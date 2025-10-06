"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, ChevronsRight, Loader } from "lucide-react"

interface ModelResult {
  model: string
  subtitle: string
  latency: string
  tokensPerSec: string
  costPerMtok: string
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ModelResult[]>([
    { model: "gpt-5", subtitle: "Flagship", latency: "---", tokensPerSec: "---", costPerMtok: "---" },
    { model: "gpt-5-mini", subtitle: "Cost-Effective", latency: "---", tokensPerSec: "---", costPerMtok: "---" },
    { model: "gpt-4o", subtitle: "Previous Flagship", latency: "---", tokensPerSec: "---", costPerMtok: "---" },
    { model: "gpt-realtime", subtitle: "Speed-Focused", latency: "---", tokensPerSec: "---", costPerMtok: "---" },
    { model: "Claude Sonnet 4.5", subtitle: "", latency: "---", tokensPerSec: "---", costPerMtok: "---" },
    { model: "Claude Haiku 3.5", subtitle: "", latency: "---", tokensPerSec: "---", costPerMtok: "---" },
    { model: "Gemini 2.5 Pro", subtitle: "", latency: "---", tokensPerSec: "---", costPerMtok: "---" },
    { model: "DeepSeek-V3.2-Exp", subtitle: "", latency: "---", tokensPerSec: "---", costPerMtok: "---" },
  ])

  const handleRunTest = async () => {
    setLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setResults([
      { model: "gpt-5", subtitle: "Flagship", latency: "245ms", tokensPerSec: "142", costPerMtok: "$15.00" },
      { model: "gpt-5-mini", subtitle: "Cost-Effective", latency: "189ms", tokensPerSec: "178", costPerMtok: "$0.60" },
      { model: "gpt-4o", subtitle: "Previous Flagship", latency: "312ms", tokensPerSec: "98", costPerMtok: "$10.00" },
      { model: "gpt-realtime", subtitle: "Speed-Focused", latency: "98ms", tokensPerSec: "245", costPerMtok: "$8.50" },
      { model: "Claude Sonnet 4.5", subtitle: "", latency: "267ms", tokensPerSec: "125", costPerMtok: "$12.00" },
      { model: "Claude Haiku 3.5", subtitle: "", latency: "156ms", tokensPerSec: "198", costPerMtok: "$0.80" },
      { model: "Gemini 2.5 Pro", subtitle: "", latency: "289ms", tokensPerSec: "115", costPerMtok: "$7.50" },
      { model: "DeepSeek-V3.2-Exp", subtitle: "", latency: "198ms", tokensPerSec: "165", costPerMtok: "$0.30" },
    ])
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Zap className="size-6" />
            Optaimi Pulse
          </CardTitle>
          <CardDescription>
            Real-time performance and cost analysis of leading LLMs.
          </CardDescription>
          <CardAction>
            <Button variant="outline" onClick={handleRunTest} disabled={loading}>
              {loading ? (
                <>
                  <Loader className="animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <ChevronsRight />
                  Run Test
                </>
              )}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Model</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Latency</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Tokens/Sec</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Cost / Mtok</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{result.model}</span>
                        {result.subtitle && (
                          <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 tabular-nums">{result.latency}</td>
                    <td className="text-right py-3 px-4 tabular-nums">{result.tokensPerSec}</td>
                    <td className="text-right py-3 px-4 tabular-nums">{result.costPerMtok}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
