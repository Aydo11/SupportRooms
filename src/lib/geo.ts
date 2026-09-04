import "server-only";

/**
 * Geocoding adapter. The default driver is postcodes.io — free, UK-only, no key,
 * and accurate to the postcode. Set GEOCODE_DRIVER=none to switch it off, or add
 * a driver here for Mapbox/Google without changing any calling code.
 */

export type Point = { latitude: number; longitude: number };

const MILES_PER_DEGREE_LAT = 69.05;

/** Rough bounding box around a point. Cheap enough to run per query. */
export function boundingBox(point: Point, radiusMiles: number) {
  const latDelta = radiusMiles / MILES_PER_DEGREE_LAT;
  const lngDelta = radiusMiles / (MILES_PER_DEGREE_LAT * Math.cos((point.latitude * Math.PI) / 180));
  return {
    minLat: point.latitude - latDelta,
    maxLat: point.latitude + latDelta,
    minLng: point.longitude - lngDelta,
    maxLng: point.longitude + lngDelta,
  };
}

/** Great-circle distance in miles, for sorting and "3.2 miles away" labels. */
export function distanceMiles(a: Point, b: Point) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

const cache = new Map<string, Point | null>();

async function fromPostcodesIo(path: string): Promise<Point | null> {
  try {
    const response = await fetch(`https://api.postcodes.io${path}`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      result?: { latitude?: number; longitude?: number } | { latitude?: number; longitude?: number }[];
    };
    const result = Array.isArray(data.result) ? data.result[0] : data.result;
    if (!result?.latitude || !result?.longitude) return null;
    return { latitude: result.latitude, longitude: result.longitude };
  } catch {
    return null;
  }
}

/** Full postcode first, then the outward code, then the place name. */
export async function geocode(input: {
  postcode?: string | null;
  city?: string | null;
}): Promise<Point | null> {
  if (process.env.GEOCODE_DRIVER === "none") return null;

  const key = `${input.postcode ?? ""}|${input.city ?? ""}`.toUpperCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  let point: Point | null = null;
  const postcode = input.postcode?.trim().toUpperCase();

  if (postcode) {
    point = await fromPostcodesIo(`/postcodes/${encodeURIComponent(postcode)}`);
    if (!point) {
      const outward = postcode.split(/\s+/)[0];
      point = await fromPostcodesIo(`/outcodes/${encodeURIComponent(outward)}`);
    }
  }

  if (!point && input.city) {
    point = await fromPostcodesIo(`/places?q=${encodeURIComponent(input.city)}&limit=1`);
  }

  cache.set(key, point);
  return point;
}

/** Where a text search should centre the map, used by search and the map view. */
export async function resolveArea(where: string | undefined): Promise<Point | null> {
  if (!where?.trim()) return null;
  const value = where.trim();
  const looksLikePostcode = /^[A-Z]{1,2}\d/i.test(value);
  return geocode(looksLikePostcode ? { postcode: value } : { city: value });
}
