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
import { useAuth } from "@/hooks/useAuth";
import { canUse } from "@/lib/planGate";
import { recordOptimizeUseAndCheckLimits, getCooldown, GUEST_LOGIN_SOFT_NUDGE_AFTER } from "@/lib/usageMeter";
import PaywallModal from "./PaywallModal";
import LoginModal from "./LoginModal";


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
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&access_token=${getToken()}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat) return null;
  return { place_name: feat.place_name, center: feat.center as LngLat };
};

// Fetch autocomplete suggestions
const fetchSuggestions = async (query: string, proximity?: LngLat): Promise<GeocodeResult[]> => {
  if (!query.trim()) return [];
  const encoded = encodeURIComponent(query.trim());
  const proximityParam = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : '';
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?autocomplete=true&limit=5&types=address,poi,place,locality,neighborhood${proximityParam}&access_token=${getToken()}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.features || []).map((feat: any) => ({
    place_name: feat.place_name,
    center: feat.center as LngLat
  }));
};

// Debounce function
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  }) as T;
};

// Build traffic paint from ratio
const buildTrafficPaintFromRatio = (liveTrip: any, typicalTrip: any) => {
  if (!liveTrip?.legs || !typicalTrip?.legs) {
    // Fallback to congestion-based coloring if available
    if (liveTrip?.legs) {
      let congestionData: string[] = [];
      liveTrip.legs.forEach((leg: any) => {
        if (leg.annotation?.congestion) {
          congestionData = congestionData.concat(leg.annotation.congestion);
        }
      });
      
      if (congestionData.length > 0) {
        const congestionColors = {
          low: "#22c55e",     // green
          moderate: "#eab308", // yellow
          heavy: "#f97316",   // orange
          severe: "#ef4444"   // red
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
    if (ratio <= 1.1) color = "#22c55e";      // green - good traffic
    else if (ratio <= 1.3) color = "#eab308"; // yellow - moderate traffic
    else if (ratio <= 1.6) color = "#f97316"; // orange - heavy traffic
    else color = "#ef4444";                    // red - severe traffic
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

const MapboxRoutePlanner: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const routeSourceId = useRef<string>("optimized-route");
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const geocodeCache = useRef(new Map<string, {place_name: string, center: [number,number]}>());
  
  // Persistence refs for theme switching
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
    return ALLOWED_STYLES.has(saved || "") ? saved! : SAT;   // default Satellite
  });
  const [showTrafficDialog, setShowTrafficDialog] = useState(false);
  const [showNewRouteDialog, setShowNewRouteDialog] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [showDestinations, setShowDestinations] = useState(true);
  const [showRouteOrder, setShowRouteOrder] = useState(false);

  // Duplicate detection (normalize + index set)
const normalizeAddr = useCallback((s: string) => s.toLowerCase().replace(/\s+/g, " ").trim(), []);
const duplicateIndexSet = useMemo(() => {
  const counts = new Map<string, number>();
  destinations.forEach((d) => {
    const key = normalizeAddr(d);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const dup = new Set<number>();
  destinations.forEach((d, i) => {
    const key = normalizeAddr(d);
    if (key && counts.get(key)! > 1) dup.add(i);
  });
  return dup;
}, [destinations, normalizeAddr]);


    // --- Plan / auth / gating state (must be inside component) ---
  const { session, email, plan } = useAuth();
  const isLoggedIn = !!session;
  const userId = session?.user?.id ?? null;
  
  const [paywall, setPaywall] = useState<{
    open: boolean;
    reason?: 'address_lock'|'stops10'|'guest_limit'|'free_limit'
  }>({ open:false });
  
  const [loginOpen, setLoginOpen] = useState(false);
  
  // Initialize cooldown from localStorage for this user/plan (safe in client)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(
    () => getCooldown(userId, plan, isLoggedIn)
  );
  
  // Pro-only: lock a destination as final stop
  const [lockedEndIndex, setLockedEndIndex] = useState<number | null>(null);
  
  // Dynamic limit by plan
  const stopLimit = (plan === 'pro' || plan === 'team') ? 50 : 9;

  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState<{[key: string]: GeocodeResult[]}>({});
  const [showSuggestions, setShowSuggestions] = useState<{[key: string]: boolean}>({});
  const [recentAddresses, setRecentAddresses] = useState<string[]>(() => {
    const saved = localStorage.getItem('recent_addresses');
    return saved ? JSON.parse(saved) : [];
  });

  const canAddDestination = destinations.length < stopLimit; // more than 1 and less than 10 => max 9 stops

  // Debounced autocomplete
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

      // Re-add route and markers if they exist
      if (lastRouteGeojsonRef.current) {
        addOrUpdateRoute(lastRouteGeojsonRef.current, lastPaintRef.current);
      }
      
      if (lastMarkerDataRef.current.length > 0) {
        // Re-add markers from stored data
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

  // Save theme to localStorage when changed
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

  // Update markers function to store marker data
  const updateMarkers = useCallback((points: { coord: LngLat; color: string; label: string; role: string; index?: number }[]) => {
    // Store marker data for persistence
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

  const addOrUpdateRoute = useCallback((geojson: Feature<LineString>, paintOverrides?: any) => {
    const map = mapRef.current;
    if (!map) return;

    // Store for rehydration
    lastRouteGeojsonRef.current = geojson;
    lastPaintRef.current = paintOverrides;

    const source = map.getSource(routeSourceId.current) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson as any);
      // Apply paint overrides
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

    const ensureLayer = () => {
      addOrUpdateRoute(geojson, paintOverrides);
    };

    if (map.isStyleLoaded()) {
      ensureLayer();
    } else {
      map.once("load", ensureLayer);
    }
  }, [trafficOn, addOrUpdateRoute]);

  const optimizeRoute = useCallback(async () => {
    // Check if traffic preference needs to be asked
    if (trafficOn === null) {
      setShowTrafficDialog(true);
      return;
      // Soft warning if duplicates exist
      if (duplicateIndexSet.size > 0) {
        toast("Duplicates detected — we’ll include them as typed.");
      }

    }

    setLoading(true);
        // Usage metering
    const usage = recordOptimizeUseAndCheckLimits(userId, plan, isLoggedIn);
    if (usage.blocked) {
      if (usage.reason === 'cooldown') {
        setCooldownUntil(usage.cooldownUntil!);
        setPaywall({ open:true, reason: isLoggedIn ? 'free_limit' : 'guest_limit' });
      } else if (usage.reason === 'guest_limit') {
        setPaywall({ open:true, reason: 'guest_limit' });
      } else if (usage.reason === 'free_limit') {
        setPaywall({ open:true, reason: 'free_limit' });
      }
      setLoading(false);
      return;
    }
    // Soft login nudge after 3 guest uses
    if (!isLoggedIn && usage.count === GUEST_LOGIN_SOFT_NUDGE_AFTER) {
      setLoginOpen(true);
    }

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
      
      // If Pro/Team and a stop is locked as final destination, move it to the end BEFORE stabilizing
      let filteredMutable = [...filtered];
      if ((plan === 'pro' || plan === 'team') && lockedEndIndex !== null) {
        const [lockedVal] = filteredMutable.splice(lockedEndIndex, 1);
        filteredMutable.push(lockedVal);
        const [lockedRes] = destResults.splice(lockedEndIndex, 1);
        destResults.push(lockedRes);
      }
      
      // Build stable labels and coordinates
      const rawInputLabels = [start, ...filteredMutable]; // EXACT typed text
      
      let coords: LngLat[];
      let labelsByStableIndex: string[];

      if (stabilizeResults) {
          const stable = destResults.map((res, i) => ({
            center: res.center as LngLat,
            typed: filteredMutable[i] // was filtered[i]
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

      drawRoute({ type: "Feature", geometry: route, properties: {} }, liveTrip, typicalTrip);

      // Build ordered stops with correct labels using origIndex pattern
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

        const stop: OrderedStop = {
          order: i,
          role: i === 0 ? 'Start' : 'Stop',
          label, lat, lng,
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

      // Save + render
      setOrdered(orderedStops);
      setArrow(formatArrowString(orderedStops));

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

      setTotalsLive({ distance_m: liveTotalDistanceM, duration_s: liveTotalDurationS });
      if (trafficOn) {
        setTotalsTypical({ distance_m: liveTotalDistanceM, duration_s: typicalTotalDurationS });
      } else {
        setTotalsTypical(null);
      }

      // IMPORTANT: tooltips must use stop.label
      updateMarkers(orderedStops.map((stop, i) => ({
        coord: [stop.lng, stop.lat] as LngLat,
        color: i === 0 ? "#7c3aed" : "#06b6d4",
        label: stop.label,             // <- typed label only
        role: stop.role,
        index: stop.order,
      })));

      fitToBounds(route.coordinates as LngLat[]);
      
      // Post-optimize UX
      setRouteOptimized(true);
      setShowDestinations(false);
      setShowRouteOrder(true);
      
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
  if (destinations.length >= stopLimit) {
    if (!(plan === 'pro' || plan === 'team')) setPaywall({ open:true, reason:'stops10' });
    return;
  }
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
    if (value.trim()) {
      setShowSuggestions(prev => ({ ...prev, [key]: true }));
    }
  };

  const handleSuggestionSelect = (suggestion: GeocodeResult, key: string, setter: (value: string) => void) => {
    setter(suggestion.place_name);
    saveToRecentAddresses(suggestion.place_name);
    setShowSuggestions(prev => ({ ...prev, [key]: false }));
    setSuggestions(prev => ({ ...prev, [key]: [] }));
  };

  const handleInputFocus = (key: string, currentValue: string) => {
    if (!currentValue.trim() && recentAddresses.length > 0) {
      setSuggestions(prev => ({ 
        ...prev, 
        [key]: recentAddresses.map(addr => ({ place_name: addr, center: [0, 0] as LngLat }))
      }));
      setShowSuggestions(prev => ({ ...prev, [key]: true }));
    }
  };

  const handleRowClick = (stop: OrderedStop) => {
    if (!mapRef.current) return;
    
    // Pan and zoom to marker
    mapRef.current.flyTo({
      center: [stop.lng, stop.lat],
      zoom: 14,
      duration: 1000
    });
    
    // Find and pulse the marker
    const marker = markersRef.current.find((m, i) => {
      const lngLat = m.getLngLat();
      return Math.abs(lngLat.lng - stop.lng) < 0.0001 && Math.abs(lngLat.lat - stop.lat) < 0.0001;
    });
    
    if (marker) {
      const el = marker.getElement();
      el.style.transform = 'scale(1.3)';
      el.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        el.style.transform = 'scale(1)';
      }, 300);
    }
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
    setShowDestinations(true);
    setShowRouteOrder(false);
    
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

  // Helper function to get short label
  const shortLabel = (address: string) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts[0].trim() || address;
  };

  // Update theme change handler to use persistence refs
  const handleThemeChange = (newTheme: string) => {
    setCurrentTheme(newTheme);
    
    // The map will automatically re-add route and markers via the useEffect
    // that listens to currentTheme changes and calls handleStyleLoad
  };

  return (
    <section className={`w-full ${ordered ? 'pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-0' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold">ZipRoute</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter a start and 2–9 stops. We'll order and open in Google Maps.
            </p>
          </div>

          {/* Card A - Start */}
          <Card className="shadow-[var(--shadow-elegant)]">
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
                  {showSuggestions.start && suggestions.start && suggestions.start.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {suggestions.start.map((suggestion, i) => (
                        <button
                          key={i}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border/50 last:border-b-0"
                          onClick={() => handleSuggestionSelect(suggestion, 'start', setStart)}
                        >
                          {suggestion.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" onClick={setMyLocationAsStart} className="min-h-[44px] text-xs px-3">
                  Use my location
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card B - Stops */}
          <Card className="shadow-[var(--shadow-elegant)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Stops (2–{stopLimit})</CardTitle>

                <span className="text-sm text-muted-foreground">
                  {destinations.filter(d => d.trim()).length}/9
                </span>
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
                            const newDests = [...destinations];
                            newDests[i] = value;
                            setDestinations(newDests);
                          });
                        }}
                        onFocus={() => handleInputFocus(`dest-${i}`, destination)}
                        onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, [`dest-${i}`]: false })), 150)}
                        className={`min-h-[44px] ${duplicateIndexSet.has(i) ? "border-destructive/60 focus-visible:ring-destructive" : ""}`}
                      />
                      {duplicateIndexSet.has(i) && (
                          <div className="text-[11px] text-destructive mt-1">
                            Duplicate stop (we’ll still include it)
                          </div>
                        )}
                      {showSuggestions[`dest-${i}`] && suggestions[`dest-${i}`] && suggestions[`dest-${i}`].length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                          {suggestions[`dest-${i}`].map((suggestion, j) => (
                            <button
                              key={j}
                              className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border/50 last:border-b-0"
                              onClick={() => {
                                const newDests = [...destinations];
                                newDests[i] = suggestion.place_name;
                                setDestinations(newDests);
                                handleSuggestionSelect(suggestion, `dest-${i}`, () => {});
                              }}
                            >
                              {suggestion.place_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {destinations.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDestination(i)}
                        className="min-h-[44px] px-3 text-xs"
                      >
                        Remove
                      </Button>
                    )}
                    {(plan === 'pro' || plan === 'team') ? (
  <Button
    type="button"
    variant={lockedEndIndex === i ? "default" : "outline"}
    size="sm"
    onClick={() => setLockedEndIndex(lockedEndIndex === i ? null : i)}
    className="min-h-[44px] px-3 text-xs"
  >
    {lockedEndIndex === i ? "End (locked)" : "Set as End"}
  </Button>
) : (
 
)}

                  </div>
                ))}
              </div>
              
              {canAddDestination ? (
  <Button
    type="button"
    variant="secondary"
    onClick={addDestination}
    className="w-full min-h-[44px]"
  >
    Add stop
  </Button>
) : (
  <Button
    type="button"
    variant="secondary"
    onClick={() => setPaywall({ open:true, reason:'stops10' })}
    className="w-full min-h-[44px]"
  >
    Upgrade to add more stops
  </Button>
)}

            </CardContent>
          </Card>

          {/* Card C - Options */}
          <Card className="shadow-[var(--shadow-elegant)]">
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
                    
                    // Re-draw route with new traffic setting if route exists
                    if (routeGeometry.current) {
                      const route = routeGeometry.current;
                      const congestionData = checked && ordered ? [] : undefined;
                      drawRoute(route, congestionData);
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
          <div className="hidden lg:block">
            {/* Cooldown banner */}
            {cooldownUntil && Date.now() < cooldownUntil && (
              <div className="rounded-md border px-3 py-2 text-sm bg-amber-50 border-amber-200 text-amber-800 mb-2">
                You’ve reached today’s limit. Wait ~{Math.max(0, Math.ceil((cooldownUntil - Date.now())/60000))} minutes,
                or <button className="underline" onClick={() => setLoginOpen(true)}>log in / upgrade</button>.
              </div>
            )}
            
            <Button 
              onClick={optimizeRoute} 
              disabled={loading || (cooldownUntil && Date.now() < cooldownUntil)} 
              className="w-full min-h-[44px]"
            >
              {loading ? "Optimizing..." : routeOptimized ? "Recalculate route" : `Find shortest route${destinations.filter(d => d.trim()).length >= 2 ? ` (${destinations.filter(d => d.trim()).length + 1} stops)` : ''}`}
            </Button>

          </div>

          {/* Desktop New Route Button */}
          {routeOptimized && (
            <div className="hidden lg:block">
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
            </div>
          )}
        </div>

        {/* Map Section */}
        <div className="lg:col-span-3">
          <div ref={mapContainer} className="w-full h-[420px] lg:h-[620px] rounded-lg shadow-[var(--shadow-elegant)]" />
        </div>
      </div>

      {/* Optimized Route Bottom Sheet Card */}
      {ordered && (
        <Card className="mt-6 shadow-[var(--shadow-elegant)]">
                  <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Optimized Route</CardTitle>
            <div className="flex items-center gap-3">
              {/* Totals & units (see Fix 6) */}
              <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
                {totalsLive && (
                  <span>
                    {(units === 'metric'
                      ? (totalsLive.distance_m / 1000).toFixed(1) + " km"
                      : (totalsLive.distance_m * 0.000621371).toFixed(1) + " mi")}
                    {" • "}
                    {Math.round(totalsLive.duration_s / 60)} min
                  </span>
                )}
                <Select value={units} onValueChange={(v) => setUnits(v as 'metric'|'imperial')}>
                  <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">km</SelectItem>
                    <SelectItem value="imperial">mi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
        
              {routeOptimized && (
                <Button size="sm" variant="secondary" onClick={optimizeRoute}>
                  Recalculate
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

          <CardContent className="space-y-3">
            <ul className="divide-y">
              {ordered.map((stop, i) => (
                <li 
                  key={i} 
                  className="py-3 cursor-pointer hover:bg-muted/50 rounded-md px-2 transition-colors"
                  onClick={() => handleRowClick(stop)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-medium mt-0.5">
                        {stop.order === 0 ? 'S' : stop.order}
                      </span>
                      <div>
                        <div className="font-medium">{shortLabel(stop.label)}</div>
                        <div className="text-sm text-muted-foreground mt-1">{stop.label}</div>
                      </div>
                    </div>
                    {stop.toNext && (
                      <span className="text-xs px-2 py-1 rounded bg-muted whitespace-nowrap">
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

            {/* Footer Button */}
            <div className="pt-3">
              <Button className="w-full" onClick={() => window.open(buildGoogleMapsUrl(ordered), '_blank')}>
                Google Maps
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                We send your typed addresses; Google may adjust pins to the nearest entrance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile sticky bottom bar */}
      {(routeOptimized || (!routeOptimized && start.trim() && destinations.filter(d => d.trim()).length >= 2)) && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur border-t p-3 lg:hidden">
          <div className="flex gap-2">
            {routeOptimized && (
              <Button variant="ghost" size="sm" onClick={() => setShowNewRouteDialog(true)} className="text-sm">
                New route
              </Button>
            )}
            <Button 
              className="flex-1 min-h-[44px]" 
              onClick={routeOptimized ? () => window.open(buildGoogleMapsUrl(ordered!), '_blank') : optimizeRoute}
              disabled={loading || (!routeOptimized && (cooldownUntil && Date.now() < cooldownUntil))}

            >
              {loading ? "Optimizing..." : routeOptimized ? "Google Maps" : `Find shortest route${destinations.filter(d => d.trim()).length >= 2 ? ` (${destinations.filter(d => d.trim()).length + 1} stops)` : ''}`}
            </Button>
          </div>
          {routeOptimized && (
            <p className="mt-2 text-xs text-muted-foreground">
              We send your typed addresses; Google may adjust pins slightly to the nearest entrance.
            </p>
          )}
        </div>
      )}

      {/* Mobile spacer */}
      {(routeOptimized || (!routeOptimized && start.trim() && destinations.filter(d => d.trim()).length >= 2)) && <div className="h-[calc(88px+env(safe-area-inset-bottom))] lg:hidden" />}

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
      {/* Paywall & Login Modals */}
        {paywall.open && <PaywallModal reason={paywall.reason!} onClose={() => setPaywall({ open:false })} />}
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}

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

// Single-source for address-or-coord
function addrOrCoord(s: OrderedStop) {
  const label = (s.label || '').trim().replace(/\s+/g, ' '); // normalize spaces
  return label && !isCoordInput(label) ? label : `${s.lat},${s.lng}`;
}

// Build Google Maps Directions URL using EXACTLY ONE round of encoding
function buildGoogleMapsUrl(stops: OrderedStop[]) {
  if (!stops?.length) return '';

  const origin = addrOrCoord(stops[0]);
  const destination = addrOrCoord(stops[stops.length - 1]);
  const waypointsStr = stops.slice(1, -1).map(addrOrCoord).join('|');

  // Option A: rely on URLSearchParams (no pre-encoding)
  const params = new URLSearchParams({
    api: '1',
    origin,            // <- raw string; URLSearchParams will encode exactly once
    destination,
    travelmode: 'driving'
  });
  if (waypointsStr) params.set('waypoints', waypointsStr);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}


export default MapboxRoutePlanner;
