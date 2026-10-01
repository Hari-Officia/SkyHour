import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartCard } from './ChartCard'

interface FeatureItem {
  feature: string
  importance: number
  description?: string
}

interface FeatureImportanceChartProps {
  features?: FeatureItem[]
  modelName?: string
  source?: string
  loading?: boolean
  error?: string | null
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  features,
  modelName = "XGBoost Model D (Production)",
  source,
  loading,
  error
}) => {
  const isEmpty = !features || features.length === 0

  return (
    <ChartCard
      title={`Feature Importance — ${modelName}`}
      subtitle="Gain / Split Importance Weights of Trained Predictors"
      explanation="Derived from XGBoost feature gain splits during tree gradient boosting on 2.76M training flights."
      source={source || "XGBoost Model Artifact (model_xgboost_d.json)"}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      badgeText="XGBoost D"
    >
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={features} layout="vertical" margin={{ top: 10, right: 30, left: 90, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 0.3]} />
            <YAxis dataKey="feature" type="category" stroke="#cbd5e1" tick={{ fontSize: 11, fontWeight: 'bold' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              formatter={(val: any, _name: any, item: any) => [`${(Number(val) * 100).toFixed(1)}% Weight`, item.payload.description || item.payload.feature]}
            />
            <Bar dataKey="importance" name="Relative Gain Weight" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
