import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, Clock, Filter, AlertTriangle, ShieldCheck, Plane, Navigation, MapPin, CheckSquare, Square, ArrowRight, BarChart3 } from 'lucide-react'
import { searchFlights, getCalendarRisk, getTimeRiskMatrix } from '../services/flightSearchApi'
import type { FlightOptionItem, CalendarDayRisk, TimeRiskCell } from '../services/flightSearchApi'
import { FlightComparisonModal } from '../components/FlightComparisonModal'
import { DateTimeRiskHeatmap } from '../components/DateTimeRiskHeatmap'

export function FlightFinder() {
  const [origin, setOrigin] = useState('MAA')
  const [destination, setDestination] = useState('DEL')
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0])
  const [timeWindow, setTimeWindow] = useState('ANY')
  const [selectedAirline, setSelectedAirline] = useState('ALL')
  const [riskFilter, setRiskFilter] = useState('ALL')

  const [flights, setFlights] = useState<FlightOptionItem[]>([])
  const [calendarDays, setCalendarDays] = useState<CalendarDayRisk[]>([])
  const [timeRiskWindows, setTimeRiskWindows] = useState<TimeRiskCell[]>([])
  const [timeRiskDates, setTimeRiskDates] = useState<string[]>([])
  const [dataMode, setDataMode] = useState<string>('SCHEDULED+MODELLED')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [comparisonList, setComparisonList] = useState<FlightOptionItem[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)

  const executeSearch = async (
    searchOrig = origin,
    searchDest = destination,
    searchDate = dateStr,
    searchTW = timeWindow
  ) => {
    setLoading(true)
    setError(null)
    try {
      let riskMaxVal: number | undefined = undefined
      if (riskFilter === 'LOW') riskMaxVal = 20.0
      else if (riskFilter === 'MEDIUM') riskMaxVal = 40.0

      const searchRes = await searchFlights({
        origin: searchOrig,
        destination: searchDest,
        date: searchDate,
        time_window: searchTW,
        airline: selectedAirline !== 'ALL' ? selectedAirline : undefined,
        risk_max: riskMaxVal
      })

      if (searchRes && searchRes.data) {
        setFlights(searchRes.data.flights)
        setDataMode(searchRes.meta.data_mode)
      } else {
        setFlights([])
      }

      // Fetch calendar risk & heatmap concurrently
      const calRes = await getCalendarRisk({ origin: searchOrig, destination: searchDest, date: searchDate })
      if (calRes && calRes.days) {
        setCalendarDays(calRes.days)
      }

      const heatRes = await getTimeRiskMatrix({ origin: searchOrig, destination: searchDest, date: searchDate })
      if (heatRes && heatRes.time_windows) {
        setTimeRiskWindows(heatRes.time_windows)
        setTimeRiskDates(heatRes.dates)
      }
    } catch (err: any) {
      setError('Flight intelligence service unavailable. Please check your backend connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    executeSearch()
  }, [])

  const handleQuickDateSelect = (daysOffset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    const newDate = d.toISOString().split('T')[0]
    setDateStr(newDate)
    executeSearch(origin, destination, newDate, timeWindow)
  }

  const toggleCompareFlight = (flightId: string) => {
    setSelectedForCompare(prev =>
      prev.includes(flightId) ? prev.filter(id => id !== flightId) : [...prev, flightId]
    )
  }

  const handleOpenCompare = () => {
    const matched = flights.filter(f => selectedForCompare.includes(f.flight_id) || selectedForCompare.includes(f.flight_number))
    setComparisonList(matched)
    setShowCompareModal(true)
  }

  // Operator summary calculation
  const operatorStats = flights.reduce((acc, f) => {
    if (!acc[f.airline]) {
      acc[f.airline] = { airline: f.airline, count: 0, sumProb: 0, sumHist: 0 }
    }
    acc[f.airline].count += 1
    acc[f.airline].sumProb += f.predicted_delay_probability
    acc[f.airline].sumHist += f.historical_delay_rate
    return acc
  }, {} as Record<string, { airline: string; count: number; sumProb: number; sumHist: number }>)

  const operatorsList = Object.values(operatorStats)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/80 text-blue-400 border border-blue-800/80 rounded-full text-xs font-bold mb-2">
              <ShieldCheck size={14} />
              <span>Primary Date-Wise Flight Workspace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Flight Finder &amp; Delay Risk Intelligence</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Investigate flights by date, route, and time window. Compare carrier options and analyze dynamic XGBoost delay risk probabilities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold">
              Data Mode: <strong className="text-emerald-400">{dataMode}</strong>
            </span>
          </div>
        </div>

        {/* Primary Search Workspace Controls */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">From (Origin)</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value.toUpperCase())}
                placeholder="e.g. MAA"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-white uppercase focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">To (Destination)</label>
            <div className="relative">
              <Navigation size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value.toUpperCase())}
                placeholder="e.g. DEL"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-white uppercase focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">Travel Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="date"
                value={dateStr}
                onChange={e => setDateStr(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm font-semibold text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">Time Window</label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-3 text-slate-500" />
              <select
                value={timeWindow}
                onChange={e => setTimeWindow(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm font-semibold text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="ANY">Any Time (00:00 - 23:59)</option>
                <option value="MORNING">Morning (06:00 – 11:59)</option>
                <option value="AFTERNOON">Afternoon (12:00 – 16:59)</option>
                <option value="EVENING">Evening (17:00 – 20:59)</option>
                <option value="NIGHT">Night (21:00 – 23:59)</option>
                <option value="MIDNIGHT">Midnight (00:00 – 05:59)</option>
              </select>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <button
              onClick={() => executeSearch()}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Search size={18} />
                  <span>SEARCH FLIGHTS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Date Shortcuts & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Quick Dates:</span>
            <button onClick={() => handleQuickDateSelect(0)} className="px-3 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer">Today</button>
            <button onClick={() => handleQuickDateSelect(1)} className="px-3 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer">Tomorrow</button>
            <button onClick={() => handleQuickDateSelect(2)} className="px-3 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer">+2 Days</button>
            <button onClick={() => handleQuickDateSelect(7)} className="px-3 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer">+7 Days</button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              <span className="text-slate-400 font-medium">Airline:</span>
              <select
                value={selectedAirline}
                onChange={e => { setSelectedAirline(e.target.value); executeSearch(origin, destination, dateStr, timeWindow); }}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Airlines</option>
                <option value="AI">Air India (AI)</option>
                <option value="6E">IndiGo (6E)</option>
                <option value="SG">SpiceJet (SG)</option>
                <option value="UK">Vistara (UK)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Delay Risk:</span>
              <select
                value={riskFilter}
                onChange={e => { setRiskFilter(e.target.value); executeSearch(origin, destination, dateStr, timeWindow); }}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low Risk (&lt;20%)</option>
                <option value="MEDIUM">Medium Risk (20-40%)</option>
                <option value="HIGH">High Risk (&gt;40%)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Calendar Date Bar */}
      {calendarDays.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-400" />
              7-Day Route Risk Calendar Overview ({origin} → {destination})
            </span>
            <span className="text-[10px] text-slate-400">Click date to filter search</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {calendarDays.map(cd => {
              const isSelected = cd.date === dateStr
              return (
                <button
                  key={cd.date}
                  onClick={() => { setDateStr(cd.date); executeSearch(origin, destination, cd.date, timeWindow); }}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/50 shadow-lg'
                      : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-400">{cd.day_name}</div>
                  <div className="text-xs font-extrabold text-white mt-0.5">{cd.date.slice(5)}</div>
                  <div className="text-base font-black text-blue-400 mt-1">{cd.avg_predicted_risk}%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{cd.total_flights} flights</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Operator Comparison Summary Section */}
      {operatorsList.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-400" />
              Carrier Comparison on Corridor ({origin} → {destination})
            </span>
            <span className="text-[10px] text-slate-400">Factual dataset metrics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {operatorsList.map(op => {
              const avgProb = Math.round(op.sumProb / op.count)
              const avgHist = Math.round(op.sumHist / op.count)
              return (
                <div key={op.airline} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="font-bold text-white text-sm">{op.airline}</div>
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Flights:</span>
                    <strong className="text-slate-200">{op.count} scheduled</strong>
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Avg Predicted Delay:</span>
                    <strong className="text-amber-400">{avgProb}%</strong>
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Historical Delay:</span>
                    <strong className="text-slate-300">{avgHist}%</strong>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-2xl text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <span>{error}</span>
          <button onClick={() => executeSearch()} className="ml-auto px-3 py-1 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-semibold">Retry</button>
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Available Flight Options
            <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded-full">
              {flights.length} flights
            </span>
          </h2>

          {selectedForCompare.length > 0 && (
            <button
              onClick={handleOpenCompare}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer animate-pulse"
            >
              <CheckSquare size={16} />
              <span>Compare Selected ({selectedForCompare.length}) →</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : flights.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <AlertTriangle className="mx-auto text-amber-500" size={40} />
            <h3 className="text-lg font-bold text-white">No Flights Match Your Criteria</h3>
            <p className="text-sm text-slate-400">
              No scheduled flights match {origin} → {destination} for {dateStr} during time window {timeWindow}.
            </p>
            <button onClick={() => { setTimeWindow('ANY'); setRiskFilter('ALL'); executeSearch(origin, destination, dateStr, 'ANY'); }} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs cursor-pointer">
              Reset Filters &amp; Search All Windows
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {flights.map(f => {
              const isSelected = selectedForCompare.includes(f.flight_id) || selectedForCompare.includes(f.flight_number)
              return (
                <div
                  key={f.flight_id}
                  className={`bg-slate-900/90 border rounded-2xl p-5 transition-all shadow-xl hover:border-blue-500/60 ${
                    isSelected ? 'border-blue-500 bg-blue-950/20 ring-1 ring-blue-500' : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Checkbox & Carrier info */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleCompareFlight(f.flight_id)}
                        className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {isSelected ? <CheckSquare size={20} className="text-blue-400" /> : <Square size={20} />}
                      </button>

                      <div className="p-3 bg-slate-950 text-blue-400 border border-slate-800 rounded-2xl">
                        <Plane size={24} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-extrabold text-white">{f.flight_number}</h3>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                            {f.airline}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {f.aircraft_type} • <strong className="text-slate-200">Non-stop</strong>
                        </div>
                      </div>
                    </div>

                    {/* Schedule times */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xl font-black text-white">{f.scheduled_departure}</div>
                        <div className="text-xs font-semibold text-blue-400">{f.origin}</div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-semibold">{f.duration_formatted}</span>
                        <div className="w-16 h-0.5 bg-slate-700 relative my-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500 absolute -top-0.75 left-1/2 -translate-x-1/2"></div>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold">Direct</span>
                      </div>

                      <div className="text-center">
                        <div className="text-xl font-black text-white">{f.scheduled_arrival}</div>
                        <div className="text-xs font-semibold text-blue-400">{f.destination}</div>
                      </div>
                    </div>

                    {/* Risk & Probability badge */}
                    <div className="text-right space-y-1">
                      <div className="text-xs text-slate-400">Delay Probability</div>
                      <div className={`text-2xl font-black ${f.risk_level === 'HIGH' ? 'text-red-400' : f.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {f.predicted_delay_probability}%
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${f.risk_level === 'HIGH' ? 'bg-red-950 text-red-300 border-red-800' : f.risk_level === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'}`}>
                          {f.risk_level} RISK
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Hist: {f.historical_delay_rate}%</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/flight/${f.flight_number}`}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>VIEW FLIGHT</span>
                        <ArrowRight size={12} />
                      </Link>
                      <Link
                        to={`/route/${f.origin}/${f.destination}`}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        ROUTE
                      </Link>
                      <Link
                        to={`/map?origin=${f.origin}&destination=${f.destination}`}
                        className="px-3 py-2 bg-purple-950 hover:bg-purple-900 border border-purple-800/80 text-purple-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        MAP
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Date x Time Heatmap */}
      <DateTimeRiskHeatmap
        dates={timeRiskDates}
        timeWindows={timeRiskWindows}
        onCellClick={(selectedDate, selectedTW) => {
          setDateStr(selectedDate)
          setTimeWindow(selectedTW)
          executeSearch(origin, destination, selectedDate, selectedTW)
        }}
      />

      {/* Side-by-Side Comparison Modal */}
      {showCompareModal && (
        <FlightComparisonModal
          flights={comparisonList}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  )
}
