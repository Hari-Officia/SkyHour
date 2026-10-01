import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartCard } from './ChartCard'

interface AirportItem {
  airport: string
  city: string
  flight_volume: number
  delay_rate_pct: number
  avg_delay_min?: number
}

interface AirportAnalyticsChartProps {
  airports?: AirportItem[]
  source?: string
  loading?: boolean
  error?: string | null
}

export const AirportAnalyticsChart: React.FC<AirportAnalyticsChartProps> = ({
  airports,
  source,
  loading,
  error
}) => {
  const isEmpty = !airports || airports.length === 0
  const topAirports = airports?.slice(0, 15) || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Top 15 Origin Airports by Flight Traffic"
        subtitle="Departure Volume Across Major Hub Airports"
        explanation="Airport traffic volume computed from origin flight records."
        source={source}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAirports} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="airport" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, _name: any, item: any) => [`${val.toLocaleString()} departures`, `${item.payload.airport} (${item.payload.city})`]}
              />
              <Bar dataKey="flight_volume" name="Flight Volume" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Airport Arrival Delay Rates"
        subtitle="Percentage of Delayed Departures by Airport"
        explanation="Comparison of historical delay rates across high-volume hub airports."
        source={source}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAirports} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="airport" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 40]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, _name: any, item: any) => [`${val}% Delay Rate`, `${item.payload.airport} (${item.payload.city})`]}
              />
              <Bar dataKey="delay_rate_pct" name="Delay Rate (%)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
