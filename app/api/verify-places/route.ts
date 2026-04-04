import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'


interface LLMPlaceResult {
  original: string
  corrected: string | null  // null means not a real place
  changed: boolean          // true if spelling was corrected
  confidence: 'high' | 'medium' | 'low'
  reason: string
  autoAccept: boolean
  geocodeQuery: string | null // fully qualified name for unambiguous Mapbox lookup
}

function normalizeSimplePlaceName(place: string): string {
  return place
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase()
      if (['of', 'the', 'and', 'at', 'in', 'on'].includes(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
    .replace(/\bNw\b/g, 'NW')
    .replace(/\bNe\b/g, 'NE')
    .replace(/\bSw\b/g, 'SW')
    .replace(/\bSe\b/g, 'SE')
}

async function verifyPlacesWithLLM(places: string[], destination: string): Promise<LLMPlaceResult[]> {
  const prompt = `You are a geography assistant helping parents verify place names for a kids activity book.

Destination: "${destination}"
Places entered: ${JSON.stringify(places)}

For each place:
1. Is it a real place that could plausibly be visited at or near "${destination}"?
2. If the spelling is wrong or slightly off, what is the correct spelling?
3. Provide a fully qualified geocode query — the most unambiguous search string for this specific place (e.g. "Lake Crescent, Olympic National Park, Washington, USA" not just "Lake Crescent"). This prevents map pins from landing in the wrong state or country.
4. Estimate whether the correction is high, medium, or low confidence.
5. Set autoAccept to true only when the correction is an obvious capitalization / spacing fix or a highly confident spelling correction that should not require bothering the parent.

Rules:
- If real and spelled correctly, return it as-is with changed: false
- If spelling is wrong, return corrected name with changed: true
- If not a real place at all, return corrected: null and geocodeQuery: null
- Do NOT rename to a broader region (e.g. keep "Hoh Rain Forest", not "Olympic National Park")
- Do NOT append road/trail/route suffixes (keep "Cape Flattery" not "Cape Flattery Road")
- Local/informal names are fine — if recognizable, accept it
- Capitalization-only fixes should be high confidence and autoAccept: true
- Clear typo fixes like "hurricane ridge" -> "Hurricane Ridge" can be autoAccept: true when confidence is high
- If there is any meaningful ambiguity, set autoAccept: false

Return ONLY a JSON array with no markdown:
[{ "original": "...", "corrected": "...", "changed": false, "confidence": "high", "reason": "brief reason", "autoAccept": true, "geocodeQuery": "Full Name, Region, Country" }, ...]`

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: 500,
    messages: [
      { role: 'system', content: 'You are a geography assistant. Return ONLY valid JSON with no markdown, no code fences.' },
      { role: 'user', content: prompt },
    ],
  })

  const raw = completion.choices[0].message.content?.trim() ?? '[]'
  try {
    const parsed = JSON.parse(raw) as LLMPlaceResult[]
    return parsed.map((item, i) => {
      const original = places[i] ?? item.original ?? ''
      const normalizedOriginal = normalizeSimplePlaceName(original)
      const corrected = item.corrected ? normalizeSimplePlaceName(item.corrected) : null
      const changed = !!corrected && corrected !== normalizedOriginal

      return {
        original,
        corrected: corrected ?? null,
        changed,
        confidence: item.confidence ?? 'medium',
        reason: item.reason ?? '',
        autoAccept: corrected !== null && (!changed || item.autoAccept === true),
        geocodeQuery: item.geocodeQuery ?? corrected ?? original,
      }
    })
  } catch {
    // If parsing fails, return all as-is
    return places.map((p) => {
      const corrected = normalizeSimplePlaceName(p)
      return {
        original: p,
        corrected,
        changed: corrected !== p,
        confidence: 'high' as const,
        reason: 'Normalized capitalization and spacing locally.',
        autoAccept: true,
        geocodeQuery: corrected,
      }
    })
  }
}


export async function POST(req: NextRequest) {
  const { places, destination } = await req.json()
  if (!Array.isArray(places) || !destination) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Step 1: LLM validates and corrects place names
  const llmResults = await verifyPlacesWithLLM(places, destination)

  // Step 2: Geocode only the valid places (for map coords — done separately in generate-book)
  // Here we just return the verification results for the UI
  const results = llmResults.map((r) => ({
    original: r.original,
    found: r.corrected,
    notFound: r.corrected === null,
    hasSuggestion: r.changed && r.corrected !== null,
    autoAccepted: r.autoAccept,
    confidence: r.confidence,
    reason: r.reason,
    geocodeQuery: r.geocodeQuery,
  }))

  return NextResponse.json({ results })
}
