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
    backgroundColor: '#fffaf1',
    padding: 0,
    fontFamily: 'Nunito',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageTint: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(14, 52, 33, 0.18)',
  },
  titleWrap: {
    position: 'absolute',
    top: 28,
    left: 28,
    right: 28,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  badgeText: {
    color: '#2f7759',
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1.5,
  },
  destinationName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 30,
    color: '#fffaf1',
    lineHeight: 1.1,
    textAlign: 'center',
    maxWidth: 470,
    textShadow: '0 3 0 rgba(37, 67, 52, 0.35)',
  },
  subtitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: '#ffe07b',
    marginTop: 6,
    textAlign: 'center',
    textShadow: '0 2 0 rgba(37, 67, 52, 0.28)',
  },
  infoPanel: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 30,
    backgroundColor: 'rgba(255,249,235,0.96)',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 20,
    borderWidth: 2,
    borderColor: '#ecd9ad',
  },
  infoTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    letterSpacing: 1.1,
    color: '#8f5a21',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  explorerLineLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    color: '#2b2b2b',
    marginBottom: 4,
  },
  explorerValue: {
    fontSize: 17,
    color: '#234334',
    fontFamily: 'Nunito-Bold',
  },
  explorerMeta: {
    marginTop: 4,
    fontSize: 10,
    color: '#6b665f',
  },
  line: {
    height: 2,
    backgroundColor: '#ac8255',
    borderRadius: 999,
    marginTop: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 18,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#8f5a21',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 12,
    color: '#234334',
    minHeight: 16,
  },
  footerBrandRow: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerBrand: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    color: '#d9f4e6',
  },
  footerText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
  },
})

export default function CoverPage({ destinationDisplayName, explorers, tripDates, coverImageUrl }: CoverPageProps) {
  const namesLabel = explorers.length > 1 ? 'Explorer Names' : 'Explorer Name'
  const namesValue = explorers.map((child) => child.name).join(', ')
  const explorerDetails = explorers.map((child) => `${child.name}, age ${child.age}`).join(' • ')
  const tripDateValue = tripDates ? `${tripDates.start} - ${tripDates.end}` : ''

  return (
    <Page size="A4" style={s.page}>
      {coverImageUrl && (
        <Image
          style={s.bgImage}
          src={coverImageUrl}
        />
      )}
      <View style={s.imageTint} />

      <View style={s.titleWrap}>
        <View style={s.badge}>
          <Text style={s.badgeText}>JUNIOR EXPLORER</Text>
        </View>
        <Text style={s.destinationName}>{destinationDisplayName}</Text>
        <Text style={s.subtitle}>Adventure Book</Text>
      </View>

      <View style={s.infoPanel}>
        <Text style={s.infoTitle}>Explorer Journal Cover</Text>
        <View>
          <Text style={s.explorerLineLabel}>{namesLabel}</Text>
          <Text style={s.explorerValue}>{namesValue}</Text>
          <View style={s.line} />
          <Text style={s.explorerMeta}>{explorerDetails}</Text>
        </View>

        <View style={s.bottomRow}>
          <View style={s.field}>
            <Text style={s.fieldLabel}>Trip Dates</Text>
            <Text style={s.fieldValue}>{tripDateValue}</Text>
            <View style={s.line} />
          </View>
          <View style={s.field}>
            <Text style={s.fieldLabel}>Explorer Age</Text>
            <Text style={s.fieldValue}>
              {explorers.length === 1 ? `${explorers[0].age}` : 'See names above'}
            </Text>
            <View style={s.line} />
          </View>
        </View>
      </View>

      <View style={s.footerBrandRow}>
        <Text style={s.footerBrand}>Little Explorer</Text>
        <Text style={s.footerText}>builtthisweekend.com</Text>
      </View>
    </Page>
  )
}
