const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN!

interface GeocodedPlace {
  canonical: string
  coords: [number, number]
}

async function geocodePlace(place: string, destination: string): Promise<GeocodedPlace | null> {
  const query = encodeURIComponent(`${place}, ${destination}`)
  // types=poi,place,locality prefers named landmarks over roads/addresses
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?limit=1&types=poi,place,locality,neighborhood&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null
    // feature.text is the landmark name only (e.g. "Kalaloch Beach"), not the full address
    const canonical = (feature.text as string) ?? (feature.place_name as string).split(',')[0].trim()
    return { canonical, coords: feature.center as [number, number] }
  } catch {
    return null
  }
}

export interface NormalizedPlaces {
  canonicalNames: string[]         // corrected spellings from Mapbox
  coords: ([number, number] | null)[] // lat/lng per place (null if geocode failed)
}

export async function normalizePlaces(places: string[], destination: string): Promise<NormalizedPlaces> {
  const results = await Promise.all(places.map((p) => geocodePlace(p, destination)))
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

  let pathOverlay = ''
  if (validPairs.length >= 2) {
    const geojson = JSON.stringify({
      type: 'Feature',
      properties: { stroke: '#2d6a4f', 'stroke-width': 3, 'stroke-opacity': 0.7 },
      geometry: { type: 'LineString', coordinates: validPairs.map(({ coord }) => coord) },
    })
    pathOverlay = `,geojson(${encodeURIComponent(geojson)})`
  }

  const overlay = `${pins}${pathOverlay}`
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
