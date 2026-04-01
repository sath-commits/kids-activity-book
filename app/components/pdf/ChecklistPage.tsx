import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { SectionContent } from '@/lib/types'
import { colors, styles } from './pdfStyles'
import MascotSvg from './MascotSvg'

interface ChecklistPageProps {
  destinationDisplayName: string
  sections: SectionContent[]
  badgeNames: string[]
  pageNumber: number
}

const ROW_COLORS = [
  { bg: '#fff7ed', border: colors.orange },
  { bg: '#f0f9ff', border: colors.sky },
  { bg: '#fdf4ff', border: colors.purple },
  { bg: '#f0fdfa', border: colors.teal },
  { bg: '#fffbeb', border: colors.sunshine },
  { bg: '#fdf2f8', border: colors.pink },
]

const s = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 4,
    marginRight: 12,
    flexShrink: 0,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: colors.text,
  },
  badgeName: {
    fontSize: 10,
    color: colors.muted,
  },
  intro: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 14,
    lineHeight: 1.5,
  },
})

export default function ChecklistPage({ destinationDisplayName, sections, badgeNames, pageNumber }: ChecklistPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.primary }]} />
      <View style={{ position: 'absolute', top: 28, right: 28 }}>
        <MascotSvg size={60} />
      </View>
      <Text style={[styles.h1, { color: colors.primary }]}>Master Adventure Checklist</Text>
      <Text style={s.intro}>
        Check each place as you visit! Complete all sections to earn your Explorer Certificate.
      </Text>

      {sections.map((section, i) => {
        const palette = ROW_COLORS[i % ROW_COLORS.length]
        return (
          <View key={section.id} style={[s.item, { backgroundColor: palette.bg, borderLeftColor: palette.border }]}>
            <View style={[s.checkbox, { borderColor: palette.border }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              {badgeNames[i] && (
                <Text style={s.badgeName}>Badge: {badgeNames[i]}</Text>
              )}
            </View>
          </View>
        )
      })}

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
