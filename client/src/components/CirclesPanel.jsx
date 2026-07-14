import { useEffect, useState } from 'react'
import { addCircleContact, createCircle, loadCircleContacts, loadCircles } from '../services/circleService.js'

function CirclesPanel() {
  const [circles, setCircles] = useState([])
  const [selectedCircleId, setSelectedCircleId] = useState('')
  const [contacts, setContacts] = useState([])
  const [circleForm, setCircleForm] = useState({ name: '', description: '' })
  const [contactForm, setContactForm] = useState({ displayName: '', contact: '', relationship: '' })
  const [status, setStatus] = useState('Loading circles…')
  const [error, setError] = useState('')

  const selectedCircle = circles.find((circle) => circle.id === selectedCircleId)

  useEffect(() => {
    let isMounted = true

    loadCircles()
      .then((loadedCircles) => {
        if (isMounted) {
          setCircles(loadedCircles)
          setSelectedCircleId(loadedCircles[0]?.id || '')
          setStatus(loadedCircles.length ? 'Circles loaded.' : 'Create your first circle.')
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

  useEffect(() => {
    let isMounted = true

    if (!selectedCircleId) {
      setContacts([])
      return () => {
        isMounted = false
      }
    }

    loadCircleContacts(selectedCircleId)
      .then((loadedContacts) => {
        if (isMounted) {
          setContacts(loadedContacts)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setError(error.message)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedCircleId])

  async function handleCreateCircle(event) {
    event.preventDefault()
    setError('')
    setStatus('Creating circle…')

    try {
      const circle = await createCircle(circleForm.name, circleForm.description)
      setCircles((currentCircles) => [circle, ...currentCircles])
      setSelectedCircleId(circle.id)
      setCircleForm({ name: '', description: '' })
      setStatus('Circle created.')
    } catch (error) {
      setError(error.message)
      setStatus('')
    }
  }

  async function handleAddContact(event) {
    event.preventDefault()
    setError('')
    setStatus('Adding contact…')

    try {
      const contact = await addCircleContact(
        selectedCircleId,
        contactForm.displayName,
        contactForm.contact,
        contactForm.relationship,
      )
      setContacts((currentContacts) => [contact, ...currentContacts])
      setContactForm({ displayName: '', contact: '', relationship: '' })
      setCircles((currentCircles) => currentCircles.map((circle) => (
        circle.id === selectedCircleId ? { ...circle, contactCount: circle.contactCount + 1 } : circle
      )))
      setStatus('Contact added.')
    } catch (error) {
      setError(error.message)
      setStatus('')
    }
  }

  return (
    <section className="workflow-card stacked-card" aria-labelledby="circles-title">
      <div>
        <p className="eyebrow">My Circles</p>
        <h2 id="circles-title">Trusted contact circles</h2>
        <p>Create groups for partners, close friends, safety contacts, or support people.</p>
        {status ? <p className="save-status">{status}</p> : null}
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>

      <form className="inline-form" onSubmit={handleCreateCircle}>
        <label htmlFor="circle-name">Circle name</label>
        <input
          id="circle-name"
          value={circleForm.name}
          onChange={(event) => setCircleForm((currentForm) => ({ ...currentForm, name: event.target.value }))}
          placeholder="Partners, Close friends, Safety contacts"
          required
        />
        <label htmlFor="circle-description">Description</label>
        <input
          id="circle-description"
          value={circleForm.description}
          onChange={(event) => setCircleForm((currentForm) => ({ ...currentForm, description: event.target.value }))}
          placeholder="Optional note about this circle"
        />
        <button className="button" type="submit">Create circle</button>
      </form>

      {circles.length ? (
        <div className="circle-layout">
          <div className="circle-list" aria-label="Your circles">
            {circles.map((circle) => (
              <button
                className={circle.id === selectedCircleId ? 'circle-tab active' : 'circle-tab'}
                key={circle.id}
                type="button"
                onClick={() => setSelectedCircleId(circle.id)}
              >
                <strong>{circle.name}</strong>
                <span>{circle.contactCount} contacts</span>
              </button>
            ))}
          </div>

          <div className="circle-detail">
            <h3>{selectedCircle?.name}</h3>
            {selectedCircle?.description ? <p className="save-status">{selectedCircle.description}</p> : null}

            <form className="inline-form" onSubmit={handleAddContact}>
              <label htmlFor="circle-contact-name">Contact name</label>
              <input
                id="circle-contact-name"
                value={contactForm.displayName}
                onChange={(event) => setContactForm((currentForm) => ({ ...currentForm, displayName: event.target.value }))}
                required
              />
              <label htmlFor="circle-contact-value">Email or phone/contact</label>
              <input
                id="circle-contact-value"
                value={contactForm.contact}
                onChange={(event) => setContactForm((currentForm) => ({ ...currentForm, contact: event.target.value }))}
                required
              />
              <label htmlFor="circle-contact-relationship">Relationship</label>
              <input
                id="circle-contact-relationship"
                value={contactForm.relationship}
                onChange={(event) => setContactForm((currentForm) => ({ ...currentForm, relationship: event.target.value }))}
                placeholder="Partner, friend, support, emergency contact"
              />
              <button className="button" type="submit">Add contact</button>
            </form>

            <div className="contact-list">
              {contacts.length ? contacts.map((contact) => (
                <article className="report-card" key={contact.id}>
                  <p><strong>{contact.displayName}</strong> · {contact.contact}</p>
                  {contact.relationship ? <p>{contact.relationship}</p> : null}
                </article>
              )) : <p className="save-status">No contacts in this circle yet.</p>}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default CirclesPanel
