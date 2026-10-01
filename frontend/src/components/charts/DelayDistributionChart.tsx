import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartCard } from './ChartCard'

interface DelayDistributionChartProps {
  distribution?: Array<{ name: string; value: number; pct: number; fill: string }>
  distanceBuckets?: Array<{ bucket: string; total_flights: number; delay_rate_pct: number; avg_delay_min: number }>
  source?: string
  loading?: boolean
  error?: string | null
}

export const DelayDistributionChart: React.FC<DelayDistributionChartProps> = ({
  distribution,
  distanceBuckets,
  source,
  loading,
  error
}) => {
  const isEmpty = !distribution || distribution.length === 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Overall Delay Class Distribution"
        subtitle="Delayed (ArrDel15 = 1) vs On-Time / Early Flights"
        explanation="ArrDel15 is the official DOT standard: 1 indicates arrival delay of 15 minutes or more."
        source={source}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
      >
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                label={(entry: any) => `${entry.name} (${entry.pct}%)`}
              >
                {distribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, name: any, item: any) => [`${val.toLocaleString()} flights (${item.payload.pct}%)`, name]}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Delay Rate by Route Distance Bucket"
        subtitle="Arrival Delay Rate across Flight Distance Categories"
        explanation="Categorized into Short (<500 mi), Medium (500-1200 mi), Long (1200-2000 mi), and Transcontinental (2000+ mi)."
        source={source}
        loading={loading}
        error={error}
        isEmpty={!distanceBuckets || distanceBuckets.length === 0}
      >
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distanceBuckets} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="bucket" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 40]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any) => [`${val}% Delay Rate`, 'Delay Rate']}
              />
              <Bar dataKey="delay_rate_pct" name="Delay Rate (%)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
