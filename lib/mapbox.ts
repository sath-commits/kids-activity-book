const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN!
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!

function haversineKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface GeocodedPlace {
  canonical: string
  coords: [number, number]
}

async function geocodeDestination(destination: string): Promise<[number, number] | null> {
  const query = encodeURIComponent(destination)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?limit=1&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const center = data.features?.[0]?.center
    return center ?? null
  } catch {
    return null
  }
}

// Google Geocoding fallback for places Mapbox can't find within the destination area
async function geocodePlaceGoogle(query: string, proximity: [number, number]): Promise<GeocodedPlace | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.[0]) return null
    const loc = data.results[0].geometry.location as { lat: number; lng: number }
    const coords: [number, number] = [loc.lng, loc.lat]
    // Reject if result is more than 3 degrees away from destination
    const dLon = Math.abs(coords[0] - proximity[0])
    const dLat = Math.abs(coords[1] - proximity[1])
    if (dLon > 3 || dLat > 3) return null
    const canonical = (data.results[0].address_components?.[0]?.long_name as string) ?? query.split(',')[0].trim()
    return { canonical, coords }
  } catch {
    return null
  }
}

async function geocodePlace(query: string, destination: string, proximity?: [number, number]): Promise<GeocodedPlace | null> {
  const proximityParam = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : ''
  // Hard-constrain to a ~330km bbox around the destination to prevent pins landing in wrong regions
  const bboxParam = proximity
    ? `&bbox=${(proximity[0] - 3).toFixed(4)},${(proximity[1] - 3).toFixed(4)},${(proximity[0] + 3).toFixed(4)},${(proximity[1] + 3).toFixed(4)}`
    : ''
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=1${proximityParam}${bboxParam}&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const feature = data.features?.[0]
    if (feature) {
      const coords = feature.center as [number, number]
      // Reject if result is more than 150km from destination centroid — prevents
      // Mapbox returning a more-prominent same-named place in a neighbouring city
      if (proximity && haversineKm(proximity[0], proximity[1], coords[0], coords[1]) > 150) {
        // fall through to Google
      } else {
        const canonical = (feature.text as string) ?? (feature.place_name as string).split(',')[0].trim()
        return { canonical, coords }
      }
    }
  } catch {
    // fall through to Google
  }

  // Mapbox found nothing within the bbox — fall back to Google Geocoding
  if (proximity && GOOGLE_MAPS_API_KEY) {
    return geocodePlaceGoogle(query, proximity)
  }
  return null
}

export interface NormalizedPlaces {
  canonicalNames: string[]
  coords: ([number, number] | null)[]
}

export async function normalizePlaces(places: string[], destination: string, geocodeQueries?: string[]): Promise<NormalizedPlaces> {
  // Geocode the destination first to use as proximity bias
  const destCoords = await geocodeDestination(destination)
  // Use LLM-qualified geocode queries when available (more specific = more accurate pins)
  const queries = places.map((p, i) => geocodeQueries?.[i] ?? `${p}, ${destination}`)
  const results = await Promise.all(queries.map((q) => geocodePlace(q, destination, destCoords ?? undefined)))
  return {
    canonicalNames: results.map((r, i) => r?.canonical ?? places[i]),
    coords: results.map((r) => r?.coords ?? null),
  }
}

export async function generateMapImage(
  canonicalNames: string[],
  coords: ([number, number] | null)[]
): Promise<string | null> {
  const validPairs = coords
    .map((c, i) => (c ? { coord: c, name: canonicalNames[i], idx: i } : null))
    .filter((x): x is { coord: [number, number]; name: string; idx: number } => x !== null)

  if (validPairs.length === 0) return null

  const pins = validPairs
    .map(({ coord, idx }) => `pin-l-${idx + 1}+2d6a4f(${coord[0]},${coord[1]})`)
    .join(',')

  const overlay = pins
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${overlay}/auto/800x560?padding=60&access_token=${MAPBOX_TOKEN}`

  try {
    const res = await fetch(mapUrl)
    if (!res.ok) {
      console.error('Mapbox static image failed:', res.status, await res.text())
      return null
    }
    const buffer = await res.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  } catch (e) {
    console.error('Map generation error:', e)
    return null
  }
}
