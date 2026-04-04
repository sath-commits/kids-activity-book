import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { SectionContent } from '@/lib/types'
import { colors, styles } from './pdfStyles'

const s = StyleSheet.create({
  intro: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  artFrame: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#d9d9d9',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  artImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  fallback: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fallbackTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  fallbackBody: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 1.5,
  },
})

interface SectionColoringPageProps {
  section: SectionContent
  imageUrl: string | null
  pageNumber: number
}

export default function SectionColoringPage({ section, imageUrl, pageNumber }: SectionColoringPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h1}>{section.title}</Text>
      <Text style={s.intro}>Color this scene from {section.title}. Add your own crayons, pencils, or markers!</Text>

      <View style={s.artFrame}>
        {imageUrl ? (
          <Image src={imageUrl} style={s.artImage} />
        ) : (
          <View style={s.fallback}>
            <Text style={s.fallbackTitle}>{section.title}</Text>
            <Text style={s.fallbackBody}>Color this page! If the artwork is missing, this space is still yours to draw in.</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
