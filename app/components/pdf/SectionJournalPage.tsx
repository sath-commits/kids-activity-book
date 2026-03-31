import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'

interface SectionJournalPageProps {
  sectionTitle: string
  pageNumber: number
}

const LINE_COUNT = 10

const s = StyleSheet.create({
  drawingBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    borderStyle: 'dashed',
    height: 260,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginBottom: 18,
  },
})

export default function SectionJournalPage({ sectionTitle, pageNumber }: SectionJournalPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={[styles.h2, { marginBottom: 16 }]}>{sectionTitle} — My Journal</Text>

      {/* Drawing box top half */}
      <View style={s.drawingBox}>
        <Text style={s.drawingPrompt}>Draw your favorite thing from {sectionTitle}</Text>
        <Text style={[s.drawingPrompt, { fontSize: 9, marginTop: 6 }]}>(use pencils or crayons!)</Text>
      </View>

      {/* Writing lines bottom half */}
      <View style={s.writingSection}>
        <Text style={s.writingPrompt}>What did I see and feel at {sectionTitle}?</Text>
        {Array.from({ length: LINE_COUNT }).map((_, i) => (
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
