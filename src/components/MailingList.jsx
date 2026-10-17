import { useState } from 'react'

export default function MailingList() {
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    // TODO: send to your mailing list provider (Mailchimp, Buttondown, a Google Form…)
    setSent(true)
  }

  return (
    <form className="mailing" onSubmit={submit}>
      <label className="visually-hidden" htmlFor="mailing-email">Email</label>
      <input
        id="mailing-email"
        type="email"
        required
        placeholder={sent ? 'You’re on the list ♡' : 'Join our mailing list to stay updated!'}
        disabled={sent}
      />
      <button type="submit" aria-label="Join mailing list" disabled={sent}>
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h16M13 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  )
}
