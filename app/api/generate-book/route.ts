import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getSupabase, BookContent, DestinationCache } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rateLimit'
import { normalizePlaces, generateMapImage } from '@/lib/mapbox'
import { hashStr } from '@/lib/maze'

export const maxDuration = 90
const SECTION_IMAGE_VERSION = 'v2'
const COVER_IMAGE_VERSION = 'v1'

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

interface AudienceProfile {
  cacheKey: string
  summary: string
  promptBlock: string
  ageFloor: number
  ageCeiling: number
}

function tryParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function tryExtractAndParseJsonObject<T>(raw: string): T | null {
  return tryParseJson<T>(raw) ?? (() => {
    const match = raw.match(/\{[\s\S]*\}/)
    return match ? tryParseJson<T>(match[0]) : null
  })()
}

function tryExtractAndParseJsonArray<T>(raw: string): T | null {
  return tryParseJson<T>(raw) ?? (() => {
    const match = raw.match(/\[[\s\S]*\]/)
    return match ? tryParseJson<T>(match[0]) : null
  })()
}

function asStringArray(value: unknown, limit: number, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, limit)
}

function normalizeBookContent(content: Partial<BookContent>): BookContent | null {
  const rawSections = Array.isArray(content.sections) ? content.sections : []
  const sections = rawSections
    .map((section, index) => {
      if (!section || typeof section !== 'object') return null
      const s = section as unknown as Record<string, unknown>
      const title = typeof s.title === 'string' ? s.title.trim() : ''
      if (!title) return null

      return {
        id: typeof s.id === 'string' && s.id.trim() ? s.id.trim() : `section-${index + 1}`,
        title,
        emoji: typeof s.emoji === 'string' && s.emoji.trim() ? s.emoji.trim() : '🌲',
        historyBlurb: typeof s.historyBlurb === 'string' ? s.historyBlurb.trim() : '',
        funFacts: asStringArray(s.funFacts, 9),
        whatDoYouSee: asStringArray(s.whatDoYouSee, 5),
        findThese: asStringArray(s.findThese, 4),
        challenge: typeof s.challenge === 'string' ? s.challenge.trim() : '',
        thinkQuestion: typeof s.thinkQuestion === 'string' ? s.thinkQuestion.trim() : '',
        thinkQuestionAnswer: typeof s.thinkQuestionAnswer === 'string' ? s.thinkQuestionAnswer.trim() : '',
        carChallenge: typeof s.carChallenge === 'string' && s.carChallenge.trim() ? s.carChallenge.trim() : null,
        imagePrompt: typeof s.imagePrompt === 'string' ? s.imagePrompt.trim() : title,
      }
    })
    .filter((section): section is BookContent['sections'][number] => section !== null)

  if (sections.length === 0) return null

  const badgeNames = asStringArray(content.badgeNames, sections.length)
  while (badgeNames.length < sections.length) {
    badgeNames.push(`${sections[badgeNames.length].title} Explorer`)
  }

  return {
    destinationIntro: typeof content.destinationIntro === 'string' ? content.destinationIntro.trim() : '',
    sections,
    scavengerHuntItems: asStringArray(content.scavengerHuntItems, 12),
    bingoGrid: asStringArray(content.bingoGrid, 24),
    badgeNames,
    crosswordWords: Array.isArray(content.crosswordWords)
      ? content.crosswordWords
          .map((item) => {
            if (!item || typeof item !== 'object') return null
            const entry = item as Record<string, unknown>
            const word = typeof entry.word === 'string' ? entry.word.trim() : ''
            const clue = typeof entry.clue === 'string' ? entry.clue.trim() : ''
            if (!word || !clue) return null
            return { word, clue }
          })
          .filter((item): item is NonNullable<BookContent['crosswordWords']>[number] => item !== null)
      : undefined,
    sillyChallenges: asStringArray(content.sillyChallenges, 12),
    cryptogramPhrase: typeof content.cryptogramPhrase === 'string' ? content.cryptogramPhrase.trim() : undefined,
    rebusPuzzles: Array.isArray(content.rebusPuzzles)
      ? content.rebusPuzzles
          .map((item) => {
            if (!item || typeof item !== 'object') return null
            const entry = item as Record<string, unknown>
            const equation = typeof entry.equation === 'string' ? entry.equation.trim() : ''
            const answer = typeof entry.answer === 'string' ? entry.answer.trim() : ''
            if (!equation || !answer) return null
            return { equation, answer }
          })
          .filter((item): item is NonNullable<BookContent['rebusPuzzles']>[number] => item !== null)
      : undefined,
    logicGrid: content.logicGrid,
    travelTrivia: Array.isArray(content.travelTrivia)
      ? content.travelTrivia
          .map((item) => {
            if (!item || typeof item !== 'object') return null
            const entry = item as Record<string, unknown>
            const question = typeof entry.question === 'string' ? entry.question.trim() : ''
            const answer = typeof entry.answer === 'string' ? entry.answer.trim() : ''
            if (!question || !answer) return null
            return { question, answer }
          })
          .filter((item): item is NonNullable<BookContent['travelTrivia']>[number] => item !== null)
      : undefined,
    travelMenu: Array.isArray(content.travelMenu)
      ? content.travelMenu
          .map((menu) => {
            if (!menu || typeof menu !== 'object') return null
            const entry = menu as Record<string, unknown>
            const category = typeof entry.category === 'string' ? entry.category.trim() : ''
            const items = Array.isArray(entry.items)
              ? entry.items
                  .map((item) => {
                    if (!item || typeof item !== 'object') return null
                    const food = item as Record<string, unknown>
                    const name = typeof food.name === 'string' ? food.name.trim() : ''
                    const description = typeof food.description === 'string' ? food.description.trim() : ''
                    const price = typeof food.price === 'string' ? food.price.trim() : ''
                    if (!name || !description || !price) return null
                    return { name, description, price }
                  })
                  .filter((item): item is { name: string; description: string; price: string } => item !== null)
              : []
            if (!category || items.length === 0) return null
            return { category, items }
          })
          .filter((item): item is NonNullable<BookContent['travelMenu']>[number] => item !== null)
      : undefined,
    topFiveLists: Array.isArray(content.topFiveLists)
      ? content.topFiveLists
          .map((item) => {
            if (!item || typeof item !== 'object') return null
            const entry = item as Record<string, unknown>
            const title = typeof entry.title === 'string' ? entry.title.trim() : ''
            const items = asStringArray(entry.items, 5)
            if (!title || items.length === 0) return null
            return { title, items }
          })
          .filter((item): item is NonNullable<BookContent['topFiveLists']>[number] => item !== null)
      : undefined,
    comicStrip: content.comicStrip && typeof content.comicStrip === 'object'
      ? (() => {
          const comic = content.comicStrip as Record<string, unknown>
          const title = typeof comic.title === 'string' ? comic.title.trim() : ''
          const panels = Array.isArray(comic.panels)
            ? comic.panels
                .map((item) => {
                  if (!item || typeof item !== 'object') return null
                  const scene = typeof (item as Record<string, unknown>).scene === 'string'
                    ? ((item as Record<string, unknown>).scene as string).trim()
                    : ''
                  return scene ? { scene } : null
                })
                .filter((item): item is { scene: string } => item !== null)
            : []
          return title && panels.length > 0 ? { title, panels } : undefined
        })()
      : undefined,
    mapDrawingChallenge: content.mapDrawingChallenge && typeof content.mapDrawingChallenge === 'object'
      ? (() => {
          const map = content.mapDrawingChallenge as Record<string, unknown>
          const instructions = asStringArray(map.instructions, 8)
          const landmarks = asStringArray(map.landmarks, 8)
          return instructions.length > 0 || landmarks.length > 0 ? { instructions, landmarks } : undefined
        })()
      : undefined,
    timeCapsuleLetter: content.timeCapsuleLetter && typeof content.timeCapsuleLetter === 'object'
      ? (() => {
          const capsule = content.timeCapsuleLetter as Record<string, unknown>
          const prompts = asStringArray(capsule.prompts, 12)
          return prompts.length > 0 ? { prompts } : undefined
        })()
      : undefined,
  }
}

function normalizeInterestWords(children: Child[]): string[] {
  const seen = new Set<string>()
  const words: string[] = []

  for (const child of children) {
    const raw = child.interests ?? ''
    for (const part of raw.split(/[,\n/|]+/)) {
      const cleaned = part.trim().toLowerCase().replace(/\s+/g, ' ')
      if (!cleaned) continue
      if (seen.has(cleaned)) continue
      seen.add(cleaned)
      words.push(cleaned)
    }
  }

  return words.slice(0, 6)
}

function ageBandLabel(minAge: number, maxAge: number): string {
  if (maxAge <= 4) return 'preschool'
  if (maxAge <= 7 && minAge >= 5) return 'young-elementary'
  if (maxAge <= 10 && minAge >= 8) return 'elementary'
  if (minAge >= 11) return 'older-kids'
  return 'mixed-ages'
}

function buildAudienceProfile(children: Child[]): AudienceProfile {
  const ages = children.map((child) => child.age)
  const minAge = Math.min(...ages)
  const maxAge = Math.max(...ages)
  const interests = normalizeInterestWords(children)
  const ageBand = ageBandLabel(minAge, maxAge)
  const readingLevel =
    maxAge <= 5
      ? 'very short sentences, concrete vocabulary, lots of sensory wording'
      : maxAge <= 7
      ? 'simple but vivid sentences with playful comparisons'
      : maxAge <= 10
      ? 'clear elementary reading level with real facts and fun comparisons'
      : 'richer elementary-to-middle-grade wording with slightly deeper explanations'
  const challengeLevel =
    maxAge <= 5
      ? 'very easy observation, matching, counting, and drawing prompts'
      : maxAge <= 7
      ? 'easy puzzles, searching, simple reasoning, and movement prompts'
      : maxAge <= 10
      ? 'moderate puzzles, deduction, trivia, and creative tasks'
      : 'the upper end of kid-friendly puzzles, with more reasoning and richer facts'

  const interestLine = interests.length > 0
    ? `Top interests to weave in naturally when relevant: ${interests.join(', ')}.`
    : 'No strong interests were supplied, so keep the content broadly adventurous and destination-led.'

  return {
    cacheKey: `${ageBand}|${minAge}-${maxAge}|${interests.join('|') || 'general'}`,
    summary: `${children.length} child${children.length > 1 ? 'ren' : ''}, ages ${minAge}-${maxAge}, interests: ${interests.join(', ') || 'general exploration'}`,
    promptBlock: `AUDIENCE PROFILE:
- Children: ${children.length}
- Age range: ${minAge}-${maxAge}
- Reading level target: ${readingLevel}
- Puzzle/challenge target: ${challengeLevel}
- ${interestLine}

PERSONALIZATION RULES:
- The core destination facts must stay accurate, but examples, comparisons, scavenger prompts, riddles, and activity framing should reflect this age range.
- Use the stated interests to influence the angle of the content whenever it feels natural. For example:
  - animal lovers: wildlife spotting, habitats, tracks, birdwatching
  - vehicle/train lovers: routes, trails, boats, roads, transport, motion
  - art/drawing lovers: colors, shapes, sketching, noticing patterns
  - dinosaurs/science lovers: geology, fossils, deep time, landforms, cause-and-effect explanations
  - fantasy/imagination lovers: role-play, explorer missions, magical-feeling comparisons while staying factual
- Do not just mention the interests once. Let them shape the choice of examples, challenges, and game prompts across the book.
- Keep everything appropriate for the full age range if siblings are sharing one book.`,
    ageFloor: minAge,
    ageCeiling: maxAge,
  }
}

// Non-logic-grid bonus content — uses mini (no complex reasoning needed)
async function generateBonusContent(displayName: string, audience: AudienceProfile): Promise<BonusContent> {
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

${audience.promptBlock}

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
- comicStrip: exactly 6 panels, scene descriptions 4-8 words.
- Make the bonus pages feel tailored to the audience profile above, especially in topic choice and difficulty.`,
        },
      ],
    })

    const raw = completion.choices[0].message.content?.trim() ?? ''
    return tryExtractAndParseJsonObject<BonusContent>(raw) ?? {}
  } catch (e) {
    console.error('Bonus content generation failed:', e)
    return {}
  }
}

// Logic grid — kept on gpt-4o because it requires consistent logical reasoning
// (clues must uniquely and correctly solve to the given answer)
async function generateLogicGrid(displayName: string, audience: AudienceProfile): Promise<BookContent['logicGrid'] | undefined> {
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

${audience.promptBlock}

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
- clues should be fun for kids, not too abstract
- adjust clue complexity to the audience profile above`,
        },
      ],
    })

    const raw = completion.choices[0].message.content?.trim() ?? ''
    return tryExtractAndParseJsonObject<BookContent['logicGrid']>(raw) ?? undefined
  } catch (e) {
    console.error('Logic grid generation failed:', e)
    return undefined
  }
}

async function generateDestinationContent(displayName: string, audience: AudienceProfile, places?: string[]): Promise<BookContent> {
  const sectionsInstruction = places && places.length > 0
    ? `Generate sections for ONLY these specific places the family will visit (in this order): ${places.join(', ')}. Do not add or substitute other attractions — only cover what they listed.`
    : `Generate 4-8 sections depending on how many distinct notable attractions the destination has. If it is a city, pick the most iconic kid-friendly landmarks/activities. If it is a national park, each major attraction/trail/feature gets a section. If it is a zoo or museum, pick themed zones.`

  const systemPrompt =
    'You are an expert children\'s educational content creator specializing in travel destinations and nature. You create age-appropriate, fun, and educational activity booklet content for kids ages 4-12. You write in a warm, encouraging, adventurous tone. STRICT CONTENT RULES: All content must be 100% safe, legal, and appropriate for children. Never include anything violent, scary, sexual, politically controversial, or that encourages dangerous behavior. Return ONLY valid JSON with no markdown, no code fences. If any place names in the list appear to be misspelled, interpret them as the closest real landmark or attraction at the destination.'

  const userPrompt = `Create a junior explorer activity booklet content for: ${displayName}

If any place names in the list appear to be misspelled, interpret them as the closest real landmark or attraction at the destination.

${audience.promptBlock}

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

${sectionsInstruction} Badge names array must have the same length as sections array. For crosswordWords, generate exactly 12 words suitable for a crossword puzzle. Words must use only capital letters A-Z, no spaces or punctuation, and be 3-12 letters long.

Additional personalization rules:
- Facts must stay accurate, but examples and comparisons should match the audience profile.
- For younger kids, prefer shorter facts, more concrete observations, and simpler scavenger tasks.
- For older kids, allow deeper science/history explanations and more thoughtful questions.
- Weave in the listed interests repeatedly across facts, scavenger hunts, bingo, challenges, badge names, and crossword clues when it fits the destination naturally.
- Avoid generic filler that could fit any kid. The activities should feel noticeably tuned to this audience profile.`

  for (const temperature of [0.7, 0.2]) {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = completion.choices[0].message.content?.trim() ?? ''
    const parsed = tryExtractAndParseJsonObject<Partial<BookContent>>(raw)
    const normalized = parsed ? normalizeBookContent(parsed) : null
    if (normalized) return normalized
  }

  throw new Error('Failed to parse GPT content response')
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
    ? uploadImageToStorage(coverB64, `destinations/${slug}/cover-${COVER_IMAGE_VERSION}.png`)
    : Promise.resolve(null)
  const sectionUploads = sectionsB64.map((b64, i) =>
    b64 ? uploadImageToStorage(b64, `destinations/${slug}/section-${SECTION_IMAGE_VERSION}-${i}.png`) : Promise.resolve(null)
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
  return `watercolor-${COVER_IMAGE_VERSION}-${child.gender}-${ageBucket}`
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
      `Children's coloring book page for ages 4-10. STYLE: simple flat cartoon line art, bold black outlines only, pure white background, absolutely zero gray shading, zero crosshatching, zero fills, zero gradients, zero dark areas. Every region must be left as empty white space ready to be colored in by a child. Think very simple thick-outlined cartoon, NOT a realistic illustration. IMPORTANT COMPOSITION RULES: this must be a SINGLE PAGE illustration only. Do NOT draw a book spread, double-page layout, center seam, center fold, gutter shadow, crease, split composition, panel divider, frame border, or any vertical line down the middle. Do NOT make it look like an open book. The drawing should read as one continuous scene on one page. SUBJECT: This page is specifically about "${s.title}" located at ${displayName}. Draw ONLY what is authentically found at this exact place — the architecture, landscape, or wildlife must be accurate to "${s.title}". For example, a Hindu temple must show gopuram towers and carved stonework, NOT a mosque or church; a cave must show cave interiors, NOT an exterior building. SCENE: ${s.imagePrompt}`
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
  const parsed = tryExtractAndParseJsonArray<{
    name: string
    keywords: string[]
    personalizedChallengeNote: string
    personalizedDrawingPrompt: string
  }[]>(raw)

  if (!parsed) {
    return children.map((c) => ({
      name: c.name,
      age: c.age,
      gender: c.gender,
      keywords: [],
      personalizedChallengeNote: '',
      personalizedDrawingPrompt: `Draw something amazing you saw at ${destination}!`,
    }))
  }

  return children.map((child, i) => ({
    name: child.name,
    age: child.age,
    gender: child.gender,
    keywords: parsed[i]?.keywords ?? [],
    personalizedChallengeNote: parsed[i]?.personalizedChallengeNote ?? '',
    personalizedDrawingPrompt: parsed[i]?.personalizedDrawingPrompt ?? `Draw something amazing you saw at ${destination}!`,
  }))
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
  return tryExtractAndParseJsonObject<BookContent>(raw) ?? content
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

function cacheWritePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    ...payload,
    // Backward compatibility for older Supabase schemas that still require these columns.
    cover_image_b64: '',
    section_images_b64: [],
  }
}

function userSafeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (!message) return 'Failed to generate the book. Please try again.'
  if (message.includes('The string did not match the expected pattern')) {
    return 'A generated image or cached asset had an invalid URL pattern. Please try again.'
  }
  if (message.includes('Failed to parse GPT content response') || message.includes('JSON')) {
    return 'The AI returned malformed structured content. Please try again.'
  }
  return message
}

export async function POST(req: NextRequest) {
  try {
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
    const audience = buildAudienceProfile(children)

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
      const displayPlaces = places!.map((place) => place.trim())
      const geo = await normalizePlaces(places!, destinationDisplayName, placeGeoQueries)
      placeCoords = geo.coords
      const itineraryHash = hashStr([
        destinationSlug,
        language,
        audience.cacheKey,
        ...displayPlaces.map((place) => place.toLowerCase()),
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

        const hasCurrentCover = typeof coverImageUrl === 'string' && coverImageUrl.includes(`cover-${COVER_IMAGE_VERSION}.png`)
        const hasCurrentSections = sectionImageUrls.length > 0 && sectionImageUrls.every((url, i) => {
          if (!url) return false
          return url.includes(`section-${SECTION_IMAGE_VERSION}-${i}.png`)
        })
        const needsImages = !hasCurrentCover || !hasCurrentSections
        const needsBonus = !cached.bonus_content_json

        const [imagesResult, bonusResult, logicGridResult] = await Promise.all([
          needsImages
            ? Promise.all([
                !hasCurrentSections ? generateSectionImages(destinationDisplayName, content) : Promise.resolve([]),
                !hasCurrentCover ? generateCoverImage(destinationDisplayName) : Promise.resolve(null),
              ])
            : Promise.resolve(null),
          needsBonus ? generateBonusContent(destinationDisplayName, audience) : Promise.resolve(null),
          needsBonus ? generateLogicGrid(destinationDisplayName, audience) : Promise.resolve(null),
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

        await getSupabase().from('destination_cache').update(cacheWritePayload(updatePayload)).eq('destination_slug', itineraryCacheSlug)
      } else {
        content = await generateDestinationContent(destinationDisplayName, audience, displayPlaces)
        const [imagesResult, bonus, logicGrid] = await Promise.all([
          Promise.all([
            generateSectionImages(destinationDisplayName, content),
            generateCoverImage(destinationDisplayName),
          ]),
          generateBonusContent(destinationDisplayName, audience),
          generateLogicGrid(destinationDisplayName, audience),
        ])
        Object.assign(content, bonus, { logicGrid })

        if (language !== 'en' && languageNames[language]) {
          content = await translateContent(content, language, languageNames[language])
        }

        const [sectionsB64, coverB64] = imagesResult
        const uploaded = await uploadImagesToStorage(itineraryCacheSlug, coverB64, sectionsB64)
        coverImageUrl = uploaded.coverUrl
        sectionImageUrls = uploaded.sectionUrls

        const { error: upsertError } = await getSupabase().from('destination_cache').upsert(cacheWritePayload({
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
        }))
        if (upsertError) console.error('Itinerary cache upsert error:', upsertError.message)
      }

      const mapImageB64Result = await generateMapImage(displayPlaces, placeCoords!)
      const personalizedCoverUrl = coverChild
        ? await ensurePersonalizedCoverUrl(destinationSlug, destinationDisplayName, coverChild)
        : null

      const childPersonalization = await personalizationPromise
      return NextResponse.json({
        destinationDisplayName, destinationSlug, tripDates, cacheHit,
        content, coverImageUrl: personalizedCoverUrl ?? coverImageUrl, sectionImageUrls, childPersonalization,
        language, parentEmail, places: displayPlaces, mapImageB64: mapImageB64Result ?? null,
      })
    }

    const audienceHash = hashStr(audience.cacheKey).toString(16)
    const cacheSlugBase = `${destinationSlug}_aud_${audienceHash}`
    const cacheSlug = language === 'en' ? cacheSlugBase : `${cacheSlugBase}_${language}`

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

      const hasCurrentCover = typeof coverImageUrl === 'string' && coverImageUrl.includes(`cover-${COVER_IMAGE_VERSION}.png`)
      const hasCurrentSections = sectionImageUrls.length > 0 && sectionImageUrls.every((url, i) => {
        if (!url) return false
        return url.includes(`section-${SECTION_IMAGE_VERSION}-${i}.png`)
      })
      const needsImages = !hasCurrentCover || !hasCurrentSections
      const needsBonus = !cached.bonus_content_json

      const [imagesResult, bonusResult, logicGridResult] = await Promise.all([
        needsImages
          ? Promise.all([
              !hasCurrentSections ? generateSectionImages(destinationDisplayName, content) : Promise.resolve([]),
              !hasCurrentCover ? generateCoverImage(destinationDisplayName) : Promise.resolve(null),
            ])
          : Promise.resolve(null),
        needsBonus ? generateBonusContent(destinationDisplayName, audience) : Promise.resolve(null),
        needsBonus ? generateLogicGrid(destinationDisplayName, audience) : Promise.resolve(null),
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

      await getSupabase().from('destination_cache').update(cacheWritePayload(updatePayload)).eq('destination_slug', cacheSlug)
    } else {
      content = await generateDestinationContent(destinationDisplayName, audience)
      const [imagesResult, bonus, logicGrid] = await Promise.all([
        Promise.all([
          generateSectionImages(destinationDisplayName, content),
          generateCoverImage(destinationDisplayName),
        ]),
        generateBonusContent(destinationDisplayName, audience),
        generateLogicGrid(destinationDisplayName, audience),
      ])
      const [sectionsB64, coverB64] = imagesResult
      Object.assign(content, bonus, { logicGrid })

      if (language !== 'en' && languageNames[language]) {
        content = await translateContent(content, language, languageNames[language])
      }

      const uploaded = await uploadImagesToStorage(cacheSlug, coverB64, sectionsB64)
      coverImageUrl = uploaded.coverUrl
      sectionImageUrls = uploaded.sectionUrls

      const { error: upsertError } = await getSupabase().from('destination_cache').upsert(cacheWritePayload({
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
      }))
      if (upsertError) console.error('Cache upsert error:', upsertError.message)
    }

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
  } catch (error) {
    console.error('[generate-book]', error)
    return NextResponse.json({ error: userSafeErrorMessage(error) }, { status: 500 })
  }
}
