import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartCard } from './ChartCard'

interface CarrierItem {
  airline: string
  code: string
  flight_volume: number
  delay_rate_pct: number
  cancellation_rate_pct?: number
  diversion_rate_pct?: number
  avg_delay_min?: number
}

interface CarrierAnalyticsChartProps {
  carriers?: CarrierItem[]
  source?: string
  loading?: boolean
  error?: string | null
}

export const CarrierAnalyticsChart: React.FC<CarrierAnalyticsChartProps> = ({
  carriers,
  source,
  loading,
  error
}) => {
  const isEmpty = !carriers || carriers.length === 0
  const topCarriers = carriers?.slice(0, 12) || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Airline Flight Volume"
        subtitle="Total Operated Flights by Carrier"
        explanation="Flight count aggregated directly across 4.08 million records."
        source={source}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCarriers} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis dataKey="code" type="category" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 'bold' }} width={35} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, _name: any, item: any) => [`${val.toLocaleString()} flights`, item.payload.airline]}
              />
              <Bar dataKey="flight_volume" name="Flight Volume" fill="#0284c7" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Airline Delay & Cancellation Rates"
        subtitle="Arrival Delay Rate (>=15 min) and Cancellation Rate by Carrier"
        explanation="Neutral operational performance metrics calculated strictly from historical flight logs."
        source={source}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCarriers} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="code" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 45]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, name: any, item: any) => [`${val}%`, `${name} (${item.payload.airline})`]}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="delay_rate_pct" name="Delay Rate (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              {topCarriers.some(c => c.cancellation_rate_pct !== undefined) && (
                <Bar dataKey="cancellation_rate_pct" name="Cancellation Rate (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
