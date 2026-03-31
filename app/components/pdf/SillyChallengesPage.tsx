import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'

interface SillyChallengesPageProps {
  challenges: string[]
  destinationDisplayName: string
  pageNumber: number
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff9e6',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#f9c922',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#f9c922',
    flexShrink: 0,
    marginTop: 1,
  },
  challengeText: {
    fontSize: 9.5,
    color: colors.text,
    flex: 1,
    lineHeight: 1.4,
    fontFamily: 'Nunito',
  },
})

export default function SillyChallengesPage({ challenges, destinationDisplayName, pageNumber }: SillyChallengesPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h1}>Silly Challenges!</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 12 }}>
        Can you complete all these fun challenges on your trip to {destinationDisplayName}? Check the box when you do it!
      </Text>

      <View style={s.grid}>
        {challenges.map((challenge, i) => (
          <View key={i} style={s.card}>
            <View style={s.checkbox} />
            <Text style={s.challengeText}>{challenge}</Text>
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
