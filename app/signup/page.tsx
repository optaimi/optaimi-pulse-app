"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Bell, BarChart3, TrendingUp, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (err) {
      setError('Failed to create account. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <Mail className="h-6 w-6 text-emerald-500" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a verification link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-sm text-emerald-500">
                Please check your email ({email}) and click the verification link to activate your account.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                The link will expire in 1 hour.
              </p>
            </div>
            <Link href="/signin">
              <Button variant="outline" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <Zap className="h-6 w-6 text-emerald-500" />
          </div>
          <CardTitle>Get started with Optaimi Pulse</CardTitle>
          <CardDescription>
            Start monitoring your LLM performance today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <Bell className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-200">Smart Alerts</h4>
                <p className="text-xs text-slate-400">Get notified when metrics breach thresholds</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-200">Real-time Tracking</h4>
                <p className="text-xs text-slate-400">Monitor latency, TPS, and costs live</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-200">Historical Insights</h4>
                <p className="text-xs text-slate-400">Analyze trends over 24h, 7d, or 30d</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-slate-400">
                Must be at least 8 characters with letters and numbers
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/signin" className="text-emerald-500 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
