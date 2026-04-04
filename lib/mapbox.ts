const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN!
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!
const MAX_DESTINATION_DISTANCE_KM = 220

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

interface MapboxFeature {
  center?: [number, number]
  text?: string
  place_name?: string
  place_type?: string[]
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ')
}

function containsRoadSuffix(value: string): boolean {
  return /\b(road|rd|drive|dr|street|st|avenue|ave|highway|hwy|lane|ln)\b/i.test(value)
}

function placeKeywordBonus(query: string, featureName: string): number {
  const keywords = ['beach', 'lake', 'ridge', 'forest', 'bay', 'cape', 'falls', 'mount', 'mountain', 'trail']
  const q = normalizeLabel(query)
  const f = normalizeLabel(featureName)
  return keywords.reduce((score, keyword) => {
    const queryHas = q.includes(keyword)
    const featureHas = f.includes(keyword)
    if (queryHas && featureHas) return score + 14
    if (queryHas && !featureHas) return score - 18
    return score
  }, 0)
}

function scoreFeature(feature: MapboxFeature, query: string, destination: string, proximity?: [number, number]): number {
  const text = feature.text ?? ''
  const placeName = feature.place_name ?? ''
  const normalizedQuery = normalizeLabel(query.split(',')[0] ?? query)
  const normalizedText = normalizeLabel(text)
  const normalizedPlaceName = normalizeLabel(placeName)
  let score = 0

  if (normalizedText === normalizedQuery) score += 120
  else if (normalizedText.includes(normalizedQuery) || normalizedQuery.includes(normalizedText)) score += 60

  if (normalizedPlaceName.includes(normalizeLabel(destination))) score += 30

  score += placeKeywordBonus(query, `${text} ${placeName}`)

  if (!containsRoadSuffix(query) && containsRoadSuffix(text)) score -= 120
  if (!containsRoadSuffix(query) && containsRoadSuffix(placeName)) score -= 60

  const placeTypes = feature.place_type ?? []
  if (placeTypes.includes('address')) score -= 100
  if (placeTypes.includes('street')) score -= 90
  if (placeTypes.includes('postcode')) score -= 80

  if (proximity && feature.center) {
    const distanceKm = haversineKm(proximity[0], proximity[1], feature.center[0], feature.center[1])
    score -= Math.min(distanceKm, 250) * 0.2
  }

  return score
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
    if (haversineKm(proximity[0], proximity[1], coords[0], coords[1]) > MAX_DESTINATION_DISTANCE_KM) return null
    const canonical = (data.results[0].address_components?.[0]?.long_name as string) ?? query.split(',')[0].trim()
    return { canonical, coords }
  } catch {
    return null
  }
}

async function geocodePlace(query: string, destination: string, proximity?: [number, number]): Promise<GeocodedPlace | null> {
  const proximityParam = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : ''
  // Hard-constrain to a broad bbox around the destination to prevent pins landing in the wrong region.
  const bboxParam = proximity
    ? `&bbox=${(proximity[0] - 4).toFixed(4)},${(proximity[1] - 4).toFixed(4)},${(proximity[0] + 4).toFixed(4)},${(proximity[1] + 4).toFixed(4)}`
    : ''
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=5${proximityParam}${bboxParam}&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const features: MapboxFeature[] = Array.isArray(data.features) ? data.features : []
    const feature = features
      .filter((item): item is MapboxFeature & { center: [number, number] } => Array.isArray(item.center))
      .filter((item) => {
        if (!proximity) return true
        return haversineKm(proximity[0], proximity[1], item.center[0], item.center[1]) <= MAX_DESTINATION_DISTANCE_KM
      })
      .map((item) => ({
        item,
        score: scoreFeature(item, query, destination, proximity),
      }))
      .sort((a, b) => b.score - a.score)[0]?.item

    if (feature) {
      const coords = feature.center as [number, number]
      if (!proximity || haversineKm(proximity[0], proximity[1], coords[0], coords[1]) <= MAX_DESTINATION_DISTANCE_KM) {
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
    // Preserve the verified place labels from the parent flow; geocoders often return roads/regions.
    canonicalNames: places,
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
