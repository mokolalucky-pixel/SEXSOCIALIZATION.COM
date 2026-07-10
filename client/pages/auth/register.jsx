import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../../firebase/firebaseConfig'
import AgeGate from '../../components/AgeGate'
import toast, { Toaster } from 'react-hot-toast'
import { differenceInYears, parseISO } from 'date-fns'

export default function RegisterPage() {
  const router = useRouter()
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm()

  const onSubmit = async (data) => {
    // Validate age on submit too (double-check)
    const age = differenceInYears(new Date(), parseISO(data.dob))
    if (age < 18) {
      toast.error('You must be at least 18 years old to register.')
      return
    }

    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = credential.user

      await updateProfile(user, { displayName: data.fullName })

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: data.fullName,
        email: data.email,
        phone: data.phone || '',
        gender: data.gender,
        dob: data.dob,
        ageVerified: true,
        partnerId: null,
        partnerLinkedAt: null,
        photoURL: '',
        joinedAt: serverTimestamp(),
      })

      toast.success('Account created! Now invite your partner 💝')
      router.push('/auth/invite')
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" />

      {!ageConfirmed && <AgeGate onConfirm={() => setAgeConfirmed(true)} />}

      <div className="max-w-md w-full card">
        <div className="text-center mb-8">
          <span className="text-4xl">💝</span>
          <h1 className="text-2xl font-bold text-white mt-2">Create your account</h1>
          <p className="text-white/60 text-sm mt-1">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#e91e8c] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full name */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              className="input-field"
              {...register('fullName', { required: 'Full name is required' })}
            />
            {errors.fullName && (
              <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
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

          {/* Phone */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Phone (optional)</label>
            <input
              type="tel"
              placeholder="+1 234 567 8900"
              className="input-field"
              {...register('phone')}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              className="input-field"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Gender</label>
            <select
              className="input-field"
              {...register('gender', { required: 'Please select your gender' })}
            >
              <option value="">Select gender…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && (
              <p className="text-red-400 text-xs mt-1">{errors.gender.message}</p>
            )}
          </div>

          {/* Date of birth */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Date of Birth (18+ only)</label>
            <input
              type="date"
              className="input-field"
              {...register('dob', {
                required: 'Date of birth is required',
                validate: (val) =>
                  differenceInYears(new Date(), parseISO(val)) >= 18 ||
                  'You must be at least 18 years old',
              })}
            />
            {errors.dob && (
              <p className="text-red-400 text-xs mt-1">{errors.dob.message}</p>
            )}
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-[#e91e8c]"
                {...register('terms', { required: 'You must accept the terms to register' })}
              />
              <span className="text-white/70 text-sm">
                I agree to the{' '}
                <a href="#" className="text-[#e91e8c] hover:underline">
                  Terms &amp; Conditions
                </a>{' '}
                and confirm I am 18+.
              </span>
            </label>
            {errors.terms && (
              <p className="text-red-400 text-xs mt-1">{errors.terms.message}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create account 💝'}
          </button>
        </form>
      </div>
    </div>
  )
}
