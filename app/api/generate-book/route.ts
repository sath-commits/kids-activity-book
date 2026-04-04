import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getSupabase, BookContent, DestinationCache } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rateLimit'
import { normalizePlaces, generateMapImage } from '@/lib/mapbox'
import { hashStr } from '@/lib/maze'

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
  placeGeoQueries?: string[]
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

type BonusContent = Pick<BookContent,
  'cryptogramPhrase' | 'rebusPuzzles' | 'travelTrivia' |
  'travelMenu' | 'topFiveLists' | 'comicStrip' | 'mapDrawingChallenge' | 'timeCapsuleLetter'
>

// Non-logic-grid bonus content — uses mini (no complex reasoning needed)
async function generateBonusContent(displayName: string): Promise<BonusContent> {
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a children\'s activity book creator. Create fun, age-appropriate content for kids ages 4-12. Return ONLY valid JSON, no markdown, no code fences.',
        },
        {
          role: 'user',
          content: `Create bonus activity content for a kids activity book about: ${displayName}

Return a JSON object with this exact schema:
{
  "cryptogramPhrase": "A fun 8-12 word fact about ${displayName} using simple vocabulary (e.g. 'The giant trees here are older than your great grandparents')",
  "rebusPuzzles": [
    {"equation": "WATER + FALL", "answer": "WATERFALL"},
    {"equation": "CAMP + FIRE", "answer": "CAMPFIRE"}
  ],
  "travelTrivia": [
    {"question": "destination-specific trivia question", "answer": "short answer"}
  ],
  "travelMenu": [
    {
      "category": "Starters",
      "items": [{"name": "Silly destination-themed dish name", "description": "funny description", "price": "$3.00"}]
    }
  ],
  "topFiveLists": [
    {"title": "Top 5 Animals to Spot", "items": ["item1", "item2", "item3", "item4", "item5"]},
    {"title": "Top 5 Things to Taste", "items": ["..."]},
    {"title": "Top 5 Must-Do Activities", "items": ["..."]}
  ],
  "comicStrip": {
    "title": "My ${displayName} Adventure!",
    "panels": [
      {"scene": "Arriving, looking excited"},
      {"scene": "Seeing something amazing"},
      {"scene": "Having a funny moment"},
      {"scene": "Making a discovery"},
      {"scene": "Trying something brave"},
      {"scene": "Saying goodbye, happy and tired"}
    ]
  },
  "mapDrawingChallenge": {
    "instructions": ["Draw North at the top", "Add 3 roads or paths", "Mark where you ate lunch", "Draw the animals you saw", "Add your favorite spot with a star"],
    "landmarks": ["6-8 specific landmarks/features at ${displayName}"]
  },
  "timeCapsuleLetter": {
    "prompts": [
      "My name is ___ and I am ___ years old.",
      "I am visiting ${displayName} with ___",
      "The first thing I saw was ___",
      "The most amazing thing was ___",
      "I ate ___ and it was ___",
      "The funniest moment was ___",
      "I felt ___ when I saw ___",
      "My favorite memory from today is ___",
      "When I grow up I want to ___",
      "A message for future me: ___"
    ]
  }
}

Rules:
- rebusPuzzles: exactly 6 compound word puzzles using destination-relevant words. "equation" shows the parts (e.g. "RAIN + FOREST"), "answer" is combined (e.g. "RAINFOREST").
- travelTrivia: exactly 8 questions, mix easy and medium, answers 1-5 words.
- travelMenu: exactly 3 categories (Starters, Mains, Desserts), 3 items each, silly destination-themed names.
- comicStrip: exactly 6 panels, scene descriptions 4-8 words.`,
        },
      ],
    })

    const raw = completion.choices[0].message.content?.trim() ?? ''
    try {
      return JSON.parse(raw) as BonusContent
    } catch {
      return {}
    }
  } catch (e) {
    console.error('Bonus content generation failed:', e)
    return {}
  }
}

// Logic grid — kept on gpt-4o because it requires consistent logical reasoning
// (clues must uniquely and correctly solve to the given answer)
async function generateLogicGrid(displayName: string): Promise<BookContent['logicGrid'] | undefined> {
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.5,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a children\'s puzzle designer. Return ONLY valid JSON. The logic grid clues MUST be logically consistent — each clue must be unambiguous and together they must lead to exactly one solution.',
        },
        {
          role: 'user',
          content: `Create a logic grid puzzle for a kids activity book about: ${displayName}

Three explorer friends each spotted one amazing thing first. Use clues to figure out who saw what.

Return JSON with this exact schema:
{
  "intro": "Three explorer friends each spotted one amazing thing first at ${displayName}. Can you figure out who saw what?",
  "people": ["Maya", "Finn", "Zoe"],
  "options": ["ThingA", "ThingB", "ThingC"],
  "clues": ["Clue 1", "Clue 2", "Clue 3"],
  "solution": {"Maya": "ThingA", "Finn": "ThingB", "Zoe": "ThingC"}
}

Rules:
- options must be 3 things specific and interesting at ${displayName} (e.g. animals, landmarks, natural features)
- clues must each eliminate at least one possibility — together they must lead to EXACTLY ONE solution
- verify: work through the clues yourself before returning to confirm the solution is correct and unique
- clues should be fun for kids, not too abstract`,
        },
      ],
    })

    const raw = completion.choices[0].message.content?.trim() ?? ''
    return JSON.parse(raw) as BookContent['logicGrid']
  } catch (e) {
    console.error('Logic grid generation failed:', e)
    return undefined
  }
}

async function generateDestinationContent(displayName: string, places?: string[]): Promise<BookContent> {
  const sectionsInstruction = places && places.length > 0
    ? `Generate sections for ONLY these specific places the family will visit (in this order): ${places.join(', ')}. Do not add or substitute other attractions — only cover what they listed.`
    : `Generate 4-8 sections depending on how many distinct notable attractions the destination has. If it is a city, pick the most iconic kid-friendly landmarks/activities. If it is a national park, each major attraction/trail/feature gets a section. If it is a zoo or museum, pick themed zones.`

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 6000,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert children\'s educational content creator specializing in travel destinations and nature. You create age-appropriate, fun, and educational activity booklet content for kids ages 4-12. You write in a warm, encouraging, adventurous tone. STRICT CONTENT RULES: All content must be 100% safe, legal, and appropriate for children. Never include anything violent, scary, sexual, politically controversial, or that encourages dangerous behavior. Return ONLY valid JSON with no markdown, no code fences. If any place names in the list appear to be misspelled, interpret them as the closest real landmark or attraction at the destination.',
      },
      {
        role: 'user',
        content: `Create a junior explorer activity booklet content for: ${displayName}

If any place names in the list appear to be misspelled, interpret them as the closest real landmark or attraction at the destination.

Return a JSON object with this exact schema (no markdown, no code fences, pure JSON):
{
  "destinationIntro": "2-3 sentence kid-friendly intro about the destination overall",
  "sections": [
    {
      "id": "unique-slug",
      "title": "Place or attraction name",
      "emoji": "🏔",
      "historyBlurb": "2-3 sentences kid-friendly history or science about this place",
      "funFacts": ["7 to 9 memorable, educational facts — make them relatable with fun comparisons kids understand (e.g. 'These trees are older than your great-great-grandparents!', 'This rock weighs as much as 1,000 school buses!', 'The lake is deep enough to stack 10 school buses on top of each other!'). Include geography, science, nature, history, and wildlife so kids learn WHY the place looks the way it does and what makes it special."],
      "whatDoYouSee": ["4-5 observable things at this location"],
      "findThese": ["3-4 specific things to look for at this location"],
      "sectionScavengerHunt": ["4-5 specific scavenger hunt challenges for this place, as action items e.g. 'Find a rock with a hole in it', 'Spot 3 different bird species', 'Touch the bark of a tree and describe how it feels'"],
      "challenge": "One fun physical or sensory challenge to do here",
      "thinkQuestion": "One open-ended thinking question",
      "thinkQuestionAnswer": "Kid-friendly answer for the answer key",
      "riddle": "A fun kid-friendly riddle about something you'd find at this location (e.g. 'I have needles but I don't sew. What am I?')",
      "riddleAnswer": "The answer to the riddle",
      "carChallenge": "A car/travel challenge for if this section involves a drive (null if not applicable)",
      "imagePrompt": "DALL-E prompt for a SIMPLE children's coloring page of this specific place. Be culturally and architecturally accurate — a Hindu temple must say 'Hindu temple with gopuram tower', a Buddhist temple must say 'Buddhist pagoda', a mosque must say 'mosque with minaret'. Describe a clean, uncluttered scene with 2-3 key elements max (e.g. one large tree, a mountain peak, a child looking at the view). Use simple shapes. Avoid dense forests, crowds, or complex textures. Do not mention color or shading — just describe the subject simply as if explaining what to outline.",
      "crosswordClues": [{"word": "UPPERCASE_WORD", "clue": "Kid-friendly clue for this word (1 sentence)"}]
    }
  ],
  "scavengerHuntItems": ["12 items relevant to this destination"],
  "bingoGrid": ["24 items for a 5x5 bingo grid with a free space in the center"],
  "sillyChallenges": ["10-12 fun silly travel challenges appropriate for this destination and travel style, e.g. 'Wave at 3 cars!', 'Count how many trees you can spot in 1 minute', 'Make your best animal sound when you spot a bird', 'High-five everyone in your group', 'Do a happy dance when you arrive at your first stop'"],
  "badgeNames": ["One badge name per section, e.g. 'Mountain Explorer', 'Beach Detective'"],
  "crosswordWords": [{"word": "UPPERCASE_WORD_RELATED_TO_DESTINATION", "clue": "Kid-friendly clue"}]
}

${sectionsInstruction} Badge names array must have the same length as sections array. For crosswordWords, generate exactly 12 words suitable for a crossword puzzle. Words must use only capital letters A-Z, no spaces or punctuation, and be 3-12 letters long.`,
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

async function uploadImageToStorage(b64: string, path: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(b64, 'base64')
    const { error } = await getSupabase().storage
      .from('book-images')
      .upload(path, buffer, { contentType: 'image/png', upsert: true })
    if (error) {
      console.error('Storage upload error:', path, error.message)
      return null
    }
    const { data } = getSupabase().storage.from('book-images').getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.error('Storage upload exception:', e)
    return null
  }
}

async function uploadImagesToStorage(
  slug: string,
  coverB64: string | null,
  sectionsB64: (string | null)[]
): Promise<{ coverUrl: string | null; sectionUrls: (string | null)[] }> {
  const coverUpload = coverB64
    ? uploadImageToStorage(coverB64, `destinations/${slug}/cover.png`)
    : Promise.resolve(null)
  const sectionUploads = sectionsB64.map((b64, i) =>
    b64 ? uploadImageToStorage(b64, `destinations/${slug}/section-${i}.png`) : Promise.resolve(null)
  )
  const [coverUrl, ...sectionUrls] = await Promise.all([coverUpload, ...sectionUploads])
  return { coverUrl, sectionUrls }
}

async function generateCoverImage(displayName: string): Promise<string | null> {
  const prompt = `Children's adventure book cover illustration in a soft watercolor storybook style. Destination: ${displayName}. Show an inviting, accurate backdrop from this destination with 2-3 iconic natural or landmark features. Composition: large open sky and clean space near the top for the title, scenic destination backdrop in the middle, and welcoming foreground space near the bottom for cover text. Mood: vibrant, joyful, warm, polished, age-appropriate, hand-painted watercolor texture. Do not include any printed words, labels, signs, logos, badges, or watermark.`

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

function ageDescriptor(age: number): string {
  if (age <= 4) return 'preschool-age'
  if (age <= 7) return 'young elementary-age'
  if (age <= 10) return 'elementary-age'
  return 'older child'
}

function coverVariantKey(child: Child): string {
  const ageBucket = child.age <= 4 ? '2-4' : child.age <= 7 ? '5-7' : child.age <= 10 ? '8-10' : '11-12'
  return `watercolor-v1-${child.gender}-${ageBucket}`
}

async function storageObjectExists(path: string): Promise<boolean> {
  try {
    const { data, error } = await getSupabase().storage.from('book-images').download(path)
    if (error) return false
    return !!data
  } catch {
    return false
  }
}

async function generatePersonalizedCoverImage(displayName: string, child: Child): Promise<string | null> {
  const prompt = `Personalized children's junior ranger adventure book cover in a charming watercolor storybook style. Destination backdrop: ${displayName}, shown accurately with recognizable scenery, landscape, and natural features from the destination. Main character: one happy ${ageDescriptor(child.age)} ${child.gender} explorer, centered prominently in the foreground, age-appropriate proportions and clothing, expressive and sweet, holding explorer gear such as a map, binoculars, magnifying glass, backpack, or ranger hat. Composition should feel close to a premium children's activity-book cover: bold vertical poster layout, clean open sky at the top for a large title, scenic destination background, and a calmer lighter area near the bottom for explorer name and date lines. Include flowers, trail details, and playful foreground energy, but keep the center clean enough for overlaid text. Mood: vibrant but tasteful, warm, polished, magical watercolor wash, playful and premium. Important: no printed words, no letters, no sign text, no logos, no badges, no watermark.`

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
    console.error('Personalized cover image generation failed:', e)
    return null
  }
}

async function ensurePersonalizedCoverUrl(
  destinationSlug: string,
  destinationDisplayName: string,
  child: Child
): Promise<string | null> {
  const variantKey = coverVariantKey(child)
  const path = `destinations/${destinationSlug}/cover-${variantKey}.png`

  if (await storageObjectExists(path)) {
    const { data } = getSupabase().storage.from('book-images').getPublicUrl(path)
    return data.publicUrl
  }

  const b64 = await generatePersonalizedCoverImage(destinationDisplayName, child)
  if (!b64) return null
  return uploadImageToStorage(b64, path)
}

async function generateSectionImages(displayName: string, content: BookContent): Promise<(string | null)[]> {
  const sectionPrompts = content.sections.map(
    (s) =>
      `Children's coloring book page for ages 4-10. STYLE: simple flat cartoon line art, bold black outlines only, pure white background, absolutely zero gray shading, zero crosshatching, zero fills, zero gradients, zero dark areas. Every region must be left as empty white space ready to be colored in by a child. Think very simple thick-outlined cartoon, NOT a realistic illustration. SUBJECT: This page is specifically about "${s.title}" located at ${displayName}. Draw ONLY what is authentically found at this exact place — the architecture, landscape, or wildlife must be accurate to "${s.title}". For example, a Hindu temple must show gopuram towers and carved stonework, NOT a mosque or church; a cave must show cave interiors, NOT an exterior building. SCENE: ${s.imagePrompt}`
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
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a children\'s activity creator. Return ONLY valid JSON, no markdown.',
      },
      {
        role: 'user',
        content: `For each child below, create a personalized activity challenge based ONLY on their age and interests.
Children: ${JSON.stringify(children.map((c) => ({ name: c.name, age: c.age, interests: c.interests || 'general exploration' })))}

Rules:
- Base the challenge on their age and interests ONLY — do NOT mention any specific location or place name
- Make it a fun general activity: an observation game, counting challenge, creative task, or movement game
- It should be doable anywhere during a trip (at any stop, in the car, at a rest area)
- Keep it to 1 engaging sentence

Return a JSON array (one object per child, in the same order):
[
  {
    "name": "child name",
    "keywords": ["interest1", "interest2"],
    "personalizedChallengeNote": "A fun 1-sentence challenge based only on their age and interests",
    "personalizedDrawingPrompt": "A drawing prompt based on their interests"
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
    model: 'gpt-4o-mini',
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

function contentFromCacheRow(cached: DestinationCache & { destination_intro?: string | null }): BookContent {
  const bonus = (cached.bonus_content_json ?? {}) as BonusContent & {
    crosswordWords?: BookContent['crosswordWords']
    sillyChallenges?: string[]
    logicGrid?: BookContent['logicGrid']
  }

  return {
    destinationIntro: cached.destination_intro ?? '',
    sections: cached.sections_json as unknown as BookContent['sections'],
    scavengerHuntItems: cached.scavenger_hunt_json as unknown as string[],
    bingoGrid: cached.bingo_grid_json as unknown as string[],
    badgeNames: cached.badge_names_json as unknown as string[],
    crosswordWords: bonus.crosswordWords,
    sillyChallenges: bonus.sillyChallenges,
    cryptogramPhrase: bonus.cryptogramPhrase,
    rebusPuzzles: bonus.rebusPuzzles,
    logicGrid: bonus.logicGrid,
    travelTrivia: bonus.travelTrivia,
    travelMenu: bonus.travelMenu,
    topFiveLists: bonus.topFiveLists,
    comicStrip: bonus.comicStrip,
    mapDrawingChallenge: bonus.mapDrawingChallenge,
    timeCapsuleLetter: bonus.timeCapsuleLetter,
  }
}

function bonusToCache(content: BookContent) {
  return {
    crosswordWords: content.crosswordWords,
    sillyChallenges: content.sillyChallenges,
    cryptogramPhrase: content.cryptogramPhrase,
    rebusPuzzles: content.rebusPuzzles,
    logicGrid: content.logicGrid,
    travelTrivia: content.travelTrivia,
    travelMenu: content.travelMenu,
    topFiveLists: content.topFiveLists,
    comicStrip: content.comicStrip,
    mapDrawingChallenge: content.mapDrawingChallenge,
    timeCapsuleLetter: content.timeCapsuleLetter,
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

  const { destinationSlug, destinationDisplayName, tripDates, children, language, parentEmail, places, placeGeoQueries } = body
  const hasItinerary = Array.isArray(places) && places.length > 0
  const coverChild = children.length === 1 ? children[0] : null

  const languageNames: Record<string, string> = {
    es: 'Spanish', fr: 'French', zh: 'Chinese (Simplified)', pt: 'Portuguese',
  }

  let content: BookContent
  let sectionImageUrls: (string | null)[]
  let coverImageUrl: string | null = null
  let cacheHit = false
  let placeCoords: ([number, number] | null)[] | undefined

  // Start personalization immediately — it only needs children + destination name,
  // not the generated content, so it runs in parallel with everything else.
  const personalizationPromise = personalizeChildren(children, destinationDisplayName)

  if (hasItinerary) {
    const geo = await normalizePlaces(places!, destinationDisplayName, placeGeoQueries)
    placeCoords = geo.coords
    const normalizedPlaces = geo.canonicalNames
    const itineraryHash = hashStr([
      destinationSlug,
      language,
      ...normalizedPlaces.map((place) => place.trim().toLowerCase()),
    ].join('|')).toString(16)
    const itineraryCacheSlug = `${destinationSlug}_itinerary_${itineraryHash}`

    const { data: cached, error: cacheReadError } = await getSupabase()
      .from('destination_cache')
      .select('destination_slug,destination_display_name,destination_intro,sections_json,scavenger_hunt_json,bingo_grid_json,badge_names_json,answer_key_json,cover_image_url,section_image_urls,bonus_content_json,hit_count')
      .eq('destination_slug', itineraryCacheSlug)
      .maybeSingle()

    if (cacheReadError) console.error('Itinerary cache read error:', cacheReadError.message)

    if (cached) {
      cacheHit = true
      content = contentFromCacheRow(cached as DestinationCache & { destination_intro?: string | null })
      coverImageUrl = cached.cover_image_url ?? null
      sectionImageUrls = (cached.section_image_urls as (string | null)[] | null) ?? []

      const needsImages = !coverImageUrl || sectionImageUrls.length === 0
      const needsBonus = !cached.bonus_content_json

      const [imagesResult, bonusResult, logicGridResult] = await Promise.all([
        needsImages
          ? Promise.all([
              sectionImageUrls.length === 0 ? generateSectionImages(destinationDisplayName, content) : Promise.resolve([]),
              !coverImageUrl ? generateCoverImage(destinationDisplayName) : Promise.resolve(null),
            ])
          : Promise.resolve(null),
        needsBonus ? generateBonusContent(destinationDisplayName) : Promise.resolve(null),
        needsBonus ? generateLogicGrid(destinationDisplayName) : Promise.resolve(null),
      ])

      const updatePayload: Record<string, unknown> = { hit_count: (cached.hit_count ?? 0) + 1 }

      if (imagesResult) {
        const [sectionsB64, coverB64] = imagesResult
        const uploaded = await uploadImagesToStorage(itineraryCacheSlug, coverB64, sectionsB64)
        if (uploaded.coverUrl) { coverImageUrl = uploaded.coverUrl; updatePayload.cover_image_url = coverImageUrl }
        if (uploaded.sectionUrls.length > 0) { sectionImageUrls = uploaded.sectionUrls; updatePayload.section_image_urls = sectionImageUrls }
      }

      if (bonusResult || logicGridResult) {
        Object.assign(content, bonusResult, logicGridResult ? { logicGrid: logicGridResult } : {})
        updatePayload.bonus_content_json = {
          ...((cached.bonus_content_json ?? {}) as Record<string, unknown>),
          ...bonusResult,
          ...(logicGridResult ? { logicGrid: logicGridResult } : {}),
        }
      }

      await getSupabase().from('destination_cache').update(updatePayload).eq('destination_slug', itineraryCacheSlug)
    } else {
      content = await generateDestinationContent(destinationDisplayName, normalizedPlaces)
      const [imagesResult, bonus, logicGrid] = await Promise.all([
        Promise.all([
          generateSectionImages(destinationDisplayName, content),
          generateCoverImage(destinationDisplayName),
        ]),
        generateBonusContent(destinationDisplayName),
        generateLogicGrid(destinationDisplayName),
      ])
      Object.assign(content, bonus, { logicGrid })

      if (language !== 'en' && languageNames[language]) {
        content = await translateContent(content, language, languageNames[language])
      }

      const [sectionsB64, coverB64] = imagesResult
      const uploaded = await uploadImagesToStorage(itineraryCacheSlug, coverB64, sectionsB64)
      coverImageUrl = uploaded.coverUrl
      sectionImageUrls = uploaded.sectionUrls

      const { error: upsertError } = await getSupabase().from('destination_cache').upsert({
        destination_slug: itineraryCacheSlug,
        destination_display_name: destinationDisplayName,
        destination_intro: content.destinationIntro,
        sections_json: content.sections,
        cover_image_url: coverImageUrl,
        section_image_urls: sectionImageUrls,
        scavenger_hunt_json: content.scavengerHuntItems,
        bingo_grid_json: content.bingoGrid,
        badge_names_json: content.badgeNames,
        bonus_content_json: bonusToCache(content),
        answer_key_json: Object.fromEntries(
          content.sections.map((s) => [s.title, s.thinkQuestionAnswer])
        ),
        hit_count: 1,
      })
      if (upsertError) console.error('Itinerary cache upsert error:', upsertError.message)
    }

    const mapImageB64Result = await generateMapImage(normalizedPlaces, placeCoords!)
    const personalizedCoverUrl = coverChild
      ? await ensurePersonalizedCoverUrl(destinationSlug, destinationDisplayName, coverChild)
      : null

    const childPersonalization = await personalizationPromise
    return NextResponse.json({
      destinationDisplayName, destinationSlug, tripDates, cacheHit,
      content, coverImageUrl: personalizedCoverUrl ?? coverImageUrl, sectionImageUrls, childPersonalization,
      language, parentEmail, places: normalizedPlaces, mapImageB64: mapImageB64Result ?? null,
    })
  }

  const cacheSlug = language === 'en' ? destinationSlug : `${destinationSlug}_${language}`

  // Check destination cache — select only non-image columns to avoid large row reads
  const { data: cached, error: cacheReadError } = await getSupabase()
    .from('destination_cache')
    .select('destination_slug,destination_display_name,destination_intro,sections_json,scavenger_hunt_json,bingo_grid_json,badge_names_json,answer_key_json,cover_image_url,section_image_urls,bonus_content_json,hit_count')
    .eq('destination_slug', cacheSlug)
    .maybeSingle()

  if (cacheReadError) console.error('Cache read error:', cacheReadError.message)

  if (cached) {
    cacheHit = true
    const bonus = (cached.bonus_content_json ?? {}) as Record<string, unknown>
    content = contentFromCacheRow(cached as DestinationCache & { destination_intro?: string | null })

    coverImageUrl = cached.cover_image_url ?? null
    sectionImageUrls = (cached.section_image_urls as (string | null)[] | null) ?? []

    // If missing images or bonus content, fill the gaps — personalization is already running in parallel
    const needsImages = !coverImageUrl || sectionImageUrls.length === 0
    const needsBonus = !cached.bonus_content_json

    const [imagesResult, bonusResult, logicGridResult] = await Promise.all([
      needsImages
        ? Promise.all([
            sectionImageUrls.length === 0 ? generateSectionImages(destinationDisplayName, content) : Promise.resolve([]),
            !coverImageUrl ? generateCoverImage(destinationDisplayName) : Promise.resolve(null),
          ])
        : Promise.resolve(null),
      needsBonus ? generateBonusContent(destinationDisplayName) : Promise.resolve(null),
      needsBonus ? generateLogicGrid(destinationDisplayName) : Promise.resolve(null),
    ])

    const updatePayload: Record<string, unknown> = { hit_count: (cached.hit_count ?? 0) + 1 }

    if (imagesResult) {
      const [sectionsB64, coverB64] = imagesResult
      const uploaded = await uploadImagesToStorage(cacheSlug, coverB64, sectionsB64)
      if (uploaded.coverUrl) { coverImageUrl = uploaded.coverUrl; updatePayload.cover_image_url = coverImageUrl }
      if (uploaded.sectionUrls.length > 0) { sectionImageUrls = uploaded.sectionUrls; updatePayload.section_image_urls = sectionImageUrls }
    }

    if (bonusResult || logicGridResult) {
      const merged = { ...bonus, ...bonusResult, ...(logicGridResult ? { logicGrid: logicGridResult } : {}) }
      Object.assign(content, bonusResult, logicGridResult ? { logicGrid: logicGridResult } : {})
      updatePayload.bonus_content_json = merged
    }

    await getSupabase().from('destination_cache').update(updatePayload).eq('destination_slug', cacheSlug)
  } else {
    // Cache miss — generate content first, then images + bonus (mini) + logic grid (gpt-4o) all in parallel
    content = await generateDestinationContent(destinationDisplayName)
    const [imagesResult, bonus, logicGrid] = await Promise.all([
      Promise.all([
        generateSectionImages(destinationDisplayName, content),
        generateCoverImage(destinationDisplayName),
      ]),
      generateBonusContent(destinationDisplayName),
      generateLogicGrid(destinationDisplayName),
    ])
    const [sectionsB64, coverB64] = imagesResult
    Object.assign(content, bonus, { logicGrid })

    if (language !== 'en' && languageNames[language]) {
      content = await translateContent(content, language, languageNames[language])
    }

    const uploaded = await uploadImagesToStorage(cacheSlug, coverB64, sectionsB64)
    coverImageUrl = uploaded.coverUrl
    sectionImageUrls = uploaded.sectionUrls

    const { error: upsertError } = await getSupabase().from('destination_cache').upsert({
      destination_slug: cacheSlug,
      destination_display_name: destinationDisplayName,
      destination_intro: content.destinationIntro,
      sections_json: content.sections,
      cover_image_url: coverImageUrl,
      section_image_urls: sectionImageUrls,
      scavenger_hunt_json: content.scavengerHuntItems,
      bingo_grid_json: content.bingoGrid,
      badge_names_json: content.badgeNames,
      bonus_content_json: bonusToCache(content),
      answer_key_json: Object.fromEntries(
        content.sections.map((s) => [s.title, s.thinkQuestionAnswer])
      ),
      hit_count: 1,
    })
    if (upsertError) console.error('Cache upsert error:', upsertError.message)
  }

  // Personalization has been running the whole time — just await it now
  const childPersonalization = await personalizationPromise
  const personalizedCoverUrl = coverChild
    ? await ensurePersonalizedCoverUrl(destinationSlug, destinationDisplayName, coverChild)
    : null

  return NextResponse.json({
    destinationDisplayName,
    destinationSlug,
    tripDates,
    cacheHit,
    content,
    coverImageUrl: personalizedCoverUrl ?? coverImageUrl,
    sectionImageUrls,
    childPersonalization,
    language,
    parentEmail,
    places: undefined,
    mapImageB64: null,
  })
}
