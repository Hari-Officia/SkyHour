import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ChartCard } from './ChartCard'

interface RocPoint {
  fpr: number
  tpr: number
  threshold?: number
}

interface RocCurveChartProps {
  rocCurve?: RocPoint[]
  rocAuc?: number
  modelLabel?: string
  evalDataset?: string
  source?: string
  loading?: boolean
  error?: string | null
}

export const RocCurveChart: React.FC<RocCurveChartProps> = ({
  rocCurve,
  rocAuc = 0.6274,
  modelLabel = "Frozen V1.2.0 Test Evaluation",
  evalDataset = "591,738 Test Flights (July 2022)",
  source,
  loading,
  error
}) => {
  const isEmpty = !rocCurve || rocCurve.length === 0

  return (
    <ChartCard
      title="Receiver Operating Characteristic (ROC) Curve"
      subtitle={`${modelLabel} | ROC-AUC = ${rocAuc}`}
      explanation={`Evaluated on ${evalDataset}. Baseline random classifier is represented by the diagonal line (AUC = 0.5000).`}
      source={source || "SKYHOUR Test Evaluation Engine"}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      badgeText={`AUC ${rocAuc}`}
    >
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rocCurve} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="fpr" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'False Positive Rate (1 - Specificity)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'True Positive Rate (Recall)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              formatter={(val: any, name: any, item: any) => [`${(Number(val) * 100).toFixed(1)}%`, `${name} (Prob Threshold: ${item.payload.threshold})`]}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#475569" strokeDasharray="4 4" label={{ value: "Random Baseline (0.50)", fill: "#64748b", fontSize: 10 }} />
            <Line type="monotone" dataKey="tpr" name={`XGBoost V1.2.0 (ROC-AUC = ${rocAuc})`} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
