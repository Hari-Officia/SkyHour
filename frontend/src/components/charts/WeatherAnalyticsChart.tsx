import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartCard } from './ChartCard'

interface WeatherCondition {
  condition: string
  flight_count: number
  avg_arrival_delay_min: number
  avg_departure_delay_min: number
  avg_wind_speed_kts: number
  avg_visibility_miles: number
  avg_temperature_c: number
}

interface WeatherAnalyticsChartProps {
  weatherConditions?: WeatherCondition[]
  source?: string
  loading?: boolean
  error?: string | null
}

export const WeatherAnalyticsChart: React.FC<WeatherAnalyticsChartProps> = ({
  weatherConditions,
  source,
  loading,
  error
}) => {
  const isEmpty = !weatherConditions || weatherConditions.length === 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Weather Conditions vs Flight Delays"
        subtitle="Average Delay Minutes by Meteorological Condition"
        explanation="Analyzes impact of meteorological conditions (Thunderstorms, Rain, Snow, Fog, Clear) on average departure and arrival delays."
        source={source || "AviationWeather.gov / OpenSky Telemetry Data"}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        badgeText="Aviation METAR"
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weatherConditions} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="condition" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="m" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${val} minutes`, name]}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="avg_departure_delay_min" name="Avg Departure Delay (min)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg_arrival_delay_min" name="Avg Arrival Delay (min)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Weather Phenomenon Sample Count"
        subtitle="Distribution of Flights by Recorded Weather Category"
        explanation="Frequency distribution of weather events during flight telemetry observations."
        source={source || "AviationWeather.gov / OpenSky Telemetry Data"}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        badgeText="METAR Samples"
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weatherConditions} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="condition" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any) => [`${val.toLocaleString()} flights`, 'Flight Count']}
              />
              <Bar dataKey="flight_count" name="Flight Count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
