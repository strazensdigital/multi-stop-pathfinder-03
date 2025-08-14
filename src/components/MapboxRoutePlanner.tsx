import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Feature, LineString } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { OrderedStop, formatArrowString, reverseGeocode, toKm, toMiles, toMinutes, isCoordInput } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";

// Public token can be safely used on the client. Users can override via localStorage key "MAPBOX_TOKEN".
const DEFAULT_MAPBOX_TOKEN = "pk.eyJ1Ijoia3VsbHVtdXV1IiwiYSI6ImNtZTZqb2d0ODEzajYybHB1Mm0xbzBva2YifQ.zDdnxTggkS-qfrNIoLJwTw";

const getToken = () => localStorage.getItem("MAPBOX_TOKEN") || DEFAULT_MAPBOX_TOKEN;

mapboxgl.accessToken = getToken();

type LngLat = [number, number];

type GeocodeResult = {
  place_name: string;
  center: LngLat;
};

const geocode = async (query: string): Promise<GeocodeResult | null> => {
  const coordMatch = query.trim().match(/^(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { place_name: `${lat}, ${lng}`, center: [lng, lat] };
    }
  }
  const encoded = encodeURIComponent(query.trim());
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&access_token=${getToken()}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat) return null;
  return { place_name: feat.place_name, center: feat.center as LngLat };
};

const getCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });

const MapboxRoutePlanner: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const routeSourceId = useRef<string>("optimized-route");
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const geocodeCache = useRef(new Map<string, {place_name: string, center: [number,number]}>());

  const [start, setStart] = useState<string>("");
  const [destinations, setDestinations] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState<OrderedStop[] | null>(null);
  const [units, setUnits] = useState<'metric'|'imperial'>('metric');
  const [arrow, setArrow] = useState<string>('');
  const [totalsLive, setTotalsLive] = useState<{distance_m: number; duration_s: number} | null>(null);
  const [totalsTypical, setTotalsTypical] = useState<{distance_m: number; duration_s: number} | null>(null);
  const [trafficOn, setTrafficOn] = useState(() => {
    const saved = localStorage.getItem('route-traffic-enabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [stabilizeResults, setStabilizeResults] = useState(() => {
    const saved = localStorage.getItem('route-stabilize-enabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [currentTheme, setCurrentTheme] = useState('mapbox://styles/mapbox/light-v11');
  const [showTrafficDialog, setShowTrafficDialog] = useState(false);
  const [showNewRouteDialog, setShowNewRouteDialog] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string>("");

  const canAddDestination = destinations.length < 9; // more than 1 and less than 10 => max 9 stops

  useEffect(() => {
    if (!mapContainer.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: currentTheme,
      center: [0, 20],
      zoom: 1.5,
      projection: "globe",
      pitch: 30,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current.scrollZoom.disable();

    const handleStyleLoad = () => {
      if (!mapRef.current) return;
      
      mapRef.current.setFog({
        color: "rgb(255, 255, 255)",
        "high-color": "rgb(200, 220, 255)",
        "horizon-blend": 0.2,
      });

      // Re-add route and markers if they exist
      if (ordered && ordered.length > 0) {
        // Re-add route source and layer
        const existingSource = mapRef.current.getSource(routeSourceId.current);
        if (!existingSource && routeGeometry.current) {
          drawRoute(routeGeometry.current);
        }
        
        // Re-add markers
        updateMarkers(ordered.map((stop, i) => ({
          coord: [stop.lng, stop.lat] as LngLat,
          color: i === 0 ? "#7c3aed" : "#06b6d4",
          label: stop.label,
          role: stop.role,
          index: stop.order,
        })));
      }
    };

    mapRef.current.on("style.load", handleStyleLoad);

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [currentTheme]);

  const routeGeometry = useRef<any>(null);

  const attachHoverTooltip = useCallback((map: mapboxgl.Map, marker: mapboxgl.Marker, contentHtml: string) => {
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
    const el = marker.getElement();
    const show = () => popup.setLngLat(marker.getLngLat()).setHTML(contentHtml).addTo(map);
    const hide = () => popup.remove();
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', show);
    el.addEventListener('blur', hide);
    el.tabIndex = 0;
  }, []);

  const updateMarkers = useCallback((points: { coord: LngLat; color: string; label: string; role: string; index?: number }[]) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    points.forEach(({ coord, color, label, role, index }) => {
      const el = document.createElement("div");
      el.className = "flex items-center justify-center rounded-full border border-foreground/20 text-[10px] font-medium text-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";
      el.style.width = "22px";
      el.style.height = "22px";
      el.style.backgroundColor = color;
      el.textContent = typeof index === "number" ? (index === 0 ? "S" : String(index)) : "";
      
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(coord).addTo(mapRef.current!);
      
      // Create tooltip content
      const tooltipContent = `
        <div class="p-2 text-sm">
          <div class="font-medium">${label}</div>
          <div class="text-xs text-muted-foreground mt-1">
            ${role} · ${coord[1].toFixed(5)}, ${coord[0].toFixed(5)}
          </div>
        </div>
      `;
      
      attachHoverTooltip(mapRef.current!, marker, tooltipContent);
      markersRef.current.push(marker);
    });
  }, [attachHoverTooltip]);

  const fitToBounds = useCallback((coordinates: LngLat[]) => {
    if (!mapRef.current || coordinates.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach((c) => bounds.extend(c));
    mapRef.current.fitBounds(bounds, { padding: 60, duration: 600 });
  }, []);

  const drawRoute = useCallback((geojson: Feature<LineString>, congestionData?: any[]) => {
    const map = mapRef.current;
    if (!map) return;

    routeGeometry.current = geojson;

    const ensureLayer = () => {
      const source = map.getSource(routeSourceId.current) as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geojson as any);
      } else {
        map.addSource(routeSourceId.current, {
          type: "geojson",
          data: geojson as any,
          lineMetrics: true,
        } as any);

        let linePaint;
        if (congestionData && trafficOn) {
          // Create traffic-colored gradient
          const congestionColors = {
            low: "#22c55e",     // green
            moderate: "#eab308", // yellow
            heavy: "#f97316",   // orange
            severe: "#ef4444"   // red
          };
          
          const stops: any[] = ["interpolate", ["linear"], ["line-progress"]];
          congestionData.forEach((level, i) => {
            const progress = i / (congestionData.length - 1);
            stops.push(progress, congestionColors[level as keyof typeof congestionColors] || congestionColors.moderate);
          });

          linePaint = {
            "line-width": 6,
            "line-opacity": 0.9,
            "line-gradient": stops,
          };
        } else {
          linePaint = {
            "line-width": 6,
            "line-opacity": 0.9,
            "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#7c3aed", 1, "#06b6d4"],
          };
        }

        map.addLayer({
          id: "route-line",
          type: "line",
          source: routeSourceId.current,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: linePaint,
        });
      }
    };

    if (map.isStyleLoaded()) {
      ensureLayer();
    } else {
      map.once("load", ensureLayer);
    }
  }, [trafficOn]);

  const optimizeRoute = useCallback(async () => {
    // Check if traffic preference needs to be asked
    if (trafficOn === null) {
      setShowTrafficDialog(true);
      return;
    }

    setLoading(true);
    try {
      // Validate
      const filtered = destinations.map((d) => d.trim()).filter(Boolean);
      if (!start.trim()) {
        toast.error("Please enter a starting point.");
        return;
      }
      if (filtered.length < 2) {
        toast.error("Add at least 2 destinations (max 9).");
        return;
      }

      // Geocode with caching
      const geocodeWithCache = async (query: string): Promise<GeocodeResult | null> => {
        const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();
        const cached = geocodeCache.current.get(normalizedQuery);
        if (cached) {
          return { place_name: cached.place_name, center: cached.center };
        }

        const result = await geocode(query);
        if (result) {
          geocodeCache.current.set(normalizedQuery, result);
        }
        return result;
      };

      const startRes = await geocodeWithCache(start);
      if (!startRes) throw new Error("Could not geocode start location");

      const destResults: GeocodeResult[] = [];
      for (const d of filtered) {
        const r = await geocodeWithCache(d);
        if (!r) throw new Error(`Could not geocode destination: ${d}`);
        destResults.push(r);
      }

      // Build stable labels and coordinates
      const rawInputLabels = [start, ...filtered]; // EXACT typed text
      
      let coords: LngLat[];
      let labelsByStableIndex: string[];

      if (stabilizeResults) {
        // Build stable destination array by sorting by lng asc, then lat asc
        const stable = destResults.map((res, i) => ({
          center: res.center as LngLat,
          typed: filtered[i]
        })).sort((a, b) => a.center[0] - b.center[0] || a.center[1] - b.center[1]);

        coords = [startRes.center, ...stable.map(x => x.center)];
        labelsByStableIndex = [rawInputLabels[0], ...stable.map(x => x.typed)];
      } else {
        coords = [startRes.center, ...destResults.map(r => r.center)];
        labelsByStableIndex = rawInputLabels;
      }

      const coordsStr = coords.map((c) => `${c[0]},${c[1]}`).join(";");

      // Build requests
      const baseParams = `source=first&destination=last&roundtrip=false&geometries=geojson&overview=full&access_token=${getToken()}`;
      
      let liveUrl: string;
      let typicalUrl: string;

      if (trafficOn) {
        liveUrl = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving-traffic/${coordsStr}?${baseParams}&annotations=congestion,distance,duration&steps=true`;
        typicalUrl = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordsStr}?${baseParams}&steps=true`;
      } else {
        liveUrl = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordsStr}?${baseParams}`;
        typicalUrl = liveUrl;
      }

      // Fetch live route
      const liveRes = await fetch(liveUrl);
      if (!liveRes.ok) throw new Error("Optimization request failed");
      const liveData = await liveRes.json();
      const liveTrip = liveData?.trips?.[0];
      if (!liveTrip) throw new Error("No route found. Try different locations.");

      // Fetch typical route if needed
      let typicalTrip = liveTrip;
      if (trafficOn && typicalUrl !== liveUrl) {
        const typicalRes = await fetch(typicalUrl);
        if (typicalRes.ok) {
          const typicalData = await typicalRes.json();
          typicalTrip = typicalData?.trips?.[0] || liveTrip;
        }
      }

      const route = liveTrip.geometry as LineString;
      
      // Extract congestion data for coloring
      let congestionData: string[] = [];
      if (trafficOn && liveTrip.legs) {
        liveTrip.legs.forEach((leg: any) => {
          if (leg.annotation?.congestion) {
            congestionData = congestionData.concat(leg.annotation.congestion);
          }
        });
      }

      drawRoute({ type: "Feature", geometry: route, properties: {} }, congestionData);

      // Build ordered stops with correct labels using original_index
      type OptWp = { waypoint_index: number; original_index: number; location: LngLat; name: string };
      const waypoints = (liveData?.waypoints || []) as OptWp[];
      const orderedWps = waypoints.slice().sort((a, b) => a.waypoint_index - b.waypoint_index);
      const legs = liveTrip.legs || [];

      const orderedStops: OrderedStop[] = [];
      for (let i = 0; i < orderedWps.length; i++) {
        const wp = orderedWps[i];
        const [lng, lat] = wp.location;
        const orig = wp.original_index;
        let label = labelsByStableIndex[orig] ?? '';

        if (!label || isCoordInput(label)) {
          const reverseLabel = await reverseGeocode(lat, lng, getToken());
          label = reverseLabel || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }

        const stop: OrderedStop = {
          order: i,
          role: i === 0 ? 'Start' : 'Stop',
          label, lat, lng
        };

        if (i < legs.length) {
          const leg = legs[i];
          stop.toNext = { distance_m: leg.distance || 0, duration_s: leg.duration || 0 };
        }
        orderedStops.push(stop);
      }

      // Calculate totals
      const liveTotalDistanceM = typeof liveTrip.distance === "number"
        ? liveTrip.distance
        : legs.reduce((s, l) => s + (l.distance || 0), 0);
      const liveTotalDurationS = typeof liveTrip.duration === "number"
        ? liveTrip.duration
        : legs.reduce((s, l) => s + (l.duration || 0), 0);

      const typicalTotalDurationS = trafficOn && typicalTrip !== liveTrip
        ? (typeof typicalTrip.duration === "number"
          ? typicalTrip.duration
          : (typicalTrip.legs || []).reduce((s: number, l: any) => s + (l.duration || 0), 0))
        : liveTotalDurationS;

      // Update state
      setOrdered(orderedStops);
      setArrow(formatArrowString(orderedStops));
      setTotalsLive({ distance_m: liveTotalDistanceM, duration_s: liveTotalDurationS });
      if (trafficOn) {
        setTotalsTypical({ distance_m: liveTotalDistanceM, duration_s: typicalTotalDurationS });
      } else {
        setTotalsTypical(null);
      }

      // Update markers
      updateMarkers(orderedStops.map((stop, i) => ({
        coord: [stop.lng, stop.lat] as LngLat,
        color: i === 0 ? "#7c3aed" : "#06b6d4",
        label: stop.label,
        role: stop.role,
        index: stop.order,
      })));

      fitToBounds(route.coordinates as LngLat[]);
      
      // Post-optimize UX
      setRouteOptimized(true);
      setAccordionValue("order");
      
      // Auto-scroll map into view
      setTimeout(() => {
        mapContainer.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      toast.success("Optimized route ready!");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to compute route");
    } finally {
      setLoading(false);
    }
  }, [start, destinations, trafficOn, stabilizeResults, drawRoute, updateMarkers, fitToBounds, attachHoverTooltip]);

  const addDestination = () => {
    if (!canAddDestination) return;
    setDestinations((prev) => [...prev, ""]);
  };

  const removeDestination = (index: number) => {
    setDestinations((prev) => prev.filter((_, i) => i !== index));
  };

  const setMyLocationAsStart = async () => {
    try {
      const pos = await getCurrentPosition();
      const { longitude, latitude } = pos.coords;
      setStart(`${latitude}, ${longitude}`);
      toast("Using current location as start (lat,lng)");
    } catch (e) {
      toast.error("Unable to access current location");
    }
  };

  const handleNewRoute = () => {
    setStart("");
    setDestinations([""]);
    setOrdered(null);
    setArrow("");
    setTotalsLive(null);
    setTotalsTypical(null);
    setRouteOptimized(false);
    setAccordionValue("destinations");
    
    // Clear map
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    
    const map = mapRef.current;
    if (map) {
      const source = map.getSource(routeSourceId.current);
      if (source) {
        map.removeLayer("route-line");
        map.removeSource(routeSourceId.current);
      }
    }
    
    routeGeometry.current = null;
    setShowNewRouteDialog(false);
  };

  const handleTrafficChoice = (choice: boolean) => {
    setTrafficOn(choice);
    localStorage.setItem('route-traffic-enabled', JSON.stringify(choice));
    setShowTrafficDialog(false);
    // Re-trigger optimization
    setTimeout(() => optimizeRoute(), 100);
  };

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle>Plan Your Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" value={accordionValue} onValueChange={setAccordionValue} className="w-full">
              <AccordionItem value="destinations">
                <AccordionTrigger>
                  {routeOptimized ? "Edit Destinations" : "Destinations"}
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Starting point</Label>
                    <div className="flex gap-2">
                      <Input
                        id="start"
                        placeholder="Address or 'lat, lng'"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={setMyLocationAsStart}>
                        Use my location
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Destinations (2–9)</Label>
                      {canAddDestination && (
                        <Button type="button" variant="secondary" onClick={addDestination}>
                          Add destination
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {destinations.map((d, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            placeholder={`Destination ${i + 1}`}
                            value={d}
                            onChange={(e) =>
                              setDestinations((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeDestination(i)}
                            disabled={destinations.length <= 1}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="traffic"
                        checked={trafficOn}
                        onCheckedChange={(checked) => {
                          setTrafficOn(checked);
                          localStorage.setItem('route-traffic-enabled', JSON.stringify(checked));
                        }}
                      />
                      <Label htmlFor="traffic" className="text-sm">Account for live traffic</Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="stabilize"
                        checked={stabilizeResults}
                        onCheckedChange={(checked) => {
                          setStabilizeResults(checked);
                          localStorage.setItem('route-stabilize-enabled', JSON.stringify(checked));
                        }}
                      />
                      <Label htmlFor="stabilize" className="text-sm">Stable results</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {routeOptimized && (
                <AccordionItem value="order">
                  <AccordionTrigger>Route Order</AccordionTrigger>
                  <AccordionContent>
                    {ordered && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">Optimized Route</h3>
                          <div className="flex items-center gap-3">
                            {totalsLive && (
                              <div className="text-sm text-muted-foreground">
                                {trafficOn ? "Live: " : "Total: "}
                                {units === 'metric'
                                  ? `${(toKm(totalsLive.distance_m)).toFixed(1)} km`
                                  : `${(toMiles(totalsLive.distance_m)).toFixed(1)} mi`
                                }
                                &nbsp;·&nbsp;{(toMinutes(totalsLive.duration_s)).toFixed(0)} min
                                {totalsTypical && (
                                  <>
                                    <br />Typical: {(toMinutes(totalsTypical.duration_s)).toFixed(0)} min
                                  </>
                                )}
                              </div>
                            )}
                            <Label className="text-sm">Units</Label>
                            <select
                              className="border rounded px-2 py-1 text-sm bg-background"
                              value={units}
                              onChange={e => setUnits(e.target.value as any)}
                            >
                              <option value="metric">km / min</option>
                              <option value="imperial">mi / min</option>
                            </select>
                          </div>
                        </div>

                        <ul className="divide-y">
                          {ordered.map((s, idx) => {
                            const next = s.toNext;
                            const dist = next ? (units === 'metric' ? `${(toKm(next.distance_m)).toFixed(2)} km` : `${(toMiles(next.distance_m)).toFixed(2)} mi`) : '';
                            const dur = next ? `${(toMinutes(next.duration_s)).toFixed(0)} min` : '';
                            return (
                              <li key={idx} className="py-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                    {s.order === 0 ? 'S' : s.order}
                                  </span>
                                  <div>
                                    <div className="font-medium">{s.label}</div>
                                    <div className="text-xs text-muted-foreground">{s.role} · {s.lat.toFixed(5)}, {s.lng.toFixed(5)}</div>
                                  </div>
                                </div>
                                {next && (
                                  <span className="text-xs px-2 py-1 rounded bg-muted">{dist} · {dur}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>

                        {trafficOn && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Traffic Legend:</span>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-green-500 rounded"></div>
                              <span>Low</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                              <span>Moderate</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-orange-500 rounded"></div>
                              <span>Heavy</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-red-500 rounded"></div>
                              <span>Severe</span>
                            </div>
                          </div>
                        )}

                        <Card className="shadow-[var(--shadow-elegant)]">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold">Copy / Export</h4>
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(arrow)}>Copy</Button>
                                <Button size="sm" variant="outline" onClick={() => downloadTxt(arrow, 'route.txt')}>Download .txt</Button>
                                <Button size="sm" variant="outline" onClick={() => downloadCsv(ordered!, 'route.csv')}>Export CSV</Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => window.open(buildGoogleMapsUrl(ordered!), "_blank")}
                                >
                                  Google Maps
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => window.open(buildAppleMapsUrl(ordered!), "_blank")}
                                >
                                  Apple Maps
                                </Button>
                              </div>
                            </div>
                            <textarea 
                              readOnly 
                              className="w-full rounded border p-2 text-sm bg-background resize-none" 
                              rows={2} 
                              value={arrow} 
                            />
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            <div className="flex gap-2">
              <Button 
                onClick={optimizeRoute} 
                disabled={loading} 
                variant="hero" 
                className="flex-1"
              >
                {loading ? "Optimizing..." : routeOptimized ? "Recalculate route" : "Find shortest route"}
              </Button>
              {routeOptimized && (
                <AlertDialog open={showNewRouteDialog} onOpenChange={setShowNewRouteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost">New route</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Start a new route?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your current route data will be cleared and you'll start fresh.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleNewRoute}>Start New Route</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Route Map</h3>
            <Select value={currentTheme} onValueChange={setCurrentTheme}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Map Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mapbox://styles/mapbox/light-v11">Light</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/dark-v11">Dark</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/traffic-day-v2">Traffic (Day)</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/traffic-night-v2">Traffic (Night)</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/navigation-day-v1">Navigation Day</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/navigation-night-v1">Navigation Night</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/satellite-streets-v12">Satellite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div ref={mapContainer} className="w-full h-[420px] lg:h-[620px] rounded-lg shadow-[var(--shadow-elegant)]" />
        </div>
      </div>

      {/* Traffic Dialog */}
      <AlertDialog open={showTrafficDialog} onOpenChange={setShowTrafficDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Include live traffic in calculations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will use real-time traffic data to provide more accurate travel times and route coloring.
              You can change this setting later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleTrafficChoice(false)}>No, use typical times</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleTrafficChoice(true)}>Yes, include traffic</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

// Helper functions for export
function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); 
  a.href = url; 
  a.download = filename; 
  a.click();
  URL.revokeObjectURL(url);
}

function buildGoogleMapsUrl(stops: OrderedStop[]) {
  if (!stops.length) return "";
  const origin = `${stops[0].lat},${stops[0].lng}`;
  const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
  const waypoints = stops.slice(1, -1).map(s => `${s.lat},${s.lng}`).join("|");
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
    ...(waypoints ? { waypoints } : {})
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildAppleMapsUrl(stops: OrderedStop[]) {
  if (!stops.length) return "";
  const origin = `${stops[0].lat},${stops[0].lng}`;
  const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
  const waypoints = stops.slice(1, -1).map(s => `${s.lat},${s.lng}`).join("|");
  const params = new URLSearchParams({
    saddr: origin,
    daddr: destination,
    ...(waypoints ? { waypoints } : {})
  });
  return `https://maps.apple.com/?${params.toString()}`;
}

function downloadCsv(stops: OrderedStop[], filename: string) {
  const header = 'order,role,label,lat,lng,distance_to_next_m,duration_to_next_s\n';
  const rows = stops.map(s => [
    s.order,
    s.role,
    `"${s.label.replace(/"/g,'""')}"`,
    s.lat,
    s.lng,
    s.toNext?.distance_m ?? '',
    s.toNext?.duration_s ?? '',
  ].join(',')).join('\n');
  downloadTxt(header + rows, filename);
}

export default MapboxRoutePlanner;
