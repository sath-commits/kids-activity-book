import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { SectionContent } from '@/lib/types'
import { colors, styles } from './pdfStyles'

interface SectionColoringPageProps {
  section: SectionContent
  imageB64: string | null
  pageNumber: number
}

const s = StyleSheet.create({
  coloringPage: {
    backgroundColor: colors.pageBackground,
    fontFamily: 'Nunito',
    padding: 24,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
  },
  emoji: {
    fontSize: 20,
  },
  imageContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
})

export default function SectionColoringPage({ section, imageB64, pageNumber }: SectionColoringPageProps) {
  return (
    <Page size="A4" style={s.coloringPage}>
      <View style={s.header}>
        <Text style={s.emoji}>{section.emoji}</Text>
        <Text style={s.title}>{section.title}</Text>
      </View>

      {imageB64 ? (
        <View style={s.imageContainer}>
          <Image
            style={s.image}
            src={`data:image/png;base64,${imageB64}`}
          />
        </View>
      ) : (
        <View style={s.placeholder}>
          <Text style={s.placeholderText}>✏️</Text>
          <Text style={s.placeholderText}>Draw your own picture{'\n'}of {section.title} here!</Text>
        </View>
      )}

      <Text style={s.label}>🎨 Color me in!</Text>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
