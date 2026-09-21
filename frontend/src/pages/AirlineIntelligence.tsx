import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Building2, AlertTriangle, ShieldCheck, Activity, MapPin, Navigation, X, ChevronRight, ArrowRight } from 'lucide-react'
import { getAirlineDetails } from '../services/api'
import type { AirlineIntelligenceResponse } from '../services/api'

export function AirlineIntelligence() {
  const { airlineCode } = useParams<{ airlineCode: string }>()
  const [data, setData] = useState<AirlineIntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<{ title: string; value: string; desc: string } | null>(null)

  useEffect(() => {
    if (airlineCode) {
      setLoading(true)
      getAirlineDetails(airlineCode)
        .then(res => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    }
  }, [airlineCode])

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
        <h2 className="text-2xl font-bold text-white">Airline Intelligence Unavailable</h2>
        <p className="text-slate-400">Could not retrieve information for airline {airlineCode}.</p>
        <Link to="/" className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm">
          Return Home
        </Link>
      </div>
    )
  }

  const { airline, metrics, top_airports, top_routes, risk_assessment } = data

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-950/80 text-amber-400 border border-amber-800/80 rounded-2xl">
            <Building2 size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              {airline.name} ({airline.iata})
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                ICAO: {airline.icao}
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Registered Country: <strong className="text-slate-200">{airline.country}</strong>
            </p>
          </div>
        </div>

        <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
          Operated Flights: <strong className="text-white text-sm">{metrics.total_flights}</strong>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Risk Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="text-amber-400" size={18} />
            Airline Dynamic Risk Rating
          </h2>

          <div className="text-center py-4 space-y-2">
            <div className="text-5xl font-black text-amber-400">{risk_assessment.risk_score}</div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
              {risk_assessment.risk_category}
            </div>
          </div>
        </div>

        {/* Factual Operational Metrics */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="text-blue-400" size={18} />
              Factual Delay &amp; Reliability Metrics
            </h2>
            <span className="text-[10px] text-slate-400">Click metric card for breakdown</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedMetric({
                title: 'Airports Served',
                value: `${metrics.airports_served_count} hubs`,
                desc: 'Number of unique domestic and international airport destinations actively operated by this carrier.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-blue-300">Airports Served</div>
              <div className="text-2xl font-bold text-white mt-1 group-hover:text-blue-400">{metrics.airports_served_count}</div>
            </button>

            <button
              onClick={() => setSelectedMetric({
                title: 'Average Flight Delay',
                value: `${metrics.avg_delay_minutes} minutes`,
                desc: 'Fleet-wide mean departure/arrival delay across all active flights operated by this carrier.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-blue-300">Avg Delay</div>
              <div className="text-2xl font-bold text-white mt-1 group-hover:text-blue-400">{metrics.avg_delay_minutes}m</div>
            </button>

            <button
              onClick={() => setSelectedMetric({
                title: 'Carrier Delayed Flight Rate',
                value: `${metrics.delayed_percentage}%`,
                desc: 'Proportion of scheduled operations by this airline experiencing delays greater than 15 minutes.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-amber-300">Delayed Flight %</div>
              <div className="text-2xl font-bold text-amber-400 mt-1 group-hover:text-amber-300">{metrics.delayed_percentage}%</div>
            </button>

            <button
              onClick={() => setSelectedMetric({
                title: 'Carrier Cancellation Rate',
                value: `${metrics.cancellation_percentage}%`,
                desc: 'Percentage of scheduled flights cancelled prior to departure across this airline network.'
              })}
              className="p-4 bg-slate-950/60 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/40 rounded-xl text-center transition-all cursor-pointer group"
            >
              <div className="text-xs text-slate-400 group-hover:text-red-300">Cancellation %</div>
              <div className="text-2xl font-bold text-red-400 mt-1 group-hover:text-red-300">{metrics.cancellation_percentage}%</div>
            </button>
          </div>
        </div>
      </div>

      {/* Top Hubs & Routes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <MapPin className="text-emerald-400" size={18} />
              Top Operating Hubs
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click hub for airport details</span>
          </h3>
          <div className="space-y-2 text-xs">
            {top_airports.map((item, idx) => (
              <Link
                key={idx}
                to={`/airport/${item.origin}`}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-all -ml-1 group-hover:ml-0" />
                  <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {item.origin_city} ({item.origin})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-bold group-hover:text-emerald-300">{item.departures_count} departures</span>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <Navigation className="text-purple-400" size={18} />
              Top Airline Routes
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click route for corridor analysis</span>
          </h3>
          <div className="space-y-2 text-xs">
            {top_routes.map((item, idx) => (
              <Link
                key={idx}
                to={`/route/${item.origin}/${item.destination}`}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-all -ml-1 group-hover:ml-0" />
                  <span className="font-semibold text-slate-200 group-hover:text-purple-400 transition-colors">
                    {item.route}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-purple-400 font-bold group-hover:text-purple-300">{item.flights_count} flights</span>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

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
              <div className="p-3 bg-amber-950 text-amber-400 border border-amber-800 rounded-xl">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedMetric.title}</h3>
                <div className="text-2xl font-black text-amber-400 mt-0.5">{selectedMetric.value}</div>
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
    </div>
  )
}

