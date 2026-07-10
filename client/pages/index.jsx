import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../../firebase/firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'
import Navbar from '../components/Navbar'
import CircleCard from '../components/CircleCard'
import PartnerStatus from '../components/PartnerStatus'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function HomePage() {
  const router = useRouter()
  const [user, userLoading] = useAuthState(auth)
  const [userData, setUserData] = useState(null)
  const [partnerName, setPartnerName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      router.push('/auth/login')
      return
    }

    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (!snap.exists()) { setLoading(false); return }
        const data = snap.data()
        setUserData(data)

        if (data.partnerId) {
          const pSnap = await getDoc(doc(db, 'users', data.partnerId))
          if (pSnap.exists()) setPartnerName(pSnap.data().displayName || 'Partner')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, userLoading, router])

  if (userLoading || loading) {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center">
        <span className="text-white/60">Loading…</span>
      </div>
    )
  }

  const partnerStatus = userData?.partnerId
    ? 'connected'
    : 'none'

  const isFemale = userData?.gender === 'female'
  const isMale = userData?.gender === 'male'
  const hasPartner = !!userData?.partnerId

  // Valentine's Day check (Feb 14)
  const today = new Date()
  const isValentines = today.getMonth() === 1 && today.getDate() === 14

  return (
    <div className="auth-bg min-h-screen">
      <Toaster position="top-center" />
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto pt-24 px-4 pb-12">
        {/* Valentine's Day Banner */}
        {isValentines && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#e91e8c] to-[#c2185b] p-5 text-center shadow-lg">
            <p className="text-2xl font-bold text-white">💝 Happy Valentine&apos;s Day! 💝</p>
            <p className="text-white/80 text-sm mt-1">
              Share a nudge with your partner today — let them know you&apos;re thinking of them ❤️
            </p>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            Welcome, {userData?.displayName || user?.displayName || 'there'} 💝
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Your relationship-first social space
          </p>
        </div>

        {/* Partner status */}
        <div className="mb-8">
          <PartnerStatus status={partnerStatus} name={partnerName} />
        </div>

        {/* Quick actions */}
        {hasPartner && (
          <div className="flex gap-3 mb-8 flex-wrap">
            <Link href="/private/chat" className="btn-primary text-sm">
              💬 Open Chat
            </Link>
            <Link href="/circles/mixed-circle" className="btn-secondary text-sm">
              👫 Mixed Circle
            </Link>
          </div>
        )}

        {/* Circles */}
        <h2 className="text-lg font-bold text-white mb-4">The Four Circles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CircleCard
            title="Women's Circle"
            description="A safe space for women to share relationship advice and support."
            href="/circles/womens-circle"
            icon="👩"
            locked={!isFemale || !hasPartner}
            lockReason="Female users with a linked partner only."
          />
          <CircleCard
            title="Men's Circle"
            description="Men supporting men on partnership and relationship topics."
            href="/circles/mens-circle"
            icon="👨"
            locked={!isMale || !hasPartner}
            lockReason="Male users with a linked partner only."
          />
          <CircleCard
            title="Mixed Circle"
            description="All couples discussing relationships, intimacy, and growth together."
            href="/circles/mixed-circle"
            icon="👫"
            locked={!hasPartner}
            lockReason="Link your partner to access."
          />
          <CircleCard
            title="Private Circle"
            description="A private space just for you and your partner."
            href="/circles/private-circle"
            icon="🔒"
            locked={!hasPartner}
            lockReason="Link your partner first."
          />
        </div>
      </div>
    </div>
  )
}
