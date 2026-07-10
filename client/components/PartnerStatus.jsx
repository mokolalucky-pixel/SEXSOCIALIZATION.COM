import Link from 'next/link'

/**
 * PartnerStatus — shows a partner connection status badge.
 *
 * Props:
 *  status   'connected' | 'pending' | 'none'
 *  name     string   Partner display name (when connected)
 */
export default function PartnerStatus({ status, name }) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-full px-4 py-2 text-sm">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-300 font-medium">
          💑 Connected with {name || 'your partner'}
        </span>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-4 py-2 text-sm">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-yellow-300 font-medium">
          ⏳ Invite pending — waiting for partner
        </span>
      </div>
    )
  }

  // status === 'none'
  return (
    <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm">
      <span className="text-white/60">💔 No partner linked yet</span>
      <Link
        href="/auth/invite"
        className="ml-auto btn-primary text-xs py-1.5 px-4"
      >
        Invite partner
      </Link>
    </div>
  )
}
