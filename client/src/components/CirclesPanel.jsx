import { useEffect, useState } from 'react'
import { joinCircle, leaveCircle, loadCircleMembers, loadCircles } from '../services/circleService.js'

function CirclesPanel() {
  const [circles, setCircles] = useState([])
  const [userGender, setUserGender] = useState(null)
  const [selectedType, setSelectedType] = useState('')
  const [members, setMembers] = useState([])
  const [status, setStatus] = useState('Loading circles…')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    loadCircles()
      .then(({ circles: loadedCircles, userGender: loadedGender }) => {
        if (isMounted) {
          setCircles(loadedCircles)
          setUserGender(loadedGender)
          setStatus(loadedGender ? 'Select a circle below.' : 'Set your gender during sign-up to access gender-restricted circles.')
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
    setMembers([])

    const selected = circles.find((circle) => circle.type === selectedType)
    if (!selectedType || !selected?.joined) {
      return () => {
        isMounted = false
      }
    }

    loadCircleMembers(selectedType)
      .then((loadedMembers) => {
        if (isMounted) {
          setMembers(loadedMembers)
        }
      })
      .catch(() => {
        if (isMounted) {
          setMembers([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedType, circles])

  async function handleJoin(circleType) {
    setError('')
    setStatus('Joining circle…')

    try {
      await joinCircle(circleType)
      setCircles((currentCircles) => currentCircles.map((circle) => (
        circle.type === circleType ? { ...circle, joined: true, memberCount: circle.memberCount + 1 } : circle
      )))
      setSelectedType(circleType)
      setStatus('Joined.')
    } catch (error) {
      setError(error.message)
      setStatus('')
    }
  }

  async function handleLeave(circleType) {
    setError('')
    setStatus('Leaving circle…')

    try {
      await leaveCircle(circleType)
      setCircles((currentCircles) => currentCircles.map((circle) => (
        circle.type === circleType ? { ...circle, joined: false, memberCount: Math.max(0, circle.memberCount - 1) } : circle
      )))
      if (selectedType === circleType) {
        setMembers([])
      }
      setStatus('Left circle.')
    } catch (error) {
      setError(error.message)
      setStatus('')
    }
  }

  const selectedCircle = circles.find((circle) => circle.type === selectedType)

  return (
    <section className="workflow-card stacked-card" aria-labelledby="circles-title">
      <div>
        <p className="eyebrow">My Circles</p>
        <h2 id="circles-title">Community circles</h2>
        <p>Join circles based on your gender identity. Gender-restricted circles enforce membership rules.</p>
        {userGender ? <p className="save-status">Your gender: <strong>{userGender}</strong></p> : null}
        {status ? <p className="save-status">{status}</p> : null}
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>

      <div className="circle-layout">
        <div className="circle-list" aria-label="Community circles">
          {circles.map((circle) => (
            <button
              className={circle.type === selectedType ? 'circle-tab active' : 'circle-tab'}
              key={circle.type}
              type="button"
              onClick={() => setSelectedType(circle.type)}
            >
              <strong>{circle.name}</strong>
              <span>{circle.memberCount} members</span>
              {circle.joined ? <span className="circle-badge joined">Joined</span> : null}
              {!circle.canJoin ? <span className="circle-badge restricted">Restricted</span> : null}
            </button>
          ))}
        </div>

        <div className="circle-detail">
          {selectedCircle ? (
            <>
              <h3>{selectedCircle.name}</h3>
              <p className="save-status">{selectedCircle.description}</p>
              {selectedCircle.allowedGenders ? (
                <p className="save-status">Open to: <strong>{selectedCircle.allowedGenders.join(', ')}</strong></p>
              ) : (
                <p className="save-status">Open to: <strong>all genders</strong></p>
              )}

              <div className="action-row">
                {selectedCircle.canJoin && !selectedCircle.joined ? (
                  <button className="button" type="button" onClick={() => handleJoin(selectedCircle.type)}>Join circle</button>
                ) : null}
                {selectedCircle.joined ? (
                  <button className="button secondary" type="button" onClick={() => handleLeave(selectedCircle.type)}>Leave circle</button>
                ) : null}
                {!selectedCircle.canJoin && !selectedCircle.joined ? (
                  <p className="save-status">Your gender does not match this circle's membership requirement.</p>
                ) : null}
              </div>

              {selectedCircle.joined && members.length ? (
                <div className="contact-list">
                  <h4>Members</h4>
                  {members.map((member) => (
                    <article className="report-card" key={member.id}>
                      <p><strong>{member.displayName}</strong>{member.isYou ? ' (you)' : ''}</p>
                      {member.gender ? <p>{member.gender}</p> : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          ) : <p className="save-status">Select a circle to view details.</p>}
        </div>
      </div>
    </section>
  )
}

export default CirclesPanel
