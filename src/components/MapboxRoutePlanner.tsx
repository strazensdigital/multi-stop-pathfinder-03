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

  const updateMarkers = useCallback((points: { coord: LngLat; color: string; label: string; index?: number }[]) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    points.forEach(({ coord, color, label, index }) => {
      const el = document.createElement("div");
      el.className = "flex items-center justify-center rounded-full border border-foreground/20 text-[10px] font-medium text-background";
      el.style.width = "22px";
      el.style.height = "22px";
      el.style.backgroundColor = color;
      el.setAttribute("title", label);
      el.textContent = typeof index === "number" ? (index === 0 ? "S" : String(index)) : "";
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(coord).addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, []);

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

      // Markers in optimized order: Start + Destination 1..N
      const waypoints = (data?.waypoints || []) as Array<{ waypoint_index: number; location: LngLat; name: string }>;
      const ordered = waypoints.slice().sort((a, b) => a.waypoint_index - b.waypoint_index);
      const destinationsOrdered = ordered.slice(1);
      updateMarkers([
        { coord: startRes.center, color: "#7c3aed", label: `Start: ${startRes.place_name}`, index: 0 },
        ...destinationsOrdered.map((w, i) => ({
          coord: w.location as LngLat,
          color: "#06b6d4",
          label: `Destination ${i + 1}: ${w.name || `${w.location[1].toFixed(5)}, ${w.location[0].toFixed(5)}`}`,
          index: i + 1,
        })),
      ]);

      fitToBounds(route.coordinates as LngLat[]);
      toast.success("Optimized route ready!");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to compute route");
    } finally {
      setLoading(false);
    }
  }, [start, destinations, drawRoute, updateMarkers, fitToBounds]);

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
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <div ref={mapContainer} className="w-full h-[420px] lg:h-[620px] rounded-lg shadow-[var(--shadow-elegant)]" />
        </div>
      </div>
    </section>
  );
};

export default MapboxRoutePlanner;
