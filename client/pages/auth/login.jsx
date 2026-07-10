import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../firebase/firebaseConfig'
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      toast.success('Welcome back 💝')
      router.push('/')
    } catch (err) {
      toast.error('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" />

      <div className="max-w-md w-full card">
        <div className="text-center mb-8">
          <span className="text-4xl">💝</span>
          <h1 className="text-2xl font-bold text-white mt-2">Welcome back</h1>
          <p className="text-white/60 text-sm mt-1">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-[#e91e8c] hover:underline">
              Register
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="input-field"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
              })}
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Password</label>
            <input
              type="password"
              placeholder="Your password"
              className="input-field"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in 💝'}
          </button>
        </form>

        <p className="text-center text-white/40 text-xs mt-6">
          🔞 18+ platform only. By signing in you confirm you are of legal age.
        </p>
      </div>
    </div>
  )
}
