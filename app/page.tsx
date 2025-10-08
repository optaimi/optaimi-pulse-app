"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Bell, BarChart3 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-emerald-500" />
            <span className="text-xl font-bold">Optaimi Pulse</span>
          </div>
          <div className="flex gap-3">
            <Link href="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            Monitor Your LLM Performance in Real-Time
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Get instant alerts when latency spikes, costs surge, or errors occur across GPT-4, Claude, Gemini, and more.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
              Start Monitoring Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <Bell className="h-10 w-10 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Smart Alerts</h3>
            <p className="text-slate-400">
              Set custom thresholds for latency, TPS drops, cost per token, and errors. Get notified via email when limits are breached.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <BarChart3 className="h-10 w-10 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Performance Tracking</h3>
            <p className="text-slate-400">
              Compare latency, tokens per second, and cost across OpenAI, Anthropic, Google, and DeepSeek in real-time.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <Zap className="h-10 w-10 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Instant Insights</h3>
            <p className="text-slate-400">
              Visualize trends over 24h, 7d, or 30d. Make data-driven decisions about which models to use for your workload.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-500">
          <p>&copy; 2025 Optaimi Pulse. Monitor smarter, not harder.</p>
        </div>
      </footer>
    </div>
  )
}
