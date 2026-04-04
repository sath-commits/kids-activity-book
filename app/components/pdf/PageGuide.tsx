import { View, Text, StyleSheet } from '@react-pdf/renderer'
import MascotWithBubble from './MascotWithBubble'

interface PageGuideProps {
  message: string
  side?: 'left' | 'right'
  accentColor?: string
}

const s = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    paddingRight: 10,
  },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: 10,
    lineHeight: 1.45,
    color: '#1f2937',
    maxWidth: 260,
  },
})

export default function PageGuide({
  message,
  side = 'right',
  accentColor = '#52b788',
}: PageGuideProps) {
  const bubbleSide = side === 'left' ? 'right' : 'left'

  return (
    <View style={s.wrap}>
      <View style={[s.card, { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}>
        {side === 'left' && (
          <MascotWithBubble message={message} size={48} bubbleSide={bubbleSide} maxBubbleWidth={110} />
        )}
        <View style={s.textBlock}>
          <Text style={[s.kicker, { color: accentColor }]}>Explorer Tip</Text>
          <Text style={s.hint}>{message.replace(/\n/g, ' ')}</Text>
        </View>
        {side === 'right' && (
          <MascotWithBubble message={message} size={48} bubbleSide={bubbleSide} maxBubbleWidth={110} />
        )}
      </View>
    </View>
  )
}
