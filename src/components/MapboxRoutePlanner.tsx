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
import { OrderedStop, formatArrowString, reverseGeocode, toKm, toMiles, toMinutes } from "@/lib/utils";

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

  const [start, setStart] = useState<string>("");
  const [destinations, setDestinations] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState<OrderedStop[] | null>(null);
  const [units, setUnits] = useState<'metric'|'imperial'>('metric');
  const [arrow, setArrow] = useState<string>('');
  const [totals, setTotals] = useState<{distance_m: number; duration_s: number} | null>(null);

  const canAddDestination = destinations.length < 9; // more than 1 and less than 10 => max 9 stops

  useEffect(() => {
    if (!mapContainer.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 1.5,
      projection: "globe",
      pitch: 30,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current.scrollZoom.disable();

    mapRef.current.on("style.load", () => {
      mapRef.current?.setFog({
        color: "rgb(255, 255, 255)",
        "high-color": "rgb(200, 220, 255)",
        "horizon-blend": 0.2,
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

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

  const drawRoute = useCallback((geojson: Feature<LineString>) => {
    const map = mapRef.current;
    if (!map) return;

    const ensureLayer = () => {
      const source = map.getSource(routeSourceId.current) as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geojson as any);
      } else {
        map.addSource(routeSourceId.current, {
          type: "geojson",
          data: geojson as any,
          // Needed for line-gradient with line-progress
          lineMetrics: true,
        } as any);
        map.addLayer({
          id: "route-line",
          type: "line",
          source: routeSourceId.current,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-width": 6,
            "line-opacity": 0.9,
            "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#7c3aed", 1, "#06b6d4"],
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      ensureLayer();
    } else {
      map.once("load", ensureLayer);
    }
  }, []);

  const optimizeRoute = useCallback(async () => {
    setLoading(true);
    try {
      // Validate
      const filtered = destinations.map((d) => d.trim()).filter(Boolean);
      if (!start.trim()) {
        toast.error("Please enter a starting point.");
        return;
      }
      if (filtered.length < 2) {
        toast.error("Add at least 2 destinations (max 9). ");
        return;
      }

      // Geocode all inputs
      const startRes = await geocode(start);
      if (!startRes) throw new Error("Could not geocode start location");

      const destResults: GeocodeResult[] = [];
      for (const d of filtered) {
        const r = await geocode(d);
        if (!r) throw new Error(`Could not geocode destination: ${d}`);
        destResults.push(r);
      }

      // Store input labels and resolved place names for later use
      const inputLabels = [start, ...filtered];
      const resolvedInputLabels: string[] = [
        startRes.place_name || start,
        ...destResults.map((r, i) => r.place_name || filtered[i])
      ];

      // Build coordinates string for Optimization API
      const coords: LngLat[] = [startRes.center, ...destResults.map((r) => r.center)];
      const coordsStr = coords.map((c) => `${c[0]},${c[1]}`).join(";");

      const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordsStr}?source=first&destination=last&roundtrip=false&geometries=geojson&overview=full&access_token=${getToken()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Optimization request failed");
      const data = await res.json();
      const trip = data?.trips?.[0];
      if (!trip) throw new Error("No route found. Try different locations.");

      const route = trip.geometry as LineString;
      drawRoute({ type: "Feature", geometry: route, properties: {} });

      // Build ordered stops with correct labels using original_index
      type OptWp = { waypoint_index: number; original_index: number; location: LngLat; name: string };
      const waypoints = (data?.waypoints || []) as OptWp[];

      // Sort by position in optimized trip
      const orderedWaypoints = waypoints.slice().sort((a, b) => a.waypoint_index - b.waypoint_index);
      const legs = trip.legs || [];

      const orderedStops: OrderedStop[] = [];

      for (let i = 0; i < orderedWaypoints.length; i++) {
        const wp = orderedWaypoints[i];
        const [lng, lat] = wp.location;

        // Use ORIGINAL index to map back to the user's input / geocoded label
        const orig = wp.original_index;
        let label = resolvedInputLabels[orig] ?? inputLabels[orig] ?? "";

        // If label looks like coords or is empty, reverse geocode once
        if (!label || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(label)) {
          const reverseLabel = await reverseGeocode(lat, lng, getToken());
          label = reverseLabel || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }

        const stop: OrderedStop = {
          order: i,
          role: i === 0 ? "Start" : "Stop",
          label,
          lat,
          lng,
        };

        if (i < legs.length) {
          const leg = legs[i];
          stop.toNext = {
            distance_m: leg.distance || 0,
            duration_s: leg.duration || 0,
          };
        }

        orderedStops.push(stop);
      }

      const totalDistanceM = typeof trip.distance === "number"
        ? trip.distance
        : legs.reduce((s, l) => s + (l.distance || 0), 0);

      const totalDurationS = typeof trip.duration === "number"
        ? trip.duration
        : legs.reduce((s, l) => s + (l.duration || 0), 0);

      // Update state
      setOrdered(orderedStops);
      setArrow(formatArrowString(orderedStops));
      setTotals({ distance_m: totalDistanceM, duration_s: totalDurationS });

      // Update markers with proper numbering and labels
      updateMarkers(orderedStops.map((stop, i) => ({
        coord: [stop.lng, stop.lat] as LngLat,
        color: i === 0 ? "#7c3aed" : "#06b6d4",
        label: stop.label,
        role: stop.role,
        index: stop.order,
      })));

      fitToBounds(route.coordinates as LngLat[]);
      toast.success("Optimized route ready!");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to compute route");
    } finally {
      setLoading(false);
    }
  }, [start, destinations, drawRoute, updateMarkers, fitToBounds, attachHoverTooltip]);

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

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle>Plan Your Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Button onClick={optimizeRoute} disabled={loading} variant="hero" className="w-full">
              {loading ? "Optimizing..." : "Find shortest route"}
            </Button>

            {ordered && (
              <div className="mt-4 space-y-3">
                <Card className="shadow-[var(--shadow-elegant)]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Route Order</h3>
                      <div className="flex items-center gap-3">
                        {totals && (
                          <div className="text-sm text-muted-foreground">
                            Total:&nbsp;
                            {units === 'metric'
                              ? `${(toKm(totals.distance_m)).toFixed(1)} km`
                              : `${(toMiles(totals.distance_m)).toFixed(1)} mi`
                            }
                            &nbsp;·&nbsp;{(toMinutes(totals.duration_s)).toFixed(0)} min
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
                  </CardContent>
                </Card>

                <Card className="shadow-[var(--shadow-elegant)]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Copy / Export</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(arrow)}>Copy</Button>
                        <Button size="sm" variant="outline" onClick={() => downloadTxt(arrow, 'route.txt')}>Download .txt</Button>
                        <Button size="sm" variant="outline" onClick={() => downloadCsv(ordered!, 'route.csv')}>Export CSV</Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => window.open(buildGoogleMapsUrl(ordered!), "_blank")}
                        >
                          Open in Google Maps
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
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <div ref={mapContainer} className="w-full h-[420px] lg:h-[620px] rounded-lg shadow-[var(--shadow-elegant)]" />
        </div>
      </div>
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
