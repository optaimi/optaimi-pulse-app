"use client"

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, Bell, BarChart3, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const handleSignUp = () => {
    window.location.href = '/api/login'
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

          <Button
            onClick={handleSignUp}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            size="lg"
          >
            Continue with Replit
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-2 text-slate-500">
                Secure authentication
              </span>
            </div>
          </div>

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
