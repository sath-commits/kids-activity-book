import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import MascotWithBubble from './MascotWithBubble'

interface RebusPuzzlePageProps {
  puzzles: { equation: string; answer: string }[]
  destinationDisplayName: string
  pageNumber: number
}

const s = StyleSheet.create({
  subtitle: {
    fontSize: 10.5,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff9e6',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#f9c922',
    padding: 12,
    marginBottom: 8,
    width: '48%',
  },
  equationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  wordChip: {
    backgroundColor: colors.light,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  wordChipText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    color: colors.primary,
  },
  operator: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    color: colors.text,
    marginHorizontal: 4,
  },
  answerLine: {
    width: 90,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    marginLeft: 6,
    height: 14,
  },
  hintText: {
    fontSize: 8,
    color: colors.muted,
    fontStyle: 'italic',
  },
})

function parseEquation(equation: string): string[] {
  // Split on + signs, returning tokens with operators
  return equation.split('+').map((s) => s.trim())
}

export default function RebusPuzzlePage({ puzzles, pageNumber }: RebusPuzzlePageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.sunshine }]} />
      <View style={{ position: 'absolute', top: 22, left: 28 }}>
        <MascotWithBubble
          message={"Put the words\ntogether to find\na secret word!\nCan you do it?"}
          bubbleSide="right"
          size={55}
        />
      </View>

      <View style={{ marginTop: 60 }}>
        <Text style={[styles.h1, { color: colors.amber }]}>Rebus Puzzles!</Text>
        <Text style={s.subtitle}>Add the words together to make a new word!</Text>

        <View style={s.grid}>
          {puzzles.map((puzzle, i) => {
            const parts = parseEquation(puzzle.equation)
            return (
              <View key={i} style={s.card}>
                <View style={s.equationRow}>
                  {parts.map((part, pi) => (
                    <View key={pi} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {pi > 0 && <Text style={s.operator}>+</Text>}
                      <View style={s.wordChip}>
                        <Text style={s.wordChipText}>{part}</Text>
                      </View>
                    </View>
                  ))}
                  <Text style={s.operator}>=</Text>
                  <View style={s.answerLine} />
                </View>
                <Text style={s.hintText}>(Hint: combine the words!)</Text>
              </View>
            )
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
