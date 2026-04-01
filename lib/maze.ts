export interface MazeCell {
  walls: [boolean, boolean, boolean, boolean] // top, right, bottom, left
}

function seededRandom(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function hashStr(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (Math.imul(h, 0x01000193)) >>> 0
  }
  return h
}

// [dRow, dCol, thisWallIndex, neighborWallIndex]
const DIRS: [number, number, number, number][] = [
  [-1, 0, 0, 2],
  [0, 1, 1, 3],
  [1, 0, 2, 0],
  [0, -1, 3, 1],
]

export function generateMaze(cols: number, rows: number, seed: number): MazeCell[][] {
  const rand = seededRandom(seed)
  const grid: MazeCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      walls: [true, true, true, true] as [boolean, boolean, boolean, boolean],
    }))
  )
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false))

  const stack: [number, number][] = [[0, 0]]
  visited[0][0] = true

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1]
    const free = DIRS.filter(([dr, dc]) => {
      const nr = r + dr, nc = c + dc
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]
    })

    if (free.length === 0) {
      stack.pop()
    } else {
      const [dr, dc, tw, nw] = free[Math.floor(rand() * free.length)]
      const nr = r + dr, nc = c + dc
      grid[r][c].walls[tw] = false
      grid[nr][nc].walls[nw] = false
      visited[nr][nc] = true
      stack.push([nr, nc])
    }
  }

  return grid
}
