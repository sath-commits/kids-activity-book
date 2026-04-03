import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import MascotWithBubble from './MascotWithBubble'

interface TimeCapsulePageProps {
  timeCapsuleLetter: {
    prompts: string[]
  }
  pageNumber: number
}

const s = StyleSheet.create({
  sealBanner: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sealText: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: '#7c3aed',
    flex: 1,
  },
  sealDateLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#8b5cf6',
    width: 80,
    marginLeft: 6,
    height: 12,
  },
  subtitle: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  letterBox: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#faf5ff',
    flex: 1,
  },
  salutation: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: '#7c3aed',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  promptText: {
    fontSize: 10.5,
    color: colors.text,
    lineHeight: 1.4,
    marginBottom: 3,
  },
  blankLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
    height: 14,
    width: '90%',
  },
  blankLineTall: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 4,
    height: 14,
    width: '90%',
  },
  closing: {
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#d8b4fe',
    paddingTop: 8,
  },
  closingText: {
    fontSize: 10.5,
    fontFamily: 'Nunito-Bold',
    color: '#7c3aed',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameLabel: {
    fontSize: 10,
    color: colors.text,
    marginRight: 6,
  },
  nameLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: 140,
    height: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  dateLabel: {
    fontSize: 9.5,
    color: colors.muted,
    marginRight: 6,
  },
  dateLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: 120,
    height: 12,
  },
})

export default function TimeCapsulePage({ timeCapsuleLetter, pageNumber }: TimeCapsulePageProps) {
  const { prompts } = timeCapsuleLetter

  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: '#8b5cf6' }]} />
      <View style={{ position: 'absolute', top: 22, right: 28 }}>
        <MascotWithBubble
          message={"Write honestly!\nFuture-you will\nlove reading this\nin 5 years!"}
          bubbleSide="left"
          size={55}
        />
      </View>

      <Text style={[styles.h1, { color: '#7c3aed' }]}>Time Capsule Letter</Text>

      <View style={s.sealBanner}>
        <Text style={s.sealText}>SEALED: Open on</Text>
        <View style={s.sealDateLine} />
      </View>

      <Text style={s.subtitle}>Fill this out TODAY. Seal it in an envelope. Open it in 5 years!</Text>

      <View style={s.letterBox}>
        <Text style={s.salutation}>Dear Future Me,</Text>

        {prompts.map((prompt, i) => (
          <View key={i}>
            <Text style={s.promptText}>{prompt}</Text>
            <View style={s.blankLine} />
            {prompt.length > 50 && <View style={s.blankLineTall} />}
          </View>
        ))}

        <View style={s.closing}>
          <Text style={s.closingText}>Love,</Text>
          <View style={s.nameRow}>
            <Text style={s.nameLabel}>Your name:</Text>
            <View style={s.nameLine} />
          </View>
        </View>
      </View>

      <View style={s.dateRow}>
        <Text style={s.dateLabel}>Today's date:</Text>
        <View style={s.dateLine} />
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
