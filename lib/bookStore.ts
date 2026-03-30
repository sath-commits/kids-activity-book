import { GeneratedBook } from './types'

// In-memory store for passing book data between loading → preview pages.
// Client-side router.push() doesn't unload JS modules, so this survives navigation.
// Falls back gracefully if the user refreshes (they'll be redirected to home).
let _book: GeneratedBook | null = null

export function setBook(book: GeneratedBook) {
  _book = book
}

export function getBook(): GeneratedBook | null {
  return _book
}

export function clearBook() {
  _book = null
}
