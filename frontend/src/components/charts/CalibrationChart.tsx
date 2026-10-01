import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ChartCard } from './ChartCard'

interface CalibrationPoint {
  predicted_prob: number
  observed_ratio: number
  sample_count?: number
}

interface CalibrationChartProps {
  calibrationCurve?: CalibrationPoint[]
  source?: string
  loading?: boolean
  error?: string | null
}

export const CalibrationChart: React.FC<CalibrationChartProps> = ({
  calibrationCurve,
  source,
  loading,
  error
}) => {
  const isEmpty = !calibrationCurve || calibrationCurve.length === 0

  return (
    <ChartCard
      title="Probability Calibration Curve"
      subtitle="Predicted Probability vs Observed Fraction of Delayed Flights"
      explanation="A perfectly calibrated model follows the 45-degree diagonal line, meaning predicted risk 30% matches 30% actual delayed flights."
      source={source || "SKYHOUR Model Calibration Engine"}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      badgeText="Brier 0.2464"
    >
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={calibrationCurve} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="predicted_prob" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Mean Predicted Probability', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'Observed Fraction of Positives', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              formatter={(val: any, _name: any, item: any) => [`${(Number(val) * 100).toFixed(1)}% Observed`, `Predicted ${(item.payload.predicted_prob * 100).toFixed(0)}% (${item.payload.sample_count?.toLocaleString() || 0} samples)`]}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#475569" strokeDasharray="4 4" label={{ value: "Perfect Calibration", fill: "#64748b", fontSize: 10 }} />
            <Line type="monotone" dataKey="observed_ratio" name="XGBoost Calibration Curve" stroke="#0284c7" strokeWidth={3} dot={{ r: 4, fill: '#0284c7' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
