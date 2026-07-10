import Link from 'next/link'

/**
 * CircleCard — entry-point card for each circle.
 *
 * Props:
 *  title       string    Circle name
 *  description string    Short description
 *  href        string    Link destination
 *  icon        string    Emoji icon
 *  locked      bool      Show a lock badge if user doesn't qualify
 *  lockReason  string    Message shown when locked
 */
export default function CircleCard({ title, description, href, icon, locked, lockReason }) {
  return (
    <div className="relative card hover:border-[#e91e8c]/60 transition-colors group">
      {locked && (
        <span className="absolute top-3 right-3 bg-red-600/80 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
          🔒 Locked
        </span>
      )}
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-white/60 text-sm mb-4">{description}</p>

      {locked ? (
        <p className="text-red-400 text-xs">{lockReason || 'Access denied.'}</p>
      ) : (
        <Link
          href={href}
          className="inline-block btn-primary text-sm"
        >
          Enter circle →
        </Link>
      )}
    </div>
  )
}
