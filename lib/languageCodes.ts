export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  hi: 'हिन्दी',
  zh: '中文',
  pt: 'Português',
}

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES
