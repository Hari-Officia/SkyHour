import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Navigation, AlertTriangle, ShieldCheck, BarChart3, Plane, X, Info, Clock, ChevronRight, ArrowRight } from 'lucide-react'
import { getRouteDetails } from '../services/api'
import type { RouteIntelligenceResponse } from '../services/api'

interface RiskFactorDetail {
  factor: string
  points: number
  impact: string
  description: string
  recommendation: string
}

export function RouteIntelligence() {
  const { origin: paramOrigin, destination: paramDest } = useParams<{ origin?: string; destination?: string }>()
  const [searchParams] = useSearchParams()
  
  const origin = paramOrigin || searchParams.get('origin') || 'MAA'
  const destination = paramDest || searchParams.get('destination') || 'DEL'

  const [data, setData] = useState<RouteIntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFactor, setSelectedFactor] = useState<RiskFactorDetail | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<{ title: string; value: string; desc: string } | null>(null)
  const [selectedHour, setSelectedHour] = useState<{ label: string; rate: number } | null>(null)

  useEffect(() => {
    if (origin && destination) {
      setLoading(true)
      getRouteDetails(origin, destination)
        .then(res => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    }
  }, [origin, destination])

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
        <h2 className="text-2xl font-bold text-white">Route Intelligence Unavailable</h2>
        <p className="text-slate-400">Could not retrieve information for route {origin} → {destination}.</p>
        <Link to="/" className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm">
          Return Home
        </Link>
      </div>
    )
  }

  const { route, summary, delay_by_hour, airline_performance, risk_assessment } = data

  const factorDescriptions: Record<string, { desc: string; rec: string }> = {
    'Distance & Airway Congestion': {
      desc: 'Air corridor volume and air traffic control hold protocols along this origin-to-destination flight path.',
      rec: 'Choose non-stop direct flights scheduled outside morning and evening rush hours.'
    },
    'Origin Hub Congestion': {
      desc: 'Ground operations and taxi queue delays at origin airport impacting flight turnaround timelines.',
      rec: 'Check origin airport dynamic risk score before scheduling tightly connected legs.'
    },
    'Destination Arrival Holds': {
      desc: 'Air traffic control holding patterns and gate availability constraints at the destination airport.',
      rec: 'Review carrier historical on-time performance on this specific corridor.'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-950/80 text-purple-400 border border-purple-800/80 rounded-2xl">
            <Navigation size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Link to={`/airport/${route.origin}`} className="hover:text-blue-400 transition-colors">{route.origin}</Link>
              <span className="text-slate-500 font-normal">({route.origin_city})</span>
              <span className="text-purple-400">→</span>
              <Link to={`/airport/${route.destination}`} className="hover:text-blue-400 transition-colors">{route.destination}</Link>
              <span className="text-slate-500 font-normal">({route.destination_city})</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Direct Route Code: <strong className="text-slate-200">{route.route_code}</strong> • Distance: <strong className="text-slate-200">{route.distance_miles} miles</strong>
            </p>
          </div>
        </div>

        <Link to={`/flight/AI302`} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5">
          <span>Predict Delay for Selected Flight</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Route Risk Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-purple-400" size={18} />
              Route Dynamic Risk Score
            </h2>
            <span className="text-[10px] text-slate-400">Interactive</span>
          </div>

          <div className="text-center py-2 space-y-2">
            <div className="text-5xl font-black text-purple-400">{risk_assessment.risk_score}</div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">
              {risk_assessment.risk_category}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="font-semibold text-slate-300">Top Route Risk Factors:</div>
            {risk_assessment.top_contributors.map((item, idx) => {
              const info = factorDescriptions[item.factor] || {
                desc: 'Operational factor influencing route risk score.',
                rec: 'Check real-time status updates.'
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
                  className="w-full flex justify-between items-center p-2 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/60 hover:border-purple-500/50 transition-all cursor-pointer text-left group"
                >
                  <span className="text-slate-300 group-hover:text-purple-300 font-medium flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.factor}
                  </span>
                  <span className="font-bold text-slate-200 group-hover:text-purple-400 shrink-0 ml-2">
                    {item.impact} (+{item.points} pts)
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Route Delay Summary & Time Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={18} />
              Historical Route Performance Summary
            </h2>
            <span className="text-[10px] text-slate-400">Click metrics or slots</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedMetric({
                title: 'Total Logged Corridor Flights',
                value: `${summary.total_flights} flights`,
                desc: 'Total logged flight operations evaluated on this origin-to-destination route across our analytical data lake.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-blue-300">Total Flights</div>
              <div className="text-2xl font-bold text-white mt-1 group-hover:text-blue-400">{summary.total_flights}</div>
            </button>

            <button
              onClick={() => setSelectedMetric({
                title: 'Average Corridor Delay',
                value: `${summary.avg_delay_minutes} minutes`,
                desc: 'Mean departure/arrival delay calculated across all logged flights along this specific city pair.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-blue-300">Avg Delay</div>
              <div className="text-2xl font-bold text-white mt-1 group-hover:text-blue-400">{summary.avg_delay_minutes}m</div>
            </button>

            <button
              onClick={() => setSelectedMetric({
                title: 'Delayed Flight Rate',
                value: `${summary.delayed_percentage}%`,
                desc: 'Proportion of flights on this route experiencing delays of 15 minutes or longer.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-amber-300">Delayed Flight %</div>
              <div className="text-2xl font-bold text-amber-400 mt-1 group-hover:text-amber-300">{summary.delayed_percentage}%</div>
            </button>

            <button
              onClick={() => setSelectedMetric({
                title: 'Corridor Cancellation Rate',
                value: `${summary.cancellation_percentage}%`,
                desc: 'Percentage of scheduled operations cancelled on this route prior to departure.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-red-300">Cancellation %</div>
              <div className="text-2xl font-bold text-red-400 mt-1 group-hover:text-red-300">{summary.cancellation_percentage}%</div>
            </button>
          </div>

          {/* Delay Rate by Hour of Day */}
          <div className="pt-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Clock size={14} className="text-purple-400" />
                Delay Rate by Departure Hour Period
              </span>
              <span className="text-[10px] text-purple-400 font-normal">Click slot for details</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              {Object.entries(delay_by_hour).map(([key, item]) => {
                const isSelected = selectedHour?.label === item.label
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedHour({ label: item.label, rate: item.delay_rate })}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer block group text-center ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500'
                        : 'bg-slate-950 border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className={`text-[10px] ${isSelected ? 'text-purple-300 font-bold' : 'text-slate-400 group-hover:text-purple-300'}`}>{item.label}</div>
                    <div className={`font-bold mt-1 ${isSelected ? 'text-white' : 'text-amber-400 group-hover:text-amber-300'}`}>{item.delay_rate}%</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Airline Route Performance Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="flex items-center gap-2">
            <Plane className="text-blue-400" size={18} />
            Airline Performance on {route.origin} → {route.destination}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Click airline to view carrier hub</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Airline</th>
                <th className="p-3">Flights Operated</th>
                <th className="p-3">Delay Rate (≥15m)</th>
                <th className="p-3">Average Delay</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {airline_performance.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-3 font-semibold text-white">
                    <Link to={`/airline/${row.airline_iata}`} className="text-blue-400 group-hover:text-blue-300 hover:underline flex items-center gap-1.5">
                      {row.airline} ({row.airline_iata})
                    </Link>
                  </td>
                  <td className="p-3 font-mono">{row.flights_operated}</td>
                  <td className="p-3 font-bold text-amber-400">{row.delay_rate}%</td>
                  <td className="p-3 font-mono">{row.avg_delay} mins</td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/airline/${row.airline_iata}`}
                      className="px-3 py-1 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg transition-all text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <span>View Airline</span>
                      <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Factor Detail Modal */}
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
              <div className="p-3 bg-purple-950 text-purple-400 border border-purple-800 rounded-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedFactor.factor}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded-full">
                  Impact: {selectedFactor.impact} (+{selectedFactor.points} pts)
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Info size={14} className="text-purple-400" />
                  Factor Explanation
                </div>
                <p className="text-slate-400 leading-relaxed">{selectedFactor.description}</p>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-1">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Travel Recommendation
                </div>
                <p className="text-emerald-200/90 leading-relaxed">{selectedFactor.recommendation}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedFactor(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all"
            >
              Close Factor Details
            </button>
          </div>
        </div>
      )}

      {/* Metric Detail Modal */}
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
              <div className="p-3 bg-blue-950 text-blue-400 border border-blue-800 rounded-xl">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedMetric.title}</h3>
                <div className="text-2xl font-black text-blue-400 mt-0.5">{selectedMetric.value}</div>
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

      {/* Hour Slot Detail Modal */}
      {selectedHour && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedHour(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-purple-950 text-purple-400 border border-purple-800 rounded-xl">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Departure Window: {selectedHour.label}</h3>
                <p className="text-xs text-slate-400">Historical Delay Rate: <strong className="text-amber-400">{selectedHour.rate}%</strong></p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                Flights departing {route.origin} for {route.destination} during <strong className="text-white">{selectedHour.label}</strong> experience a historical delay rate of <strong className="text-amber-400">{selectedHour.rate}%</strong>.
              </p>
              <p className="text-slate-400">
                {selectedHour.rate > 20
                  ? 'Peak delay probability period. Consider choosing an earlier departure window.'
                  : 'Favorable flight window with low average delay likelihood.'}
              </p>
            </div>

            <button
              onClick={() => setSelectedHour(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all"
            >
              Close Window Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

