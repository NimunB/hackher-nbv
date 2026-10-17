import StoryBook from './StoryBook'
import MailingList from './MailingList'

export default function Hero({ reducedMotion }) {
  return (
    <header className="hero" id="top" data-pin>
      <div className="hero-text">
        <h1 className="wordmark">HackHer</h1>
        <p className="tagline gradient-text">Queen’s Women in Computing’s annual hackathon</p>
        <p className="dates">Coming to you February 26 – 28, 2027</p>
        <MailingList />
      </div>
      <div className="hero-book">
        <StoryBook reducedMotion={reducedMotion} />
      </div>
    </header>
  )
}
