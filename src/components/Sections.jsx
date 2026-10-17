import MailingList from './MailingList'

// All copy below is placeholder: swap in the real details before launch.

function Section({ id, chapter, title, children }) {
  return (
    <section className="section" id={id} data-stop>
      <div className="container">
        <div className="section-head">
          <span className="chapter gradient-text">chapter {chapter}</span>
          <h2>{title}</h2>
        </div>
        {children}
      </div>
    </section>
  )
}

export function About() {
  return (
    <Section id="about" chapter="one" title="About">
      <p className="lede">
        HackHer is a weekend for women and gender-diverse students to build something new, learn
        from mentors, and meet people who’ll cheer them on. No experience needed: just bring an idea,
        or come find one.
      </p>
      <div className="facts">
        {[
          ['When', 'Feb 26 – 28, 2027'],
          ['Where', 'Queen’s University, Kingston'],
          ['Who', 'Beginners very welcome'],
        ].map(([k, v]) => (
          <div className="card fact" key={k}>
            <span className="fact-k">{k}</span>
            <span className="fact-v">{v}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

export function Stories() {
  const projects = [
    ['Project name', 'What it does, in one line.', -3],
    ['Project name', 'What it does, in one line.', 2],
    ['Project name', 'What it does, in one line.', -1.5],
  ]
  return (
    <Section id="stories" chapter="two" title="Projects & Stories">
      <p className="lede">Stories written at past HackHers.</p>
      <div className="polaroids">
        {projects.map(([name, blurb, tilt], i) => (
          <figure className="polaroid" key={i} style={{ '--tilt': `${tilt}deg` }}>
            <div className="polaroid-img">screenshot</div>
            <figcaption>
              <strong>{name}</strong>
              <span>{blurb}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}

export function Sponsors() {
  return (
    <Section id="sponsors" chapter="three" title="Sponsors">
      <p className="lede">The people helping us turn the page.</p>
      <div className="sponsor-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="card sponsor" key={i}>logo</div>
        ))}
      </div>
      <a className="button" href="mailto:your-email@example.com">Sponsor HackHer →</a>
    </Section>
  )
}

export function FAQ() {
  const faqs = [
    ['Who can attend?', 'Confirm your eligibility rules here.'],
    ['Do I need coding experience?', 'Nope! We’ll have workshops and mentors for first-timers.'],
    ['How much does it cost?', 'Confirm here (most student hackathons are free).'],
    ['Can I come with a team?', 'Confirm max team size here, and whether there’s team matching.'],
    ['What should I bring?', 'A laptop, a charger, and anything you need to be comfy for the weekend.'],
  ]
  return (
    <Section id="faq" chapter="four" title="FAQ">
      <div className="faq">
        {faqs.map(([q, a]) => (
          <details className="card" key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}

export function Contact() {
  return (
    <Section id="contact" chapter="five" title="Contact us">
      <p className="lede">
        Questions, ideas, or want to help out? Email us at{' '}
        <a href="mailto:your-email@example.com">your-email@example.com</a>.
      </p>
      <MailingList />
      <p className="the-end hand">The end… or your beginning.</p>
    </Section>
  )
}
