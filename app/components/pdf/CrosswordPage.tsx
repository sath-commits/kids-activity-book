import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import MascotWithBubble from './MascotWithBubble'
import { CrosswordGrid } from '@/lib/crossword'

interface CrosswordPageProps {
  crossword: CrosswordGrid
  pageNumber: number
}

const CELL_SIZE = 22

const s = StyleSheet.create({
  gridContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: '#2d6a4f',
  },
  cellLetter: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: colors.text,
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 1,
    fontSize: 5,
    color: colors.primary,
    fontFamily: 'Nunito-Bold',
  },
  cluesSection: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  cluesColumn: {
    flex: 1,
  },
  cluesTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    color: colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clueItem: {
    fontSize: 8.5,
    color: colors.text,
    marginBottom: 3,
    lineHeight: 1.3,
  },
})

export default function CrosswordPage({ crossword, pageNumber }: CrosswordPageProps) {
  if (!crossword.placedWords.length) return null

  const { grid, placedWords } = crossword

  // Build number map: which cell has a clue number
  const numberMap: Record<string, number> = {}
  for (const pw of placedWords) {
    numberMap[`${pw.row},${pw.col}`] = pw.number
  }

  const acrossClues = placedWords.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number)
  const downClues = placedWords.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number)

  return (
    <Page size="A4" style={styles.page}>
      <View style={{ position: 'absolute', top: 22, left: 28 }}>
        <MascotWithBubble message={"Use the clues\nbelow to fill in\nall the letters!\nYou can do it!"} size={55} bubbleSide="right" />
      </View>
      <Text style={styles.h1}>Crossword Puzzle</Text>
      <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 8 }}>
        Fill in the letters! Use the clues below to solve the puzzle.
      </Text>

      <View style={s.gridContainer}>
        {grid.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map((cell, ci) => {
              const num = numberMap[`${ri},${ci}`]
              if (cell === null) {
                return <View key={ci} style={s.emptyCell} />
              }
              return (
                <View key={ci} style={s.cell}>
                  {num && <Text style={s.cellNumber}>{num}</Text>}
                </View>
              )
            })}
          </View>
        ))}
      </View>

      <View style={s.cluesSection}>
        <View style={s.cluesColumn}>
          <Text style={s.cluesTitle}>Across</Text>
          {acrossClues.map(w => (
            <Text key={w.number} style={s.clueItem}>{w.number}. {w.clue}</Text>
          ))}
        </View>
        <View style={s.cluesColumn}>
          <Text style={s.cluesTitle}>Down</Text>
          {downClues.map(w => (
            <Text key={w.number} style={s.clueItem}>{w.number}. {w.clue}</Text>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
