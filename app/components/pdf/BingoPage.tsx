import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import PageGuide from './PageGuide'

interface BingoPageProps {
  gridItems: string[]
  destinationDisplayName: string
  pageNumber: number
}

const s = StyleSheet.create({
  grid: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: colors.amber,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#e5d5a0',
    minHeight: 76,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  freeCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#e5d5a0',
    minHeight: 76,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    backgroundColor: '#fef3c7',
  },
  cellText: {
    fontSize: 8.5,
    textAlign: 'center',
    color: colors.text,
    lineHeight: 1.3,
  },
  freeCellText: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    textAlign: 'center',
  },
  intro: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 8,
  },
})

export default function BingoPage({ gridItems, destinationDisplayName, pageNumber }: BingoPageProps) {
  // Build 5x5 grid: items 0-11 for first half, FREE SPACE in center (index 12), items 12-23 for second half
  const buildGrid = () => {
    const cells: (string | null)[] = []
    const items = gridItems.slice(0, 24)
    // Fill 25 cells: 12 before center, free space, 12 after
    for (let i = 0; i < 12; i++) cells.push(items[i] ?? '')
    cells.push(null) // free space
    for (let i = 12; i < 24; i++) cells.push(items[i] ?? '')
    return cells
  }

  const cells = buildGrid()
  const rows: (string | null)[][] = []
  for (let i = 0; i < 5; i++) {
    rows.push(cells.slice(i * 5, i * 5 + 5))
  }

  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.sunshine }]} />
      <PageGuide
        message={"Get five in a row to shout BINGO. Good luck, Explorer!"}
        side="right"
        accentColor={colors.amber}
      />
      <Text style={[styles.h1, { color: colors.amber }]}>Adventure Bingo!</Text>
      <Text style={s.intro}>
        Find 5 things in a row — across, down, or diagonally — to win! Look for these at {destinationDisplayName}.
      </Text>

      <View style={s.grid}>
        {rows.map((row, ri) => {
          const rowBg = ri % 2 === 0 ? '#fffbf0' : '#fff8e1'
          return (
            <View key={ri} style={s.row}>
              {row.map((cell, ci) => (
                <View key={ci} style={[cell === null ? s.freeCell : s.cell, cell !== null ? { backgroundColor: rowBg } : {}]}>
                  {cell === null ? (
                    <Text style={s.freeCellText}>FREE{'\n'}SPACE</Text>
                  ) : (
                    <Text style={s.cellText}>{cell}</Text>
                  )}
                </View>
              ))}
            </View>
          )
        })}
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
