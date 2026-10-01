import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ChartCard } from './ChartCard'

interface SweepItem {
  threshold: number
  precision: number
  recall: number
  f1: number
  specificity: number
  balanced_accuracy: number
}

interface ThresholdSweepChartProps {
  sweepData?: SweepItem[]
  selectedThreshold?: number
  source?: string
  loading?: boolean
  error?: string | null
}

export const ThresholdSweepChart: React.FC<ThresholdSweepChartProps> = ({
  sweepData,
  selectedThreshold = 0.50,
  source,
  loading,
  error
}) => {
  const isEmpty = !sweepData || sweepData.length === 0

  return (
    <ChartCard
      title="Operational Probability Threshold Trade-Off Sweep"
      subtitle="Evaluating Classification Metrics Across Thresholds (0.20 to 0.70)"
      explanation="Demonstrates the trade-off between Recall (catching delayed flights early) and Precision (minimizing false alarms). Selected operational threshold is 0.50."
      source={source || "SKYHOUR Threshold Trade-Off Analysis (R Script 10)"}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      badgeText="Sweep 0.20–0.70"
    >
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sweepData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="threshold" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Classification Probability Threshold', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              formatter={(val: any, name: any) => [`${val}%`, name]}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine x={selectedThreshold} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: `Threshold (${selectedThreshold})`, fill: "#3b82f6", fontSize: 10 }} />
            <Line type="monotone" dataKey="precision" name="Precision (%)" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="recall" name="Recall (%)" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="f1" name="F1 Score (%)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="specificity" name="Specificity (%)" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} />
            <Line type="monotone" dataKey="balanced_accuracy" name="Balanced Accuracy (%)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
