function Avatar({ url, name, size = 40 }) {
  if (url) {
    return (
      <img
        className="avatar"
        src={url}
        alt={name ? `${name}'s avatar` : 'User avatar'}
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    )
  }

  const initial = String(name || '?').charAt(0).toUpperCase()

  return (
    <span
      className="avatar avatar-placeholder"
      aria-label={name ? `${name}'s avatar` : 'User avatar'}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  )
}

export default Avatar
