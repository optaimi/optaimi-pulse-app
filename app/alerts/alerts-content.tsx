"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Bell, BellOff, Trash2, Edit } from 'lucide-react'
import { AlertForm } from './alert-form'

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

const ALERT_TYPE_LABELS = {
  latency: 'High Latency',
  tps_drop: 'TPS Drop',
  cost_mtok: 'Cost per MTok',
  error: 'Errors',
  digest: 'Daily Digest',
}

const CADENCE_LABELS = {
  '5m': 'Every 5 minutes',
  '15m': 'Every 15 minutes',
  '1h': 'Hourly',
  '4h': 'Every 4 hours',
  '12h': 'Every 12 hours',
  '24h': 'Daily',
}

export function AlertsContent() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts()
    }
  }, [isAuthenticated])

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (alertId: number) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId))
      }
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  const handleToggleActive = async (alert: Alert) => {
    try {
      const res = await fetch(`/api/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !alert.active }),
      })

      if (res.ok) {
        const updated = await res.json()
        setAlerts(alerts.map(a => a.id === alert.id ? updated : a))
      }
    } catch (error) {
      console.error('Error toggling alert:', error)
    }
  }

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert)
    setDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setDialogOpen(false)
    setEditingAlert(null)
    fetchAlerts()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Alert Configuration</h1>
            <p className="text-slate-400">Set up alerts for your LLM performance metrics</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingAlert(null)
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="mr-2 h-4 w-4" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAlert ? 'Edit Alert' : 'Create New Alert'}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {editingAlert ? 'Update your alert configuration' : 'Configure a new alert for your LLM metrics'}
                </DialogDescription>
              </DialogHeader>
              <AlertForm alert={editingAlert} onSuccess={handleFormSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {alerts.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="h-16 w-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No alerts configured</h3>
              <p className="text-slate-400 mb-4">Create your first alert to start monitoring your LLM performance</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="bg-slate-900 border-slate-800 text-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {alert.active ? (
                        <Bell className="h-5 w-5 text-emerald-500 mt-1" />
                      ) : (
                        <BellOff className="h-5 w-5 text-slate-600 mt-1" />
                      )}
                      <div>
                        <CardTitle className="text-lg mb-1">
                          {ALERT_TYPE_LABELS[alert.type]}
                          {alert.model && <span className="text-slate-400 font-normal ml-2">({alert.model})</span>}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          {alert.type !== 'digest' && alert.type !== 'error' && alert.threshold && (
                            <span className="mr-4">Threshold: {alert.threshold}{alert.type === 'latency' ? 's' : alert.type === 'tps_drop' ? '%' : ''}</span>
                          )}
                          {alert.window && <span className="mr-4">Window: {alert.window}</span>}
                          <span>Cadence: {CADENCE_LABELS[alert.cadence]}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(alert)}
                        className="text-slate-400 hover:text-white"
                      >
                        {alert.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(alert)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(alert.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
