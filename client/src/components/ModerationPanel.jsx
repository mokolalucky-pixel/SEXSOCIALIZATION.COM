import { useEffect, useState } from 'react'
import { loadModerationReports, submitModerationReport, updateModerationReport } from '../services/moderationService.js'

function ModerationPanel({ isAdmin }) {
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [reports, setReports] = useState([])

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    loadModerationReports()
      .then(setReports)
      .catch(() => setReports([]))
  }, [isAdmin])

  async function handleReport(event) {
    event.preventDefault()
    setError('')
    setStatus('Submitting report…')

    try {
      await submitModerationReport(reason)
      setReason('')
      setStatus('Report submitted for admin review.')
    } catch (error) {
      setError(error.message)
      setStatus('')
    }
  }

  async function handleStatusChange(id, nextStatus) {
    const report = await updateModerationReport(id, nextStatus)
    setReports((currentReports) => currentReports.map((currentReport) => (
      currentReport.id === id ? { ...currentReport, ...report } : currentReport
    )))
  }

  return (
    <section className="workflow-card stacked-card" aria-labelledby="moderation-title">
      <div>
        <p className="eyebrow">Admin moderation</p>
        <h2 id="moderation-title">Safety reports</h2>
        <p>Submit partner safety concerns for review. Admin review is limited to accounts listed in `ADMIN_EMAILS`.</p>
        {status ? <p className="save-status">{status}</p> : null}
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>

      <form className="inline-form" onSubmit={handleReport}>
        <label htmlFor="moderation-reason">Report reason</label>
        <textarea
          id="moderation-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Describe the safety concern or moderation issue"
          required
        />
        <button className="button" type="submit">Submit report</button>
      </form>

      {isAdmin ? (
        <div className="admin-report-list">
          <h3>Admin queue</h3>
          {reports.length ? reports.map((report) => (
            <article className="report-card" key={report.id}>
              <p><strong>{report.status}</strong> · {report.reporter_email} reported {report.reported_email || 'unknown user'}</p>
              <p>{report.reason}</p>
              <select value={report.status} onChange={(event) => handleStatusChange(report.id, event.target.value)}>
                <option value="open">open</option>
                <option value="reviewing">reviewing</option>
                <option value="resolved">resolved</option>
                <option value="dismissed">dismissed</option>
              </select>
            </article>
          )) : <p className="save-status">No reports yet.</p>}
        </div>
      ) : null}
    </section>
  )
}

export default ModerationPanel
