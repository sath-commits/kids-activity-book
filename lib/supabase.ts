import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
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
  cover_image_b64: string
  section_images_b64: (string | null)[]
  scavenger_hunt_json: string[]
  bingo_grid_json: string[]
  badge_names_json: string[]
  answer_key_json: Record<string, string>
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
}
