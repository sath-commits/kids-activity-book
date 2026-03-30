import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'

interface MapPageProps {
  destinationDisplayName: string
  places: string[]
  mapImageB64: string
  pageNumber: number
}

const s = StyleSheet.create({
  mapImage: {
    width: '100%',
    borderRadius: 8,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 4,
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    flexShrink: 0,
  },
  pinNumber: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
  },
  placeName: {
    fontSize: 10,
    color: colors.text,
    flex: 1,
  },
})

export default function MapPage({ destinationDisplayName, places, mapImageB64, pageNumber }: MapPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h1}>🗺️ Your Adventure Map</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 12 }}>
        Here are all the amazing places you&apos;ll explore at {destinationDisplayName}!
      </Text>

      <Image
        style={s.mapImage}
        src={`data:image/png;base64,${mapImageB64}`}
      />

      <View style={s.legend}>
        {places.map((place, i) => (
          <View key={i} style={s.legendItem}>
            <View style={s.pin}>
              <Text style={s.pinNumber}>{i + 1}</Text>
            </View>
            <Text style={s.placeName}>{place}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
