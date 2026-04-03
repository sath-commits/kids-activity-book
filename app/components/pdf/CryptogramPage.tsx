import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import MascotWithBubble from './MascotWithBubble'

interface CryptogramPageProps {
  phrase: string
  pageNumber: number
}

const s = StyleSheet.create({
  subtitle: {
    fontSize: 10.5,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  keySection: {
    marginBottom: 14,
    backgroundColor: colors.lightSky,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.sky,
  },
  keyTitle: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: colors.muted,
    marginBottom: 5,
  },
  keyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  keyChip: {
    backgroundColor: colors.light,
    borderRadius: 4,
    padding: 3,
    marginRight: 3,
    marginBottom: 2,
    alignItems: 'center',
    minWidth: 22,
  },
  keyLetter: {
    fontSize: 7,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
  keyNumber: {
    fontSize: 6.5,
    color: colors.muted,
  },
  messageSection: {
    marginTop: 8,
  },
  messageSectionTitle: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: colors.muted,
    marginBottom: 8,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  wordGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 10,
    marginBottom: 12,
  },
  letterBox: {
    alignItems: 'center',
    marginRight: 2,
  },
  numberBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  numberText: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: colors.text,
  },
  blankLine: {
    width: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 3,
    height: 8,
  },
})

function encodePhrase(phrase: string): { letter: string; code: number }[][] {
  const words = phrase.toUpperCase().split(' ')
  return words.map((word) =>
    word.split('').map((char) => ({
      letter: char,
      code: char >= 'A' && char <= 'Z' ? char.charCodeAt(0) - 64 : 0,
    }))
  )
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function CryptogramPage({ phrase, pageNumber }: CryptogramPageProps) {
  const encodedWords = encodePhrase(phrase)
  const firstHalf = ALPHABET.slice(0, 13).split('')
  const secondHalf = ALPHABET.slice(13).split('')

  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.purple }]} />
      <View style={{ position: 'absolute', top: 22, left: 28 }}>
        <MascotWithBubble
          message={"Use the key\nbelow to crack\nthe code!\nGood luck!"}
          bubbleSide="right"
          size={55}
        />
      </View>

      <View style={{ marginTop: 60 }}>
        <Text style={[styles.h1, { color: colors.purple }]}>Secret Cryptogram!</Text>
        <Text style={s.subtitle}>Decode the hidden message using the number key below!</Text>

        <View style={s.keySection}>
          <Text style={s.keyTitle}>THE CODE KEY</Text>
          <View style={s.keyRow}>
            {firstHalf.map((letter) => (
              <View key={letter} style={s.keyChip}>
                <Text style={s.keyLetter}>{letter}</Text>
                <Text style={s.keyNumber}>{letter.charCodeAt(0) - 64}</Text>
              </View>
            ))}
          </View>
          <View style={s.keyRow}>
            {secondHalf.map((letter) => (
              <View key={letter} style={s.keyChip}>
                <Text style={s.keyLetter}>{letter}</Text>
                <Text style={s.keyNumber}>{letter.charCodeAt(0) - 64}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.messageSection}>
          <Text style={s.messageSectionTitle}>DECODE THIS MESSAGE:</Text>
          <View style={s.wordsRow}>
            {encodedWords.map((word, wi) => (
              <View key={wi} style={s.wordGroup}>
                {word.map((item, li) => (
                  <View key={li} style={s.letterBox}>
                    <View style={s.numberBox}>
                      <Text style={s.numberText}>{item.code > 0 ? item.code : item.letter}</Text>
                    </View>
                    <View style={s.blankLine} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
