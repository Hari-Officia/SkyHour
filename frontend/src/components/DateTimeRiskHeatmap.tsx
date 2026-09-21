import { Clock } from 'lucide-react'
import type { TimeRiskCell } from '../services/flightSearchApi'

interface DateTimeRiskHeatmapProps {
  dates: string[]
  timeWindows: TimeRiskCell[]
  onCellClick?: (date: string, timeWindow: string) => void
}

export function DateTimeRiskHeatmap({ dates, timeWindows, onCellClick }: DateTimeRiskHeatmapProps) {
  if (!dates || dates.length === 0 || !timeWindows || timeWindows.length === 0) return null

  const getRiskStyle = (val: number) => {
    if (val < 20) {
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80'
    } else if (val <= 30) {
      return 'bg-blue-950/60 border-blue-800/80 text-blue-300 hover:bg-blue-900/80'
    } else if (val <= 40) {
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300 hover:bg-amber-900/80'
    } else {
      return 'bg-red-950/60 border-red-800/80 text-red-300 hover:bg-red-900/80'
    }
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="text-purple-400" size={18} />
          Departure Time Risk Matrix (Date × Time Heatmap)
        </h3>
        <span className="text-[10px] text-slate-400">Click any cell to filter search</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="p-3 text-left font-semibold text-slate-300">Time Window</th>
              {dates.map(d => (
                <th key={d} className="p-3 font-semibold">
                  <div className="text-slate-200">{d.slice(5)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {timeWindows.map(tw => (
              <tr key={tw.time_window} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 text-left font-medium text-slate-300">
                  <div className="font-bold text-white">{tw.time_window}</div>
                  <div className="text-[10px] text-slate-500">{tw.label}</div>
                </td>
                {dates.map(d => {
                  const riskVal = tw.dates_risk[d] || 20.0
                  return (
                    <td key={d} className="p-2">
                      <button
                        onClick={() => onCellClick?.(d, tw.time_window)}
                        className={`w-full py-2.5 px-1 rounded-xl border font-mono font-bold text-xs transition-all cursor-pointer block ${getRiskStyle(riskVal)}`}
                      >
                        {riskVal}%
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
