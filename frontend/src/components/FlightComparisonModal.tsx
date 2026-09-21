import { X, Plane, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { FlightOptionItem } from '../services/flightSearchApi'

interface FlightComparisonModalProps {
  flights: FlightOptionItem[]
  onClose: () => void
}

export function FlightComparisonModal({ flights, onClose }: FlightComparisonModalProps) {
  if (flights.length === 0) return null

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 space-y-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-blue-950 text-blue-400 border border-blue-800/80 rounded-2xl">
            <Plane size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Side-by-Side Flight Option Comparison</h2>
            <p className="text-xs text-slate-400">Comparing {flights.length} selected flights on factual risk metrics and schedules</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                <th className="p-4 w-40">Metric / Attribute</th>
                {flights.map(f => (
                  <th key={f.flight_id} className="p-4 text-center border-l border-slate-800/80 min-w-[200px]">
                    <div className="text-sm font-bold text-white">{f.flight_number}</div>
                    <div className="text-xs text-blue-400 font-semibold">{f.airline}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Route</td>
                {flights.map(f => (
                  <td key={f.flight_id} className="p-4 text-center border-l border-slate-800/60 font-semibold text-white">
                    {f.origin} → {f.destination}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Schedule &amp; Duration</td>
                {flights.map(f => (
                  <td key={f.flight_id} className="p-4 text-center border-l border-slate-800/60">
                    <div className="font-bold text-white">{f.scheduled_departure} - {f.scheduled_arrival}</div>
                    <div className="text-[11px] text-slate-400">{f.duration_formatted} (Non-stop)</div>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Predicted Delay Risk</td>
                {flights.map(f => (
                  <td key={f.flight_id} className="p-4 text-center border-l border-slate-800/60">
                    <div className={`text-xl font-black ${f.risk_level === 'HIGH' ? 'text-red-400' : f.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {f.predicted_delay_probability}%
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 mt-1 rounded-full text-[10px] font-bold border ${f.risk_level === 'HIGH' ? 'bg-red-950 text-red-300 border-red-800' : f.risk_level === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'}`}>
                      {f.risk_level} RISK
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Historical Delay Rate</td>
                {flights.map(f => (
                  <td key={f.flight_id} className="p-4 text-center border-l border-slate-800/60 font-mono font-bold text-amber-400">
                    {f.historical_delay_rate}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Expected Delay Window</td>
                {flights.map(f => (
                  <td key={f.flight_id} className="p-4 text-center border-l border-slate-800/60 text-slate-200">
                    {f.expected_delay_range}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Weather Condition</td>
                {flights.map(f => (
                  <td key={f.flight_id} className="p-4 text-center border-l border-slate-800/60 text-blue-300">
                    {f.weather_condition}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Aircraft Type</td>
                {flights.map(f => (
                  <td key={f.flight_id} className="p-4 text-center border-l border-slate-800/60 text-slate-300">
                    {f.aircraft_type}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Actions</td>
                {flights.map(f => (
                  <td key={f.flight_id} className="p-4 text-center border-l border-slate-800/60">
                    <Link
                      to={`/flight/${f.flight_number}`}
                      onClick={onClose}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1 shadow-md shadow-blue-600/20 transition-all"
                    >
                      <span>View Flight Details</span>
                      <ArrowRight size={12} />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl text-xs transition-all cursor-pointer"
        >
          Close Comparison Window
        </button>
      </div>
    </div>
  )
}
