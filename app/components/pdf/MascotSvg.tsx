'use client'

import { Svg, Circle, Path, Rect, Ellipse } from '@react-pdf/renderer'

interface MascotSvgProps {
  /** Height of the rendered SVG (width scales proportionally) */
  size?: number
}

/**
 * Moss — the Little Explorer mascot.
 * An original woodland scout with a floppy ranger hat and satchel.
 */
export default function MascotSvg({ size = 70 }: MascotSvgProps) {
  // viewBox is 100 × 110
  const w = Math.round(size * (100 / 110))
  const h = size
  return (
    <Svg width={w} height={h} viewBox="0 0 100 110">
      <Ellipse cx="72" cy="92" rx="13" ry="8" fill="#d86d4b" transform="rotate(25 72 92)" />
      <Ellipse cx="70" cy="92" rx="8" ry="4" fill="#f7d59f" transform="rotate(25 70 92)" />

      <Ellipse cx="48" cy="91" rx="22" ry="15" fill="#d97745" />
      <Ellipse cx="47" cy="94" rx="10" ry="6" fill="#f7d59f" />

      <Path d="M26 46 L35 28 L43 49 Z" fill="#d97745" />
      <Path d="M57 49 L65 28 L74 46 Z" fill="#d97745" />
      <Path d="M30 45 L35 34 L40 46 Z" fill="#f7b6b2" />
      <Path d="M60 46 L65 34 L70 45 Z" fill="#f7b6b2" />

      <Circle cx="49" cy="53" r="24" fill="#d97745" />
      <Ellipse cx="49" cy="63" rx="15" ry="12" fill="#f7d59f" />

      <Path d="M28 26 C30 15 41 12 50 14 C60 12 71 16 73 27 L73 34 L28 34 Z" fill="#436850" />
      <Rect x="28" y="31" width="45" height="6" rx="3" fill="#f0b44d" />
      <Ellipse cx="50" cy="36" rx="35" ry="7" fill="#2c4b3a" />
      <Path d="M56 16 C60 12 67 13 70 18 C65 18 61 20 58 24 Z" fill="#67b67a" />

      <Circle cx="40" cy="55" r="7.5" fill="white" />
      <Circle cx="59" cy="55" r="7.5" fill="white" />
      <Circle cx="41" cy="56" r="4.6" fill="#1b1b1b" />
      <Circle cx="58" cy="56" r="4.6" fill="#1b1b1b" />
      <Circle cx="43" cy="54" r="1.8" fill="white" />
      <Circle cx="60" cy="54" r="1.8" fill="white" />

      <Ellipse cx="49" cy="64" rx="4.7" ry="3.4" fill="#5b3219" />
      <Path d="M43 69 C46 74 52 74 55 69" stroke="#5b3219" strokeWidth="2" fill="none" />
      <Path d="M48 67 L48 71" stroke="#5b3219" strokeWidth="1.5" />
      <Path d="M51 67 L51 71" stroke="#5b3219" strokeWidth="1.5" />

      <Circle cx="31" cy="64" r="4.8" fill="#f4a6a1" />
      <Circle cx="67" cy="64" r="4.8" fill="#f4a6a1" />

      <Path d="M28 79 C38 73 59 73 68 79 L65 92 C56 96 40 96 31 91 Z" fill="#6da574" />
      <Path d="M31 79 C35 84 43 87 49 87 C56 87 62 84 66 79" stroke="#355843" strokeWidth="2" fill="none" />
      <Circle cx="35" cy="84" r="4" fill="#d97745" />
      <Circle cx="63" cy="84" r="4" fill="#d97745" />

      <Path d="M24 78 C18 80 16 87 20 91 C24 94 31 91 31 85 Z" fill="#d97745" />
      <Path d="M64 83 C71 78 80 81 80 89 C79 95 72 96 66 92 Z" fill="#d97745" />

      <Rect x="58" y="79" width="12" height="16" rx="3" fill="#8b5a3c" />
      <Path d="M58 81 C62 78 67 78 70 81" stroke="#f4d6a0" strokeWidth="1.5" fill="none" />
      <Circle cx="64" cy="87" r="1.8" fill="#f4d6a0" />
    </Svg>
  )
}
