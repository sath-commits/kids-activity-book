/**
 * Zuri — the Little Explorer mascot (web/HTML SVG version).
 * Same visual design as the PDF version but using standard HTML SVG.
 */
interface MascotSvgProps {
  size?: number
  className?: string
}

export default function MascotSvg({ size = 80, className }: MascotSvgProps) {
  const w = Math.round(size * (100 / 110))
  const h = size
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body */}
      <ellipse cx="50" cy="94" rx="21" ry="15" fill="#F4A832" />

      {/* Ears */}
      <circle cx="20" cy="54" r="13" fill="#F4A832" />
      <circle cx="80" cy="54" r="13" fill="#F4A832" />
      <circle cx="20" cy="54" r="8" fill="#E8856E" />
      <circle cx="80" cy="54" r="8" fill="#E8856E" />

      {/* Head */}
      <circle cx="50" cy="57" r="27" fill="#F4A832" />

      {/* Hat crown */}
      <rect x="28" y="12" width="44" height="24" rx="5" fill="#2d6a4f" />
      {/* Hat band */}
      <rect x="28" y="32" width="44" height="5" fill="#52b788" />
      {/* Hat brim */}
      <rect x="15" y="35" width="70" height="7" rx="3" fill="#1a3a17" />

      {/* Eyes */}
      <circle cx="38" cy="56" r="8" fill="white" />
      <circle cx="62" cy="56" r="8" fill="white" />
      <circle cx="39" cy="56" r="5" fill="#1b1b1b" />
      <circle cx="63" cy="56" r="5" fill="#1b1b1b" />
      {/* Highlights */}
      <circle cx="41" cy="54" r="2" fill="white" />
      <circle cx="65" cy="54" r="2" fill="white" />

      {/* Nose */}
      <ellipse cx="50" cy="67" rx="5" ry="3.5" fill="#7B3F00" />

      {/* Smile */}
      <path d="M44,73 Q50,80 56,73" stroke="#7B3F00" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Cheeks */}
      <circle cx="31" cy="66" r="6" fill="#FFB7B2" fillOpacity="0.8" />
      <circle cx="69" cy="66" r="6" fill="#FFB7B2" fillOpacity="0.8" />
    </svg>
  )
}
