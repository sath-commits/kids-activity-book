'use client'

import { Svg, Circle, Path, Rect, Ellipse } from '@react-pdf/renderer'

interface MascotSvgProps {
  /** Height of the rendered SVG (width scales proportionally) */
  size?: number
}

/**
 * Zuri — the Little Explorer mascot.
 * A round honey-bear cub wearing an adventure hat.
 * Completely original design, renders as PDF SVG primitives.
 */
export default function MascotSvg({ size = 70 }: MascotSvgProps) {
  // viewBox is 100 × 110
  const w = Math.round(size * (100 / 110))
  const h = size
  return (
    <Svg width={w} height={h} viewBox="0 0 100 110">
      {/* ── Body ── */}
      <Ellipse cx="50" cy="94" rx="21" ry="15" fill="#F4A832" />

      {/* ── Ears (drawn before head so head overlaps the inner ear) ── */}
      <Circle cx="20" cy="54" r="13" fill="#F4A832" />
      <Circle cx="80" cy="54" r="13" fill="#F4A832" />
      <Circle cx="20" cy="54" r="8" fill="#E8856E" />
      <Circle cx="80" cy="54" r="8" fill="#E8856E" />

      {/* ── Head ── */}
      <Circle cx="50" cy="57" r="27" fill="#F4A832" />

      {/* ── Hat ── */}
      {/* Crown */}
      <Rect x="28" y="12" width="44" height="24" rx="5" fill="#2d6a4f" />
      {/* Band */}
      <Rect x="28" y="32" width="44" height="5" fill="#52b788" />
      {/* Brim (wider than crown) */}
      <Rect x="15" y="35" width="70" height="7" rx="3" fill="#1a3a17" />

      {/* ── Eyes ── */}
      <Circle cx="38" cy="56" r="8" fill="white" />
      <Circle cx="62" cy="56" r="8" fill="white" />
      <Circle cx="39" cy="56" r="5" fill="#1b1b1b" />
      <Circle cx="63" cy="56" r="5" fill="#1b1b1b" />
      {/* Highlights */}
      <Circle cx="41" cy="54" r="2" fill="white" />
      <Circle cx="65" cy="54" r="2" fill="white" />

      {/* ── Nose ── */}
      <Ellipse cx="50" cy="67" rx="5" ry="3.5" fill="#7B3F00" />

      {/* ── Smile ── */}
      <Path d="M44,73 Q50,80 56,73" stroke="#7B3F00" strokeWidth="2" fill="none" />

      {/* ── Rosy cheeks ── */}
      <Circle cx="31" cy="66" r="6" fill="#FFB7B2" />
      <Circle cx="69" cy="66" r="6" fill="#FFB7B2" />
    </Svg>
  )
}
