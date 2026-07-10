import { useState } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth } from '../../../firebase/firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'
import toast, { Toaster } from 'react-hot-toast'
import Navbar from '../../components/Navbar'

export default function InvitePage() {
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    setLoading(true)
    try {
      const functions = getFunctions()
      const sendInvite = httpsCallable(functions, 'sendPartnerInvite')
      await sendInvite({ recipientEmail: data.partnerEmail })
      toast.success(`Invite sent to ${data.partnerEmail} 💌`)
      setTimeout(() => router.push('/'), 1500)
    } catch (err) {
      toast.error(err.message || 'Failed to send invite. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg min-h-screen">
      <Toaster position="top-center" />
      <Navbar user={user} />

      <div className="pt-24 px-4 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full card">
          <div className="text-center mb-8">
            <span className="text-4xl">💌</span>
            <h1 className="text-2xl font-bold text-white mt-2">Invite Your Partner</h1>
            <p className="text-white/60 text-sm mt-1 leading-relaxed">
              Enter your partner&apos;s email address to send them an invitation. They&apos;ll need
              to accept before you can start chatting.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Partner&apos;s Email Address
              </label>
              <input
                type="email"
                placeholder="partner@example.com"
                className="input-field"
                {...register('partnerEmail', {
                  required: 'Partner email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                })}
              />
              {errors.partnerEmail && (
                <p className="text-red-400 text-xs mt-1">{errors.partnerEmail.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Sending invite…' : 'Send invite 💌'}
            </button>
          </form>

          <p className="text-center text-white/40 text-xs mt-6">
            Your partner will receive an email with a link to join and connect with you.
          </p>
        </div>
      </div>
    </div>
  )
}
