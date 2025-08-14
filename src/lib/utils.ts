import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Role = 'Start' | 'Stop';
export type OrderedStop = {
  order: number;             // 0 = Start, then 1..N
  role: Role;
  label: string;             // user address or reverse-geocoded
  lat: number;
  lng: number;
  toNext?: { distance_m: number; duration_s: number }; // none on last
};

export const toKm = (m: number) => m / 1000;
export const toMiles = (m: number) => m / 1609.344;
export const toMinutes = (s: number) => s / 60;

export function formatArrowString(stops: OrderedStop[]) {
  return stops
    .map(s => (s.order === 0 ? `S. ${s.label}` : `${s.order}. ${s.label}`))
    .join(' → ');
}

// Cache for reverse geocoding results
const reverseGeocodeCache = new Map<string, string>();

export async function reverseGeocode(lat: number, lng: number, token: string): Promise<string | null> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (reverseGeocodeCache.has(key)) {
    return reverseGeocodeCache.get(key)!;
  }
  
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(`${lng},${lat}`)}.json?limit=1&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data?.features?.[0];
  const result = feat?.place_name ?? null;
  
  if (result) {
    reverseGeocodeCache.set(key, result);
  }
  
  return result;
}
