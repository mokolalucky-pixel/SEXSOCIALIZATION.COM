import { useEffect, useState } from 'react'
import { loadMessageThread, sendPrivateMessage } from '../services/messageService.js'

function MessagingPanel() {
  const [partner, setPartner] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('Loading messages…')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    let isMounted = true

    loadMessageThread()
      .then(({ partner: loadedPartner, messages: loadedMessages }) => {
        if (isMounted) {
          setPartner(loadedPartner)
          setMessages(loadedMessages)
          setStatus(loadedPartner ? 'Private partner thread ready.' : 'Accept a partner invite to unlock messaging.')
        }
      })
      .catch((error) => {
        if (isMounted) {
          setError(error.message)
          setStatus('')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSending(true)

    try {
      const message = await sendPrivateMessage(body)
      setMessages((currentMessages) => [...currentMessages, message])
      setBody('')
      setStatus('Message saved.')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="workflow-card stacked-card" aria-labelledby="messaging-title">
      <div>
        <p className="eyebrow">Secure messaging</p>
        <h2 id="messaging-title">Private partner thread</h2>
        <p>
          Messages are restricted to the accepted partner connection and stored through the authenticated backend.
        </p>
        {partner ? <p className="save-status">Partner: <strong>{partner.partnerEmail}</strong></p> : null}
        {status ? <p className="save-status">{status}</p> : null}
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>

      <div className="message-list" aria-live="polite">
        {messages.length ? messages.map((message) => (
          <article className={message.mine ? 'message-bubble mine' : 'message-bubble'} key={message.id}>
            <p>{message.body}</p>
            <small>{new Date(message.createdAt).toLocaleString()}</small>
          </article>
        )) : <p className="save-status">No messages yet.</p>}
      </div>

      <form className="inline-form" onSubmit={handleSubmit}>
        <label htmlFor="message-body">Message</label>
        <textarea
          id="message-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a respectful private message"
          disabled={!partner}
          required
        />
        <button className="button" type="submit" disabled={!partner || isSending}>
          {isSending ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </section>
  )
}

export default MessagingPanel
