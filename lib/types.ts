export interface Child {
  name: string
  age: number
  gender: 'boy' | 'girl' | 'explorer'
  interests?: string
}

export interface TripDates {
  start: string
  end: string
}

export interface ChildPersonalization {
  name: string
  age: number
  gender: 'boy' | 'girl' | 'explorer'
  keywords: string[]
  personalizedChallengeNote: string
  personalizedDrawingPrompt: string
}

export interface SectionContent {
  id: string
  title: string
  emoji: string
  historyBlurb: string
  funFact: string
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
}

export interface GeneratedBook {
  destinationDisplayName: string
  destinationSlug: string
  tripDates?: TripDates
  cacheHit: boolean
  content: BookContent
  coverImageB64: string | null
  sectionImagesB64: (string | null)[]
  childPersonalization: ChildPersonalization[]
  language: string
  parentEmail: string
}

export interface FormState {
  destination: string
  tripDates: TripDates | null
  children: Child[]
  language: string
  parentEmail: string
}
