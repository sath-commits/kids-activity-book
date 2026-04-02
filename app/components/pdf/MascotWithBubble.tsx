'use client'

import { View, Text, StyleSheet, Svg, Polygon, Line } from '@react-pdf/renderer'
import MascotSvg from './MascotSvg'

interface MascotWithBubbleProps {
  message: string
  size?: number
  /** 'left' = bubble left of mascot (use when mascot is on right side of page)
   *  'right' = bubble right of mascot (use when mascot is on left side of page) */
  bubbleSide?: 'left' | 'right'
  maxBubbleWidth?: number
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: '#fffde7',
    borderWidth: 1.5,
    borderColor: '#e8a020',
    borderRadius: 8,
    padding: 7,
  },
  bubbleText: {
    fontSize: 7.5,
    fontFamily: 'Nunito-Bold',
    color: '#333',
    lineHeight: 1.4,
    textAlign: 'center',
  },
})

export default function MascotWithBubble({
  message,
  size = 58,
  bubbleSide = 'left',
  maxBubbleWidth = 115,
}: MascotWithBubbleProps) {
  return (
    <View style={s.container}>
      {bubbleSide === 'left' && (
        <>
          <View style={[s.bubble, { maxWidth: maxBubbleWidth, marginRight: -1 }]}>
            <Text style={s.bubbleText}>{message}</Text>
          </View>
          {/* Tail pointing right toward mascot */}
          <Svg width={9} height={18} viewBox="0 0 9 18">
            <Polygon points="0,0 9,9 0,18" fill="#fffde7" />
            <Line x1="0" y1="0" x2="9" y2="9" stroke="#e8a020" strokeWidth="1.5" />
            <Line x1="9" y1="9" x2="0" y2="18" stroke="#e8a020" strokeWidth="1.5" />
          </Svg>
        </>
      )}
      <MascotSvg size={size} />
      {bubbleSide === 'right' && (
        <>
          {/* Tail pointing left toward mascot */}
          <Svg width={9} height={18} viewBox="0 0 9 18">
            <Polygon points="9,0 0,9 9,18" fill="#fffde7" />
            <Line x1="9" y1="0" x2="0" y2="9" stroke="#e8a020" strokeWidth="1.5" />
            <Line x1="0" y1="9" x2="9" y2="18" stroke="#e8a020" strokeWidth="1.5" />
          </Svg>
          <View style={[s.bubble, { maxWidth: maxBubbleWidth, marginLeft: -1 }]}>
            <Text style={s.bubbleText}>{message}</Text>
          </View>
        </>
      )}
    </View>
  )
}
