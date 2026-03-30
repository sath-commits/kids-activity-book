import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { SectionContent, ChildPersonalization } from '@/lib/types'
import { colors, styles } from './pdfStyles'

interface SectionActivityPageProps {
  section: SectionContent
  childPersonalization: ChildPersonalization
  pageNumber: number
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 3,
    borderBottomColor: colors.accent,
  },
  emojiLarge: {
    fontSize: 28,
    marginRight: 10,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: colors.primary,
    flex: 1,
  },
  didYouKnow: {
    backgroundColor: colors.light,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  didYouKnowLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    color: colors.primary,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyText: {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: colors.text,
  },
  funFactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  funFactStar: {
    fontSize: 11,
    marginRight: 5,
    color: '#f9c922',
  },
  funFactText: {
    fontSize: 10,
    color: '#555',
    fontStyle: 'italic',
    flex: 1,
  },
  sectionLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  checkBox: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 2,
    marginRight: 7,
    marginTop: 1.5,
    flexShrink: 0,
  },
  checkText: {
    fontSize: 10.5,
    flex: 1,
    lineHeight: 1.4,
  },
  challengeBox: {
    backgroundColor: '#fff9c4',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f9c922',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  carBox: {
    backgroundColor: '#e8f4fd',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#90caf9',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thinkBox: {
    backgroundColor: '#f3e8ff',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#c084fc',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  riddleBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#fb923c',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  personBox: {
    backgroundColor: '#fff0f3',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ffb3c1',
  },
  boxIcon: {
    fontSize: 13,
    marginRight: 7,
    marginTop: 0,
  },
  boxText: {
    fontSize: 10.5,
    flex: 1,
    lineHeight: 1.4,
  },
  boxLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 9.5,
    marginBottom: 2,
  },
  drawingBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 8,
    padding: 8,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawingPrompt: {
    fontSize: 9.5,
    color: colors.muted,
    textAlign: 'center',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
})

export default function SectionActivityPage({ section, childPersonalization, pageNumber }: SectionActivityPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.emojiLarge}>{section.emoji}</Text>
        <Text style={s.sectionTitle}>{section.title}</Text>
      </View>

      {/* Did You Know */}
      <View style={s.didYouKnow}>
        <Text style={s.didYouKnowLabel}>📚 Did You Know?</Text>
        <Text style={s.historyText}>{section.historyBlurb}</Text>
        <View style={s.funFactRow}>
          <Text style={s.funFactStar}>⭐</Text>
          <Text style={s.funFactText}>Fun fact: {section.funFact}</Text>
        </View>
      </View>

      <View style={s.twoCol}>
        {/* Left column */}
        <View style={s.col}>
          <Text style={s.sectionLabel}>👀 What Do You See?</Text>
          {section.whatDoYouSee.map((item, i) => (
            <View key={i} style={s.checkRow}>
              <View style={s.checkBox} />
              <Text style={s.checkText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Right column */}
        <View style={s.col}>
          <Text style={s.sectionLabel}>🔍 Find These!</Text>
          {section.findThese.map((item, i) => (
            <View key={i} style={s.checkRow}>
              <View style={s.checkBox} />
              <Text style={s.checkText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Challenge */}
      <View style={s.challengeBox}>
        <Text style={s.boxIcon}>⭐</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.boxLabel, { color: '#b45309' }]}>Explorer Challenge</Text>
          <Text style={s.boxText}>{section.challenge}</Text>
        </View>
      </View>

      {/* Car challenge */}
      {section.carChallenge && (
        <View style={s.carBox}>
          <Text style={s.boxIcon}>🚗</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.boxLabel, { color: '#1565c0' }]}>Car Challenge</Text>
            <Text style={s.boxText}>{section.carChallenge}</Text>
          </View>
        </View>
      )}

      {/* Think question */}
      <View style={s.thinkBox}>
        <Text style={s.boxIcon}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.boxLabel, { color: '#7b2d8b' }]}>Think About It</Text>
          <Text style={s.boxText}>{section.thinkQuestion}</Text>
        </View>
      </View>

      {/* Riddle */}
      {section.riddle && (
        <View style={s.riddleBox}>
          <Text style={s.boxIcon}>🧩</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.boxLabel, { color: '#c2410c' }]}>Riddle Time!</Text>
            <Text style={s.boxText}>{section.riddle}</Text>
            <Text style={[s.boxText, { color: '#9a3412', fontSize: 9, marginTop: 3 }]}>
              (Answer in the answer key at the back!)
            </Text>
          </View>
        </View>
      )}

      {/* Personalization */}
      {childPersonalization.personalizedChallengeNote && (
        <View style={s.personBox}>
          <Text style={[s.boxLabel, { color: '#c2185b' }]}>
            🌟 Special Challenge for {childPersonalization.name}!
          </Text>
          <Text style={[s.boxText, { color: '#333' }]}>{childPersonalization.personalizedChallengeNote}</Text>
        </View>
      )}

      {/* Drawing box */}
      <View style={s.drawingBox}>
        <Text style={s.drawingPrompt}>✏️ Draw it!</Text>
        <Text style={s.drawingPrompt}>{childPersonalization.personalizedDrawingPrompt || 'Draw something amazing you saw here!'}</Text>
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
