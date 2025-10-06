"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, RefreshCw, TrendingUp, DollarSign, Gauge } from "lucide-react"

const PerformanceChart = dynamic(() => import("@/components/PerformanceChart"), {
  ssr: false,
  loading: () => <div className="h-80 flex items-center justify-center text-muted-foreground">Loading chart...</div>
})

interface ModelResult {
  display_name: string
  latency_s: number
  tps: number
  cost_usd: number
  error?: string
}

interface HistoryPoint {
  timestamp: string
  latency_s: number
  tps: number
  cost_usd: number
}

type TimeRange = '24h' | '7d' | '30d'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ModelResult[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [historyData, setHistoryData] = useState<Record<string, HistoryPoint[]>>({})

  const handleRefresh = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/run-test');
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
      const models = ['gpt-4o-mini', 'claude-3-5-haiku-20241022', 'gemini-2.0-flash-exp', 'deepseek-chat']
      const historyPromises = models.map(async (model) => {
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
  }, [timeRange])

  const avgLatency = results.length > 0 
    ? (results.reduce((sum, r) => sum + (r.error ? 0 : r.latency_s), 0) / results.filter(r => !r.error).length).toFixed(2)
    : '---'
  
  const avgTPS = results.length > 0
    ? (results.reduce((sum, r) => sum + (r.error ? 0 : r.tps), 0) / results.filter(r => !r.error).length).toFixed(0)
    : '---'
  
  const avgCost = results.length > 0
    ? (results.reduce((sum, r) => sum + (r.error ? 0 : r.cost_usd), 0) / results.filter(r => !r.error).length).toFixed(4)
    : '---'

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-3xl font-bold">
                  <Zap className="size-8 text-emerald-500" />
                  Optaimi Pulse
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Real-time performance and cost analysis of leading LLMs
                </CardDescription>
              </div>
              <CardAction>
                <Button 
                  onClick={handleRefresh} 
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Testing...' : 'Refresh'}
                </Button>
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
                  <div className="text-3xl font-bold">${avgCost}</div>
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
                            {result.error ? '---' : `$${result.cost_usd.toFixed(4)}`}
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
      </div>
    </div>
  )
}
