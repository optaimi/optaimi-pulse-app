"use client"

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Mail } from 'lucide-react'
import Link from 'next/link'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState('')

  const verified = searchParams?.get('verified')
  const errorParam = searchParams?.get('error')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to sign in')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Failed to sign in. Please try again.')
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send magic link')
        setLoading(false)
        return
      }

      setMagicLinkSent(true)
      setLoading(false)
    } catch (err) {
      setError('Failed to send magic link. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <Zap className="h-6 w-6 text-emerald-500" />
          </div>
          <CardTitle>Sign in to Optaimi Pulse</CardTitle>
          <CardDescription>
            Monitor your LLM performance in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-500">
              Email verified successfully! You can now sign in.
            </div>
          )}

          {errorParam === 'invalid_token' && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
              Invalid or expired verification link.
            </div>
          )}

          {errorParam === 'token_expired' && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
              Verification link has expired. Please request a new one.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
              {error}
            </div>
          )}

          {magicLinkSent ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <Mail className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-emerald-500">
                  Check your email for a magic link to sign in.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  The link will expire in 15 minutes.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setMagicLinkSent(false)}
                className="w-full"
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/reset-password"
                    className="text-xs text-emerald-500 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          )}

          {!magicLinkSent && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-950 px-2 text-slate-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleMagicLink}
                className="w-full"
                disabled={loading}
              >
                <Mail className="mr-2 h-4 w-4" />
                {loading ? 'Sending...' : 'Email magic link'}
              </Button>

              <div className="text-center text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-emerald-500 hover:underline">
                  Sign up
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
