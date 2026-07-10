import { useState } from 'react'
import { useRouter } from 'next/router'

/**
 * AgeGate — shown before the registration form.
 * Users must confirm they are 18+ to proceed.
 *
 * Props:
 *  onConfirm   () => void   Called when user confirms 18+
 */
export default function AgeGate({ onConfirm }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d0036]/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full card text-center">
        <div className="text-6xl mb-4">🔞</div>
        <h2 className="text-2xl font-bold text-white mb-2">Age Verification Required</h2>
        <p className="text-white/70 text-sm mb-6 leading-relaxed">
          <strong className="text-[#e91e8c]">Sexsocialization.com</strong> is an 18+ platform for
          consenting adults in committed relationships. You must confirm your age to continue.
        </p>

        <label className="flex items-start gap-3 text-left mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 w-4 h-4 accent-[#e91e8c]"
          />
          <span className="text-white/80 text-sm">
            I confirm that I am <strong className="text-white">18 years of age or older</strong> and
            agree to the Terms &amp; Conditions.
          </span>
        </label>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={!checked}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            I am 18+ — Continue
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-white/50 text-sm hover:text-white/80 transition-colors"
          >
            Leave this site
          </button>
        </div>
      </div>
    </div>
  )
}
