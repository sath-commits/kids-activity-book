import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import { WordSearchResult } from '@/lib/wordSearch'
import PageGuide from './PageGuide'

interface WordSearchPageProps {
  wordSearch: WordSearchResult
  destinationDisplayName: string
  pageNumber: number
}

const CELL_SIZE = 17

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellLetter: {
    fontSize: 8.5,
    fontFamily: 'Nunito-Bold',
    color: colors.text,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  wordChip: {
    backgroundColor: colors.light,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  wordChipText: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
})

export default function WordSearchPage({ wordSearch, destinationDisplayName, pageNumber }: WordSearchPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <PageGuide
        message={"Hidden words everywhere. Can you find them all?"}
        side="right"
        accentColor={colors.primary}
      />
      <Text style={styles.h1}>Word Search!</Text>
      <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 8 }}>
        Find all the hidden words about {destinationDisplayName}. Words can go in any direction!
      </Text>

      <View style={s.gridContainer}>
        {wordSearch.grid.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map((letter, ci) => (
              <View key={ci} style={s.cell}>
                <Text style={s.cellLetter}>{letter}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 10, fontFamily: 'Nunito-Bold', color: colors.primary, marginBottom: 6 }}>
        Find these words:
      </Text>
      <View style={s.wordsContainer}>
        {wordSearch.placedWords.map((word) => (
          <View key={word} style={s.wordChip}>
            <Text style={s.wordChipText}>{word}</Text>
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
