import { useEffect, useRef, useState } from 'react'
import { deleteAvatar, uploadAvatar } from '../services/profileService.js'
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
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('')
      return undefined
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(nextPreviewUrl)
    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [selectedFile])

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setStatus('Picture selected. Upload it when ready.')
    setError('')
    event.target.value = ''
  }

  function clearSelection() {
    setSelectedFile(null)
    setStatus('')
    setError('')
  }

  async function handleUpload() {
    if (!selectedFile) return

    setError('')
    setIsSaving(true)

    try {
      const needsCompression = selectedFile.size > MAX_SIZE
      setStatus(needsCompression ? 'Compressing image…' : 'Uploading…')
      const avatar = needsCompression ? await compressAvatar(selectedFile) : selectedFile
      if (needsCompression) setStatus('Uploading compressed image…')
      const updatedUser = await uploadAvatar(avatar)
      setSelectedFile(null)
      setStatus('Profile picture updated.')
      onUpdated(updatedUser)
    } catch (nextError) {
      setError(nextError.message)
      setStatus('')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setError('')
    setIsSaving(true)

    try {
      const updatedUser = await deleteAvatar()
      setSelectedFile(null)
      setStatus('Profile picture deleted.')
      onUpdated(updatedUser)
    } catch (nextError) {
      setError(nextError.message)
      setStatus('')
    } finally {
      setIsSaving(false)
    }
  }

  const avatarUrl = previewUrl || user?.avatarUrl

  return (
    <div className="avatar-upload">
      <Avatar url={avatarUrl} name={user?.displayName} size={72} />
      <div className="avatar-upload-controls">
        <div className="avatar-upload-actions">
          <label className="button secondary" htmlFor="avatar-file-input">Edit picture</label>
          <input ref={inputRef} id="avatar-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} disabled={isSaving} hidden />
          {selectedFile ? <button className="button" type="button" onClick={handleUpload} disabled={isSaving}>{isSaving ? 'Saving…' : 'Upload picture'}</button> : null}
          {selectedFile ? <button className="button secondary" type="button" onClick={clearSelection} disabled={isSaving}>Cancel</button> : null}
          {user?.avatarUrl ? <button className="button secondary danger-button" type="button" onClick={handleDelete} disabled={isSaving}>Delete picture</button> : null}
        </div>
        <p className="save-status">Choose a picture to preview it. It is not uploaded until you select Upload picture.</p>
        {status ? <p className="save-status">{status}</p> : null}
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>
    </div>
  )
}

export default AvatarUpload
