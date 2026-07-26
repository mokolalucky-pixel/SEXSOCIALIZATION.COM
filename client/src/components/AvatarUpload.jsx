import { useRef, useState } from 'react'
import { uploadAvatar } from '../services/profileService.js'
import Avatar from './Avatar.jsx'

const MAX_SIZE = 5 * 1024 * 1024
const MAX_SOURCE_SIZE = 25 * 1024 * 1024

function canvasBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

async function compressAvatar(file) {
  if (file.size <= MAX_SIZE) return file
  if (file.type === 'image/gif') throw new Error('GIF images over 5 MB cannot be compressed. Choose a JPEG, PNG, or WebP image.')
  if (file.size > MAX_SOURCE_SIZE) throw new Error('Choose an image smaller than 25 MB.')

  const image = await createImageBitmap(file)
  let width = image.width
  let height = image.height
  let quality = 0.88

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(image, 0, 0, width, height)
    const blob = await canvasBlob(canvas, quality)
    if (blob && blob.size <= MAX_SIZE) return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'avatar'}.webp`, { type: 'image/webp' })
    width = Math.max(320, Math.round(width * 0.8))
    height = Math.max(320, Math.round(height * 0.8))
    quality = Math.max(0.5, quality - 0.08)
  }

  throw new Error('We could not compress this image below 5 MB. Choose a smaller image.')
}

function AvatarUpload({ user, onUpdated }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setIsUploading(true)

    try {
      const needsCompression = file.size > MAX_SIZE
      setStatus(needsCompression ? 'Compressing image…' : 'Uploading…')
      const avatar = needsCompression ? await compressAvatar(file) : file
      if (needsCompression) setStatus('Uploading compressed image…')
      const updatedUser = await uploadAvatar(avatar)
      setStatus('Profile picture updated.')
      onUpdated(updatedUser)
    } catch (nextError) {
      setError(nextError.message)
      setStatus('')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="avatar-upload">
      <Avatar url={user?.avatarUrl} name={user?.displayName} size={72} />
      <div className="avatar-upload-controls">
        <label className="button secondary" htmlFor="avatar-file-input">{isUploading ? 'Uploading…' : 'Change picture'}</label>
        <input ref={inputRef} id="avatar-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} disabled={isUploading} hidden />
        <p className="save-status">Images up to 5 MB upload directly. Larger JPEG, PNG, and WebP images are compressed before upload.</p>
        {status ? <p className="save-status">{status}</p> : null}
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>
    </div>
  )
}

export default AvatarUpload
