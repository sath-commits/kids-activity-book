import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { ChildPersonalization } from '@/lib/types'
import { colors } from './pdfStyles'

interface CoverPageProps {
  destinationDisplayName: string
  explorers: ChildPersonalization[]
  tripDates?: { start: string; end: string }
  coverImageB64: string | null
}

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.pageBackground,
    fontFamily: 'Nunito',
    position: 'relative',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.12,
  },
  topSection: {
    padding: 40,
    paddingBottom: 20,
    zIndex: 1,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 32,
    color: colors.primary,
    lineHeight: 1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
  },
  border: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 4,
    borderColor: colors.accent,
    borderRadius: 16,
  },
  childRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  childChip: {
    backgroundColor: colors.light,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  childName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    color: colors.primary,
  },
  childAge: {
    fontSize: 10,
    color: colors.muted,
    marginLeft: 4,
  },
  dates: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 8,
  },
  bottomImage: {
    flex: 1,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  footer: {
    padding: 20,
    paddingTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: colors.muted,
  },
})

const genderEmoji = (gender: string) => {
  if (gender === 'girl') return '👧'
  if (gender === 'boy') return '🧒'
  return '🌟'
}

export default function CoverPage({ destinationDisplayName, explorers, tripDates, coverImageB64 }: CoverPageProps) {
  const namesDisplay =
    explorers.length === 1
      ? `${explorers[0].name}'s Adventure Book`
      : `${explorers.map((c) => c.name).slice(0, -1).join(', ')} & ${explorers[explorers.length - 1].name}'s Adventure Book`

  return (
    <Page size="A4" style={s.page}>
      <View style={s.border} />

      {coverImageB64 && (
        <Image
          style={s.bgImage}
          src={`data:image/png;base64,${coverImageB64}`}
        />
      )}

      <View style={s.topSection}>
        <View style={s.badge}>
          <Text style={s.badgeText}>🌲 JUNIOR EXPLORER</Text>
        </View>

        <Text style={s.title}>{destinationDisplayName}</Text>
        <Text style={s.subtitle}>Adventure Book</Text>

        <View style={s.childRow}>
          {explorers.map((child) => (
            <View key={child.name} style={s.childChip}>
              <Text style={s.childName}>{genderEmoji(child.gender)} {child.name}</Text>
              <Text style={s.childAge}>age {child.age}</Text>
            </View>
          ))}
        </View>

        {tripDates && (
          <Text style={s.dates}>📅 {tripDates.start} – {tripDates.end}</Text>
        )}
      </View>

      {coverImageB64 && (
        <View style={s.bottomImage}>
          <Image
            style={s.img}
            src={`data:image/png;base64,${coverImageB64}`}
          />
        </View>
      )}

      <View style={s.footer}>
        <Text style={s.footerText}>Little Explorer · builtthisweekend.com</Text>
      </View>
    </Page>
  )
}
