"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, ChevronsRight, Loader } from "lucide-react"

interface ModelResult {
  name: string
  latency: string
  tps: string
  cost: string
}

const initialResults: ModelResult[] = [
    { name: 'gpt-5', latency: '---', tps: '---', cost: '---' },
    { name: 'gpt-5-mini', latency: '---', tps: '---', cost: '---' },
    { name: 'gpt-4o', latency: '---', tps: '---', cost: '---' },
    { name: 'gpt-realtime', latency: '---', tps: '---', cost: '---' },
    { name: 'Claude Sonnet 4.5', latency: '---', tps: '---', cost: '---' },
    { name: 'Claude Haiku 3.5', latency: '---', tps: '---', cost: '---' },
    { name: 'Gemini 2.5 Pro', latency: '---', tps: '---', cost: '---' },
    { name: 'DeepSeek-V3.2-Exp', latency: '---', tps: '---', cost: '---' },
]

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(initialResults)

  const handleRunTest = async () => {
    setLoading(true)

    try {
      const backendUrl = `${window.location.protocol}//${window.location.hostname}:8000/api/run-test`;
      const response = await fetch(backendUrl);
      const data = await response.json();

      const formattedResults = data.results.map((result: any) => ({
        name: result.name,
        latency: result.latency,
        tps: result.tps,
        cost: result.cost,
      }));

      setResults(formattedResults);

    } catch (error) {
      console.error("Failed to fetch test results:", error);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Zap className="size-6" />
                Optaimi Pulse
              </CardTitle>
              <CardDescription>
                Real-time performance and cost analysis of leading LLMs.
              </CardDescription>
            </div>
            <CardAction>
              <Button variant="outline" onClick={handleRunTest} disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <ChevronsRight className="mr-2" />
                    Run Test
                  </>
                )}
              </Button>
            </CardAction>
          </div>
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
                        <span className="font-medium">{result.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 tabular-nums">{result.latency}</td>
                    <td className="text-right py-3 px-4 tabular-nums">{result.tps}</td>
                    <td className="text-right py-3 px-4 tabular-nums">{result.cost}</td>
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