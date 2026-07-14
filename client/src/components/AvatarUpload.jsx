import { useRef, useState } from 'react'
import { uploadAvatar } from '../services/profileService.js'
import Avatar from './Avatar.jsx'

function AvatarUpload({ user, onUpdated }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.')
      return
    }

    setError('')
    setStatus('Uploading…')
    setIsUploading(true)

    try {
      const updatedUser = await uploadAvatar(file)
      setStatus('Profile picture updated.')
      onUpdated(updatedUser)
    } catch (error) {
      setError(error.message)
      setStatus('')
    } finally {
      setIsUploading(false)

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="avatar-upload">
      <Avatar url={user?.avatarUrl} name={user?.displayName} size={72} />
      <div className="avatar-upload-controls">
        <label className="button secondary" htmlFor="avatar-file-input">
          {isUploading ? 'Uploading…' : 'Change picture'}
        </label>
        <input
          ref={inputRef}
          id="avatar-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={isUploading}
          hidden
        />
        {status ? <p className="save-status">{status}</p> : null}
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>
    </div>
  )
}

export default AvatarUpload
