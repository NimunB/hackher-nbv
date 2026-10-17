import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { quadTransform } from '../lib/homography'
import { women } from '../data/women'

gsap.registerPlugin(ScrollTrigger)

// Everything is positioned in the sketch's own pixel space (book.webp is 876×662)
// and the whole book is scaled to fit its column.
const SKETCH_W = 876
const SKETCH_H = 662

// Corners of each page in the sketch: top-left, top-right, bottom-right, bottom-left.
// Kept a little inside the pencil lines. Redraw the book → re-measure these
// (open the site with ?debug to see them outlined).
const PAGES = {
  left: { size: [270, 300], quad: [[126, 200], [394, 165], [440, 458], [182, 488]] },
  right: { size: [300, 300], quad: [[418, 160], [700, 80], [810, 450], [462, 432]] },
  cover: { size: [330, 380], quad: [[404, 140], [712, 52], [845, 505], [452, 500]] },
}

// The sketch's left half is hidden until the cover opens. x% of the spine at top/bottom.
const CLOSED_CLIP = 'polygon(45.5% -5%, 105% -5%, 105% 105%, 51.5% 105%)'
const OPEN_CLIP = 'polygon(-5% -5%, 105% -5%, 105% 105%, -5% 105%)'

const spreads = [
  { left: <Bookplate />, right: <Prologue /> },
  ...women.map((w, i) => ({
    left: <Portrait woman={w} />,
    right: <Story woman={w} chapter={i + 1} />,
  })),
  { left: <YourPortrait />, right: <YourStory chapter={women.length + 1} /> },
]

// Pins the nearest [data-pin] ancestor (the hero) while the pages turn.
export default function StoryBook({ reducedMotion }) {
  const fitRef = useRef(null)
  const tiltRef = useRef(null)
  const sketchRef = useRef(null)
  const coverRef = useRef(null)
  const leftRefs = useRef([])
  const rightRefs = useRef([])
  const tlRef = useRef(null)
  const [scale, setScale] = useState(0.6)
  const [page, setPage] = useState(0)

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / SKETCH_W))
    ro.observe(fitRef.current)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: reducedMotion })
      gsap.set(leftRefs.current, { scaleX: 0 })
      gsap.set(sketchRef.current, { clipPath: CLOSED_CLIP })

      tl.fromTo(tiltRef.current, { rotate: -7, scale: 0.88, y: 24 }, { rotate: 0, scale: 1, y: 0, duration: 0.6 })
      tl.addLabel('closed')

      const outgoing = [coverRef.current, ...rightRefs.current]
      spreads.forEach((_, i) => {
        const out = outgoing[i]
        const into = leftRefs.current[i]
        // first half: the right-hand leaf folds up toward the spine...
        tl.to(out, { scaleX: 0, duration: 0.5, ease: 'power1.in' }, '+=0.35')
        tl.to(out.querySelector('.shade'), { opacity: 0.55, duration: 0.5, ease: 'power1.in' }, '<')
        // ...second half: its back unfolds onto the left page
        tl.fromTo(into, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power1.out' })
        tl.fromTo(into.querySelector('.shade'), { opacity: 0.55 }, { opacity: 0, duration: 0.5, ease: 'power1.out' }, '<')
        if (i === 0) tl.to(sketchRef.current, { clipPath: OPEN_CLIP, duration: 0.5, ease: 'power1.out' }, '<')
        tl.addLabel(`spread${i}`)
      })
      tl.to({}, { duration: 0.6 }) // let the last spread rest before the page scrolls on

      if (reducedMotion) {
        tl.progress(0).seek('spread0')
      } else {
        ScrollTrigger.create({
          trigger: fitRef.current.closest('[data-pin]'),
          start: 'top top',
          end: () => `+=${spreads.length * 70}%`,
          pin: true,
          scrub: 0.6,
          animation: tl,
        })
      }
      tlRef.current = tl
    })
    return () => ctx.revert()
  }, [reducedMotion])

  const goTo = (i) => {
    const next = Math.max(0, Math.min(spreads.length - 1, i))
    setPage(next)
    tlRef.current?.tweenTo(`spread${next}`, { duration: 0.9, ease: 'power2.inOut' })
  }

  const debug = import.meta.env.DEV && new URLSearchParams(location.search).has('debug')

  return (
    <div className="book-fit" ref={fitRef} style={{ aspectRatio: `${SKETCH_W} / ${SKETCH_H}` }}>
      <div className="book" style={{ width: SKETCH_W, height: SKETCH_H, transform: `scale(${scale})` }}>
        <div className="book-tilt" ref={tiltRef}>
          <img ref={sketchRef} className="book-sketch sticker-lg" src="/stickers/book.webp" alt="" />

          <PageQuad page={PAGES.left} debug={debug}>
            {spreads.map((s, i) => (
              <div key={i} className="leaf leaf-left" style={{ zIndex: i + 1 }} ref={(el) => (leftRefs.current[i] = el)}>
                {s.left}
                <div className="shade" />
              </div>
            ))}
          </PageQuad>

          <PageQuad page={PAGES.right} debug={debug}>
            {spreads.map((s, i) => (
              <div key={i} className="leaf leaf-right" style={{ zIndex: spreads.length - i }} ref={(el) => (rightRefs.current[i] = el)}>
                {s.right}
                <div className="shade" />
              </div>
            ))}
          </PageQuad>

          <PageQuad page={PAGES.cover} debug={debug}>
            <div className="leaf leaf-right cover" ref={coverRef}>
              <Cover />
              <div className="shade" />
            </div>
          </PageQuad>
        </div>
      </div>

      {reducedMotion && (
        <div className="book-controls">
          <button onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Previous page">←</button>
          <button onClick={() => goTo(page + 1)} disabled={page === spreads.length - 1} aria-label="Next page">→</button>
        </div>
      )}

      {/* Screen readers get the stories as a plain list, the visual book is decorative */}
      <ul className="visually-hidden">
        {women.map((w) => (
          <li key={w.name}>{w.name} ({w.years}): {w.story}</li>
        ))}
      </ul>
    </div>
  )
}

function PageQuad({ page, debug, children }) {
  const [w, h] = page.size
  return (
    <div
      className={`page-quad${debug ? ' debug' : ''}`}
      style={{ width: w, height: h, transform: quadTransform(w, h, page.quad) }}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}

function Cover() {
  return (
    <div className="cover-inner">
      <span className="cover-kicker">a HackHer storybook</span>
      <span className="cover-title">Write your own story</span>
      <img className="cover-bunny" src="/stickers/bunny.webp" alt="" />
      <span className="cover-hint">scroll to open ↓</span>
    </div>
  )
}

function Bookplate() {
  return (
    <div className="page bookplate">
      <span className="page-kicker">ex libris</span>
      <p className="hand">This book belongs to</p>
      <p className="hand blank">________________</p>
      <p className="hand">(that’s you!)</p>
    </div>
  )
}

function Prologue() {
  return (
    <div className="page">
      <span className="page-kicker">prologue</span>
      <p className="hand big">Once upon a time, someone wrote the very first line of code.</p>
      <p className="hand">Here are a few of the women who wrote theirs…</p>
      <span className="page-num">keep scrolling →</span>
    </div>
  )
}

function Portrait({ woman }) {
  const initials = woman.name.split(' ').map((n) => n[0]).join('')
  return (
    <div className="page portrait">
      {woman.portrait ? (
        <img className="portrait-img" src={woman.portrait} alt="" />
      ) : (
        <div className="portrait-placeholder">
          <span>{initials}</span>
          <small>draw {woman.name.split(' ')[0]} here ✎</small>
        </div>
      )}
      <span className="portrait-name hand">{woman.name}</span>
    </div>
  )
}

function Story({ woman, chapter }) {
  return (
    <div className="page">
      <span className="page-kicker">chapter {chapter} · {woman.chapter}</span>
      <h3 className="hand name">{woman.name}</h3>
      <span className="years">{woman.years}</span>
      <p className="hand">{woman.story}</p>
      <span className="page-num">{chapter * 2 + 1}</span>
    </div>
  )
}

function YourPortrait() {
  return (
    <div className="page portrait">
      <div className="portrait-placeholder you">
        <span>?</span>
      </div>
      <span className="portrait-name hand">you</span>
    </div>
  )
}

function YourStory({ chapter }) {
  return (
    <div className="page">
      <span className="page-kicker">chapter {chapter} · yours</span>
      <h3 className="hand name">This page is blank.</h3>
      <p className="hand">Come write it with us at HackHer, February 26 – 28, 2027.</p>
      <span className="page-num">the end? ↓</span>
    </div>
  )
}
