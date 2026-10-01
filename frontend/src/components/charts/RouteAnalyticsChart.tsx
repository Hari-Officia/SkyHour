import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartCard } from './ChartCard'

interface RouteItem {
  route: string
  origin: string
  destination: string
  flight_volume: number
  delay_rate_pct: number
  distance_miles?: number
}

interface RouteAnalyticsChartProps {
  routes?: RouteItem[]
  topDelayedRoutes?: Array<{ route: string; origin: string; destination: string; total_flights: number; delay_rate_pct: number }>
  source?: string
  loading?: boolean
  error?: string | null
}

export const RouteAnalyticsChart: React.FC<RouteAnalyticsChartProps> = ({
  routes,
  topDelayedRoutes,
  source,
  loading,
  error
}) => {
  const topVolumeRoutes = routes?.slice(0, 15) || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Top 15 High-Volume Flight Routes"
        subtitle="Route Flight Volume (Origin to Destination Pair)"
        explanation="Origin-destination corridor traffic aggregated over historical period."
        source={source}
        loading={loading}
        error={error}
        isEmpty={!routes || routes.length === 0}
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topVolumeRoutes} margin={{ top: 10, right: 10, left: 0, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="route" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, _name: any, item: any) => [`${val.toLocaleString()} flights`, `Route ${item.payload.route}`]}
              />
              <Bar dataKey="flight_volume" name="Flight Volume" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Top Delayed High-Volume Routes"
        subtitle="Routes (>=500 Flights) with Highest Delay Rates"
        explanation="Identification of operational bottleneck corridors where delay rates are highest."
        source={source}
        loading={loading}
        error={error}
        isEmpty={!topDelayedRoutes || topDelayedRoutes.length === 0}
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topDelayedRoutes} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="route" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 50]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, _name: any, item: any) => [`${val}% Delay Rate (${item.payload.total_flights.toLocaleString()} flights)`, `Route ${item.payload.route}`]}
              />
              <Bar dataKey="delay_rate_pct" name="Delay Rate (%)" fill="#ec4899" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
