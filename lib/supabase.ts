import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    // Use service role key server-side so writes bypass RLS (key is never sent to browser)
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!
    _client = createClient(process.env.SUPABASE_URL!, key)
  }
  return _client
}

// Keep named export for compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export interface DestinationCache {
  destination_slug: string
  destination_display_name: string
  sections_json: SectionContent[]
  cover_image_url?: string | null
  section_image_urls?: (string | null)[] | null
  scavenger_hunt_json: string[]
  bingo_grid_json: string[]
  badge_names_json: string[]
  answer_key_json: Record<string, string>
  bonus_content_json?: Record<string, unknown> | null
  hit_count: number
  created_at: string
}

export interface SectionContent {
  id: string
  title: string
  emoji: string
  historyBlurb: string
  funFacts: string[]
  whatDoYouSee: string[]
  findThese: string[]
  challenge: string
  thinkQuestion: string
  thinkQuestionAnswer: string
  carChallenge: string | null
  imagePrompt: string
}

export interface BookContent {
  destinationIntro: string
  sections: SectionContent[]
  scavengerHuntItems: string[]
  bingoGrid: string[]
  badgeNames: string[]
  crosswordWords?: { word: string; clue: string }[]
  sillyChallenges?: string[]
  cryptogramPhrase?: string
  rebusPuzzles?: { equation: string; answer: string }[]
  logicGrid?: {
    intro: string
    people: string[]
    options: string[]
    clues: string[]
    solution: Record<string, string>
  }
  travelTrivia?: { question: string; answer: string }[]
  travelMenu?: { category: string; items: { name: string; description: string; price: string }[] }[]
  topFiveLists?: { title: string; items: string[] }[]
  comicStrip?: { title: string; panels: { scene: string }[] }
  mapDrawingChallenge?: { instructions: string[]; landmarks: string[] }
  timeCapsuleLetter?: { prompts: string[] }
}
