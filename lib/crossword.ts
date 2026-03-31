export interface CrosswordWord {
  word: string
  clue: string
}

export interface PlacedWord {
  word: string
  clue: string
  row: number
  col: number
  direction: 'across' | 'down'
  number: number
}

export interface CrosswordGrid {
  grid: (string | null)[][]
  placedWords: PlacedWord[]
  size: number
}

export function buildCrossword(words: CrosswordWord[], targetSize = 15): CrosswordGrid {
  // Filter to valid words (letters only, 3-12 chars)
  const validWords = words
    .filter(w => /^[A-Z]+$/.test(w.word) && w.word.length >= 3 && w.word.length <= 12)
    .sort((a, b) => b.word.length - a.word.length)
    .slice(0, 15)

  if (validWords.length === 0) return { grid: [], placedWords: [], size: 0 }

  const size = targetSize
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))
  const placed: PlacedWord[] = []
  let clueNumber = 1

  // Place first word horizontally in center
  const firstWord = validWords[0]
  const startCol = Math.floor((size - firstWord.word.length) / 2)
  const centerRow = Math.floor(size / 2)
  for (let i = 0; i < firstWord.word.length; i++) {
    grid[centerRow][startCol + i] = firstWord.word[i]
  }
  placed.push({ ...firstWord, row: centerRow, col: startCol, direction: 'across', number: clueNumber++ })

  // Try to place remaining words
  for (let wi = 1; wi < validWords.length; wi++) {
    const wordObj = validWords[wi]
    const word = wordObj.word
    let bestPlacement: { row: number; col: number; direction: 'across' | 'down' } | null = null
    let bestScore = -1

    // Try each placed word for intersections
    for (const placedWord of placed) {
      for (let li = 0; li < word.length; li++) {
        const letter = word[li]
        // Find this letter in the placed word
        for (let pi = 0; pi < placedWord.word.length; pi++) {
          if (placedWord.word[pi] !== letter) continue

          let row: number, col: number, direction: 'across' | 'down'

          if (placedWord.direction === 'across') {
            // New word goes DOWN
            direction = 'down'
            row = placedWord.row - li
            col = placedWord.col + pi
          } else {
            // New word goes ACROSS
            direction = 'across'
            row = placedWord.row + pi
            col = placedWord.col - li
          }

          // Check bounds
          if (row < 0 || col < 0) continue
          if (direction === 'across' && col + word.length > size) continue
          if (direction === 'down' && row + word.length > size) continue

          // Check for conflicts
          let valid = true
          let intersections = 0
          for (let i = 0; i < word.length; i++) {
            const r = direction === 'across' ? row : row + i
            const c = direction === 'across' ? col + i : col
            const existing = grid[r][c]
            if (existing !== null && existing !== word[i]) { valid = false; break }
            if (existing === word[i]) intersections++
          }
          // Check adjacent cells
          if (valid) {
            if (direction === 'across') {
              if (col > 0 && grid[row][col - 1] !== null) valid = false
              if (col + word.length < size && grid[row][col + word.length] !== null) valid = false
            } else {
              if (row > 0 && grid[row - 1][col] !== null) valid = false
              if (row + word.length < size && grid[row + word.length][col] !== null) valid = false
            }
          }
          if (valid && intersections > 0 && intersections > bestScore) {
            bestScore = intersections
            bestPlacement = { row, col, direction }
          }
        }
      }
    }

    if (bestPlacement) {
      const { row, col, direction } = bestPlacement
      for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i
        const c = direction === 'across' ? col + i : col
        grid[r][c] = word[i]
      }
      placed.push({ ...wordObj, row, col, direction, number: clueNumber++ })
    }
  }

  // Trim grid to used area
  let minRow = size, maxRow = 0, minCol = size, maxCol = 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== null) {
        minRow = Math.min(minRow, r)
        maxRow = Math.max(maxRow, r)
        minCol = Math.min(minCol, c)
        maxCol = Math.max(maxCol, c)
      }
    }
  }

  const trimmedSize = Math.max(maxRow - minRow + 1, maxCol - minCol + 1) + 2
  const trimmedGrid: (string | null)[][] = Array.from({ length: trimmedSize }, () => Array(trimmedSize).fill(null))
  const rowOffset = 1 - minRow
  const colOffset = 1 - minCol

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (grid[r][c] !== null) {
        trimmedGrid[r + rowOffset][c + colOffset] = grid[r][c]
      }
    }
  }

  // Update placed word positions
  const adjustedPlaced = placed.map(p => ({
    ...p,
    row: p.row + rowOffset,
    col: p.col + colOffset,
  }))

  return { grid: trimmedGrid, placedWords: adjustedPlaced, size: trimmedSize }
}
