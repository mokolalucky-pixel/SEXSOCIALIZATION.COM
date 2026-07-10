import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, getDoc,
} from 'firebase/firestore'
import { auth, db } from '../../../firebase/firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'
import Navbar from '../../components/Navbar'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function PrivateCirclePage() {
  const router = useRouter()
  const [user, userLoading] = useAuthState(auth)
  const [userData, setUserData] = useState(null)
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [access, setAccess] = useState(null)

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/auth/login'); return }

    const checkAccess = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) { setAccess(false); return }
      const data = snap.data()
      setUserData(data)
      setAccess(!!data.partnerId)
    }
    checkAccess()
  }, [user, userLoading, router])

  useEffect(() => {
    if (!access || !userData?.partnerId) return
    // Use a consistent pair ID regardless of who checks
    const [a, b] = [user.uid, userData.partnerId].sort()
    const pairId = `${a}_${b}`

    const q = query(
      collection(db, 'circles', 'private', pairId, 'posts'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [access, userData, user])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim() || !userData?.partnerId) return
    setPosting(true)
    try {
      const [a, b] = [user.uid, userData.partnerId].sort()
      const pairId = `${a}_${b}`
      await addDoc(collection(db, 'circles', 'private', pairId, 'posts'), {
        text: newPost.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'You',
        createdAt: serverTimestamp(),
      })
      setNewPost('')
    } catch {
      toast.error('Failed to post. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  if (userLoading || access === null) {
    return <div className="min-h-screen auth-bg flex items-center justify-center"><span className="text-white/60">Loading…</span></div>
  }

  if (!access) {
    return (
      <div className="auth-bg min-h-screen">
        <Navbar user={user} />
        <div className="pt-24 px-4 flex items-center justify-center min-h-screen">
          <div className="card text-center max-w-md">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-white mb-2">Link your partner first</h2>
            <p className="text-white/60 text-sm mb-4">
              The Private Circle is only accessible once you and your partner are linked.
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
    <div className="auth-bg min-h-screen">
      <Toaster position="top-center" />
      <Navbar user={user} />

      <div className="max-w-2xl mx-auto pt-24 px-4 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🔒</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Private Circle</h1>
            <p className="text-white/50 text-sm">Just you and your partner 💑</p>
          </div>
        </div>

        <form onSubmit={handlePost} className="card mb-6">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share something private with your partner…"
            className="input-field resize-none h-24 mb-3"
          />
          <button type="submit" disabled={posting} className="btn-primary disabled:opacity-50">
            {posting ? 'Posting…' : 'Post'}
          </button>
        </form>

        <div className="space-y-4">
          {posts.length === 0 && (
            <p className="text-white/40 text-center text-sm">No posts yet. Start sharing!</p>
          )}
          {posts.map((p) => (
            <div key={p.id} className="card">
              <p className="text-white text-sm mb-2">{p.text}</p>
              <p className="text-white/40 text-xs">{p.authorName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
