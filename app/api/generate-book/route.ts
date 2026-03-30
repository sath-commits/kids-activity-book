import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getSupabase, BookContent, DestinationCache } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rateLimit'
import { normalizePlaces, generateMapImage } from '@/lib/mapbox'

export const maxDuration = 90

interface Child {
  name: string
  age: number
  gender: 'boy' | 'girl'
  interests?: string
}

interface GenerateBookRequest {
  destinationSlug: string
  destinationDisplayName: string
  tripDates?: { start: string; end: string }
  children: Child[]
  language: string
  parentEmail: string
  places?: string[]
}

interface ChildPersonalization {
  name: string
  age: number
  gender: 'boy' | 'girl'
  keywords: string[]
  personalizedChallengeNote: string
  personalizedDrawingPrompt: string
}

function validateInput(body: GenerateBookRequest): string | null {
  if (!body.destinationSlug || typeof body.destinationSlug !== 'string') return 'Missing destinationSlug'
  if (!body.destinationDisplayName || typeof body.destinationDisplayName !== 'string') return 'Missing destinationDisplayName'
  if (!Array.isArray(body.children) || body.children.length === 0) return 'At least one child required'
  if (body.children.length > 4) return 'Maximum 4 children'
  for (const child of body.children) {
    if (!child.name || child.name.length > 20) return 'Child name invalid'
    if (!child.age || child.age < 2 || child.age > 12) return 'Child age must be 2-12'
    if (!['boy', 'girl'].includes(child.gender)) return 'Invalid gender'
    if (child.interests && child.interests.length > 100) return 'Interests too long'
  }
  if (!body.parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.parentEmail)) return 'Invalid email'
  return null
}

async function generateDestinationContent(displayName: string, places?: string[]): Promise<BookContent> {
  const sectionsInstruction = places && places.length > 0
    ? `Generate sections for ONLY these specific places the family will visit (in this order): ${places.join(', ')}. Do not add or substitute other attractions — only cover what they listed.`
    : `Generate 4-8 sections depending on how many distinct notable attractions the destination has. If it is a city, pick the most iconic kid-friendly landmarks/activities. If it is a national park, each major attraction/trail/feature gets a section. If it is a zoo or museum, pick themed zones.`

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 4500,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert children\'s educational content creator specializing in travel destinations and nature. You create age-appropriate, fun, and educational activity booklet content for kids. You write in a warm, encouraging, adventurous tone. All content should be positive, safe, and appropriate for ages 4–12. Return ONLY valid JSON with no markdown, no code fences.',
      },
      {
        role: 'user',
        content: `Create a junior explorer activity booklet content for: ${displayName}

Return a JSON object with this exact schema (no markdown, no code fences, pure JSON):
{
  "destinationIntro": "2-3 sentence kid-friendly intro about the destination overall",
  "sections": [
    {
      "id": "unique-slug",
      "title": "Place or attraction name",
      "emoji": "🏔",
      "historyBlurb": "2-3 sentences kid-friendly history or science about this place",
      "funFact": "One surprising delightful fact",
      "whatDoYouSee": ["4-5 observable things at this location"],
      "findThese": ["3-4 specific things to hunt for"],
      "challenge": "One fun physical or sensory challenge to do here",
      "thinkQuestion": "One open-ended thinking question",
      "thinkQuestionAnswer": "Kid-friendly answer for the answer key",
      "riddle": "A fun kid-friendly riddle about something you'd find at this location (e.g. 'I have needles but I don't sew. What am I?')",
      "riddleAnswer": "The answer to the riddle",
      "carChallenge": "A car/travel challenge for if this section involves a drive (null if not applicable)",
      "imagePrompt": "Detailed DALL-E prompt for a coloring page illustration of this specific place. Describe the scene, key landmark features, and optionally a child character exploring. Do not mention color — this is line art only."
    }
  ],
  "scavengerHuntItems": ["12 items relevant to this destination"],
  "bingoGrid": ["24 items for a 5x5 bingo grid with a free space in the center"],
  "badgeNames": ["One badge name per section, e.g. 'Mountain Explorer', 'Beach Detective'"]
}

${sectionsInstruction} Badge names array must have the same length as sections array.`,
      },
    ],
  })

  const raw = completion.choices[0].message.content?.trim() ?? ''
  try {
    return JSON.parse(raw) as BookContent
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as BookContent
    throw new Error('Failed to parse GPT content response')
  }
}

async function generateCoverImage(displayName: string, children: Child[]): Promise<string | null> {
  const childDescriptions = children.map((c) => `a ${c.age}-year-old ${c.gender}`)
  const kidsDesc =
    childDescriptions.length === 1
      ? childDescriptions[0]
      : childDescriptions.length === 2
        ? `${childDescriptions[0]} and ${childDescriptions[1]}`
        : `${childDescriptions.slice(0, -1).join(', ')}, and ${childDescriptions[childDescriptions.length - 1]}`

  const prompt = `Children's illustrated adventure book cover, full color, vibrant, warm, cartoon style similar to a children's picture book: A cheerful landscape scene of ${displayName} with iconic landmarks and natural features beautifully depicted in the background. In the foreground, ${kidsDesc} wearing colorful outdoor gear and backpacks, smiling and excited. Style: bright saturated colors, friendly rounded cartoon illustration, rich detailed background showing the destination's key scenery. Leave the top 20% of the image as open sky area for a title banner overlay.`

  try {
    const result = await getOpenAI().images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    })
    return result.data?.[0]?.b64_json ?? null
  } catch (e) {
    console.error('Cover image generation failed:', e)
    return null
  }
}

async function generateSectionImages(displayName: string, content: BookContent): Promise<(string | null)[]> {
  const sectionPrompts = content.sections.map(
    (s) =>
      `Children's activity book coloring page, black and white line art only, thick clean outlines, no gray shading, no color fill, white background, printable quality: ${s.imagePrompt}`
  )

  const results = await Promise.allSettled(
    sectionPrompts.map((prompt) =>
      getOpenAI().images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      })
    )
  )

  return results.map((r) => {
    if (r.status === 'fulfilled') {
      return r.value.data?.[0]?.b64_json ?? null
    }
    console.error('Section image generation failed:', r.reason)
    return null
  })
}

async function personalizeChildren(children: Child[], destination: string): Promise<ChildPersonalization[]> {
  const childrenWithInterests = children.filter((c) => c.interests && c.interests.trim())

  if (childrenWithInterests.length === 0) {
    return children.map((c) => ({
      name: c.name,
      age: c.age,
      gender: c.gender,
      keywords: [],
      personalizedChallengeNote: '',
      personalizedDrawingPrompt: `Draw something amazing you saw at ${destination}!`,
    }))
  }

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 800,
    messages: [
      {
        role: 'system',
        content: 'You are a children\'s activity creator. Return ONLY valid JSON, no markdown.',
      },
      {
        role: 'user',
        content: `For each child below, create personalized activity content for their visit to ${destination}.
Children: ${JSON.stringify(children.map((c) => ({ name: c.name, interests: c.interests || 'general exploration' })))}

Return a JSON array (one object per child, in the same order):
[
  {
    "name": "child name",
    "keywords": ["interest1", "interest2"],
    "personalizedChallengeNote": "A fun 1-sentence challenge connecting their interests to what they might see at this destination",
    "personalizedDrawingPrompt": "A drawing prompt that combines their interests with the destination"
  }
]`,
      },
    ],
  })

  const raw = completion.choices[0].message.content?.trim() ?? ''
  try {
    const parsed = JSON.parse(raw) as {
      name: string
      keywords: string[]
      personalizedChallengeNote: string
      personalizedDrawingPrompt: string
    }[]
    return children.map((child, i) => ({
      name: child.name,
      age: child.age,
      gender: child.gender,
      keywords: parsed[i]?.keywords ?? [],
      personalizedChallengeNote: parsed[i]?.personalizedChallengeNote ?? '',
      personalizedDrawingPrompt: parsed[i]?.personalizedDrawingPrompt ?? `Draw something amazing you saw at ${destination}!`,
    }))
  } catch {
    return children.map((c) => ({
      name: c.name,
      age: c.age,
      gender: c.gender,
      keywords: [],
      personalizedChallengeNote: '',
      personalizedDrawingPrompt: `Draw something amazing you saw at ${destination}!`,
    }))
  }
}

async function translateContent(content: BookContent, language: string, languageName: string): Promise<BookContent> {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 6000,
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the provided JSON content into ${languageName}. Keep all JSON keys in English. Only translate string values. Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Translate all user-facing string values in this JSON to ${languageName}. Keep JSON structure and keys exactly the same:\n${JSON.stringify(content)}`,
      },
    ],
  })

  const raw = completion.choices[0].message.content?.trim() ?? ''
  try {
    return JSON.parse(raw) as BookContent
  } catch {
    return content // fallback to English
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Max 10 books per hour per IP.' }, { status: 429 })
  }

  let body: GenerateBookRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validationError = validateInput(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { destinationSlug, destinationDisplayName, tripDates, children, language, parentEmail, places } = body
  const hasItinerary = Array.isArray(places) && places.length > 0

  let content: BookContent
  let sectionImagesB64: (string | null)[]
  let cacheHit = false

  let placeCoords: ([number, number] | null)[] | undefined

  if (hasItinerary) {
    // Geocode for map coordinates only — keep user's original place names for content
    const geo = await normalizePlaces(places!, destinationDisplayName)
    placeCoords = geo.coords

    // Itinerary-specific — always generate fresh, never cache
    content = await generateDestinationContent(destinationDisplayName, places!)
    sectionImagesB64 = await generateSectionImages(destinationDisplayName, content)
  } else {
    // Step A: Check destination cache
    const { data: cached } = await getSupabase()
      .from('destination_cache')
      .select('*')
      .eq('destination_slug', language === 'en' ? destinationSlug : `${destinationSlug}_${language}`)
      .maybeSingle()

    if (cached) {
      cacheHit = true
      content = {
        destinationIntro: (cached as DestinationCache & { destination_intro?: string }).destination_intro ?? '',
        sections: cached.sections_json as unknown as BookContent['sections'],
        scavengerHuntItems: cached.scavenger_hunt_json as unknown as string[],
        bingoGrid: cached.bingo_grid_json as unknown as string[],
        badgeNames: cached.badge_names_json as unknown as string[],
      }
      sectionImagesB64 = cached.section_images_b64 as unknown as (string | null)[]

      // Increment hit_count
      await getSupabase()
        .from('destination_cache')
        .update({ hit_count: (cached.hit_count ?? 0) + 1 })
        .eq('destination_slug', cached.destination_slug)
    } else {
      // Generate content
      content = await generateDestinationContent(destinationDisplayName)
      sectionImagesB64 = await generateSectionImages(destinationDisplayName, content)

      // Translate if needed
      const languageNames: Record<string, string> = {
        es: 'Spanish',
        fr: 'French',
        hi: 'Hindi',
        zh: 'Chinese (Simplified)',
        pt: 'Portuguese',
      }
      if (language !== 'en' && languageNames[language]) {
        content = await translateContent(content, language, languageNames[language])
      }

      // Save to Supabase (cover not cached)
      const cacheSlug = language === 'en' ? destinationSlug : `${destinationSlug}_${language}`
      await getSupabase().from('destination_cache').upsert({
        destination_slug: cacheSlug,
        destination_display_name: destinationDisplayName,
        destination_intro: content.destinationIntro,
        sections_json: content.sections,
        cover_image_b64: '',
        section_images_b64: sectionImagesB64,
        scavenger_hunt_json: content.scavengerHuntItems,
        bingo_grid_json: content.bingoGrid,
        badge_names_json: content.badgeNames,
        answer_key_json: Object.fromEntries(
          content.sections.map((s) => [s.title, s.thinkQuestionAnswer])
        ),
        hit_count: 1,
      })
    }
  }

  // Cover image + child personalization + map (if itinerary) — all in parallel
  const [coverImageB64, childPersonalization, mapImageB64] = await Promise.all([
    generateCoverImage(destinationDisplayName, children),
    personalizeChildren(children, destinationDisplayName),
    hasItinerary ? generateMapImage(places!, placeCoords!) : Promise.resolve(null),
  ])

  return NextResponse.json({
    destinationDisplayName,
    destinationSlug,
    tripDates,
    cacheHit,
    content,
    coverImageB64,
    sectionImagesB64,
    childPersonalization,
    language,
    parentEmail,
    places: hasItinerary ? places : undefined,
    mapImageB64: mapImageB64 ?? null,
  })
}
