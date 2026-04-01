export interface Child {
  name: string
  age: number
  gender: 'boy' | 'girl'
  interests?: string
}

export interface TripDates {
  start: string
  end: string
}

export interface ChildPersonalization {
  name: string
  age: number
  gender: 'boy' | 'girl'
  keywords: string[]
  personalizedChallengeNote: string
  personalizedDrawingPrompt: string
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
  riddle: string
  riddleAnswer: string
  carChallenge: string | null
  sectionScavengerHunt?: string[]
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
}

export interface GeneratedBook {
  destinationDisplayName: string
  destinationSlug: string
  tripDates?: TripDates
  cacheHit: boolean
  content: BookContent
  coverImageUrl: string | null
  sectionImageUrls: (string | null)[]
  childPersonalization: ChildPersonalization[]
  language: string
  parentEmail: string
  places?: string[]
  mapImageB64?: string | null
}

export interface FormState {
  destination: string
  tripDates: TripDates | null
  children: Child[]
  language: string
  parentEmail: string
  places?: string[]
  placeGeoQueries?: string[]
}
