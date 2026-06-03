'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess('Check your email to confirm your account.')
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Card className="w-full max-w-md bg-[#111111] border-[#1f1f1f]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-[#f5f5f5]">Create account</CardTitle>
        <CardDescription className="text-[#737373]">
          Start verifying claims today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#f5f5f5]">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f5f5] placeholder:text-[#555]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#f5f5f5]">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f5f5] placeholder:text-[#555]"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}
          <Button
            type="submit"
            className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1 bg-[#2a2a2a]" />
          <span className="text-xs text-[#737373]">or continue with</span>
          <Separator className="flex-1 bg-[#2a2a2a]" />
        </div>

        <Button
          variant="outline"
          className="w-full border-[#2a2a2a] bg-[#1a1a1a] text-[#f5f5f5] hover:bg-[#222]"
          onClick={handleGoogleSignup}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-[#737373]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#6366f1] hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}