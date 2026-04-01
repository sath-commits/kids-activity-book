export interface DotShape {
  label: string
  dots: [number, number][]
  viewWidth: number
  viewHeight: number
}

// Pine tree - 19 points
const PINE_TREE: DotShape = {
  label: 'A Pine Tree!',
  viewWidth: 380,
  viewHeight: 400,
  dots: [
    [190, 25],
    [230, 90],
    [215, 90],
    [258, 158],
    [238, 158],
    [282, 225],
    [255, 225],
    [308, 295],
    [255, 295],
    [255, 375],
    [125, 375],
    [125, 295],
    [72, 295],
    [125, 225],
    [98, 225],
    [142, 158],
    [122, 158],
    [165, 90],
    [150, 90],
  ],
}

// Whale - 22 points
const WHALE: DotShape = {
  label: 'A Whale!',
  viewWidth: 460,
  viewHeight: 310,
  dots: [
    [35, 185],
    [18, 148],
    [58, 158],
    [95, 135],
    [148, 115],
    [205, 105],
    [260, 108],
    [292, 72],
    [325, 108],
    [375, 125],
    [415, 150],
    [435, 182],
    [418, 215],
    [385, 230],
    [335, 245],
    [275, 252],
    [215, 252],
    [158, 245],
    [105, 230],
    [62, 212],
    [28, 228],
    [35, 200],
  ],
}

// Fish/Salmon - 18 points
const FISH: DotShape = {
  label: 'A Fish!',
  viewWidth: 430,
  viewHeight: 290,
  dots: [
    [55, 120],
    [30, 85],
    [78, 143],
    [130, 115],
    [195, 95],
    [262, 88],
    [318, 94],
    [340, 68],
    [375, 100],
    [408, 132],
    [418, 155],
    [402, 178],
    [375, 193],
    [322, 208],
    [252, 218],
    [182, 212],
    [108, 198],
    [55, 172],
  ],
}

// Mountain peak - 20 points
const MOUNTAIN: DotShape = {
  label: 'A Mountain!',
  viewWidth: 420,
  viewHeight: 360,
  dots: [
    [210, 20],
    [255, 90],
    [240, 90],
    [290, 165],
    [270, 165],
    [185, 55],
    [160, 95],
    [175, 95],
    [120, 175],
    [140, 175],
    [75, 255],
    [75, 295],
    [345, 295],
    [345, 255],
    [300, 175],
    [320, 175],
    [265, 95],
    [280, 95],
    [255, 55],
    [232, 90],
  ],
}

// Rocket - 20 points
const ROCKET: DotShape = {
  label: 'A Rocket!',
  viewWidth: 240,
  viewHeight: 380,
  dots: [
    [120, 10],
    [155, 68],
    [160, 128],
    [165, 200],
    [160, 268],
    [188, 292],
    [205, 345],
    [178, 358],
    [160, 346],
    [148, 368],
    [120, 372],
    [92, 368],
    [80, 346],
    [62, 358],
    [35, 345],
    [52, 292],
    [75, 268],
    [80, 200],
    [82, 128],
    [85, 68],
  ],
}

// Butterfly - 24 points
const BUTTERFLY: DotShape = {
  label: 'A Butterfly!',
  viewWidth: 420,
  viewHeight: 320,
  dots: [
    [210, 55],
    [235, 70],
    [272, 44],
    [330, 18],
    [395, 52],
    [402, 122],
    [362, 152],
    [390, 182],
    [406, 235],
    [376, 285],
    [316, 300],
    [256, 260],
    [210, 272],
    [164, 260],
    [104, 300],
    [44, 285],
    [14, 235],
    [30, 182],
    [58, 152],
    [18, 122],
    [25, 52],
    [90, 18],
    [148, 44],
    [185, 70],
  ],
}

// Star - 10 points (classic 5-pointed star)
const STAR: DotShape = {
  label: 'A Star!',
  viewWidth: 300,
  viewHeight: 285,
  dots: [
    [150, 13],
    [197, 90],
    [271, 100],
    [216, 173],
    [228, 243],
    [150, 213],
    [72, 243],
    [84, 173],
    [29, 100],
    [103, 90],
  ],
}

// Sailboat - 12 points
const SAILBOAT: DotShape = {
  label: 'A Sailboat!',
  viewWidth: 360,
  viewHeight: 310,
  dots: [
    [185, 15],
    [300, 195],
    [300, 208],
    [318, 238],
    [305, 265],
    [265, 285],
    [185, 295],
    [105, 285],
    [65, 265],
    [52, 238],
    [70, 208],
    [75, 195],
  ],
}

// Castle - 19 points
const CASTLE: DotShape = {
  label: 'A Castle!',
  viewWidth: 400,
  viewHeight: 340,
  dots: [
    [30, 310],
    [30, 80],
    [110, 80],
    [110, 175],
    [150, 175],
    [150, 40],
    [250, 40],
    [250, 175],
    [290, 175],
    [290, 80],
    [370, 80],
    [370, 310],
    [285, 310],
    [285, 240],
    [230, 240],
    [200, 258],
    [170, 240],
    [115, 240],
    [115, 310],
  ],
}

// Dinosaur (T-rex silhouette) - 22 points
const DINOSAUR: DotShape = {
  label: 'A T-Rex!',
  viewWidth: 400,
  viewHeight: 360,
  dots: [
    [375, 88],
    [370, 60],
    [344, 46],
    [306, 52],
    [286, 78],
    [252, 98],
    [148, 118],
    [66, 145],
    [18, 142],
    [22, 160],
    [78, 163],
    [150, 183],
    [162, 262],
    [168, 332],
    [198, 342],
    [210, 332],
    [218, 270],
    [234, 268],
    [248, 308],
    [268, 338],
    [286, 282],
    [364, 190],
  ],
}

export function selectShape(destination: string): DotShape {
  const d = destination.toLowerCase()
  if (/dinosaur|jurassic|fossil|prehistoric|museum/.test(d)) return DINOSAUR
  if (/castle|fort|fortress|palace|citadel|historic/.test(d)) return CASTLE
  if (/space|rocket|nasa|cape canaveral|kennedy/.test(d)) return ROCKET
  if (/butterfly|garden|meadow|botanical|wildflower/.test(d)) return BUTTERFLY
  if (/harbor|port|marina|sailing|yacht|cove/.test(d)) return SAILBOAT
  if (/city|york|angeles|vegas|chicago|paris|london|tokyo|star/.test(d)) return STAR
  if (/ocean|sea|coast|coastal|marine|pacific|atlantic|gulf|bay/.test(d)) return WHALE
  if (/lake|river|salmon|creek|stream|sound|fjord/.test(d)) return FISH
  if (/mountain|peak|ridge|volcano|summit|alpine/.test(d)) return MOUNTAIN
  return PINE_TREE
}
