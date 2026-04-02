'use client'

import { Page, View, Text, StyleSheet, Svg, Line, Rect } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import { generateMaze } from '@/lib/maze'
import MascotWithBubble from './MascotWithBubble'

interface MazePageProps {
  seed: number
  mazeIndex: number
  pageNumber: number
}

const COLS = 14
const ROWS = 18
const CS = 29 // cell size in points

const svgW = COLS * CS
const svgH = ROWS * CS

const s = StyleSheet.create({
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 6,
  },
  startLabel: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: colors.accent,
    marginBottom: 2,
    marginLeft: 2,
  },
  endLabel: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: colors.accent,
    marginTop: 2,
    alignSelf: 'flex-end',
    marginRight: 2,
  },
  mazeWrap: {
    alignSelf: 'center',
  },
})

export default function MazePage({ seed, mazeIndex, pageNumber }: MazePageProps) {
  const grid = generateMaze(COLS, ROWS, seed + mazeIndex)

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CS
      const y = r * CS
      const cell = grid[r][c]

      // top wall — skip entry gap at (0, 0)
      if (cell.walls[0] && !(r === 0 && c === 0)) {
        lines.push({ x1: x, y1: y, x2: x + CS, y2: y })
      }
      // right wall
      if (cell.walls[1]) {
        lines.push({ x1: x + CS, y1: y, x2: x + CS, y2: y + CS })
      }
      // bottom wall — skip exit gap at (ROWS-1, COLS-1)
      if (cell.walls[2] && !(r === ROWS - 1 && c === COLS - 1)) {
        lines.push({ x1: x, y1: y + CS, x2: x + CS, y2: y + CS })
      }
      // left wall
      if (cell.walls[3]) {
        lines.push({ x1: x, y1: y, x2: x, y2: y + CS })
      }
    }
  }

  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.navy }]} />
      <View style={{ position: 'absolute', top: 22, right: 28 }}>
        <MascotWithBubble message={"Can you find\nyour way from\nSTART to EXIT?\nNo peeking!"} size={55} bubbleSide="left" />
      </View>
      <Text style={[styles.h1, { color: colors.navy }]}>Maze Challenge {mazeIndex}</Text>
      <Text style={s.subtitle}>
        Help the explorer find the way through! Enter at the top-left and exit at the bottom-right.
      </Text>

      <View style={s.mazeWrap}>
        <Text style={s.startLabel}>START ▶</Text>
        <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* Background */}
          <Rect x={0} y={0} width={svgW} height={svgH} fill="#fafafa" />
          {/* Walls */}
          {lines.map((l, i) => (
            <Line
              key={i}
              x1={l.x1} y1={l.y1}
              x2={l.x2} y2={l.y2}
              stroke="#1a3a2a"
              strokeWidth={1.8}
              strokeLinecap="square"
            />
          ))}
        </Svg>
        <Text style={s.endLabel}>▶ EXIT</Text>
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
