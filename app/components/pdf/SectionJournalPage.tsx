import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'

interface SectionJournalPageProps {
  sectionTitle: string
  childAge: number
  pageNumber: number
}

const s = StyleSheet.create({
  drawingBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    borderStyle: 'dashed',
    marginBottom: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
  },
  drawingPrompt: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  writingSection: {
    flex: 1,
  },
  writingPrompt: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    marginBottom: 12,
  },
  writingSubPrompt: {
    fontSize: 9.5,
    color: colors.muted,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginBottom: 18,
  },
})

export default function SectionJournalPage({ sectionTitle, childAge, pageNumber }: SectionJournalPageProps) {
  // Age-grouped layout
  // Young (5–7):  big drawing box (280), simple prompt, 6 lines
  // Middle (8–10): balanced (220), current prompt, 9 lines
  // Older (11+):  smaller box (150), richer writing prompt, 13 lines
  const isYoung = childAge <= 7
  const isOlder = childAge >= 11

  const drawingHeight = isYoung ? 280 : isOlder ? 150 : 220
  const lineCount = isYoung ? 6 : isOlder ? 13 : 9

  const drawingPrompt = isYoung
    ? `Draw your favorite thing from ${sectionTitle}!`
    : `Draw your favorite thing from ${sectionTitle}`

  const writingPrompt = isOlder
    ? `What made ${sectionTitle} special?`
    : `What did I see and feel at ${sectionTitle}?`

  const writingSubPrompt = isOlder
    ? `Describe something that surprised you. What would you tell a friend about it? Would you come back?`
    : null

  return (
    <Page size="A4" style={styles.page}>
      <Text style={[styles.h2, { marginBottom: 16 }]}>{sectionTitle} — My Journal</Text>

      {/* Drawing box */}
      <View style={[s.drawingBox, { height: drawingHeight }]}>
        <Text style={s.drawingPrompt}>{drawingPrompt}</Text>
        <Text style={[s.drawingPrompt, { fontSize: 9, marginTop: 6 }]}>(use pencils or crayons!)</Text>
      </View>

      {/* Writing lines */}
      <View style={s.writingSection}>
        <Text style={s.writingPrompt}>{writingPrompt}</Text>
        {writingSubPrompt && (
          <Text style={s.writingSubPrompt}>{writingSubPrompt}</Text>
        )}
        {Array.from({ length: lineCount }).map((_, i) => (
          <View key={i} style={s.line} />
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
