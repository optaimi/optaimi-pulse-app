"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface HistoryPoint {
  timestamp: string
  latency_s: number
  tps: number
  cost_usd: number
}

interface PerformanceChartProps {
  historyData: Record<string, HistoryPoint[]>
}

const modelColors: Record<string, string> = {
  'gpt-4o-mini': '#10b981',
  'claude-3-5-haiku-20241022': '#f59e0b',
  'gemini-2.0-flash-exp': '#3b82f6',
  'deepseek-chat': '#8b5cf6',
}

const modelNames: Record<string, string> = {
  'gpt-4o-mini': 'GPT-4o Mini',
  'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
  'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  'deepseek-chat': 'DeepSeek',
}

export default function PerformanceChart({ historyData }: PerformanceChartProps) {
  const allTimestamps = new Set<string>()
  Object.values(historyData).forEach(history => {
    history.forEach(point => allTimestamps.add(point.timestamp))
  })

  const sortedTimestamps = Array.from(allTimestamps).sort()

  const chartData = sortedTimestamps.map(timestamp => {
    const dataPoint: any = { timestamp: new Date(timestamp).toLocaleString() }
    
    Object.entries(historyData).forEach(([model, history]) => {
      const point = history.find(p => p.timestamp === timestamp)
      if (point) {
        dataPoint[`${model}_latency`] = point.latency_s
        dataPoint[`${model}_tps`] = point.tps
      }
    })
    
    return dataPoint
  })

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No historical data available yet. Run a test to start collecting data.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Latency (seconds)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="timestamp" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            {Object.keys(historyData).map(model => (
              <Line
                key={`${model}_latency`}
                type="monotone"
                dataKey={`${model}_latency`}
                stroke={modelColors[model]}
                name={modelNames[model]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Tokens per Second</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="timestamp" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            {Object.keys(historyData).map(model => (
              <Line
                key={`${model}_tps`}
                type="monotone"
                dataKey={`${model}_tps`}
                stroke={modelColors[model]}
                name={modelNames[model]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
