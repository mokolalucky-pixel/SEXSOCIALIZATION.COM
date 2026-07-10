import Link from 'next/link'
import { useRouter } from 'next/router'
import { auth } from '../../firebase/firebaseConfig'
import { signOut } from 'firebase/auth'
import toast from 'react-hot-toast'

export default function Navbar({ user }) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/auth/login')
    } catch {
      toast.error('Failed to sign out. Please try again.')
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2d0036]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">💝</span>
          <span className="font-bold text-white text-sm md:text-base tracking-tight">
            Sexsocialization
          </span>
        </Link>

        {/* Links (hidden on mobile — could add hamburger) */}
        {user && (
          <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <Link href="/circles/mixed-circle" className="hover:text-[#e91e8c] transition-colors">
              Mixed Circle
            </Link>
            <Link href="/circles/womens-circle" className="hover:text-[#e91e8c] transition-colors">
              Women&apos;s
            </Link>
            <Link href="/circles/mens-circle" className="hover:text-[#e91e8c] transition-colors">
              Men&apos;s
            </Link>
            <Link href="/circles/private-circle" className="hover:text-[#e91e8c] transition-colors">
              Private
            </Link>
            <Link href="/private/chat" className="hover:text-[#e91e8c] transition-colors">
              💬 Chat
            </Link>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile" className="text-white/80 hover:text-white text-sm transition-colors">
                👤 Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-[#e91e8c] border border-[#e91e8c] rounded-full px-4 py-1.5 hover:bg-[#e91e8c] hover:text-white transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
