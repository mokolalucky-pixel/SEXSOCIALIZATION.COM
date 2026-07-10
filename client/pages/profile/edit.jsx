import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../../../firebase/firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'
import Navbar from '../../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

export default function EditProfilePage() {
  const router = useRouter()
  const [user, userLoading] = useAuthState(auth)
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/auth/login'); return }

    const loadProfile = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) return
      const data = snap.data()
      setValue('displayName', data.displayName || '')
      setPhotoPreview(data.photoURL || null)
    }
    loadProfile()
  }, [user, userLoading, router, setValue])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data) => {
    if (!user) return
    setSaving(true)
    try {
      let photoURL = user.photoURL || ''

      if (photoFile) {
        const storageRef = ref(storage, `profiles/${user.uid}/avatar`)
        await uploadBytes(storageRef, photoFile)
        photoURL = await getDownloadURL(storageRef)
      }

      await updateProfile(user, { displayName: data.displayName, photoURL })

      await updateDoc(doc(db, 'users', user.uid), {
        displayName: data.displayName,
        photoURL,
      })

      toast.success('Profile updated! ✅')
      router.push('/profile')
    } catch {
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
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
    <div className="auth-bg min-h-screen">
      <Toaster position="top-center" />
      <Navbar user={user} />

      <div className="max-w-md mx-auto pt-24 px-4 pb-12">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-[#e91e8c]/30 border-2 border-[#e91e8c] overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <label className="btn-secondary text-sm cursor-pointer">
              Change photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Display Name</label>
            <input
              type="text"
              placeholder="How you want to be known"
              className="input-field"
              {...register('displayName', { required: 'Display name is required' })}
            />
            {errors.displayName && (
              <p className="text-red-400 text-xs mt-1">{errors.displayName.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
