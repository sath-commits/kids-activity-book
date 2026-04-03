import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import MascotWithBubble from './MascotWithBubble'

interface LogicGridPageProps {
  logicGrid: {
    intro: string
    people: string[]
    options: string[]
    clues: string[]
    solution: Record<string, string>
  }
  pageNumber: number
}

const s = StyleSheet.create({
  subtitle: {
    fontSize: 10.5,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 10,
    maxWidth: 420,
  },
  introBox: {
    backgroundColor: colors.lightSky,
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.sky,
    marginBottom: 12,
  },
  introText: {
    fontSize: 10.5,
    color: colors.text,
    lineHeight: 1.4,
  },
  gridContainer: {
    marginBottom: 14,
  },
  gridHeaderRow: {
    flexDirection: 'row',
  },
  personHeaderCell: {
    width: 90,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.light,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionHeaderCell: {
    width: 120,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.light,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
  },
  personCell: {
    width: 90,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 5,
    justifyContent: 'center',
  },
  personText: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: colors.text,
  },
  dataCell: {
    width: 120,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  checkboxCell: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 2,
  },
  cluesSection: {
    marginTop: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.sunshine,
  },
  cluesTitle: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
    color: colors.amber,
    marginBottom: 6,
  },
  clueItem: {
    fontSize: 10.5,
    color: colors.text,
    lineHeight: 1.5,
    marginBottom: 3,
  },
  instructionRow: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: colors.lightPurple,
    borderRadius: 4,
    padding: 6,
  },
  instructionText: {
    fontSize: 9,
    color: colors.purple,
    fontFamily: 'Nunito-Bold',
  },
})

export default function LogicGridPage({ logicGrid, pageNumber }: LogicGridPageProps) {
  const { intro, people, options, clues } = logicGrid

  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.purple }]} />
      <View style={{ position: 'absolute', top: 22, right: 28 }}>
        <MascotWithBubble
          message={"Read all the clues\ncarefully before\nyou start!\nThink it through!"}
          bubbleSide="left"
          size={55}
        />
      </View>

      <Text style={[styles.h1, { color: colors.purple }]}>Logic Grid Puzzle</Text>

      <View style={s.introBox}>
        <Text style={s.introText}>{intro}</Text>
      </View>

      <View style={s.gridContainer}>
        {/* Header row */}
        <View style={s.gridHeaderRow}>
          <View style={s.personHeaderCell}>
            <Text style={s.headerText}>Person</Text>
          </View>
          {options.map((option, oi) => (
            <View key={oi} style={s.optionHeaderCell}>
              <Text style={s.headerText}>{option}</Text>
            </View>
          ))}
        </View>
        {/* Data rows */}
        {people.map((person, pi) => (
          <View key={pi} style={[s.dataRow, { backgroundColor: pi % 2 === 0 ? 'white' : '#f9f9f9' }]}>
            <View style={[s.personCell, { backgroundColor: pi % 2 === 0 ? 'white' : '#f9f9f9' }]}>
              <Text style={s.personText}>{person}</Text>
            </View>
            {options.map((_, oi) => (
              <View key={oi} style={[s.dataCell, { backgroundColor: pi % 2 === 0 ? 'white' : '#f9f9f9' }]}>
                <View style={s.checkboxCell} />
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={s.instructionRow}>
        <Text style={s.instructionText}>✓ = Yes   ✗ = No   Put a checkmark in the right box!</Text>
      </View>

      <View style={s.cluesSection}>
        <Text style={s.cluesTitle}>Clues:</Text>
        {clues.map((clue, i) => (
          <Text key={i} style={s.clueItem}>{i + 1}. {clue}</Text>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
