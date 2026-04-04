import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import PageGuide from './PageGuide'

interface TopFivePageProps {
  topFiveLists: { title: string; items: string[] }[]
  destinationDisplayName: string
  pageNumber: number
}

const CARD_COLORS = [
  { bg: colors.lightOrange, border: colors.orange, header: colors.orange },
  { bg: colors.lightSky, border: colors.sky, header: colors.sky },
  { bg: colors.lightPurple, border: colors.purple, header: colors.purple },
]

const s = StyleSheet.create({
  subtitle: {
    fontSize: 10.5,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '31%',
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: 'white',
    textAlign: 'center',
  },
  cardBody: {
    padding: 8,
    backgroundColor: 'white',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemNumber: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    marginRight: 4,
    width: 16,
  },
  itemText: {
    fontSize: 10,
    color: colors.text,
    flex: 1,
    lineHeight: 1.4,
  },
  drawBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 4,
    height: 50,
    marginTop: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawLabel: {
    fontSize: 7.5,
    color: colors.muted,
  },
})

export default function TopFivePage({ topFiveLists, destinationDisplayName, pageNumber }: TopFivePageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.orange }]} />
      <PageGuide
        message={"Which one is your favorite? Draw it in the box below each list."}
        side="right"
        accentColor={colors.orange}
      />
      <Text style={[styles.h1, { color: colors.orange }]}>Top 5 Lists!</Text>
      <Text style={s.subtitle}>Amazing things about {destinationDisplayName}!</Text>

      <View style={s.cardsContainer}>
        {topFiveLists.map((list, li) => {
          const palette = CARD_COLORS[li % CARD_COLORS.length]
          return (
            <View key={li} style={[s.card, { borderColor: palette.border }]}>
              <View style={[s.cardHeader, { backgroundColor: palette.header }]}>
                <Text style={s.cardTitle}>{list.title}</Text>
              </View>
              <View style={s.cardBody}>
                {list.items.slice(0, 5).map((item, ii) => (
                  <View key={ii} style={s.listItem}>
                    <Text style={[s.itemNumber, { color: palette.header }]}>{ii + 1}.</Text>
                    <Text style={s.itemText}>{item}</Text>
                  </View>
                ))}
                <View style={s.drawBox}>
                  <Text style={s.drawLabel}>Draw your #1 pick!</Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>

      <View style={styles.footer}>
        <Text>Little Explorer · builtthisweekend.com</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
