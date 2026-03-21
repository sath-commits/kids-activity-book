import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { ChildPersonalization } from '@/lib/types'
import { colors, styles } from './pdfStyles'

interface CertificatePageProps {
  child: ChildPersonalization
  destinationDisplayName: string
  pageNumber: number
}

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.pageBackground,
    fontFamily: 'Nunito',
    padding: 36,
    justifyContent: 'center',
  },
  outer: {
    borderWidth: 4,
    borderColor: colors.accent,
    borderRadius: 16,
    padding: 30,
  },
  inner: {
    borderWidth: 1.5,
    borderColor: colors.light,
    borderRadius: 10,
    padding: 24,
  },
  badge: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeEmoji: {
    fontSize: 30,
  },
  certTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  certBody: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 1.5,
  },
  childName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
    color: colors.primary,
    textAlign: 'center',
    marginVertical: 10,
  },
  destination: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  congrats: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 10,
    color: colors.muted,
    width: 140,
    flexShrink: 0,
  },
  fieldLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
    marginBottom: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.light,
    marginVertical: 16,
  },
  footer: {
    fontSize: 9,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 16,
  },
})

const pronouns = (gender: string) => {
  if (gender === 'girl') return { they: 'She', their: 'her' }
  if (gender === 'boy') return { they: 'He', their: 'his' }
  return { they: 'They', their: 'their' }
}

export default function CertificatePage({ child, destinationDisplayName, pageNumber }: CertificatePageProps) {
  const { they, their } = pronouns(child.gender)

  return (
    <Page size="A4" style={s.page}>
      <View style={s.outer}>
        <View style={s.inner}>
          <View style={s.badge}>
            <View style={s.badgeCircle}>
              <Text style={s.badgeEmoji}>🏆</Text>
            </View>
            <Text style={s.certTitle}>Certificate of Completion</Text>
          </View>

          <Text style={s.certBody}>This certifies that</Text>
          <Text style={s.childName}>{child.name}</Text>
          <Text style={s.certBody}>has completed the</Text>
          <Text style={s.destination}>{destinationDisplayName}{'\n'}Junior Explorer Adventure</Text>

          <Text style={s.congrats}>
            {they} explored with curiosity, courage, and an open heart. {their.charAt(0).toUpperCase() + their.slice(1)} love of nature and adventure will stay with {their} always!
          </Text>

          <View style={s.divider} />

          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Total places visited:</Text>
            <View style={s.fieldLine} />
          </View>
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Favorite place:</Text>
            <View style={s.fieldLine} />
          </View>
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Best memory:</Text>
            <View style={s.fieldLine} />
          </View>
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Parent signature:</Text>
            <View style={s.fieldLine} />
          </View>
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Date:</Text>
            <View style={s.fieldLine} />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
