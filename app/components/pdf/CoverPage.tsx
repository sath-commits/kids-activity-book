import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { ChildPersonalization } from '@/lib/types'
import { colors } from './pdfStyles'

interface CoverPageProps {
  destinationDisplayName: string
  explorers: ChildPersonalization[]
  tripDates?: { start: string; end: string }
  coverImageUrl: string | null
}

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.primary,
    padding: 0,
    fontFamily: 'Nunito',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a4731',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
  },
  badge: {
    backgroundColor: '#52b788',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1.5,
  },
  destinationName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
    color: '#ffffff',
    lineHeight: 1.15,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  explorersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  explorerChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  explorerName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    color: '#ffffff',
  },
  explorerAge: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
  },
  dates: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a4731',
    paddingHorizontal: 28,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
  },
})

export default function CoverPage({ destinationDisplayName, explorers, tripDates, coverImageUrl }: CoverPageProps) {
  return (
    <Page size="A4" style={s.page}>
      {/* Background image */}
      {coverImageUrl && (
        <Image
          style={s.bgImage}
          src={coverImageUrl}
        />
      )}

      {/* Top text overlay */}
      <View style={s.topOverlay}>
        <View style={s.badge}>
          <Text style={s.badgeText}>JUNIOR EXPLORER</Text>
        </View>
        <Text style={s.destinationName}>{destinationDisplayName}</Text>
        <Text style={s.subtitle}>Adventure Book</Text>
        <View style={s.explorersRow}>
          {explorers.map((child) => (
            <View key={child.name} style={s.explorerChip}>
              <Text style={s.explorerName}>{child.name}</Text>
              <Text style={s.explorerAge}>age {child.age}</Text>
            </View>
          ))}
        </View>
        {tripDates && (
          <Text style={s.dates}>{tripDates.start} - {tripDates.end}</Text>
        )}
      </View>

      {/* Bottom footer overlay */}
      <View style={s.bottomOverlay}>
        <Text style={s.footerText}>Little Explorer</Text>
        <Text style={s.footerText}>builtthisweekend.com</Text>
      </View>
    </Page>
  )
}
