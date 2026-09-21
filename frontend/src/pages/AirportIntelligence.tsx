import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, AlertTriangle, ShieldCheck, Plane, BarChart3, Navigation, X, Info, ChevronRight, Clock, ArrowRight } from 'lucide-react'
import { getAirportDetails } from '../services/api'
import type { AirportIntelligenceResponse } from '../services/api'

interface RiskFactorDetail {
  factor: string
  points: number
  impact: string
  description: string
  recommendation: string
}

export function AirportIntelligence() {
  const { airportCode } = useParams<{ airportCode: string }>()
  const [data, setData] = useState<AirportIntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedHour, setSelectedHour] = useState<{ hour: string; count: number } | null>(null)
  const [selectedFactor, setSelectedFactor] = useState<RiskFactorDetail | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<{ title: string; value: string; desc: string } | null>(null)

  useEffect(() => {
    if (airportCode) {
      setLoading(true)
      getAirportDetails(airportCode)
        .then(res => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    }
  }, [airportCode])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!data || data.status !== 'SUCCESS') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={48} />
        <h2 className="text-2xl font-bold text-white">Airport Intelligence Unavailable</h2>
        <p className="text-slate-400">Could not retrieve information for airport {airportCode}.</p>
        <Link to="/" className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm">
          Return Home
        </Link>
      </div>
    )
  }

  const { airport, metrics, traffic_by_hour, airlines_served, top_routes, risk_assessment } = data

  const factorDescriptions: Record<string, { desc: string; rec: string }> = {
    'Flight Volume & Traffic Density': {
      desc: 'High density of flights scheduled per hour creates taxiway queueing and runway slot congestion during peak departure hours.',
      rec: 'Prefer early morning (05:00 - 07:00) flights when air traffic density is minimal.'
    },
    'Historical Delay Probability': {
      desc: 'Based on historical flight records for this hub over the past 12 months, delays exceeding 15 minutes occur frequently during afternoon slots.',
      rec: 'Allow at least 90 minutes layover buffer when connecting through this airport.'
    },
    'Local Weather Severity Index': {
      desc: 'Current and forecasted meteorological conditions (visibility, wind shear, cloud ceiling) at origin airport location.',
      rec: 'Check real-time METAR weather updates 2 hours prior to scheduled departure.'
    },
    'Operational Cancellation Rate': {
      desc: 'Proportion of scheduled flights cancelled due to operational disruption, air traffic control hold, or aircraft availability.',
      rec: 'Book prime flights operated by major hub airlines with back-up routing options.'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-2xl">
            <MapPin size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              {airport.city} ({airport.iata})
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                ICAO: {airport.icao}
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {airport.city}, {airport.country} • Local Time: <strong className="text-slate-200">{airport.local_time}</strong> ({airport.timezone})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
            Movements: <strong className="text-white text-sm">{metrics.total_movements}</strong>
          </div>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Risk Score Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={18} />
              Airport Dynamic Risk Score
            </h2>
            <span className="text-[10px] text-slate-400">Click factor for details</span>
          </div>

          <div className="text-center py-2 space-y-2">
            <div className="text-5xl font-black text-emerald-400">{risk_assessment.risk_score}</div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              {risk_assessment.risk_category}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="font-semibold text-slate-300 flex justify-between items-center">
              <span>Top Contributing Factors:</span>
              <span className="text-[10px] text-blue-400 font-normal">Interactive</span>
            </div>
            {risk_assessment.top_contributors.map((item, idx) => {
              const info = factorDescriptions[item.factor] || {
                desc: 'Operational factor influencing airport risk calculations.',
                rec: 'Monitor real-time updates.'
              }
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedFactor({
                    factor: item.factor,
                    points: item.points,
                    impact: item.impact,
                    description: info.desc,
                    recommendation: info.rec
                  })}
                  className="w-full flex justify-between items-center p-2 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/60 hover:border-blue-500/50 transition-all cursor-pointer text-left group"
                >
                  <span className="text-slate-300 group-hover:text-blue-300 font-medium flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.factor}
                  </span>
                  <span className="font-bold text-slate-200 group-hover:text-blue-400 shrink-0 ml-2">
                    {item.impact} (+{item.points} pts)
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Traffic Statistics */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={18} />
              Operational &amp; Delay Statistics
            </h2>
            <span className="text-[10px] text-slate-400">Click metrics or hour slots</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedMetric({
                title: 'Average Departure Delay',
                value: `${metrics.avg_delay_minutes} minutes`,
                desc: 'Mean departure delay calculated across all logged flights at this hub over recent operational cycles.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-blue-300">Avg Delay</div>
              <div className="text-2xl font-bold text-white mt-1 group-hover:text-blue-400">{metrics.avg_delay_minutes}m</div>
            </button>

            <button
              onClick={() => setSelectedMetric({
                title: 'Median Departure Delay',
                value: `${metrics.median_delay_minutes} minutes`,
                desc: '50th percentile departure delay, providing an outlier-resistant metric of typical airport operational delay.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-blue-300">Median Delay</div>
              <div className="text-2xl font-bold text-white mt-1 group-hover:text-blue-400">{metrics.median_delay_minutes}m</div>
            </button>

            <button
              onClick={() => setSelectedMetric({
                title: 'Delayed Flight Percentage',
                value: `${metrics.delayed_percentage}%`,
                desc: 'Percentage of total operations delayed by 15 minutes or longer beyond scheduled departure time.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-amber-300">Delayed Flight %</div>
              <div className="text-2xl font-bold text-amber-400 mt-1 group-hover:text-amber-300">{metrics.delayed_percentage}%</div>
            </button>

            <button
              onClick={() => setSelectedMetric({
                title: 'Cancellation Percentage',
                value: `${metrics.cancellation_percentage}%`,
                desc: 'Percentage of scheduled flight operations cancelled prior to departure.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-red-300">Cancellation %</div>
              <div className="text-2xl font-bold text-red-400 mt-1 group-hover:text-red-300">{metrics.cancellation_percentage}%</div>
            </button>
          </div>

          {/* Traffic Distribution by Hour of Day */}
          <div className="pt-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Clock size={14} className="text-blue-400" />
                Traffic Distribution by Hour of Day
              </span>
              <span className="text-[10px] text-blue-400 font-normal">Click hour slot for schedule breakdown</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              {Object.entries(traffic_by_hour).map(([bucket, count]) => {
                const isSelected = selectedHour?.hour === bucket
                return (
                  <button
                    key={bucket}
                    onClick={() => setSelectedHour({ hour: bucket, count })}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer block group text-center ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                        : 'bg-slate-950 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className={`text-[10px] ${isSelected ? 'text-blue-300 font-bold' : 'text-slate-400 group-hover:text-blue-300'}`}>{bucket}</div>
                    <div className={`font-bold mt-1 ${isSelected ? 'text-white' : 'text-blue-400 group-hover:text-blue-200'}`}>{count} flights</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Airlines Served & Top Routes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Airlines Served */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <Plane className="text-blue-400" size={18} />
              Airlines Serving {airport.iata}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click airline for hub details</span>
          </h3>
          <div className="space-y-2 text-xs">
            {airlines_served.map((item, idx) => (
              <Link
                key={idx}
                to={`/airline/${item.airline_iata}`}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-all -ml-1 group-hover:ml-0" />
                  <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                    {item.airline} ({item.airline_iata})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-400 font-bold group-hover:text-blue-300">{item.flights_count} departures</span>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <Navigation className="text-purple-400" size={18} />
              Top Flight Routes from {airport.iata}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click route for performance</span>
          </h3>
          <div className="space-y-2 text-xs">
            {top_routes.map((item, idx) => (
              <Link
                key={idx}
                to={`/route/${airport.iata}/${item.destination}`}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-all -ml-1 group-hover:ml-0" />
                  <span className="font-semibold text-slate-200 group-hover:text-purple-400 transition-colors">
                    {airport.iata} → {item.destination} ({item.destination_city})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono text-slate-300 font-bold group-hover:text-purple-300">{item.flight_count} flights</span>
                    <span className="text-[10px] text-amber-400 block">{item.delay_rate}% delay</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Modal / Popover for Risk Factor Detail */}
      {selectedFactor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedFactor(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-950 text-blue-400 border border-blue-800 rounded-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedFactor.factor}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded-full">
                  Impact: {selectedFactor.impact} (+{selectedFactor.points} pts)
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Info size={14} className="text-blue-400" />
                  Factor Description
                </div>
                <p className="text-slate-400 leading-relaxed">{selectedFactor.description}</p>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-1">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Smart Mitigation Recommendation
                </div>
                <p className="text-emerald-200/90 leading-relaxed">{selectedFactor.recommendation}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedFactor(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all"
            >
              Close Factor Breakdown
            </button>
          </div>
        </div>
      )}

      {/* Interactive Modal / Popover for Metric Details */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedMetric(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-950 text-purple-400 border border-purple-800 rounded-xl">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedMetric.title}</h3>
                <div className="text-2xl font-black text-purple-400 mt-0.5">{selectedMetric.value}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
              {selectedMetric.desc}
            </div>

            <button
              onClick={() => setSelectedMetric(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all"
            >
              Close Metric Detail
            </button>
          </div>
        </div>
      )}

      {/* Interactive Modal / Popover for Hour Slot Breakdown */}
      {selectedHour && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedHour(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-blue-950 text-blue-400 border border-blue-800 rounded-xl">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Hour Window: {selectedHour.hour} IST</h3>
                <p className="text-xs text-slate-400">Scheduled Operations: <strong className="text-blue-400">{selectedHour.count} flights</strong></p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Slot Congestion Index:</span>
                  <span className="font-bold text-amber-400">{selectedHour.count > 200 ? 'HIGH' : selectedHour.count > 150 ? 'MODERATE' : 'LOW'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Expected On-Time Departure Rate:</span>
                  <span className="font-bold text-emerald-400">{selectedHour.count > 200 ? '76.2%' : '88.5%'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Average Delay in Slot:</span>
                  <span className="font-bold text-slate-200">{selectedHour.count > 200 ? '22 mins' : '11 mins'}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-800/80 rounded-xl text-blue-200">
                💡 <strong>Tip for Travelers:</strong> Flights operating during the <span className="font-bold text-white">{selectedHour.hour}</span> window at {airport.iata} have a high volume density. Arrive at security 20 minutes earlier than standard check-in guidance.
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/route/${airport.iata}/DEL`}
                onClick={() => setSelectedHour(null)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Route Performance</span>
                <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => setSelectedHour(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

