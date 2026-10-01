import React from 'react'
import { Info, Database, AlertTriangle, RefreshCw } from 'lucide-react'

interface ChartCardProps {
  title: string
  subtitle?: string
  explanation?: string
  source?: string
  timestamp?: string
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
  badgeText?: string
  className?: string
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  explanation,
  source,
  timestamp,
  loading = false,
  error = null,
  isEmpty = false,
  emptyMessage = "No data available for the selected filters.",
  children,
  badgeText,
  className = ""
}) => {
  return (
    <div className={`bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all hover:border-slate-700/80 ${className}`}>
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              {title}
              {badgeText && (
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-md">
                  {badgeText}
                </span>
              )}
            </h3>
            {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
          </div>

          {source && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg shrink-0">
              <Database size={12} className="text-blue-400" />
              <span className="truncate max-w-[160px]">{source}</span>
            </div>
          )}
        </div>

        {explanation && (
          <div className="flex items-start gap-1.5 p-2 bg-slate-950/60 border border-slate-800/60 rounded-xl mb-4 text-[11px] text-slate-300 leading-relaxed">
            <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
            <span>{explanation}</span>
          </div>
        )}
      </div>

      {/* Card Content Area */}
      <div className="relative min-h-[260px] flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[240px] text-slate-400 gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <span className="text-xs font-semibold tracking-wide">Loading real analytics data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[240px] text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 text-center gap-2">
            <AlertTriangle size={24} />
            <span className="text-xs font-bold">Failed to load chart data</span>
            <span className="text-[11px] text-slate-400 max-w-sm">{error}</span>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-[240px] text-slate-400 bg-slate-950/40 border border-slate-800/40 rounded-xl p-4 text-center gap-2">
            <Database size={24} className="text-slate-600" />
            <span className="text-xs font-semibold text-slate-300">{emptyMessage}</span>
            <span className="text-[11px] text-slate-500">Try adjusting your filters or date range.</span>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer Provenance */}
      {timestamp && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
          <span>Real Skyhour Aggregated Query</span>
          <span>Updated: {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
    </div>
  )
}
