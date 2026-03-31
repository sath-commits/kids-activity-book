import { Page, View, Text, Image } from '@react-pdf/renderer'
import { SectionContent } from '@/lib/types'

interface SectionColoringPageProps {
  section: SectionContent
  imageB64: string | null
  pageNumber: number
}

export default function SectionColoringPage({ section, imageB64, pageNumber }: SectionColoringPageProps) {
  return (
    <Page size="A4" style={{ backgroundColor: '#fff', padding: 0 }}>
      {imageB64 ? (
        <Image src={`data:image/png;base64,${imageB64}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <View style={{ flex: 1, margin: 30, borderWidth: 2, borderColor: '#ccc', borderRadius: 8, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 18, color: '#2d6a4f', textAlign: 'center', marginBottom: 8 }}>{section.title}</Text>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Draw what you see here!</Text>
        </View>
      )}
    </Page>
  )
}
