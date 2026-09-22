/** Returns GeoJSON LineString coordinates [lng, lat][] or null on failure */
export async function fetchOsrmRoute(
  points: [number, number][] // [lat, lng][]
): Promise<[number, number][] | null> {
  if (points.length < 2) return null;

  const wp = points.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${wp}?overview=full&geometries=geojson`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates as
      | [number, number][]
      | undefined;
    return coords ?? null;
  } catch {
    return null;
  }
}
