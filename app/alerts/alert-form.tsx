"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

type Alert = {
  id: number
  type: 'latency' | 'tps_drop' | 'cost_mtok' | 'error' | 'digest'
  model: string | null
  threshold: string | null
  window: '7d' | '24h' | null
  cadence: '5m' | '15m' | '1h' | '4h' | '12h' | '24h'
  active: boolean
  createdAt: string
}

type AlertFormProps = {
  alert?: Alert | null
  onSuccess: () => void
}

const MODELS = [
  'gpt-4o-mini',
  'claude-3-5-haiku-20241022',
  'gemini-2.0-flash-exp',
  'deepseek-chat',
]

export function AlertForm({ alert, onSuccess }: AlertFormProps) {
  const [type, setType] = useState<string>(alert?.type || 'latency')
  const [model, setModel] = useState<string>(alert?.model || '')
  const [threshold, setThreshold] = useState<string>(alert?.threshold || '')
  const [window, setWindow] = useState<string>(alert?.window || '24h')
  const [cadence, setCadence] = useState<string>(alert?.cadence || '1h')
  const [active, setActive] = useState<boolean>(alert?.active ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (alert) {
      setType(alert.type)
      setModel(alert.model || '')
      setThreshold(alert.threshold || '')
      setWindow(alert.window || '24h')
      setCadence(alert.cadence)
      setActive(alert.active)
    } else {
      setType('latency')
      setModel('')
      setThreshold('')
      setWindow('24h')
      setCadence('1h')
      setActive(true)
    }
    setError(null)
    setTestResult(null)
  }, [alert])

  const requiresThreshold = ['latency', 'tps_drop', 'cost_mtok'].includes(type)
  const requiresWindow = type !== 'digest'

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    setError(null)

    try {
      const res = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          model: model || undefined,
          threshold: threshold || undefined,
          window: window || '24h',
        }),
      })

      const data = await res.json()
      setTestResult(data)

      if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to test alert configuration')
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        type,
        model: model || null,
        threshold: threshold || null,
        window: requiresWindow ? (window || '24h') : null,
        cadence,
        active,
      }

      const url = alert ? `/api/alerts/${alert.id}` : '/api/alerts'
      const method = alert ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save alert')
      }
    } catch (err) {
      setError('An error occurred while saving the alert')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="type">Alert Type</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mt-1 bg-slate-800 border-slate-700 rounded-md px-3 py-2 text-white"
          >
            <option value="latency">High Latency</option>
            <option value="tps_drop">TPS Drop</option>
            <option value="cost_mtok">Cost per MTok</option>
            <option value="error">Errors</option>
            <option value="digest">Daily Digest</option>
          </select>
        </div>

        <div>
          <Label htmlFor="model">Model (optional)</Label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full mt-1 bg-slate-800 border-slate-700 rounded-md px-3 py-2 text-white"
          >
            <option value="">All Models</option>
            {MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {requiresThreshold && (
          <div>
            <Label htmlFor="threshold">
              Threshold
              {type === 'latency' && ' (seconds)'}
              {type === 'tps_drop' && ' (% drop)'}
              {type === 'cost_mtok' && ' (cost per million tokens)'}
            </Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder={type === 'latency' ? '2.0' : type === 'tps_drop' ? '20' : '1.50'}
              required
            />
          </div>
        )}

        {requiresWindow && (
          <div>
            <Label htmlFor="window">Time Window</Label>
            <select
              id="window"
              value={window}
              onChange={(e) => setWindow(e.target.value)}
              className="w-full mt-1 bg-slate-800 border-slate-700 rounded-md px-3 py-2 text-white"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="cadence">Alert Cadence</Label>
          <select
            id="cadence"
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            className="w-full mt-1 bg-slate-800 border-slate-700 rounded-md px-3 py-2 text-white"
          >
            <option value="5m">Every 5 minutes</option>
            <option value="15m">Every 15 minutes</option>
            <option value="1h">Hourly</option>
            <option value="4h">Every 4 hours</option>
            <option value="12h">Every 12 hours</option>
            <option value="24h">Daily</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            checked={active}
            onCheckedChange={(checked) => setActive(checked as boolean)}
          />
          <Label htmlFor="active" className="cursor-pointer">Active</Label>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {testResult && !testResult.error && (
        <div className={`border px-4 py-3 rounded ${
          testResult.would_trigger 
            ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400'
            : 'bg-slate-800 border-slate-700 text-slate-300'
        }`}>
          <p className="font-semibold mb-2">
            {testResult.would_trigger ? '✓ Alert would trigger' : 'Alert would not trigger'}
          </p>
          {testResult.details && (
            <p className="text-sm">
              {testResult.details.comparison || 
               `${testResult.data_points} data points in ${testResult.window} window`}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={testing || loading}
          className="flex-1"
        >
          {testing ? 'Testing...' : 'Test Alert'}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600"
        >
          {loading ? 'Saving...' : alert ? 'Update Alert' : 'Create Alert'}
        </Button>
      </div>
    </form>
  )
}
