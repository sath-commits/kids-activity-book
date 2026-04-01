import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import MascotSvg from './MascotSvg'

interface ScavengerHuntPageProps {
  items: string[]
  destinationDisplayName: string
  pageNumber: number
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  item: {
    width: '50%',
    paddingRight: 10,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 2,
    flexShrink: 0,
  },
  sketchBox: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    borderStyle: 'dashed',
    marginLeft: 4,
    flexShrink: 0,
  },
  itemLabel: {
    fontSize: 10.5,
    flex: 1,
    lineHeight: 1.4,
    paddingTop: 1,
  },
  intro: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 4,
  },
})

export default function ScavengerHuntPage({ items, destinationDisplayName, pageNumber }: ScavengerHuntPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.teal }]} />
      <View style={{ position: 'absolute', top: 28, right: 28 }}>
        <MascotSvg size={58} />
      </View>
      <Text style={[styles.h1, { color: colors.teal }]}>Scavenger Hunt</Text>
      <Text style={s.intro}>
        Can you find all of these at {destinationDisplayName}? Check the box and sketch what you found!
      </Text>

      <View style={s.grid}>
        {items.slice(0, 12).map((item, i) => (
          <View key={i} style={s.item}>
            <View style={s.itemRow}>
              <View style={s.checkbox} />
              <Text style={s.itemLabel}>{item}</Text>
              <View style={s.sketchBox} />
            </View>
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
