import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const HOP_LENGTH = 90 // px of trail per hop
const HOP_HEIGHT = 30
const NARROW = 760 // below this everything runs down the left gutter

// A pencil trail that weaves down the page margins past every <section data-stop>,
// and a bunny that hops along it, staying level with the reader.
export default function BunnyTrail({ reducedMotion }) {
  // the trail lives inside the element whose sections it weaves through
  const rootRef = useRef(null)
  const pathRef = useRef(null)
  const maskRef = useRef(null)
  const bunnyRef = useRef(null)
  const [geo, setGeo] = useState({ w: 0, h: 0, d: '', stops: [] })

  // Rebuild the path whenever the layout changes size
  useLayoutEffect(() => {
    const zone = rootRef.current.parentElement
    const build = () => setGeo(buildTrail(zone))
    const ro = new ResizeObserver(build)
    ro.observe(zone)
    document.fonts?.ready.then(build)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const path = pathRef.current
    const bunny = bunnyRef.current
    if (!geo.d || !path) return
    const zone = rootRef.current.parentElement

    const total = path.getTotalLength()
    // y → length lookup, so the bunny can be placed at "wherever the reader is"
    const step = 4
    const ys = []
    for (let l = 0; l <= total; l += step) ys.push(path.getPointAtLength(l).y)
    const lengthAtY = (y) => {
      let lo = 0
      let hi = ys.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (ys[mid] < y) lo = mid + 1
        else hi = mid
      }
      return Math.min(total, lo * step)
    }

    const size = bunny.offsetWidth
    // The bunny sits 60% down the viewport, sliding to the bottom over the last
    // screenful so it reaches the end of the trail when the page does.
    const readerY = () => {
      const maxScroll = document.documentElement.scrollHeight - innerHeight
      const nearEnd = Math.min(1, Math.max(0, (scrollY - (maxScroll - innerHeight)) / innerHeight))
      return innerHeight * (0.6 + 0.4 * nearEnd) - zone.getBoundingClientRect().top
    }
    let current = lengthAtY(readerY())
    let air = 0
    let facing = 1
    let lastX = path.getPointAtLength(current).x

    const tick = () => {
      const target = lengthAtY(readerY())
      const prev = current
      current += (target - current) * (reducedMotion ? 1 : 0.08)
      const speed = Math.abs(current - prev)
      air += (Math.min(1, speed / 2.5) - air) * 0.12

      const p = path.getPointAtLength(current)
      if (Math.abs(p.x - lastX) > 0.4) facing = p.x > lastX ? 1 : -1
      lastX = p.x

      const arc = Math.abs(Math.sin((Math.PI * current) / HOP_LENGTH))
      const hop = reducedMotion ? 0 : arc * HOP_HEIGHT * air
      // squash on landing, stretch mid-air
      const stretch = reducedMotion ? 1 : 1 + (arc - 0.5) * 0.16 * air
      bunny.style.transform =
        `translate(${p.x - size / 2}px, ${p.y - size / 2 - hop}px) ` +
        `scale(${facing / stretch}, ${stretch})`
      maskRef.current.style.strokeDasharray = `${current} ${total}`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [geo, reducedMotion])

  return (
    <div className="trail" aria-hidden="true" ref={rootRef}>
      <svg width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`}>
        <defs>
          <mask id="trail-drawn" maskUnits="userSpaceOnUse">
            <path ref={maskRef} d={geo.d} fill="none" stroke="#fff" strokeWidth="14" />
          </mask>
        </defs>
        <path d={geo.d} className="trail-faint" />
        <path ref={pathRef} d={geo.d} className="trail-drawn" mask="url(#trail-drawn)" />
        {geo.stops.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="7" className="trail-stop" />
        ))}
      </svg>
      <img ref={bunnyRef} className="bunny sticker-sm" src="/stickers/bunny.webp" alt="" />
    </div>
  )
}

function buildTrail(zone) {
  const zr = zone.getBoundingClientRect()
  const w = zone.clientWidth
  const h = zone.offsetHeight
  const rel = (r) => ({ top: r.top - zr.top, bottom: r.bottom - zr.top, left: r.left - zr.left, right: r.right - zr.left })

  const narrow = w < NARROW
  const content = rel(zone.querySelector('.container').getBoundingClientRect())
  const inset = narrow ? 28 : Math.max(44, content.left / 2)
  const xFor = (i) => (narrow || i % 2 === 0 ? inset : w - inset)

  const pts = [[narrow ? inset : w * 0.7, 0]]
  const stops = []
  zone.querySelectorAll('[data-stop]').forEach((section, i) => {
    const s = rel(section.getBoundingClientRect())
    const head = rel(section.querySelector('h2').getBoundingClientRect())
    const x = xFor(i)
    const stop = [x, (head.top + head.bottom) / 2]
    stops.push(stop)
    // switch sides in the empty padding above each section, then run down its margin
    pts.push([x, s.top + 50], stop, [x, s.bottom - 80])
  })

  // Cubic segments with vertical tangents: smooth S-bends, and y never goes back up,
  // which keeps the y → length lookup simple.
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const k = (y1 - y0) / 2
    d += ` C${x0},${y0 + k} ${x1},${y1 - k} ${x1},${y1}`
  }
  return { w, h, d, stops }
}
