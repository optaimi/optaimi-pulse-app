"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, DollarSign, Gauge } from "lucide-react"
import { SettingsDrawer } from "@/components/SettingsDrawer"

const PerformanceChart = dynamic(() => import("@/components/PerformanceChart"), {
  ssr: false,
  loading: () => <div className="h-80 flex items-center justify-center text-muted-foreground">Loading chart...</div>
})

interface ModelResult {
  display_name: string
  latency_s: number
  tps: number
  cost_usd: number
  cost_gbp: number
  in_tokens: number
  out_tokens: number
  error?: string
}

interface HistoryPoint {
  ts_ms: number
  latency_s: number
  tps: number
  cost_usd: number
  in_tokens: number
  out_tokens: number
}

type TimeRange = '24h' | '7d' | '30d'
type Currency = 'GBP' | 'USD'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ModelResult[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [historyData, setHistoryData] = useState<Record<string, HistoryPoint[]>>({})
  const [enabledModels, setEnabledModels] = useState<string[]>([])
  const [currency, setCurrency] = useState<Currency>("GBP")

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedModels = localStorage.getItem("pulse.enabledModels")
      const savedCurrency = localStorage.getItem("pulse.currency")
      
      const defaultModels = ["gpt-4o-mini", "gemini-2.0-flash-exp"]
      setEnabledModels(savedModels ? JSON.parse(savedModels) : defaultModels)
      setCurrency((savedCurrency as Currency) || "GBP")
    }
  }, [])

  const handleRefresh = async () => {
    setLoading(true)

    try {
      // POST request with selected models and currency
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          models: enabledModels,
          currency: currency
        })
      });
      const data = await response.json();

      if (data.results) {
        setResults(data.results);
        await fetchHistory();
      }

    } catch (error) {
      console.error("Failed to fetch test results:", error);
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      // Fetch history for enabled models only
      const historyPromises = enabledModels.map(async (model) => {
        const response = await fetch(`/api/history?model=${model}&range=${timeRange}`)
        const data = await response.json()
        return { model, history: data.history || [] }
      })

      const historyResults = await Promise.all(historyPromises)
      const historyMap: Record<string, HistoryPoint[]> = {}
      historyResults.forEach(({ model, history }) => {
        historyMap[model] = history
      })
      setHistoryData(historyMap)
    } catch (error) {
      console.error("Failed to fetch history:", error)
    }
  }

  useEffect(() => {
    if (results.length > 0) {
      fetchHistory()
    }
  }, [timeRange, enabledModels])

  const handleSettingsChange = (settings: { enabledModels: string[]; currency: string }) => {
    setEnabledModels(settings.enabledModels)
    setCurrency(settings.currency as Currency)
  }

  // Format currency helper
  const formatCurrency = (amount: number | null | undefined, curr: Currency = currency): string => {
    if (amount === null || amount === undefined) return '---'
    
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    })
    return formatter.format(amount)
  }

  // Calculate blended cost per Mtok (respects selected currency)
  const calculateBlendedCostPerMtok = (result: ModelResult, curr: Currency = currency): number | null => {
    const cost = curr === 'GBP' ? result.cost_gbp : result.cost_usd
    if (!cost || !result.in_tokens || !result.out_tokens) return null
    const totalTokens = result.in_tokens + result.out_tokens
    if (totalTokens === 0) return null
    return (cost / totalTokens) * 1_000_000
  }

  // Average metrics calculations
  const validResults = results.filter(r => !r.error)
  
  const avgLatency = validResults.length > 0
    ? (validResults.reduce((sum, r) => sum + r.latency_s, 0) / validResults.length).toFixed(2)
    : '---'
  
  const avgTPS = validResults.length > 0
    ? (validResults.reduce((sum, r) => sum + r.tps, 0) / validResults.length).toFixed(0)
    : '---'
  
  // Avg cost per Mtok (blended across all models, respects currency)
  const blendedCosts = validResults.map(r => calculateBlendedCostPerMtok(r, currency)).filter(c => c !== null) as number[]
  const avgCostPerMtok = blendedCosts.length > 0
    ? blendedCosts.reduce((sum, c) => sum + c, 0) / blendedCosts.length
    : null

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-3 text-3xl font-bold">
                  <Image 
                    src="/logo.png" 
                    alt="Optaimi Spark Logo" 
                    width={200} 
                    height={60}
                    className="h-12 w-auto"
                  />
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Real-time performance and cost analysis of leading LLMs
                </CardDescription>
              </div>
              <CardAction>
                <div className="flex gap-2">
                  <SettingsDrawer onSettingsChange={handleSettingsChange} />
                  <Button 
                    onClick={handleRefresh} 
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Testing...' : 'Refresh'}
                  </Button>
                </div>
              </CardAction>
            </div>
          </CardHeader>
        </Card>

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Gauge className="size-4" />
                    Avg Latency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgLatency}s</div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="size-4" />
                    Avg Tokens/Sec
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgTPS}</div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="size-4" />
                    Avg Cost / Mtok
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums">
                    {avgCostPerMtok !== null ? formatCurrency(avgCostPerMtok, currency) : '---'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Performance History</CardTitle>
                  <div className="flex gap-2">
                    {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
                      <Button
                        key={range}
                        variant={timeRange === range ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange(range)}
                        className={timeRange === range ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        {range}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PerformanceChart historyData={historyData} />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Latest Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Model</th>
                        <th className="text-right py-3 px-4 font-semibold">Latency</th>
                        <th className="text-right py-3 px-4 font-semibold">Tokens/Sec</th>
                        <th className="text-right py-3 px-4 font-semibold">Cost / Mtok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{result.display_name}</span>
                              {result.error && (
                                <span className="text-xs text-red-500">{result.error}</span>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 tabular-nums">
                            {result.error ? '---' : `${result.latency_s.toFixed(2)}s`}
                          </td>
                          <td className="text-right py-3 px-4 tabular-nums">
                            {result.error ? '---' : result.tps.toFixed(0)}
                          </td>
                          <td className="text-right py-3 px-4 tabular-nums">
                            {result.error ? '---' : formatCurrency(calculateBlendedCostPerMtok(result, currency), currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {results.length === 0 && (
          <Card className="border-2">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">Click "Refresh" to run performance tests on all LLM models</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Brand Token Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded border-2 border-border" style={{ backgroundColor: '#0F172A' }} />
                <div className="text-sm">
                  <div className="font-mono font-semibold">#0F172A</div>
                  <div className="text-muted-foreground">Background</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded border-2 border-border" style={{ backgroundColor: '#E6E9EF' }} />
                <div className="text-sm">
                  <div className="font-mono font-semibold">#E6E9EF</div>
                  <div className="text-muted-foreground">Primary Text</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded border-2 border-border" style={{ backgroundColor: '#10B981' }} />
                <div className="text-sm">
                  <div className="font-mono font-semibold">#10B981</div>
                  <div className="text-muted-foreground">Accent</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
