import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { SectionContent } from '@/lib/types'
import { colors, styles } from './pdfStyles'

interface ChecklistPageProps {
  destinationDisplayName: string
  sections: SectionContent[]
  badgeNames: string[]
  pageNumber: number
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 4,
    marginRight: 12,
    flexShrink: 0,
  },
  emoji: {
    fontSize: 20,
    marginRight: 10,
    width: 28,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  badgeName: {
    fontSize: 10,
    color: colors.muted,
  },
  intro: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 20,
    lineHeight: 1.5,
  },
})

export default function ChecklistPage({ destinationDisplayName, sections, badgeNames, pageNumber }: ChecklistPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h1}>🗺️ Master Adventure Checklist</Text>
      <Text style={s.intro}>
        Check each place as you visit! Complete all sections to earn your Explorer Certificate.
      </Text>

      {sections.map((section, i) => (
        <View key={section.id} style={s.item}>
          <View style={s.checkbox} />
          <Text style={s.emoji}>{section.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            {badgeNames[i] && (
              <Text style={s.badgeName}>🏅 {badgeNames[i]}</Text>
            )}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
