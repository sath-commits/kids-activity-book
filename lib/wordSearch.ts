export interface WordSearchResult {
  grid: string[][]
  placedWords: string[]
  size: number
}

const DIRECTIONS = [
  [0, 1],   // right
  [1, 0],   // down
  [1, 1],   // diagonal down-right
  [0, -1],  // left
  [-1, 0],  // up
  [-1, -1], // diagonal up-left
  [1, -1],  // diagonal down-left
  [-1, 1],  // diagonal up-right
]

function canPlace(grid: (string | null)[][], word: string, row: number, col: number, dr: number, dc: number, size: number): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr
    const c = col + i * dc
    if (r < 0 || r >= size || c < 0 || c >= size) return false
    if (grid[r][c] !== null && grid[r][c] !== word[i]) return false
  }
  return true
}

function placeWord(grid: (string | null)[][], word: string, row: number, col: number, dr: number, dc: number): void {
  for (let i = 0; i < word.length; i++) {
    grid[row + i * dr][col + i * dc] = word[i]
  }
}

export function buildWordSearch(words: string[], size = 15): WordSearchResult {
  // Filter to valid words (uppercase letters only, 3-12 chars)
  const validWords = words
    .map(w => w.toUpperCase().replace(/[^A-Z]/g, ''))
    .filter(w => w.length >= 3 && w.length <= 12)
    .slice(0, 12) // max 12 words

  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))
  const placedWords: string[] = []

  // Sort by length descending for better placement
  const sorted = [...validWords].sort((a, b) => b.length - a.length)

  for (const word of sorted) {
    let placed = false
    // Try random positions and directions
    const attempts = 200
    for (let attempt = 0; attempt < attempts && !placed; attempt++) {
      const dirIdx = Math.floor(Math.random() * DIRECTIONS.length)
      const [dr, dc] = DIRECTIONS[dirIdx]
      const row = Math.floor(Math.random() * size)
      const col = Math.floor(Math.random() * size)
      if (canPlace(grid, word, row, col, dr, dc, size)) {
        placeWord(grid, word, row, col, dr, dc)
        placedWords.push(word)
        placed = true
      }
    }
  }

  // Fill empty cells with random letters
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const finalGrid: string[][] = grid.map(row =>
    row.map(cell => cell ?? LETTERS[Math.floor(Math.random() * LETTERS.length)])
  )

  return { grid: finalGrid, placedWords, size }
}
