import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { SectionContent } from '@/lib/types'

const s = StyleSheet.create({
  pageNum: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    fontSize: 7,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Nunito',
  },
})

interface SectionColoringPageProps {
  section: SectionContent
  imageUrl: string | null
  pageNumber: number
}

export default function SectionColoringPage({ section, imageUrl, pageNumber }: SectionColoringPageProps) {
  return (
    <Page size="A4" style={{ backgroundColor: '#fff', padding: 0 }}>
      {/* Fallback always visible — covered by the image if it loads successfully */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 30, borderWidth: 2, borderColor: '#ccc', borderRadius: 8, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 18, color: '#2d6a4f', textAlign: 'center', marginBottom: 8 }}>{section.title}</Text>
        <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Color this page!</Text>
      </View>
      {/* Image sits on top — if it fails to load, fallback above remains visible */}
      {imageUrl && (
        <Image src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <Text style={s.pageNum}>Page {pageNumber}</Text>
    </Page>
  )
}
