import { useEffect, useState } from 'react'
import { deletePrivateMessage, editPrivateMessage, loadMessageThread, sendPrivateMessage } from '../services/messageService.js'

function MessagingPanel() {
  const [partner, setPartner] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('Loading messages…')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingBody, setEditingBody] = useState('')
  const [deletingMessageId, setDeletingMessageId] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)

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

  function startEditing(message) {
    setError('')
    setDeletingMessageId(null)
    setEditingMessageId(message.id)
    setEditingBody(message.body)
  }

  function cancelEditing() {
    setEditingMessageId(null)
    setEditingBody('')
  }

  async function handleEdit(message) {
    const nextBody = editingBody.trim()
    if (!nextBody) {
      setError('Message cannot be empty.')
      return
    }

    setError('')
    setIsUpdating(true)
    try {
      const updated = await editPrivateMessage(message.id, nextBody)
      setMessages((current) => current.map((item) => item.id === updated.id ? updated : item))
      cancelEditing()
      setStatus('Message updated.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete(message) {
    setError('')
    setIsUpdating(true)
    try {
      await deletePrivateMessage(message.id)
      setMessages((current) => current.filter((item) => item.id !== message.id))
      setDeletingMessageId(null)
      setStatus('Message deleted.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsUpdating(false)
    }
  }

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
            {editingMessageId === message.id ? (
              <form className="inline-form" onSubmit={(event) => { event.preventDefault(); handleEdit(message) }}>
                <label htmlFor={`edit-message-${message.id}`}>Edit message</label>
                <textarea id={`edit-message-${message.id}`} value={editingBody} onChange={(event) => setEditingBody(event.target.value)} maxLength="1000" required disabled={isUpdating} />
                <div className="action-row">
                  <button className="button" type="submit" disabled={isUpdating}>{isUpdating ? 'Saving…' : 'Save'}</button>
                  <button className="button secondary" type="button" onClick={cancelEditing} disabled={isUpdating}>Cancel</button>
                </div>
              </form>
            ) : <p>{message.body}</p>}
            <small>{new Date(message.createdAt).toLocaleString()}{message.editedAt ? ' · edited' : ''}</small>
            {message.mine && editingMessageId !== message.id ? (
              <div className="action-row">
                {deletingMessageId === message.id ? (
                  <>
                    <span className="save-status">Delete this message?</span>
                    <button className="button danger-button" type="button" onClick={() => handleDelete(message)} disabled={isUpdating}>{isUpdating ? 'Deleting…' : 'Confirm delete'}</button>
                    <button className="button secondary" type="button" onClick={() => setDeletingMessageId(null)} disabled={isUpdating}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="button secondary" type="button" onClick={() => startEditing(message)} disabled={isUpdating}>Edit</button>
                    <button className="button secondary danger-button" type="button" onClick={() => { setEditingMessageId(null); setDeletingMessageId(message.id) }} disabled={isUpdating}>Delete</button>
                  </>
                )}
              </div>
            ) : null}
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
