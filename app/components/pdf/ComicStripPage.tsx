import { Page, View, Text, StyleSheet, Svg, Ellipse, Polygon, Line } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'

interface ComicStripPageProps {
  comicStrip: {
    title: string
    panels: { scene: string }[]
  }
  pageNumber: number
}

const s = StyleSheet.create({
  subtitle: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 1.4,
    marginBottom: 10,
  },
  panelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  panel: {
    width: '48%',
    height: 148,
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 4,
    backgroundColor: 'white',
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  panelNumber: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 18,
    height: 18,
    backgroundColor: colors.primary,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  panelNumberText: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: 'white',
  },
  speechBubble: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  sceneDescription: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    fontSize: 7.5,
    color: colors.muted,
    padding: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    lineHeight: 1.3,
    backgroundColor: '#f9f9f9',
  },
})

function SpeechBubble() {
  return (
    <Svg width={70} height={35}>
      <Ellipse cx={35} cy={14} rx={32} ry={12} fill="white" stroke="#555" strokeWidth={1.2} />
      <Polygon points="20,24 28,24 18,34" fill="white" />
      <Line x1="20" y1="24" x2="18" y2="34" stroke="#555" strokeWidth={1.2} />
      <Line x1="28" y1="24" x2="18" y2="34" stroke="#555" strokeWidth={1.2} />
    </Svg>
  )
}

export default function ComicStripPage({ comicStrip, pageNumber }: ComicStripPageProps) {
  const panels = comicStrip.panels.slice(0, 6)

  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.coral }]} />

      <Text style={[styles.h1, { color: colors.coral }]}>{comicStrip.title}</Text>
      <Text style={s.subtitle}>
        Draw your adventure! Write dialogue in the speech bubbles. Fill in all 6 panels!
      </Text>

      <View style={s.panelGrid}>
        {panels.map((panel, i) => (
          <View key={i} style={s.panel}>
            <View style={s.panelNumber}>
              <Text style={s.panelNumberText}>{i + 1}</Text>
            </View>
            <View style={s.speechBubble}>
              <SpeechBubble />
            </View>
            <Text style={s.sceneDescription}>{panel.scene}</Text>
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
