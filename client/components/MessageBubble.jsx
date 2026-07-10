import { format } from 'date-fns'

/**
 * MessageBubble — a single chat message bubble.
 *
 * Props:
 *  message   { text, imageUrl, senderId, createdAt, senderName }
 *  isOwn     bool   true if the message belongs to the current user
 */
export default function MessageBubble({ message, isOwn }) {
  const time = message.createdAt?.toDate
    ? format(message.createdAt.toDate(), 'HH:mm')
    : ''

  return (
    <div className={`flex flex-col max-w-[75%] ${isOwn ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
      {!isOwn && (
        <span className="text-xs text-white/50 mb-1 px-1">{message.senderName || 'Partner'}</span>
      )}

      <div
        className={`rounded-2xl px-4 py-2.5 text-sm break-words
          ${isOwn
            ? 'bg-[#e91e8c] text-white rounded-br-none'
            : 'bg-white/15 text-white rounded-bl-none'
          }`}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Shared image"
            className="rounded-xl max-w-full mb-2 max-h-60 object-cover"
          />
        )}
        {message.text && <p>{message.text}</p>}
        {message.isNudge && (
          <p className="text-lg">❤️ <em className="text-sm">Thinking of you…</em></p>
        )}
      </div>

      {time && (
        <span className="text-[10px] text-white/30 mt-0.5 px-1">{time}</span>
      )}
    </div>
  )
}
