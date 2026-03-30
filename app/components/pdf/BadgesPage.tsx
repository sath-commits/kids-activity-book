import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { SectionContent } from '@/lib/types'
import { colors, styles } from './pdfStyles'

interface BadgesPageProps {
  sections: SectionContent[]
  badgeNames: string[]
  pageNumber: number
}

const s = StyleSheet.create({
  intro: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badgeWrapper: {
    width: '33%',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fffe',
  },
  emoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  badgeName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 8.5,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 1.3,
  },
  colorNote: {
    fontSize: 8,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
})

export default function BadgesPage({ sections, badgeNames, pageNumber }: BadgesPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h1}>🏅 Explorer Badges</Text>
      <Text style={s.intro}>
        Color in each badge when you complete that section! Earn all your badges to become a Master Explorer.
      </Text>

      <View style={s.grid}>
        {sections.map((section, i) => (
          <View key={section.id} style={s.badgeWrapper}>
            <View style={s.circle}>
              <Text style={s.emoji}>{section.emoji}</Text>
              <Text style={s.badgeName}>{badgeNames[i] ?? section.title}</Text>
            </View>
            <Text style={s.colorNote}>✏️ Color when earned!</Text>
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
