import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'

interface SectionJournalPageProps {
  sectionTitle: string
  childAge: number
  pageNumber: number
}

const s = StyleSheet.create({
  pageBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#f3b655',
  },
  subtitle: {
    fontSize: 10.5,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  promptRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  promptCard: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  promptLabel: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  promptValue: {
    fontSize: 10,
    lineHeight: 1.4,
    color: colors.text,
  },
  drawingBox: {
    borderWidth: 2,
    borderColor: '#d7d4cc',
    borderRadius: 16,
    borderStyle: 'dashed',
    marginBottom: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 14,
    backgroundColor: '#fffdf8',
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
    fontSize: 12,
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
    marginBottom: 16,
  },
  memoryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 14,
  },
  memoryBox: {
    flex: 1,
    minHeight: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 8,
  },
  memoryLabel: {
    fontSize: 8.5,
    fontFamily: 'Nunito-Bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memoryLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d7d4cc',
    marginBottom: 8,
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
      <View style={s.pageBand} />
      <Text style={[styles.h2, { marginBottom: 16 }]}>{sectionTitle} — My Journal</Text>
      <Text style={s.subtitle}>Pause for a moment, remember what stood out, and make this page your own.</Text>

      <View style={s.promptRow}>
        <View style={[s.promptCard, { backgroundColor: '#fff7ed', borderColor: '#f3b655' }]}>
          <Text style={[s.promptLabel, { color: '#a66318' }]}>Best Memory</Text>
          <Text style={s.promptValue}>What was the coolest thing you saw at {sectionTitle}?</Text>
        </View>
        <View style={[s.promptCard, { backgroundColor: '#eef6ff', borderColor: '#9cc4f4' }]}>
          <Text style={[s.promptLabel, { color: '#2b6cb0' }]}>Explorer Tip</Text>
          <Text style={s.promptValue}>Use this page for sketches, small facts, sounds, and anything you want to remember.</Text>
        </View>
      </View>

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
        <View style={s.memoryRow}>
          <View style={[s.memoryBox, { borderColor: '#f0c66a', backgroundColor: '#fffaf0' }]}>
            <Text style={[s.memoryLabel, { color: '#a66318' }]}>I Spotted</Text>
            <View style={s.memoryLine} />
            <View style={s.memoryLine} />
          </View>
          <View style={[s.memoryBox, { borderColor: '#9cc4f4', backgroundColor: '#f6fbff' }]}>
            <Text style={[s.memoryLabel, { color: '#2b6cb0' }]}>I Heard / Felt</Text>
            <View style={s.memoryLine} />
            <View style={s.memoryLine} />
          </View>
          <View style={[s.memoryBox, { borderColor: '#bfa8f5', backgroundColor: '#faf7ff' }]}>
            <Text style={[s.memoryLabel, { color: '#7c3aed' }]}>I Want to Remember</Text>
            <View style={s.memoryLine} />
            <View style={s.memoryLine} />
          </View>
        </View>
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
