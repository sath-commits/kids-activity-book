import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getSupabase, BookContent, DestinationCache } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rateLimit'

export const maxDuration = 90

interface Child {
  name: string
  age: number
  gender: 'boy' | 'girl' | 'explorer'
  interests?: string
}

interface GenerateBookRequest {
  destinationSlug: string
  destinationDisplayName: string
  tripDates?: { start: string; end: string }
  children: Child[]
  language: string
  parentEmail: string
}

interface ChildPersonalization {
  name: string
  age: number
  gender: 'boy' | 'girl' | 'explorer'
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
    if (!child.age || child.age < 4 || child.age > 12) return 'Child age must be 4-12'
    if (!['boy', 'girl', 'explorer'].includes(child.gender)) return 'Invalid gender'
    if (child.interests && child.interests.length > 100) return 'Interests too long'
  }
  if (!body.parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.parentEmail)) return 'Invalid email'
  return null
}

async function generateDestinationContent(displayName: string): Promise<BookContent> {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 4000,
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
      "carChallenge": "A car/travel challenge for if this section involves a drive (null if not applicable)",
      "imagePrompt": "Detailed DALL-E prompt for a coloring page illustration of this specific place. Describe the scene, key landmark features, and optionally a child character exploring. Do not mention color — this is line art only."
    }
  ],
  "scavengerHuntItems": ["12 items relevant to this destination"],
  "bingoGrid": ["24 items for a 5x5 bingo grid with a free space in the center"],
  "badgeNames": ["One badge name per section, e.g. 'Mountain Explorer', 'Beach Detective'"]
}

Generate 4-8 sections depending on how many distinct notable attractions the destination has. If it is a city, pick the most iconic kid-friendly landmarks/activities. If it is a national park, each major attraction/trail/feature gets a section. If it is a zoo or museum, pick themed zones. Badge names array must have the same length as sections array.`,
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

async function generateImages(
  displayName: string,
  content: BookContent
): Promise<{ coverImage: string | null; sectionImages: (string | null)[] }> {
  const coverPrompt = `Children's activity book cover illustration, black and white coloring page style, thick clean outlines, no shading, no fill, white background, printable: A cheerful wide landscape scene of ${displayName} with iconic landmarks and natural features visible. Leave the top 25% of the image as clear sky for a title banner. Include 2-3 small child silhouettes with backpacks in the foreground looking at the view. Style: clean bold linework like a children's coloring book.`

  const sectionPrompts = content.sections.map(
    (s) =>
      `Children's activity book coloring page, black and white line art only, thick clean outlines, no gray shading, no color fill, white background, printable quality: ${s.imagePrompt}`
  )

  const allPrompts = [coverPrompt, ...sectionPrompts]

  const results = await Promise.allSettled(
    allPrompts.map((prompt) =>
      getOpenAI().images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      })
    )
  )

  const images = results.map((r) => {
    if (r.status === 'fulfilled') {
      return r.value.data?.[0]?.b64_json ?? null
    }
    console.error('Image generation failed:', r.reason)
    return null
  })

  return {
    coverImage: images[0],
    sectionImages: images.slice(1),
  }
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

  const { destinationSlug, destinationDisplayName, tripDates, children, language, parentEmail } = body

  // Step A: Check cache
  const { data: cached } = await getSupabase()
    .from('destination_cache')
    .select('*')
    .eq('destination_slug', language === 'en' ? destinationSlug : `${destinationSlug}_${language}`)
    .maybeSingle()

  let content: BookContent
  let coverImageB64: string | null
  let sectionImagesB64: (string | null)[]
  let cacheHit = false

  if (cached) {
    cacheHit = true
    content = cached.sections_json as unknown as BookContent
    // Reconstruct BookContent from flat cache fields
    content = {
      destinationIntro: (cached as DestinationCache & { destination_intro?: string }).destination_intro ?? '',
      sections: cached.sections_json as unknown as BookContent['sections'],
      scavengerHuntItems: cached.scavenger_hunt_json as unknown as string[],
      bingoGrid: cached.bingo_grid_json as unknown as string[],
      badgeNames: cached.badge_names_json as unknown as string[],
    }
    coverImageB64 = cached.cover_image_b64
    sectionImagesB64 = cached.section_images_b64 as unknown as (string | null)[]

    // Increment hit_count
    await getSupabase()
      .from('destination_cache')
      .update({ hit_count: (cached.hit_count ?? 0) + 1 })
      .eq('destination_slug', cached.destination_slug)
  } else {
    // Step B: Generate content
    content = await generateDestinationContent(destinationDisplayName)

    // Step C: Generate images in parallel
    const { coverImage, sectionImages } = await generateImages(destinationDisplayName, content)
    coverImageB64 = coverImage
    sectionImagesB64 = sectionImages

    // Step F: Translate if needed
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

    // Step D: Save to Supabase
    const cacheSlug = language === 'en' ? destinationSlug : `${destinationSlug}_${language}`
    await getSupabase().from('destination_cache').upsert({
      destination_slug: cacheSlug,
      destination_display_name: destinationDisplayName,
      destination_intro: content.destinationIntro,
      sections_json: content.sections,
      cover_image_b64: coverImageB64 ?? '',
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

  // Step E: Personalize children (always fresh)
  const childPersonalization = await personalizeChildren(children, destinationDisplayName)

  // Step G: Return to client
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
  })
}
