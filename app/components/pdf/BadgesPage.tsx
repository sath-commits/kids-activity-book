import { Page, View, Text, StyleSheet, Svg, Path } from '@react-pdf/renderer'
import { SectionContent } from '@/lib/types'
import { styles } from './pdfStyles'

interface BadgesPageProps {
  sections: SectionContent[]
  badgeNames: string[]
  pageNumber: number
}

const BADGE_PALETTES = [
  { outer: '#5b21b6', inner: '#7c3aed', shine: 'rgba(255,255,255,0.22)', ribbon: '#4c1d95' },
  { outer: '#1e40af', inner: '#2563eb', shine: 'rgba(255,255,255,0.20)', ribbon: '#1e3a8a' },
  { outer: '#065f46', inner: '#059669', shine: 'rgba(255,255,255,0.20)', ribbon: '#064e3b' },
  { outer: '#92400e', inner: '#d97706', shine: 'rgba(255,255,255,0.25)', ribbon: '#78350f' },
  { outer: '#9f1239', inner: '#e11d48', shine: 'rgba(255,255,255,0.20)', ribbon: '#881337' },
  { outer: '#0c4a6e', inner: '#0284c7', shine: 'rgba(255,255,255,0.22)', ribbon: '#075985' },
  { outer: '#7c2d12', inner: '#ea580c', shine: 'rgba(255,255,255,0.22)', ribbon: '#7c2d12' },
  { outer: '#134e4a', inner: '#0f766e', shine: 'rgba(255,255,255,0.20)', ribbon: '#0f3d3d' },
]

const OUTER = 88
const INNER = 68
const SHINE = 16

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  badgeWrapper: {
    alignItems: 'center',
    width: 110,
  },
  outerCircle: {
    width: OUTER,
    height: OUTER,
    borderRadius: OUTER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Drop-shadow approximated with a slightly larger outer ring
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  innerCircle: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    position: 'relative',
  },
  badgeLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 8,
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 1.2,
    marginTop: 2,
  },
  ribbon: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ribbonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 7,
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  sectionName: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 1.3,
  },
})

export default function BadgesPage({ sections, badgeNames, pageNumber }: BadgesPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h1}>Explorer Badges</Text>
      <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
        Earn each badge by visiting the location and completing its challenges!
      </Text>

      <View style={s.grid}>
        {sections.map((section, i) => {
          const palette = BADGE_PALETTES[i % BADGE_PALETTES.length]
          const name = badgeNames[i] ?? section.title
          return (
            <View key={section.id} style={s.badgeWrapper}>
              <View style={[s.outerCircle, { backgroundColor: palette.outer }]}>
                <View style={[s.innerCircle, { backgroundColor: palette.inner }]}>
                  <Svg width="22" height="22" viewBox="0 0 44 44">
                    <Path
                      d="M22 3 L26.8 15.5 L40 15.5 L29.5 23.5 L33.7 36 L22 28.5 L10.3 36 L14.5 23.5 L4 15.5 L17.2 15.5 Z"
                      fill="rgba(255,255,255,0.90)"
                    />
                  </Svg>
                  <Text style={s.badgeLabel}>{name}</Text>
                </View>
              </View>
              <View style={[s.ribbon, { backgroundColor: palette.ribbon }]}>
                <Text style={s.ribbonText}>EARNED!</Text>
              </View>
              <Text style={s.sectionName}>{section.title}</Text>
            </View>
          )
        })}
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
