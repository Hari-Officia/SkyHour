import { Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { ChartCard } from './ChartCard'

interface HourItem {
  hour: number
  label: string
  flight_volume: number
  delay_rate_pct: number
}

interface MonthItem {
  month: number
  month_name: string
  flight_volume: number
  delay_rate_pct: number
}

interface DayItem {
  day_of_week: number
  day_name: string
  flight_volume: number
  delay_rate_pct: number
}

interface TimeTrendChartProps {
  byHour?: HourItem[]
  byMonth?: MonthItem[]
  byDayOfWeek?: DayItem[]
  source?: string
  loading?: boolean
  error?: string | null
}

export const TimeTrendChart: React.FC<TimeTrendChartProps> = ({
  byHour,
  byMonth,
  byDayOfWeek,
  source,
  loading,
  error
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Delay Rate by Departure Hour"
          subtitle="Hourly Operational Risk & Flight Density (00:00 - 23:00)"
          explanation="Demonstrates how delay probabilities compound throughout the operational day."
          source={source}
          loading={loading}
          error={error}
          isEmpty={!byHour || byHour.length === 0}
        >
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={byHour} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 11 }} unit="%" domain={[0, 45]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [name.includes('Rate') ? `${val}%` : val.toLocaleString(), name]}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="flight_volume" name="Flight Volume" fill="#1e293b" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="delay_rate_pct" name="Delay Rate (%)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Monthly Delay Trend"
          subtitle="Monthly Flight Volume & Arrival Delay Rate"
          explanation="Seasonal fluctuations in delay rates across winter, summer peak travel periods."
          source={source}
          loading={loading}
          error={error}
          isEmpty={!byMonth || byMonth.length === 0}
        >
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={byMonth} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month_name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#0ea5e9" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fontSize: 11 }} unit="%" domain={[0, 35]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [name.includes('Rate') ? `${val}%` : val.toLocaleString(), name]}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="flight_volume" name="Flight Volume" fill="#0f172a" stroke="#334155" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="delay_rate_pct" name="Delay Rate (%)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Delay Rate by Day of Week"
        subtitle="Weekly Operations & Delay Rate Comparison (Monday - Sunday)"
        explanation="Evaluates day-of-week schedule impact on arrival delays."
        source={source}
        loading={loading}
        error={error}
        isEmpty={!byDayOfWeek || byDayOfWeek.length === 0}
      >
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDayOfWeek} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day_name" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 35]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, _name: any, item: any) => [`${val}% Delay Rate (${item.payload.flight_volume.toLocaleString()} flights)`, item.payload.day_name]}
              />
              <Bar dataKey="delay_rate_pct" name="Delay Rate (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
