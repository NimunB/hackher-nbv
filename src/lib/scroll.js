import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let lenis = null

// Smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis stay in step.
export function startSmoothScroll() {
  lenis = new Lenis({ autoRaf: false })
  lenis.on('scroll', ScrollTrigger.update)
  const raf = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(raf)
    lenis.destroy()
    lenis = null
  }
}

export function scrollToTarget(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { offset: -90, ...opts })
  else if (typeof target === 'number') window.scrollTo(0, target)
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
}
