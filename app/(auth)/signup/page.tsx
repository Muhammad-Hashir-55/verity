import Link from 'next/link'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#737373] hover:text-[#f5f5f5] transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <span className="text-white font-bold text-xs">V</span>
          </div>
          <span className="text-sm font-medium">Home</span>
        </Link>
      </div>
      <SignupForm />
    </div>
  )
}
