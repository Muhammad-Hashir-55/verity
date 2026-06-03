'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface NavbarProps {
  user: {
    email?: string
  }
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-xl font-bold text-[#f5f5f5]">Verity</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/history"
              className="text-sm text-[#737373] hover:text-[#f5f5f5] transition-colors"
            >
              History
            </Link>
            <span className="text-sm text-[#737373] hidden sm:inline max-w-[150px] truncate">
              {user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-[#2a2a2a] bg-[#111111] text-[#f5f5f5] hover:bg-[#1a1a1a]"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}