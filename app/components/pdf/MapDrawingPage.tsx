import { Page, View, Text, StyleSheet, Svg, Line, Polygon } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import PageGuide from './PageGuide'

interface MapDrawingPageProps {
  mapDrawingChallenge: {
    instructions: string[]
    landmarks: string[]
  }
  destinationDisplayName: string
  pageNumber: number
}

const s = StyleSheet.create({
  subtitle: {
    fontSize: 10.5,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  instructionsCol: {
    width: '42%',
    paddingRight: 10,
  },
  landmarksCol: {
    width: '58%',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    marginBottom: 5,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stepNum: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    marginRight: 4,
    width: 14,
  },
  stepText: {
    fontSize: 9,
    color: colors.text,
    flex: 1,
    lineHeight: 1.4,
  },
  landmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  landmarkCheck: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 2,
    marginRight: 5,
  },
  landmarkText: {
    fontSize: 9,
    color: colors.text,
    flex: 1,
    lineHeight: 1.4,
  },
  drawingBox: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 280,
    position: 'relative',
    backgroundColor: '#fafafa',
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 22,
    color: '#e8e8e8',
    fontFamily: 'Nunito-Bold',
  },
  compassContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
})

function CompassRose() {
  return (
    <Svg width={50} height={50}>
      {/* N arrow */}
      <Line x1="25" y1="25" x2="25" y2="4" stroke="#555" strokeWidth={1.5} />
      <Polygon points="25,2 22,8 28,8" fill={colors.primary} />
      {/* S arrow */}
      <Line x1="25" y1="25" x2="25" y2="46" stroke="#555" strokeWidth={1} />
      <Polygon points="25,48 22,42 28,42" fill="#aaa" />
      {/* E arrow */}
      <Line x1="25" y1="25" x2="46" y2="25" stroke="#555" strokeWidth={1} />
      <Polygon points="48,25 42,22 42,28" fill="#aaa" />
      {/* W arrow */}
      <Line x1="25" y1="25" x2="4" y2="25" stroke="#555" strokeWidth={1} />
      <Polygon points="2,25 8,22 8,28" fill="#aaa" />
      {/* Direction labels */}
    </Svg>
  )
}

export default function MapDrawingPage({ mapDrawingChallenge, destinationDisplayName, pageNumber }: MapDrawingPageProps) {
  const instructions = mapDrawingChallenge.instructions.slice(0, 5)
  const landmarks = mapDrawingChallenge.landmarks.slice(0, 6)

  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.teal }]} />
      <PageGuide
        message={"Make your map as detailed as you can. Add animals, roads, and more."}
        side="left"
        accentColor={colors.teal}
      />
      <Text style={[styles.h1, { color: colors.teal }]}>Draw Your Map!</Text>
      <Text style={s.subtitle}>Create your own map of {destinationDisplayName}!</Text>

      <View style={s.infoRow}>
        <View style={s.instructionsCol}>
          <Text style={s.sectionTitle}>Instructions:</Text>
          {instructions.map((step, i) => (
            <View key={i} style={s.instructionItem}>
              <Text style={s.stepNum}>{i + 1}.</Text>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>
        <View style={s.landmarksCol}>
          <Text style={s.sectionTitle}>Landmarks to include:</Text>
          {landmarks.map((landmark, i) => (
            <View key={i} style={s.landmarkItem}>
              <View style={s.landmarkCheck} />
              <Text style={s.landmarkText}>{landmark}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.drawingBox}>
        <View style={s.watermark}>
          <Text style={s.watermarkText}>Draw here!</Text>
        </View>
        <View style={s.compassContainer}>
          <CompassRose />
          <Text style={{ fontSize: 7, color: '#888', textAlign: 'center', marginTop: -4 }}>N↑</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
