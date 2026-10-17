import { useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Nav from './components/Nav'
import Hero from './components/Hero'
import BunnyTrail from './components/BunnyTrail'
import StickerFilters from './components/StickerFilters'
import { About, Stories, Sponsors, FAQ, Contact } from './components/Sections'
import { startSmoothScroll, scrollToTarget } from './lib/scroll'

function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const mq = matchMedia(query)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function App() {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const stop = startSmoothScroll()

    // dev helper for screenshots: /?scroll=2400 jumps straight to that position
    const jump = import.meta.env.DEV && new URLSearchParams(location.search).get('scroll')
    if (jump) {
      setTimeout(() => {
        ScrollTrigger.refresh()
        scrollToTarget(Number(jump), { immediate: true, offset: 0 })
      }, 300)
    }
    return stop
  }, [reducedMotion])

  return (
    <>
      <StickerFilters />
      <Nav />
      <Hero reducedMotion={reducedMotion} />
      <main className="trail-zone">
        <BunnyTrail reducedMotion={reducedMotion} />
        <About />
        <Stories />
        <Sponsors />
        <FAQ />
        <Contact />
      </main>
    </>
  )
}
