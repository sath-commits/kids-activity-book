import { GeneratedBook } from './types'

let _books: GeneratedBook[] = []

export function setBook(book: GeneratedBook) {
  _books = [book]
}

export function setBooks(books: GeneratedBook[]) {
  _books = books
}

export function getBook(): GeneratedBook | null {
  return _books[0] ?? null
}

export function getBooks(): GeneratedBook[] {
  return _books
}

export function clearBook() {
  _books = []
}
