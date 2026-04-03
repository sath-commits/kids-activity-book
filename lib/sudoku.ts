export interface SudokuPuzzle {
  puzzle: (number | null)[][]
  solution: number[][]
}

function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false
  }
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false
  }
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false
    }
  }
  return true
}

// Simple LCG seeded random
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fill(grid: number[][], rng: () => number): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (const num of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num
            if (fill(grid, rng)) return true
            grid[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

export function generateSudoku(seed: number): SudokuPuzzle {
  const rng = makeRng(seed)
  const solution: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0))
  fill(solution, rng)

  // Remove ~45 cells for easy difficulty (36 given, appropriate for kids)
  const puzzle: (number | null)[][] = solution.map(row => [...row] as (number | null)[])
  const cells = shuffled(Array.from({ length: 81 }, (_, i) => i), rng).slice(0, 45)
  for (const cell of cells) {
    puzzle[Math.floor(cell / 9)][cell % 9] = null
  }

  return { puzzle, solution }
}
