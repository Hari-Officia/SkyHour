import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartCard } from './ChartCard'

interface TamilNaduAirport {
  airport: string
  name: string
  city: string
  annual_passengers_mil: number
  monthly_flights: number
  pagerank_score: number
  skyhour_risk_score: number
  traffic_pressure_index: number
}

interface StateAviation {
  state: string
  total_airports: number
  total_annual_passengers_mil: number
  total_monthly_flights: number
}

interface IndiaAnalyticsChartProps {
  tamilNaduAirports?: TamilNaduAirport[]
  stateAnalytics?: StateAviation[]
  source?: string
  loading?: boolean
  error?: string | null
}

export const IndiaAnalyticsChart: React.FC<IndiaAnalyticsChartProps> = ({
  tamilNaduAirports,
  stateAnalytics,
  source,
  loading,
  error
}) => {
  const topStates = stateAnalytics?.slice(0, 10) || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Tamil Nadu Airport Passenger Traffic Comparison"
        subtitle="Annual Passengers (Millions) Across Tamil Nadu Hubs (MAA, CJB, TRZ, IXM)"
        explanation="Comparative analysis of passenger throughput across primary and regional hubs in Tamil Nadu."
        source={source || "Airports Authority of India (AAI) Master Intelligence"}
        loading={loading}
        error={error}
        isEmpty={!tamilNaduAirports || tamilNaduAirports.length === 0}
        badgeText="Tamil Nadu"
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tamilNaduAirports} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="airport" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="M" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, _name: any, item: any) => [`${val} Million Passengers`, `${item.payload.name} (${item.payload.city})`]}
              />
              <Bar dataKey="annual_passengers_mil" name="Annual Passengers (Mil)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="State-wise Aviation Passenger Volume"
        subtitle="Annual Passengers (Millions) by Indian State"
        explanation="Aggregated passenger movement across Indian states hosting major international & domestic aviation hubs."
        source={source || "DGCA India Master Data"}
        loading={loading}
        error={error}
        isEmpty={topStates.length === 0}
        badgeText="States"
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topStates} layout="vertical" margin={{ top: 5, right: 20, left: 65, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} unit="M" />
              <YAxis dataKey="state" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={75} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, _name: any, item: any) => [`${val} Million Pax (${item.payload.total_airports} airports)`, item.payload.state]}
              />
              <Bar dataKey="total_annual_passengers_mil" name="Annual Passengers (Mil)" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
