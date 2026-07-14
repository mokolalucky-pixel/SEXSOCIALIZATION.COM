import { useEffect, useState } from 'react'
import { createCallRoom, loadLatestCallRoom } from '../services/callService.js'

function CallPanel() {
  const [partner, setPartner] = useState(null)
  const [room, setRoom] = useState(null)
  const [status, setStatus] = useState('Loading call room…')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let isMounted = true

    loadLatestCallRoom()
      .then(({ room: loadedRoom, partner: loadedPartner }) => {
        if (isMounted) {
          setRoom(loadedRoom)
          setPartner(loadedPartner)
          setStatus(loadedPartner ? 'Call room foundation ready.' : 'Accept a partner invite to create a call room.')
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

  async function handleCreateRoom() {
    setIsCreating(true)
    setError('')

    try {
      const { room: nextRoom, partner: loadedPartner } = await createCallRoom()
      setRoom(nextRoom)
      setPartner(loadedPartner)
      setStatus(nextRoom.roomUrl ? 'Call room ready.' : 'Call room saved. Connect a WebRTC provider to activate live video.')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="workflow-card stacked-card" aria-labelledby="call-title">
      <div>
        <p className="eyebrow">Video calls</p>
        <h2 id="call-title">Partner call room</h2>
        <p>
          Vercel Functions store call-room state; live audio/video needs a WebRTC provider join URL configured.
        </p>
        {partner ? <p className="save-status">Partner: <strong>{partner.partnerEmail}</strong></p> : null}
        {room ? <p className="save-status">Room status: <strong>{room.status}</strong></p> : null}
        {status ? <p className="save-status">{status}</p> : null}
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>

      <div className="action-row">
        <button className="button" type="button" onClick={handleCreateRoom} disabled={!partner || isCreating}>
          {isCreating ? 'Creating…' : 'Create call room'}
        </button>
        {room?.roomUrl ? <a className="button secondary" href={room.roomUrl}>Join call</a> : null}
      </div>
    </section>
  )
}

export default CallPanel
