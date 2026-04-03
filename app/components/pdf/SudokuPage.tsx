import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import MascotWithBubble from './MascotWithBubble'

interface SudokuPageProps {
  puzzle: (number | null)[][]
  pageNumber: number
}

const s = StyleSheet.create({
  grid: {
    marginTop: 12,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 12,
    textAlign: 'center',
  },
  givenText: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10.5,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 8,
    maxWidth: 400,
  },
})

export default function SudokuPage({ puzzle, pageNumber }: SudokuPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.sky }]} />
      <View style={{ position: 'absolute', top: 22, right: 28 }}>
        <MascotWithBubble
          message={"Each row, column\nand box needs\nevery number\n1 through 9!"}
          bubbleSide="left"
          size={55}
        />
      </View>

      <Text style={[styles.h1, { color: colors.sky }]}>Sudoku Puzzle</Text>
      <Text style={s.subtitle}>
        Fill in the grid so every row, column, and 3×3 box contains the numbers 1-9. Use logic — no guessing needed!
      </Text>

      <View style={s.grid}>
        {puzzle.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map((cell, ci) => {
              const borderLeftWidth = ci % 3 === 0 ? 2 : 0.5
              const borderTopWidth = ri % 3 === 0 ? 2 : 0.5
              const borderRightWidth = ci === 8 ? 2 : 0
              const borderBottomWidth = ri === 8 ? 2 : 0

              return (
                <View
                  key={ci}
                  style={[
                    s.cell,
                    {
                      borderLeftWidth,
                      borderLeftColor: ci % 3 === 0 ? colors.primary : '#bbb',
                      borderTopWidth,
                      borderTopColor: ri % 3 === 0 ? colors.primary : '#bbb',
                      borderRightWidth,
                      borderRightColor: colors.primary,
                      borderBottomWidth,
                      borderBottomColor: colors.primary,
                    },
                  ]}
                >
                  {cell !== null && (
                    <Text style={s.givenText}>{cell}</Text>
                  )}
                </View>
              )
            })}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
