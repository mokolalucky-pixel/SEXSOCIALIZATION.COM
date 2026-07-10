import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../../firebase/firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'
import Navbar from '../../components/Navbar'
import Link from 'next/link'
import { format } from 'date-fns'

export default function ProfilePage() {
  const router = useRouter()
  const [user, userLoading] = useAuthState(auth)
  const [profile, setProfile] = useState(null)
  const [partnerName, setPartnerName] = useState('')

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/auth/login'); return }

    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) return
      const data = snap.data()
      setProfile(data)

      if (data.partnerId) {
        const pSnap = await getDoc(doc(db, 'users', data.partnerId))
        if (pSnap.exists()) {
          setPartnerName(pSnap.data().displayName || 'Partner')
        }
      }
    }
    fetchProfile()
  }, [user, userLoading, router])

  if (userLoading || !profile) {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center">
        <span className="text-white/60">Loading…</span>
      </div>
    )
  }

  const joinedDate = profile.joinedAt?.toDate
    ? format(profile.joinedAt.toDate(), 'MMMM yyyy')
    : 'Recently'

  return (
    <div className="auth-bg min-h-screen">
      <Navbar user={user} />

      <div className="max-w-lg mx-auto pt-24 px-4 pb-12">
        <div className="card text-center mb-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-[#e91e8c]/30 border-2 border-[#e91e8c] mx-auto mb-4 overflow-hidden flex items-center justify-center">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
          <p className="text-white/50 text-sm mt-1">{profile.email}</p>

          <div className="flex justify-center gap-4 mt-4 text-sm">
            <span className="bg-[#e91e8c]/20 text-[#e91e8c] px-3 py-1 rounded-full capitalize">
              {profile.gender || 'Unknown'}
            </span>
            <span className="bg-white/10 text-white/60 px-3 py-1 rounded-full">
              Joined {joinedDate}
            </span>
          </div>
        </div>

        {/* Partner status */}
        <div className="card mb-6">
          <h3 className="text-sm text-white/50 uppercase tracking-widest mb-3">Partner Status</h3>
          {profile.partnerId ? (
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <p className="text-white font-medium">💑 Connected with {partnerName}</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-sm">💔 No partner linked yet</p>
              <Link href="/auth/invite" className="btn-primary text-xs py-1.5 px-4">
                Invite
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        <Link href="/profile/edit" className="btn-secondary w-full text-center block">
          ✏️ Edit Profile
        </Link>
      </div>
    </div>
  )
}
