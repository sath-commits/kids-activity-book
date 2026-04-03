import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, styles } from './pdfStyles'
import MascotWithBubble from './MascotWithBubble'

interface TravelMenuProps {
  menu: { category: string; items: { name: string; description: string; price: string }[] }[]
  destinationDisplayName: string
  pageNumber: number
}

const s = StyleSheet.create({
  subtitle: {
    fontSize: 10.5,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  categoryHeader: {
    backgroundColor: colors.lightOrange,
    padding: 6,
    borderRadius: 4,
    marginBottom: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  categoryTitle: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
    color: colors.orange,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5c9a0',
    borderStyle: 'dotted',
  },
  itemDetails: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  itemName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10.5,
    color: colors.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 10,
    color: colors.muted,
    marginLeft: 8,
  },
  itemDescription: {
    fontSize: 8.5,
    color: colors.muted,
    lineHeight: 1.4,
  },
  checkboxArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 2,
  },
  checkboxLabel: {
    fontSize: 7.5,
    color: colors.muted,
    marginRight: 3,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 2,
  },
})

export default function TravelMenuPage({ menu, destinationDisplayName, pageNumber }: TravelMenuProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={[styles.pageBand, { backgroundColor: colors.orange }]} />
      <View style={{ position: 'absolute', top: 22, left: 28 }}>
        <MascotWithBubble
          message={"Welcome to the\nfunny food place!\nWhat looks\ntasty to you?"}
          bubbleSide="right"
          size={55}
        />
      </View>

      <View style={{ marginTop: 60 }}>
        <Text style={[styles.h1, { color: colors.orange }]}>{destinationDisplayName} Explorer's Menu</Text>
        <Text style={s.subtitle}>Welcome to our imaginary restaurant! What would you order?</Text>

        {menu.map((section, si) => (
          <View key={si}>
            <View style={s.categoryHeader}>
              <Text style={s.categoryTitle}>{section.category}</Text>
            </View>
            {section.items.map((item, ii) => (
              <View key={ii} style={s.menuItem}>
                <View style={s.itemDetails}>
                  <View style={s.itemNameRow}>
                    <Text style={s.itemName}>{item.name}</Text>
                    <Text style={s.itemPrice}>{item.price}</Text>
                  </View>
                  <Text style={s.itemDescription}>{item.description}</Text>
                </View>
                <View style={s.checkboxArea}>
                  <Text style={s.checkboxLabel}>Try it?</Text>
                  <View style={s.checkbox} />
                </View>
              </View>
            ))}
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
