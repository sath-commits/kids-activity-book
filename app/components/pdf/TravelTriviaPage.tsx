import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import MascotWithBubble from './MascotWithBubble'

interface TravelTriviaPageProps {
  trivia: { question: string; answer: string }[]
  destinationDisplayName: string
  pageNumber: number
}

const s = StyleSheet.create({
  subtitle: {
    fontSize: 10.5,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 12,
    maxWidth: 420,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.sky,
    padding: 10,
    marginBottom: 8,
    width: '48%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  trophy: {
    fontSize: 13,
    marginRight: 5,
    marginTop: -1,
  },
  question: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: colors.text,
    flex: 1,
    lineHeight: 1.4,
  },
  answerBox: {
    borderWidth: 1,
    borderColor: colors.sky,
    borderStyle: 'dashed',
    borderRadius: 4,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: 'white',
  },
  answerLabel: {
    fontSize: 7.5,
    color: '#aaa',
  },
})

export default function TravelTriviaPage({ trivia, destinationDisplayName, pageNumber }: TravelTriviaPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.sky }]} />
      <View style={{ position: 'absolute', top: 22, right: 28 }}>
        <MascotWithBubble
          message={"Think hard before\nyou look at the\nanswer key!\nYou've got this!"}
          bubbleSide="left"
          size={55}
        />
      </View>

      <Text style={[styles.h1, { color: colors.sky }]}>Travel Trivia!</Text>
      <Text style={s.subtitle}>
        How much do you know about {destinationDisplayName}? Try to answer before flipping to the answer key!
      </Text>

      <View style={s.grid}>
        {trivia.map((item, i) => (
          <View key={i} style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.trophy}>🏆</Text>
              <Text style={s.question}>Q: {item.question}</Text>
            </View>
            <View style={s.answerBox}>
              <Text style={s.answerLabel}>Your answer:</Text>
            </View>
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
