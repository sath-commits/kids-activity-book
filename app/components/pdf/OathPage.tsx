import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'

const s = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  oathBox: {
    borderWidth: 3,
    borderColor: colors.accent,
    borderRadius: 12,
    padding: 30,
    marginTop: 20,
  },
  oathTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  oathItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  oathText: {
    fontSize: 13,
    lineHeight: 1.4,
    flex: 1,
  },
  signatureSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signatureLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.text,
    marginTop: 24,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  intro: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.muted,
    marginBottom: 8,
    lineHeight: 1.5,
  },
})

const oathItems = [
  'Respect nature and all living things',
  'Stay on marked trails and paths',
  'Never feed wild animals',
  'Leave no trash behind — pack it in, pack it out',
  'Protect plants — look but don\'t pick',
  'Be brave, curious, and kind',
  'Listen carefully and ask good questions',
]

export default function OathPage() {
  return (
    <Page size="A4" style={styles.page}>
      <View style={s.content}>
        <Text style={[styles.h1, { textAlign: 'center' }]}>Junior Explorer Oath</Text>
        <Text style={s.intro}>Before your adventure begins, make your promise as a Junior Explorer:</Text>

        <View style={s.oathBox}>
          <Text style={s.oathTitle}>I Promise To...</Text>

          {oathItems.map((item) => (
            <View key={item} style={s.oathItem}>
              <View style={s.checkbox} />
              <Text style={s.oathText}>{item}</Text>
            </View>
          ))}

          <View style={s.signatureSection}>
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
              Junior Explorer Signature:
            </Text>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Sign your name here</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page 2</Text>
      </View>
    </Page>
  )
}
