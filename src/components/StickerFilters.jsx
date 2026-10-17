// SVG filters that give any transparent image a die-cut sticker look:
// a white border that hugs the drawing's shape, plus a soft drop shadow.
// Use with className="sticker-lg" / "sticker-sm" (see styles.css).
const sizes = { lg: { border: 9, shadow: 7 }, sm: { border: 3, shadow: 3 } }

export default function StickerFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {Object.entries(sizes).map(([name, { border, shadow }]) => (
          <filter key={name} id={`sticker-${name}`} x="-15%" y="-15%" width="130%" height="130%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={border} result="grown" />
            {/* round off the blocky corners morphology leaves behind */}
            <feGaussianBlur in="grown" stdDeviation={border / 3} result="soft" />
            <feComponentTransfer in="soft" result="outline">
              <feFuncA type="linear" slope="6" intercept="-2" />
            </feComponentTransfer>
            <feFlood floodColor="#fffaf0" />
            <feComposite in2="outline" operator="in" result="border" />
            <feGaussianBlur in="outline" stdDeviation={shadow} result="blur" />
            <feOffset dy={shadow} result="drop" />
            <feFlood floodColor="#000" floodOpacity="0.45" />
            <feComposite in2="drop" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="border" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>
    </svg>
  )
}
