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
      {imageUrl ? (
        <Image src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <View style={{ flex: 1, margin: 30, borderWidth: 2, borderColor: '#ccc', borderRadius: 8, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 18, color: '#2d6a4f', textAlign: 'center', marginBottom: 8 }}>{section.title}</Text>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Draw what you see here!</Text>
        </View>
      )}
      <Text style={s.pageNum}>Page {pageNumber}</Text>
    </Page>
  )
}
