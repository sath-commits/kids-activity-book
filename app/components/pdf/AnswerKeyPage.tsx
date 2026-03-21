import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { SectionContent } from '@/lib/types'
import { colors, styles } from './pdfStyles'

interface AnswerKeyPageProps {
  sections: SectionContent[]
  pageNumber: number
}

const s = StyleSheet.create({
  intro: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '50%',
    paddingRight: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    color: colors.primary,
    marginBottom: 3,
  },
  question: {
    fontSize: 9,
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: 2,
    lineHeight: 1.3,
  },
  answer: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.4,
  },
})

export default function AnswerKeyPage({ sections, pageNumber }: AnswerKeyPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h1}>📖 Answer Key</Text>
      <Text style={s.intro}>For parents and rangers — answers to the "Think About It" questions:</Text>

      <View style={s.grid}>
        {sections.map((section) => (
          <View key={section.id} style={s.item}>
            <Text style={s.sectionTitle}>{section.emoji} {section.title}</Text>
            <Text style={s.question}>Q: {section.thinkQuestion}</Text>
            <Text style={s.answer}>A: {section.thinkQuestionAnswer}</Text>
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
