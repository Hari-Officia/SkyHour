import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plane, Clock, AlertTriangle, ShieldCheck, Activity, Info, X, ChevronRight, ArrowRight } from 'lucide-react'
import { getFlightDetails } from '../services/api'
import type { FlightIntelligenceResponse } from '../services/api'

export function FlightIntelligence() {
  const { flightId } = useParams<{ flightId: string }>()
  const [data, setData] = useState<FlightIntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFactor, setSelectedFactor] = useState<{ factor: string; impact: string; weight: string } | null>(null)

  useEffect(() => {
    if (flightId) {
      setLoading(true)
      getFlightDetails(flightId)
        .then(res => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    }
  }, [flightId])

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
        <h2 className="text-2xl font-bold text-white">Flight Details Unavailable</h2>
        <p className="text-slate-400">Could not retrieve information for flight {flightId}.</p>
        <Link to="/" className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm">
          Return Home
        </Link>
      </div>
    )
  }

  const { flight_summary, time_intelligence, prediction, live_telemetry, is_demo, data_mode } = data
  const isDelayed = prediction.prediction === 'DELAYED'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner & Data Mode Provenance */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-800/80 rounded-xl">
              <Plane size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                Flight {flight_summary.flight_number}
                <Link
                  to={`/airline/${flight_summary.airline_iata}`}
                  className="text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 rounded-full border border-slate-700 transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <span>{flight_summary.airline}</span>
                  <ArrowRight size={10} />
                </Link>
              </h1>
              <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                <Link
                  to={`/airport/${flight_summary.origin}`}
                  className="text-blue-400 font-bold hover:underline"
                >
                  {flight_summary.origin} ({flight_summary.origin_city})
                </Link>
                <span>→</span>
                <Link
                  to={`/airport/${flight_summary.destination}`}
                  className="text-blue-400 font-bold hover:underline"
                >
                  {flight_summary.destination} ({flight_summary.destination_city})
                </Link>
                <span className="text-xs text-slate-500 font-normal">
                  • Route:{' '}
                  <Link
                    to={`/route/${flight_summary.origin}/${flight_summary.destination}`}
                    className="text-purple-400 hover:underline font-mono font-semibold"
                  >
                    {flight_summary.origin}-{flight_summary.destination}
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 ${is_demo ? 'bg-amber-950/60 border-amber-700/80 text-amber-300' : 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'}`}>
            <Activity size={14} className={is_demo ? 'animate-pulse text-amber-400' : 'text-emerald-400'} />
            <span>{data_mode}</span>
          </div>

          <div className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300">
            Status: <span className="text-white font-bold">{flight_summary.status}</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column - Prediction Engine */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pre-Flight Prediction Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={20} />
                <h2 className="text-lg font-bold text-white">Pre-Flight Arrival Delay Prediction</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Mode: <strong className="text-blue-400">{time_intelligence.prediction_mode}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className={`p-6 rounded-2xl border text-center space-y-2 ${isDelayed ? 'bg-red-950/40 border-red-800/80' : 'bg-emerald-950/40 border-emerald-800/80'}`}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delay Probability (≥15m)</div>
                <div className={`text-4xl font-black ${isDelayed ? 'text-red-400' : 'text-emerald-400'}`}>
                  {prediction.delay_percentage}%
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isDelayed ? 'bg-red-900/80 text-red-200' : 'bg-emerald-900/80 text-emerald-200'}`}>
                  {prediction.prediction} ({prediction.risk_level})
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Prediction Horizon:</span>
                  <span className="font-semibold text-white">{time_intelligence.prediction_horizon}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Time to Departure:</span>
                  <span className="font-semibold text-white">{time_intelligence.hours_to_departure} hours</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Decision Threshold:</span>
                  <span className="font-semibold text-white">{prediction.decision_threshold * 100}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Generated At:</span>
                  <span className="font-semibold text-slate-300">{time_intelligence.prediction_timestamp}</span>
                </div>
              </div>
            </div>

            {/* Contributing Factors Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200">Top Contributing Factors (XGBoost Feature Attribution)</h3>
                <span className="text-[10px] text-blue-400 font-normal">Click factor for feature details</span>
              </div>
              <div className="space-y-2">
                {prediction.contributing_factors.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFactor(item)}
                    className="w-full flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-800/60 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all text-xs cursor-pointer group text-left"
                  >
                    <span className="font-medium text-slate-300 group-hover:text-blue-300 flex items-center gap-1.5">
                      <ChevronRight size={14} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item.factor}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.impact === 'HIGH' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-blue-950 text-blue-400 border border-blue-800'}`}>
                        {item.impact}
                      </span>
                      <span className="font-mono font-bold text-slate-200 group-hover:text-white">{item.weight}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calibration Note */}
            <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-blue-300 flex items-start gap-2">
              <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <span>{prediction.model_metadata.calibration_note}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Column - Telemetry & Schedule */}
        <div className="space-y-6">
          {/* Flight Schedule */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Clock size={16} className="text-blue-400" />
              Flight Schedule
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-slate-400">Scheduled Departure</div>
                  <div className="text-base font-bold text-white mt-0.5">{flight_summary.scheduled_departure} IST</div>
                  <div className="text-[10px] text-slate-500">{flight_summary.departure_timezone}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">Scheduled Arrival</div>
                  <div className="text-base font-bold text-white mt-0.5">{flight_summary.scheduled_arrival} IST</div>
                  <div className="text-[10px] text-slate-500">{flight_summary.arrival_timezone}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Status Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Activity size={16} className="text-emerald-400" />
              Live Aircraft Telemetry
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Data Source:</span>
                <span className="font-semibold text-slate-200">{live_telemetry.source}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Altitude:</span>
                <span className="font-mono font-bold text-white">{live_telemetry.telemetry_data.altitude_ft} ft</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Ground Speed:</span>
                <span className="font-mono font-bold text-white">{live_telemetry.telemetry_data.ground_speed_knots} kts</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Heading:</span>
                <span className="font-mono font-bold text-white">{live_telemetry.telemetry_data.heading_deg}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Factor Detail Modal */}
      {selectedFactor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
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
                  Model Weight: {selectedFactor.weight} ({selectedFactor.impact})
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                In the XGBoost machine learning model trained on historical flight records, <strong className="text-white">{selectedFactor.factor}</strong> has an feature attribution impact of <strong className="text-blue-400">{selectedFactor.weight}</strong>.
              </p>
              <p className="text-slate-400">
                This factor contributes to determining whether flight {flight_summary.flight_number} will arrive on-time or be delayed by 15+ minutes.
              </p>
            </div>

            <button
              onClick={() => setSelectedFactor(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all"
            >
              Close Feature Attribution
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

