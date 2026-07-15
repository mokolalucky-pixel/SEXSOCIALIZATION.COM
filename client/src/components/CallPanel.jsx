import { useEffect, useState } from 'react'
import { createCallRoom, loadLatestCallRoom } from '../services/callService.js'

function CallPanel() {
  const [partner, setPartner] = useState(null)
  const [room, setRoom] = useState(null)
  const [status, setStatus] = useState('Loading call room…')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [inCall, setInCall] = useState(false)

  useEffect(() => {
    let isMounted = true

    loadLatestCallRoom()
      .then(({ room: loadedRoom, partner: loadedPartner }) => {
        if (isMounted) {
          setRoom(loadedRoom)
          setPartner(loadedPartner)
          setStatus(
            loadedPartner
              ? 'Call room foundation ready.'
              : 'Accept a partner invite to create a call room.',
          )
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message)
          setStatus('')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleCreateRoom() {
    setIsCreating(true)
    setError('')

    try {
      const { room: nextRoom, partner: loadedPartner } = await createCallRoom()
      setRoom(nextRoom)
      setPartner(loadedPartner)
      setStatus('Call room ready. Click "Join call" to start.')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  function handleJoinCall() {
    setInCall(true)
  }

  function handleLeaveCall() {
    setInCall(false)
  }

  if (inCall && room?.roomUrl) {
    return (
      <section className="workflow-card stacked-card" aria-labelledby="call-title">
        <div>
          <p className="eyebrow">Live call</p>
          <h2 id="call-title">Voice &amp; Video call</h2>
          {partner ? (
            <p className="save-status">
              Partner: <strong>{partner.partnerEmail}</strong>
            </p>
          ) : null}
        </div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#111',
          }}
        >
          <iframe
            title="Video call"
            src={room.roomUrl}
            allow="camera; microphone; autoplay; display-capture"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
        <div className="action-row">
          <button className="button secondary" type="button" onClick={handleLeaveCall}>
            Leave call
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="workflow-card stacked-card" aria-labelledby="call-title">
      <div>
        <p className="eyebrow">Video calls</p>
        <h2 id="call-title">Partner call room</h2>
        <p>
          Create a call room to start a live voice &amp; video session with your partner via Daily.
        </p>
        {partner ? (
          <p className="save-status">
            Partner: <strong>{partner.partnerEmail}</strong>
          </p>
        ) : null}
        {room ? (
          <p className="save-status">
            Room status: <strong>{room.status}</strong>
          </p>
        ) : null}
        {status ? <p className="save-status">{status}</p> : null}
        {error ? (
          <p className="error-message" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="action-row">
        <button
          className="button"
          type="button"
          onClick={handleCreateRoom}
          disabled={!partner || isCreating}
        >
          {isCreating ? 'Creating…' : 'Create call room'}
        </button>
        {room?.roomUrl ? (
          <button className="button secondary" type="button" onClick={handleJoinCall}>
            Join call
          </button>
        ) : null}
      </div>
    </section>
  )
}

export default CallPanel
