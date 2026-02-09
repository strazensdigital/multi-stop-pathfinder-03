import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Feature, LineString } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { OrderedStop, formatArrowString, reverseGeocode, toKm, toMiles, toMinutes, isCoordInput } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoutes } from "@/hooks/useRoutes";
import { useUsageGate } from "@/hooks/useUsageGate";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Save, Loader2, Lock, Star } from "lucide-react";
import { AiPasteBox } from "@/components/AiPasteBox";

interface MapboxRoutePlannerProps {
  routeToLoad?: any[] | null;
  onRouteLoaded?: () => void;
}

// Public token can be safely used on the client. Users can override via localStorage key "MAPBOX_TOKEN".
const DEFAULT_MAPBOX_TOKEN = "pk.eyJ1Ijoia3VsbHVtdXV1IiwiYSI6ImNtZTZqb2d0ODEzajYybHB1Mm0xbzBva2YifQ.zDdnxTggkS-qfrNIoLJwTw";

const getToken = () => localStorage.getItem("MAPBOX_TOKEN") || DEFAULT_MAPBOX_TOKEN;

// Map style constants
const LIGHT = "mapbox://styles/mapbox/light-v11";
const DARK = "mapbox://styles/mapbox/dark-v11";
const SAT = "mapbox://styles/mapbox/satellite-streets-v12";
const ALLOWED_STYLES = new Set([LIGHT, DARK, SAT]);

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
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&country=us,ca&access_token=${getToken()}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat) return null;
  return { place_name: feat.place_name, center: feat.center as LngLat };
};

const fetchSuggestions = async (query: string, proximity?: LngLat): Promise<GeocodeResult[]> => {
  if (!query.trim()) return [];
  const encoded = encodeURIComponent(query.trim());
  const proximityParam = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : '';
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?autocomplete=true&limit=5&types=address,poi,place,locality,neighborhood&country=us,ca${proximityParam}&access_token=${getToken()}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.features || []).map((feat: any) => ({
    place_name: feat.place_name,
    center: feat.center as LngLat
  }));
};

const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  }) as T;
};

const buildTrafficPaintFromRatio = (liveTrip: any, typicalTrip: any) => {
  if (!liveTrip?.legs || !typicalTrip?.legs) {
    if (liveTrip?.legs) {
      let congestionData: string[] = [];
      liveTrip.legs.forEach((leg: any) => {
        if (leg.annotation?.congestion) {
          congestionData = congestionData.concat(leg.annotation.congestion);
        }
      });
      
      if (congestionData.length > 0) {
        const congestionColors = {
          low: "#22c55e",
          moderate: "#eab308",
          heavy: "#f97316",
          severe: "#ef4444"
        };
        
        const stops: any[] = ["interpolate", ["linear"], ["line-progress"]];
        congestionData.forEach((level, i) => {
          const progress = congestionData.length === 1 ? 0 : i / (congestionData.length - 1);
          const color = congestionColors[level as keyof typeof congestionColors] || congestionColors.moderate;
          stops.push(progress, color);
        });
        
        return { "line-gradient": stops };
      }
    }
    return undefined;
  }

  const liveLegs = liveTrip.legs;
  const typicalLegs = typicalTrip.legs;
  const ratios: number[] = [];

  for (let i = 0; i < liveLegs.length && i < typicalLegs.length; i++) {
    const liveDuration = liveLegs[i].duration || 0;
    const typicalDuration = typicalLegs[i].duration || 0;
    const ratio = typicalDuration > 0 ? liveDuration / typicalDuration : 1;
    ratios.push(ratio);
  }

  if (ratios.length === 0) return undefined;

  const stops: any[] = ["interpolate", ["linear"], ["line-progress"]];
  ratios.forEach((ratio, i) => {
    const progress = ratios.length === 1 ? 0 : i / (ratios.length - 1);
    let color;
    if (ratio <= 1.1) color = "#22c55e";
    else if (ratio <= 1.3) color = "#eab308";
    else if (ratio <= 1.6) color = "#f97316";
    else color = "#ef4444";
    stops.push(progress, color);
  });

  return { "line-gradient": stops };
};

const getCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });

/* ─── Traffic Legend Component ─── */
const TrafficLegend: React.FC = () => (
  <div className="inline-flex items-center gap-4 px-4 py-2 rounded-lg border border-border bg-background/90 backdrop-blur-sm text-xs">
    <span className="font-medium text-foreground">Traffic</span>
    <span className="flex items-center gap-1">
      <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
      Fast
    </span>
    <span className="flex items-center gap-1">
      <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: "#eab308" }} />
      Moderate
    </span>
    <span className="flex items-center gap-1">
      <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: "#f97316" }} />
      Slow
    </span>
    <span className="flex items-center gap-1">
      <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: "#ef4444" }} />
      Heavy
    </span>
  </div>
);

const MapboxRoutePlanner: React.FC<MapboxRoutePlannerProps> = ({ routeToLoad, onRouteLoaded }) => {
  const { user } = useAuth();
  const { saveRoute, savedRoutes, fetchRoutes } = useRoutes();
  const { locked, isPro, maxStops, checkUsage, recordUsage, remainingUses, MAX_FREE_USES } = useUsageGate();
  const { bookmarks, matchBookmarks, addBookmark } = useBookmarks();
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const routeSourceId = useRef<string>("optimized-route");
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const geocodeCache = useRef(new Map<string, {place_name: string, center: [number,number]}>());
  
  const lastRouteGeojsonRef = useRef<Feature<LineString> | null>(null);
  const lastPaintRef = useRef<any>(null);
  const lastMarkerDataRef = useRef<{ coord: LngLat; color: string; label: string; role: string; index?: number }[]>([]);

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
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    const saved = localStorage.getItem("MAP_STYLE");
    return ALLOWED_STYLES.has(saved || "") ? saved! : SAT;
  });
  const [showTrafficDialog, setShowTrafficDialog] = useState(false);
  const [showNewRouteDialog, setShowNewRouteDialog] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState<{[key: string]: GeocodeResult[]}>({});
  const [showSuggestions, setShowSuggestions] = useState<{[key: string]: boolean}>({});
  const [recentAddresses, setRecentAddresses] = useState<string[]>(() => {
    const saved = localStorage.getItem('recent_addresses');
    return saved ? JSON.parse(saved) : [];
  });

  const canAddDestination = destinations.length < maxStops;

  // Fetch saved routes count for save-gate
  useEffect(() => {
    if (user) fetchRoutes();
  }, [user, fetchRoutes]);

  // Load route from saved routes
  useEffect(() => {
    if (routeToLoad && routeToLoad.length > 0) {
      const stops = routeToLoad as any[];
      if (stops.length >= 2) {
        setStart(stops[0].label || "");
        setDestinations(stops.slice(1).map((s: any) => s.label || ""));
        setRouteOptimized(false);
        setOrdered(null);
        toast.success("Route loaded! Press 'Find shortest route' to optimize.");
      }
      onRouteLoaded?.();
    }
  }, [routeToLoad, onRouteLoaded]);

  const handleSaveRoute = async () => {
    if (!ordered || ordered.length === 0) return;
    setSavingRoute(true);
    const name = ordered.map((s) => s.label.split(",")[0].trim()).slice(0, 3).join(" → ");
    await saveRoute(name, ordered);
    setSavingRoute(false);
  };

  const handleAiExtracted = (startAddr: string, dests: string[]) => {
    if (startAddr) setStart(startAddr);
    const needed = Math.max(dests.length, 2);
    const newDests = Array.from({ length: Math.min(needed, maxStops) }, (_, i) => dests[i] || "");
    setDestinations(newDests);
    setRouteOptimized(false);
    setOrdered(null);
  };

  const debouncedFetchSuggestions = useMemo(
    () => debounce(async (query: string, key: string) => {
      if (!query.trim()) {
        setSuggestions(prev => ({ ...prev, [key]: [] }));
        return;
      }
      const startCenter = mapRef.current ? [mapRef.current.getCenter().lng, mapRef.current.getCenter().lat] as LngLat : undefined;
      const results = await fetchSuggestions(query, startCenter);
      setSuggestions(prev => ({ ...prev, [key]: results }));
    }, 300),
    []
  );

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
      if (lastRouteGeojsonRef.current) {
        addOrUpdateRoute(lastRouteGeojsonRef.current, lastPaintRef.current);
      }
      if (lastMarkerDataRef.current.length > 0) {
        updateMarkers(lastMarkerDataRef.current);
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

  useEffect(() => {
    localStorage.setItem("MAP_STYLE", currentTheme);
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
    lastMarkerDataRef.current = points;
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

  const addOrUpdateRoute = useCallback((geojson: Feature<LineString>, paintOverrides?: any) => {
    const map = mapRef.current;
    if (!map) return;
    lastRouteGeojsonRef.current = geojson;
    lastPaintRef.current = paintOverrides;

    const source = map.getSource(routeSourceId.current) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson as any);
      if (paintOverrides) {
        Object.entries(paintOverrides).forEach(([property, value]) => {
          map.setPaintProperty("route-line", property as any, value);
        });
      }
    } else {
      map.addSource(routeSourceId.current, {
        type: "geojson",
        data: geojson as any,
        lineMetrics: true,
      } as any);
      const defaultPaint = {
        "line-width": 6,
        "line-opacity": 0.9,
        "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#7c3aed", 1, "#06b6d4"],
      };
      map.addLayer({
        id: "route-line",
        type: "line",
        source: routeSourceId.current,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { ...defaultPaint, ...paintOverrides },
      });
    }
  }, []);

  const drawRoute = useCallback((geojson: Feature<LineString>, liveTrip?: any, typicalTrip?: any) => {
    const map = mapRef.current;
    if (!map) return;
    routeGeometry.current = geojson;
    const paintOverrides = trafficOn ? buildTrafficPaintFromRatio(liveTrip, typicalTrip) : undefined;
    const ensureLayer = () => { addOrUpdateRoute(geojson, paintOverrides); };
    if (map.isStyleLoaded()) { ensureLayer(); }
    else { map.once("load", ensureLayer); }
  }, [trafficOn, addOrUpdateRoute]);

  const optimizeRoute = useCallback(async () => {
    if (trafficOn === null) {
      setShowTrafficDialog(true);
      return;
    }

    // Usage gate check
    if (!isPro) {
      const { allowed, showNudge } = checkUsage();
      if (!allowed) {
        toast.error("You've reached your daily limit of 5 free optimizations. Upgrade to Pro for unlimited access!");
        setShowUpgradeNudge(true);
        return;
      }
      if (showNudge) {
        setShowUpgradeNudge(true);
      }
    }

    setLoading(true);
    try {
      const filtered = destinations.map((d) => d.trim()).filter(Boolean);
      if (!start.trim()) { toast.error("Please enter a starting point."); return; }
      if (filtered.length < 2) { toast.error("Add at least 2 destinations."); return; }
      if (!isPro && filtered.length > 9) { toast.error("Free plan supports up to 9 stops. Upgrade to Pro for unlimited!"); return; }

      const geocodeWithCache = async (query: string): Promise<GeocodeResult | null> => {
        const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();
        const cached = geocodeCache.current.get(normalizedQuery);
        if (cached) return { place_name: cached.place_name, center: cached.center };
        const result = await geocode(query);
        if (result) geocodeCache.current.set(normalizedQuery, result);
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

      const rawInputLabels = [start, ...filtered];
      let coords: LngLat[];
      let labelsByStableIndex: string[];

      if (stabilizeResults) {
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

      const liveRes = await fetch(liveUrl);
      if (!liveRes.ok) throw new Error("Optimization request failed");
      const liveData = await liveRes.json();
      const liveTrip = liveData?.trips?.[0];
      if (!liveTrip) throw new Error("No route found. Try different locations.");

      let typicalTrip = liveTrip;
      if (trafficOn && typicalUrl !== liveUrl) {
        const typicalRes = await fetch(typicalUrl);
        if (typicalRes.ok) {
          const typicalData = await typicalRes.json();
          typicalTrip = typicalData?.trips?.[0] || liveTrip;
        }
      }

      const route = liveTrip.geometry as LineString;
      drawRoute({ type: "Feature", geometry: route, properties: {} }, liveTrip, typicalTrip);

      const rawWaypoints = (liveData?.waypoints || []).map((wp: any, idx: number) => ({...wp, origIndex: idx}));
      const orderedWaypoints = rawWaypoints.slice().sort((a, b) => a.waypoint_index - b.waypoint_index);
      const legs = liveTrip.legs || [];

      const orderedStops: OrderedStop[] = [];
      for (let i = 0; i < orderedWaypoints.length; i++) {
        const wp = orderedWaypoints[i];
        const [lng, lat] = wp.location;
        const orig = orderedWaypoints[i].origIndex;
        let label = (labelsByStableIndex[orig] ?? '').trim();
        if (!label || isCoordInput(label)) {
          const rev = await reverseGeocode(lat, lng, getToken());
          label = rev || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
        const stop: OrderedStop = { order: i, role: i === 0 ? 'Start' : 'Stop', label, lat, lng };
        if (i < legs.length) {
          stop.toNext = { distance_m: legs[i].distance || 0, duration_s: legs[i].duration || 0 };
        }
        orderedStops.push(stop);
      }

      setOrdered(orderedStops);
      setArrow(formatArrowString(orderedStops));

      const liveTotalDistanceM = typeof liveTrip.distance === "number"
        ? liveTrip.distance : legs.reduce((s: number, l: any) => s + (l.distance || 0), 0);
      const liveTotalDurationS = typeof liveTrip.duration === "number"
        ? liveTrip.duration : legs.reduce((s: number, l: any) => s + (l.duration || 0), 0);
      const typicalTotalDurationS = trafficOn && typicalTrip !== liveTrip
        ? (typeof typicalTrip.duration === "number" ? typicalTrip.duration
          : (typicalTrip.legs || []).reduce((s: number, l: any) => s + (l.duration || 0), 0))
        : liveTotalDurationS;

      setTotalsLive({ distance_m: liveTotalDistanceM, duration_s: liveTotalDurationS });
      if (trafficOn) { setTotalsTypical({ distance_m: liveTotalDistanceM, duration_s: typicalTotalDurationS }); }
      else { setTotalsTypical(null); }

      updateMarkers(orderedStops.map((stop, i) => ({
        coord: [stop.lng, stop.lat] as LngLat,
        color: i === 0 ? "#7c3aed" : "#06b6d4",
        label: stop.label,
        role: stop.role,
        index: stop.order,
      })));

      fitToBounds(route.coordinates as LngLat[]);
      setRouteOptimized(true);
      recordUsage();

      // Record usage event for logged-in users
      if (user) {
        supabase.from("usage_events").insert({
          user_id: user.id,
          event_type: "optimize",
          meta: { stops: orderedStops.length } as any,
        }).then(() => {});
      }

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
  }, [start, destinations, trafficOn, stabilizeResults, drawRoute, updateMarkers, fitToBounds, attachHoverTooltip, isPro, checkUsage, recordUsage]);

  const addDestination = () => {
    if (!canAddDestination) return;
    setDestinations((prev) => [...prev, ""]);
  };

  const removeDestination = (index: number) => {
    setDestinations((prev) => prev.filter((_, i) => i !== index));
  };

  const saveToRecentAddresses = (address: string) => {
    if (!address.trim()) return;
    const updated = [address, ...recentAddresses.filter(a => a !== address)].slice(0, 10);
    setRecentAddresses(updated);
    localStorage.setItem('recent_addresses', JSON.stringify(updated));
  };

  const handleInputChange = (value: string, key: string, setter: (value: string) => void) => {
    setter(value);
    debouncedFetchSuggestions(value, key);
    if (value.trim()) { setShowSuggestions(prev => ({ ...prev, [key]: true })); }
  };

  const handleSuggestionSelect = (suggestion: GeocodeResult, key: string, setter: (value: string) => void) => {
    setter(suggestion.place_name);
    saveToRecentAddresses(suggestion.place_name);
    setShowSuggestions(prev => ({ ...prev, [key]: false }));
    setSuggestions(prev => ({ ...prev, [key]: [] }));
  };

  const handleInputFocus = (key: string, currentValue: string) => {
    if (!currentValue.trim() && recentAddresses.length > 0) {
      setSuggestions(prev => ({ ...prev, [key]: recentAddresses.map(addr => ({ place_name: addr, center: [0, 0] as LngLat })) }));
      setShowSuggestions(prev => ({ ...prev, [key]: true }));
    }
  };

  const handleRowClick = (stop: OrderedStop) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [stop.lng, stop.lat], zoom: 14, duration: 1000 });
    const marker = markersRef.current.find((m) => {
      const lngLat = m.getLngLat();
      return Math.abs(lngLat.lng - stop.lng) < 0.0001 && Math.abs(lngLat.lat - stop.lat) < 0.0001;
    });
    if (marker) {
      const el = marker.getElement();
      el.style.transform = 'scale(1.3)';
      el.style.transition = 'transform 0.3s ease';
      setTimeout(() => { el.style.transform = 'scale(1)'; }, 300);
    }
  };

  const setMyLocationAsStart = async () => {
    try {
      const pos = await getCurrentPosition();
      const { longitude, latitude } = pos.coords;
      setStart(`${latitude}, ${longitude}`);
      toast("Using current location as start (lat,lng)");
    } catch (e) { toast.error("Unable to access current location"); }
  };

  const handleNewRoute = () => {
    setStart("");
    setDestinations([""]);
    setOrdered(null);
    setArrow("");
    setTotalsLive(null);
    setTotalsTypical(null);
    setRouteOptimized(false);
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const map = mapRef.current;
    if (map) {
      const source = map.getSource(routeSourceId.current);
      if (source) { map.removeLayer("route-line"); map.removeSource(routeSourceId.current); }
    }
    routeGeometry.current = null;
    setShowNewRouteDialog(false);
  };

  const handleTrafficChoice = (choice: boolean) => {
    setTrafficOn(choice);
    localStorage.setItem('route-traffic-enabled', JSON.stringify(choice));
    setShowTrafficDialog(false);
    setTimeout(() => optimizeRoute(), 100);
  };

  const shortLabel = (address: string) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts[0].trim() || address;
  };

  const handleThemeChange = (newTheme: string) => { setCurrentTheme(newTheme); };

  // Determine how many stops are filled
  const filledStops = destinations.filter(d => d.trim()).length;
  const canOptimize = start.trim() && filledStops >= 2;

  // Sticky button state
  const getStickyButtonConfig = () => {
    if (locked) return { label: "Daily limit reached – Upgrade to Pro", disabled: false, action: () => setShowUpgradeNudge(true) };
    if (loading) return { label: "Optimizing...", disabled: true, action: () => {} };
    if (routeOptimized) return { label: "Recalculate route", disabled: false, action: optimizeRoute };
    const usesLabel = !isPro && remainingUses < MAX_FREE_USES ? ` (${remainingUses} left today)` : '';
    return {
      label: `Find shortest route${filledStops >= 2 ? ` (${filledStops + 1} stops)` : ''}${usesLabel}`,
      disabled: !canOptimize,
      action: optimizeRoute
    };
  };

  const stickyBtn = getStickyButtonConfig();

  /* ─── Autocomplete dropdown sub-component ─── */
  const SuggestionsDropdown: React.FC<{ keyName: string; onSelect: (s: GeocodeResult) => void; currentValue?: string }> = ({ keyName, onSelect, currentValue }) => {
    // Merge bookmark matches at the top (Pro only)
    const bookmarkMatches = isPro && currentValue ? matchBookmarks(currentValue) : [];
    const geoSuggestions = suggestions[keyName] || [];
    const hasBookmarks = bookmarkMatches.length > 0;
    const hasGeo = geoSuggestions.length > 0;
    const show = showSuggestions[keyName] && (hasBookmarks || hasGeo);
    if (!show) return null;
    return (
      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
        {bookmarkMatches.map((bm) => (
          <button
            key={`bm-${bm.id}`}
            className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border/50 last:border-b-0 flex items-center gap-2"
            onClick={() => onSelect({ place_name: bm.address, center: [bm.lng || 0, bm.lat || 0] })}
          >
            <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
            <span>
              <span className="font-medium">{bm.nickname}</span>
              <span className="text-muted-foreground ml-1.5 text-xs">{bm.address.split(',')[0]}</span>
            </span>
          </button>
        ))}
        {hasBookmarks && hasGeo && <div className="h-px bg-border" />}
        {geoSuggestions.map((suggestion, j) => (
          <button
            key={j}
            className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border/50 last:border-b-0"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion.place_name}
          </button>
        ))}
      </div>
    );
  };

  return (
    <section className="w-full pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0">
      {/* App Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">ZipRoute</h1>
          <span className="text-sm font-medium text-accent">Free multi-stop optimizer</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground italic mb-6">
        Optimize multi-stop routes in seconds — free, fast, Google Maps-ready.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">

          {/* AI Paste Box - Pro only */}
          {isPro ? (
            <AiPasteBox bookmarks={bookmarks} onAddressesExtracted={handleAiExtracted} />
          ) : (
            <div className="relative">
              <div className="opacity-50 pointer-events-none">
                <AiPasteBox bookmarks={bookmarks} onAddressesExtracted={handleAiExtracted} />
              </div>
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded">PRO</span>
            </div>
          )}

          {/* Card A - Start */}
          <Card className="shadow-[var(--shadow-elegant)] border-l-2 border-l-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Address or 'lat, lng'"
                    value={start}
                    onChange={(e) => handleInputChange(e.target.value, 'start', setStart)}
                    onFocus={() => handleInputFocus('start', start)}
                    onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, start: false })), 150)}
                    className="min-h-[44px]"
                  />
                  <SuggestionsDropdown keyName="start" onSelect={(s) => handleSuggestionSelect(s, 'start', setStart)} currentValue={start} />
                </div>
                <Button type="button" variant="outline" onClick={setMyLocationAsStart} className="min-h-[44px] text-xs px-3">
                  Use my location
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card B - Stops */}
          <Card className="shadow-[var(--shadow-elegant)] border-l-2 border-l-accent/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Stops {isPro ? '' : '(2–9)'}</CardTitle>
                <span className="text-sm text-muted-foreground">{filledStops}{isPro ? '' : '/9'}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {destinations.map((destination, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder={`Stop ${i + 1}...`}
                        value={destination}
                        onChange={(e) => {
                          const newDests = [...destinations];
                          newDests[i] = e.target.value;
                          setDestinations(newDests);
                          handleInputChange(e.target.value, `dest-${i}`, (value) => {
                            const nd = [...destinations]; nd[i] = value; setDestinations(nd);
                          });
                        }}
                        onFocus={() => handleInputFocus(`dest-${i}`, destination)}
                        onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, [`dest-${i}`]: false })), 150)}
                        className="min-h-[44px]"
                      />
                      <SuggestionsDropdown
                        keyName={`dest-${i}`}
                        currentValue={destination}
                        onSelect={(s) => {
                          const newDests = [...destinations]; newDests[i] = s.place_name; setDestinations(newDests);
                          handleSuggestionSelect(s, `dest-${i}`, () => {});
                        }}
                      />
                    </div>
                    {destinations.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeDestination(i)} className="min-h-[44px] px-3 text-xs">
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {canAddDestination && (
                <Button type="button" onClick={addDestination} className="w-full min-h-[44px] btn-hero">
                  Add stop
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Card C - Options */}
          <Card className="shadow-[var(--shadow-elegant)] border-l-2 border-l-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="traffic" className="text-sm">Account for live traffic</Label>
                <Switch
                  id="traffic"
                  checked={trafficOn}
                  onCheckedChange={(checked) => {
                    setTrafficOn(checked);
                    localStorage.setItem('route-traffic-enabled', JSON.stringify(checked));
                    if (routeGeometry.current) {
                      drawRoute(routeGeometry.current);
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="stabilize" className="text-sm">Stable results</Label>
                <Switch
                  id="stabilize"
                  checked={stabilizeResults}
                  onCheckedChange={(checked) => {
                    setStabilizeResults(checked);
                    localStorage.setItem('route-stabilize-enabled', JSON.stringify(checked));
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Map Theme</Label>
                <Select value={currentTheme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LIGHT}>Light</SelectItem>
                    <SelectItem value={DARK}>Dark</SelectItem>
                    <SelectItem value={SAT}>Satellite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Optimize Button */}
          <div className="hidden lg:block space-y-2">
            <Button 
              onClick={stickyBtn.action} 
              disabled={stickyBtn.disabled} 
              className="w-full min-h-[44px] btn-hero"
            >
              {stickyBtn.label}
            </Button>
            {routeOptimized && (
              <AlertDialog open={showNewRouteDialog} onOpenChange={setShowNewRouteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full">New route</Button>
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
        </div>

        {/* Map Section */}
        <div className="lg:col-span-3 space-y-3">
          <div ref={mapContainer} className="w-full h-[420px] lg:h-[620px] rounded-lg shadow-[var(--shadow-elegant)]" />
          
          {/* Traffic Legend */}
          {trafficOn && (
            <div className="flex justify-center lg:justify-end">
              <TrafficLegend />
            </div>
          )}

          {/* New route link below map on desktop */}
          {routeOptimized && (
            <div className="hidden lg:flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setShowNewRouteDialog(true)} className="text-sm text-muted-foreground">
                New route
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Optimized Route Card ─── */}
      {ordered && (
        <Card className="mt-6 shadow-[var(--shadow-elegant)]">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">Optimized Route</CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                {totalsLive && (
                  <span className="text-sm text-muted-foreground">
                    {units === 'metric'
                      ? `${toKm(totalsLive.distance_m).toFixed(1)} km`
                      : `${toMiles(totalsLive.distance_m).toFixed(1)} mi`
                    } • {toMinutes(totalsLive.duration_s).toFixed(0)} min
                  </span>
                )}
                <Select value={units} onValueChange={(value) => setUnits(value as 'metric' | 'imperial')}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">km</SelectItem>
                    <SelectItem value="imperial">mi</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="btn-hero h-8 px-4 text-xs" onClick={optimizeRoute} disabled={loading}>
                  {loading ? "Optimizing..." : "Recalculate"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <ul className="divide-y divide-border">
              {ordered.map((stop, i) => (
                <li 
                  key={i} 
                  className="py-4 cursor-pointer hover:bg-muted/50 rounded-md px-2 transition-colors"
                  onClick={() => handleRowClick(stop)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium mt-0.5 ${
                          stop.order === 0
                            ? 'bg-[#7c3aed] text-white'
                            : 'bg-[#06b6d4] text-white'
                        }`}
                      >
                        {stop.order === 0 ? 'S' : stop.order}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{shortLabel(stop.label)}</div>
                        <div className="text-sm text-muted-foreground mt-0.5 truncate">{stop.label}</div>
                      </div>
                    </div>
                    {stop.toNext && (
                      <span className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground whitespace-nowrap shrink-0">
                        {units === 'metric' 
                          ? `${toKm(stop.toNext.distance_m).toFixed(1)} km`
                          : `${toMiles(stop.toNext.distance_m).toFixed(1)} mi`
                        } • {toMinutes(stop.toNext.duration_s).toFixed(0)} min
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              {(() => {
                const urls = buildGoogleMapsUrls(ordered);
                const isMultiLeg = urls.length > 1;
                return (
                  <Button
                    className="w-full min-h-[48px] text-base font-medium"
                    style={{ background: 'linear-gradient(135deg, hsl(348, 83%, 47%), hsl(348, 83%, 40%))' }}
                    onClick={() => {
                      urls.forEach((url, i) => {
                        setTimeout(() => window.open(url, '_blank'), i * 300);
                      });
                      if (isMultiLeg) {
                        toast.info(`Route split into ${urls.length} legs (Google Maps limits waypoints to 9). Check your browser tabs!`);
                      }
                    }}
                  >
                    {isMultiLeg ? `Google Maps (${urls.length} legs)` : 'Google Maps'}
                  </Button>
                );
              })()}
              {user && (() => {
                const canSave = isPro || savedRoutes.length < 1;
                return (
                  <Button
                    variant="outline"
                    className={`w-full min-h-[44px] border-border/40 ${!canSave ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={canSave ? handleSaveRoute : undefined}
                    disabled={savingRoute || !canSave}
                  >
                    {savingRoute ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {savingRoute ? "Saving..." : canSave ? "Save Route" : "Save Route"}
                    {!canSave && (
                      <span className="ml-2 text-xs font-semibold bg-accent/20 text-accent px-1.5 py-0.5 rounded">PRO</span>
                    )}
                  </Button>
                );
              })()}
              <p className="mt-1 text-xs text-muted-foreground">
                We send your typed addresses; Google may adjust pins to the nearest entrance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Mobile Sticky Bottom Bar ─── */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border p-3 lg:hidden safe-bottom">
        <div className="flex gap-2">
          {routeOptimized && (
            <Button variant="ghost" size="sm" onClick={() => setShowNewRouteDialog(true)} className="text-sm shrink-0">
              New route
            </Button>
          )}
          <Button 
            className="flex-1 min-h-[44px] btn-hero" 
            onClick={stickyBtn.action}
            disabled={stickyBtn.disabled}
          >
            {stickyBtn.label}
          </Button>
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

      {/* New Route Dialog (for mobile) */}
      <AlertDialog open={showNewRouteDialog} onOpenChange={setShowNewRouteDialog}>
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

      {/* Upgrade Nudge Dialog */}
      <AlertDialog open={showUpgradeNudge} onOpenChange={setShowUpgradeNudge}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-accent" />
              {locked ? "Daily limit reached" : "Enjoying ZipRoute?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locked
                ? "You've used all 5 free optimizations for today. Upgrade to Pro for unlimited route optimizations, unlimited stops, and more!"
                : `You have ${remainingUses} free optimization${remainingUses === 1 ? '' : 's'} left today. Upgrade to Pro for unlimited access!`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {!locked && <AlertDialogCancel>Continue Free</AlertDialogCancel>}
            {locked && <AlertDialogCancel>OK</AlertDialogCancel>}
            <AlertDialogAction
              onClick={() => {
                // Trigger pricing modal via global modal system
                window.dispatchEvent(new CustomEvent('open-modal', { detail: 'pricing' }));
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Upgrade to Pro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

// Helper functions
function addrOrCoord(s: OrderedStop) {
  const label = (s.label || '').trim().replace(/\s+/g, ' ');
  return label && !isCoordInput(label) ? label : `${s.lat},${s.lng}`;
}

function buildGoogleMapsUrls(stops: OrderedStop[]): string[] {
  if (!stops?.length) return [''];
  // Google Maps supports origin + up to 9 waypoints + destination = 11 stops max per URL
  const MAX_STOPS_PER_LEG = 11;
  
  if (stops.length <= MAX_STOPS_PER_LEG) {
    return [buildSingleGoogleMapsUrl(stops)];
  }

  // Split into overlapping chunks
  const urls: string[] = [];
  let i = 0;
  while (i < stops.length - 1) {
    const end = Math.min(i + MAX_STOPS_PER_LEG, stops.length);
    const chunk = stops.slice(i, end);
    urls.push(buildSingleGoogleMapsUrl(chunk));
    i = end - 1; // overlap: last stop of this leg = first stop of next
  }
  return urls;
}

function buildSingleGoogleMapsUrl(stops: OrderedStop[]) {
  if (!stops?.length) return '';
  const origin = addrOrCoord(stops[0]);
  const destination = addrOrCoord(stops[stops.length - 1]);
  const waypointsStr = stops.slice(1, -1).map(addrOrCoord).join('|');
  const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'driving' });
  if (waypointsStr) params.set('waypoints', waypointsStr);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default MapboxRoutePlanner;
