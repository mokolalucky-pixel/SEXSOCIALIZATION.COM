import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../../../firebase/firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'
import Navbar from '../../components/Navbar'
import MessageBubble from '../../components/MessageBubble'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

export default function ChatPage() {
  const router = useRouter()
  const [user, userLoading] = useAuthState(auth)
  const [userData, setUserData] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [hasPartner, setHasPartner] = useState(null)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)

  // Determine consistent chat ID
  const getChatId = (uid, partnerId) => {
    const [a, b] = [uid, partnerId].sort()
    return `${a}_${b}`
  }

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/auth/login'); return }

    const fetchUser = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) { setHasPartner(false); return }
      const data = snap.data()
      setUserData(data)
      setHasPartner(!!data.partnerId)
    }
    fetchUser()
  }, [user, userLoading, router])

  useEffect(() => {
    if (!hasPartner || !userData?.partnerId) return
    const chatId = getChatId(user.uid, userData.partnerId)
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })
    return unsub
  }, [hasPartner, userData, user])

  const sendMessage = async (overrides = {}) => {
    if (!userData?.partnerId) return
    const chatId = getChatId(user.uid, userData.partnerId)
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: user.uid,
      senderName: user.displayName || 'You',
      createdAt: serverTimestamp(),
      ...overrides,
    })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await sendMessage({ text: text.trim() })
      setText('')
    } catch {
      toast.error('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !userData?.partnerId) return
    setSending(true)
    try {
      const chatId = getChatId(user.uid, userData.partnerId)
      const storageRef = ref(storage, `chats/${chatId}/${uuidv4()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const imageUrl = await getDownloadURL(storageRef)
      await sendMessage({ imageUrl, text: '' })
    } catch {
      toast.error('Failed to upload image.')
    } finally {
      setSending(false)
      e.target.value = ''
    }
  }

  const handleNudge = async () => {
    setSending(true)
    try {
      await sendMessage({ isNudge: true, text: '' })
      toast.success('Nudge sent! ❤️')
    } catch {
      toast.error('Failed to send nudge.')
    } finally {
      setSending(false)
    }
  }

  if (userLoading || hasPartner === null) {
    return <div className="min-h-screen auth-bg flex items-center justify-center"><span className="text-white/60">Loading…</span></div>
  }

  if (!hasPartner) {
    return (
      <div className="auth-bg min-h-screen">
        <Navbar user={user} />
        <div className="pt-24 px-4 flex items-center justify-center min-h-screen">
          <div className="card text-center max-w-md">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-white mb-2">Link your partner first</h2>
            <p className="text-white/60 text-sm mb-4">
              Private chat is only available once you and your partner are linked.
            </p>
            <Link href="/auth/invite" className="btn-primary">
              Invite your partner
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-bg min-h-screen flex flex-col">
      <Toaster position="top-center" />
      <Navbar user={user} />

      {/* Chat area */}
      <div className="flex-1 max-w-2xl w-full mx-auto pt-20 pb-24 px-4 overflow-y-auto">
        <div className="text-center py-4 text-white/40 text-xs mb-4">
          🔒 This conversation is private — only you and your partner can see it.
        </div>

        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-white/40 text-sm py-8">
              No messages yet. Say hello! 👋
            </p>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user.uid}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#2d0036]/95 backdrop-blur-md border-t border-white/10 px-4 py-3">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Thinking of you nudge */}
          <button
            type="button"
            onClick={handleNudge}
            disabled={sending}
            title="Thinking of you ❤️"
            className="text-xl hover:scale-110 transition-transform disabled:opacity-40"
          >
            ❤️
          </button>

          {/* Image upload */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            title="Share an image"
            className="text-xl hover:scale-110 transition-transform disabled:opacity-40"
          >
            📷
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Text input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="input-field flex-1 py-2"
          />

          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="btn-primary py-2 disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
