import React, { useState } from 'react'
import { ChartCard } from './ChartCard'

interface HeatmapCell {
  month: number
  dep_hour: number
  flight_volume: number
  delay_rate_pct: number
}

interface HeatmapChartProps {
  data?: HeatmapCell[]
  source?: string
  loading?: boolean
  error?: string | null
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  source,
  loading,
  error
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null)

  const isEmpty = !data || data.length === 0

  // Build 12x24 matrix map
  const matrixMap = new Map<string, HeatmapCell>()
  if (data) {
    data.forEach(item => {
      matrixMap.set(`${item.month}-${item.dep_hour}`, item)
    })
  }

  const getRiskColor = (pct: number) => {
    if (pct < 15) return 'bg-emerald-900/60 text-emerald-300 border-emerald-800/40 hover:bg-emerald-800'
    if (pct < 22) return 'bg-blue-900/60 text-blue-300 border-blue-800/40 hover:bg-blue-800'
    if (pct < 28) return 'bg-amber-900/70 text-amber-300 border-amber-700/50 hover:bg-amber-800'
    if (pct < 35) return 'bg-orange-900/80 text-orange-200 border-orange-700/60 hover:bg-orange-700'
    return 'bg-rose-900/90 text-rose-100 border-rose-700/80 hover:bg-rose-800'
  }

  return (
    <ChartCard
      title="Month × Departure Hour Operational Risk Heatmap"
      subtitle="Complete 288-Cell Temporal Heat Matrix (12 Months × 24 Departure Hours)"
      explanation="Displays the compound risk multiplier calculated directly across 4.08 million real flight departure records."
      source={source}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
    >
      <div className="w-full overflow-x-auto py-2">
        <div className="min-w-[720px]">
          {/* Header Row (Hours) */}
          <div className="flex items-center gap-1 mb-1.5 pl-12">
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="flex-1 text-center text-[10px] font-bold text-slate-500">
                {h % 3 === 0 ? `${h.toString().padStart(2, '0')}h` : ''}
              </div>
            ))}
          </div>

          {/* Matrix Rows (Months) */}
          <div className="space-y-1">
            {Array.from({ length: 12 }).map((_, mIdx) => {
              const monthNum = mIdx + 1
              return (
                <div key={monthNum} className="flex items-center gap-1">
                  <div className="w-11 text-xs font-bold text-slate-400 text-right pr-1 shrink-0">
                    {monthNames[mIdx]}
                  </div>
                  <div className="flex-1 flex gap-1">
                    {Array.from({ length: 24 }).map((_, h) => {
                      const cell = matrixMap.get(`${monthNum}-${h}`)
                      const delayPct = cell ? cell.delay_rate_pct : 0
                      return (
                        <div
                          key={h}
                          onMouseEnter={() => cell && setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`flex-1 h-7 rounded border text-[9px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                            cell ? getRiskColor(delayPct) : 'bg-slate-950 border-slate-900 text-slate-700'
                          }`}
                          title={cell ? `${monthNames[mIdx]} ${h.toString().padStart(2, '0')}:00 — ${delayPct}% delay rate (${cell.flight_volume.toLocaleString()} flights)` : 'No data'}
                        >
                          {cell ? `${Math.round(delayPct)}%` : '-'}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Hover Tooltip Details */}
          <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            {hoveredCell ? (
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-200">
                  {monthNames[hoveredCell.month - 1]} at {hoveredCell.dep_hour.toString().padStart(2, '0')}:00
                </span>
                <span className="text-slate-400">
                  Delay Rate: <strong className="text-rose-400 font-extrabold">{hoveredCell.delay_rate_pct}%</strong>
                </span>
                <span className="text-slate-400">
                  Flights Operated: <strong className="text-blue-400 font-extrabold">{hoveredCell.flight_volume.toLocaleString()}</strong>
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Hover over any matrix cell to inspect exact monthly hour risk details.</span>
            )}

            {/* Legend */}
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="text-slate-400">Risk Level:</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-800">&lt;15%</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-800">15-22%</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-900/70 text-amber-300 border border-amber-700">22-28%</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-900/80 text-orange-200 border border-orange-700">28-35%</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-900/90 text-rose-100 border border-rose-700">&gt;35%</span>
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
