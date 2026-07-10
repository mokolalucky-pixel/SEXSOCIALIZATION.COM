import { useState } from 'react'
import { useRouter } from 'next/router'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth } from '../../../firebase/firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

export default function AcceptInvitePage() {
  const router = useRouter()
  const { inviteId } = router.query
  const [user, userLoading] = useAuthState(auth)
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const handleAccept = async () => {
    if (!user) {
      // Redirect to register/login with the invite ID preserved
      router.push(`/auth/register?inviteId=${encodeURIComponent(inviteId)}`)
      return
    }

    if (!inviteId) {
      toast.error('Invalid invite link.')
      return
    }

    setLoading(true)
    try {
      const functions = getFunctions()
      const acceptInvite = httpsCallable(functions, 'acceptPartnerInvite')
      await acceptInvite({ inviteId })
      setAccepted(true)
      toast.success("You're now connected with your partner! 💑")
      setTimeout(() => router.push('/'), 2000)
    } catch (err) {
      toast.error(err.message || 'Failed to accept invite. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center">
        <span className="text-white/60">Loading…</span>
      </div>
    )
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" />

      <div className="max-w-md w-full card text-center">
        {accepted ? (
          <>
            <div className="text-6xl mb-4">💑</div>
            <h1 className="text-2xl font-bold text-white mb-2">You&apos;re Connected!</h1>
            <p className="text-white/60 text-sm">Redirecting to your dashboard…</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">💝</div>
            <h1 className="text-2xl font-bold text-white mb-2">Partner Invite</h1>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              You&apos;ve been invited to join{' '}
              <strong className="text-[#e91e8c]">Sexsocialization.com</strong> as someone&apos;s
              partner. Accept below to link your accounts and unlock all features.
            </p>

            {!user && (
              <p className="text-yellow-300 text-xs mb-4">
                You need an account first. Accepting will take you to registration.
              </p>
            )}

            <button
              onClick={handleAccept}
              disabled={loading || !inviteId}
              className="btn-primary w-full disabled:opacity-50 mb-3"
            >
              {loading ? 'Accepting…' : '💑 Accept Invite'}
            </button>

            <Link
              href="/auth/register"
              className="block text-white/50 text-sm hover:text-white/80 transition-colors"
            >
              Create a new account instead
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
