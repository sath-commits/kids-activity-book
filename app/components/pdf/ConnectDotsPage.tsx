import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import { selectShape } from '@/lib/connectDots'
import MascotSvg from './MascotSvg'

interface ConnectDotsPageProps {
  destinationDisplayName: string
  pageNumber: number
}

const s = StyleSheet.create({
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  instructions: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 14,
    fontFamily: 'Nunito-Bold',
  },
  dotsArea: {
    position: 'relative',
    alignSelf: 'center',
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dotNumber: {
    position: 'absolute',
    fontSize: 7.5,
    color: '#333',
    fontFamily: 'Nunito-Bold',
  },
  answerBox: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  answerLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
})

const AREA_W = 460
const AREA_H = 360
const DOT_R = 5

export default function ConnectDotsPage({ destinationDisplayName, pageNumber }: ConnectDotsPageProps) {
  const shape = selectShape(destinationDisplayName)

  // Scale to fit AREA_W x AREA_H while preserving aspect ratio
  const scale = Math.min(AREA_W / shape.viewWidth, AREA_H / shape.viewHeight)
  const scaledW = shape.viewWidth * scale
  const scaledH = shape.viewHeight * scale
  const offsetX = (AREA_W - scaledW) / 2
  const offsetY = (AREA_H - scaledH) / 2

  const scaled = shape.dots.map(([x, y]): [number, number] => [
    offsetX + x * scale,
    offsetY + y * scale,
  ])

  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.teal }]} />
      <View style={{ position: 'absolute', top: 28, right: 28 }}>
        <MascotSvg size={58} />
      </View>
      <Text style={[styles.h1, { color: colors.teal }]}>Connect the Dots!</Text>
      <Text style={s.subtitle}>
        Connect the dots from 1 to {shape.dots.length} to reveal a hidden picture from {destinationDisplayName}!
      </Text>
      <Text style={s.instructions}>
        Start at dot 1 and draw a line to dot 2, then 3, and so on. Connect the last dot back to dot 1!
      </Text>

      <View style={[s.dotsArea, { width: AREA_W, height: AREA_H }]}>
        {scaled.map(([x, y], i) => {
          // Place number to the right, but nudge left if near right edge
          const numLeft = x + DOT_R + 2 > AREA_W - 20 ? x - 16 : x + DOT_R + 2
          const numTop = y - DOT_R
          return (
            <View key={i}>
              <View style={[s.dot, { left: x - DOT_R, top: y - DOT_R }]} />
              <Text style={[s.dotNumber, { left: numLeft, top: numTop }]}>{i + 1}</Text>
            </View>
          )
        })}
      </View>

      <View style={s.answerBox}>
        <Text style={s.answerLabel}>What did you draw?</Text>
        <View style={s.answerLine} />
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
