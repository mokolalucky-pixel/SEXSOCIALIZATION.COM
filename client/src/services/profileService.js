export async function uploadAvatar(file) {
  const response = await fetch('/api/auth/avatar', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to upload avatar.')
  }

  return payload.user
}

export async function deleteAvatar() {
  const response = await fetch('/api/auth/avatar', {
    method: 'DELETE',
    credentials: 'include',
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to delete avatar.')
  }

  return payload.user
}
