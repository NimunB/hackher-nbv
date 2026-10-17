import { scrollToTarget } from '../lib/scroll'

const links = [
  ['About', '#about'],
  ['Stories', '#stories'],
  ['Sponsors', '#sponsors'],
  ['FAQ', '#faq'],
  ['Contact', '#contact'],
]

export default function Nav() {
  const go = (e, href) => {
    e.preventDefault()
    scrollToTarget(href)
  }
  return (
    <nav className="nav">
      <a className="nav-logo" href="#top" onClick={(e) => go(e, 0)}>
        <img src="/stickers/bunny.webp" alt="" />
        <span>HackHer</span>
      </a>
      <ul>
        {links.map(([label, href]) => (
          <li key={href}>
            <a href={href} onClick={(e) => go(e, href)}>{label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
