import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ChartCard } from './ChartCard'

interface PrPoint {
  recall: number
  precision: number
  threshold?: number
}

interface PrecisionRecallChartProps {
  prCurve?: PrPoint[]
  prAuc?: number
  baselinePrior?: number
  modelLabel?: string
  evalDataset?: string
  source?: string
  loading?: boolean
  error?: string | null
}

export const PrecisionRecallChart: React.FC<PrecisionRecallChartProps> = ({
  prCurve,
  prAuc = 0.3072,
  baselinePrior = 0.2341,
  modelLabel = "Frozen V1.2.0 Test Evaluation",
  evalDataset = "591,738 Test Flights (23.41% Delay Class Prior)",
  source,
  loading,
  error
}) => {
  const isEmpty = !prCurve || prCurve.length === 0

  return (
    <ChartCard
      title="Precision-Recall (PR) Curve"
      subtitle={`${modelLabel} (${evalDataset}) | PR-AUC = ${prAuc}`}
      explanation={`Critical for imbalanced delay prediction. Baseline horizontal line represents positive class prior probability (${(baselinePrior * 100).toFixed(1)}%).`}
      source={source || "SKYHOUR Test Evaluation Engine"}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      badgeText={`PR-AUC ${prAuc}`}
    >
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={prCurve} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="recall" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Recall (Sensitivity)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'Precision (Positive Predictive Value)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              formatter={(val: any, name: any, item: any) => [`${(Number(val) * 100).toFixed(1)}%`, `${name} (Prob Threshold: ${item.payload.threshold})`]}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine y={baselinePrior} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Baseline Prior (${(baselinePrior * 100).toFixed(1)}%)`, fill: "#f59e0b", fontSize: 10 }} />
            <Line type="monotone" dataKey="precision" name={`XGBoost Model D (PR-AUC = ${prAuc})`} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
