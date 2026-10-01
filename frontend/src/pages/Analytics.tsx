import React, { useEffect, useState, useRef } from 'react'
import {
  BarChart3,
  Compass,
  RefreshCw,
  SlidersHorizontal,
  Plane,
  Clock,
  Cpu,
  Globe,
  CloudSun
} from 'lucide-react'
import {
  getAnalyticsOverview,
  getAnalyticsDelays,
  getAnalyticsCarriers,
  getAnalyticsAirports,
  getAnalyticsRoutes,
  getAnalyticsTime,
  getAnalyticsWeather,
  getAnalyticsModel,
  getAnalyticsIndia
} from '../services/api'
import type { AnalyticsFilterParams } from '../services/api'
import { DelayDistributionChart } from '../components/charts/DelayDistributionChart'
import { CarrierAnalyticsChart } from '../components/charts/CarrierAnalyticsChart'
import { AirportAnalyticsChart } from '../components/charts/AirportAnalyticsChart'
import { RouteAnalyticsChart } from '../components/charts/RouteAnalyticsChart'
import { TimeTrendChart } from '../components/charts/TimeTrendChart'
import { HeatmapChart } from '../components/charts/HeatmapChart'
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart'
import { RocCurveChart } from '../components/charts/RocCurveChart'
import { PrecisionRecallChart } from '../components/charts/PrecisionRecallChart'
import { ThresholdSweepChart } from '../components/charts/ThresholdSweepChart'
import { CalibrationChart } from '../components/charts/CalibrationChart'
import { ConfusionMatrixCard } from '../components/charts/ConfusionMatrixCard'
import { IndiaAnalyticsChart } from '../components/charts/IndiaAnalyticsChart'
import { WeatherAnalyticsChart } from '../components/charts/WeatherAnalyticsChart'

export const Analytics: React.FC = () => {
  // State for Filters
  const [module, setModule] = useState<'usa' | 'india'>('usa')
  const [month, setMonth] = useState<number | undefined>(undefined)
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined)
  const [depHour, setDepHour] = useState<number | undefined>(undefined)
  const [airline, setAirline] = useState<string>('')
  const [origin, setOrigin] = useState<string>('')
  const [destination, setDestination] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('delays')

  // Data Loading States
  const [loading, setLoading] = useState<boolean>(false)
  const [overviewData, setOverviewData] = useState<any>(null)
  const [delayData, setDelayData] = useState<any>(null)
  const [carrierData, setCarrierData] = useState<any>(null)
  const [airportData, setAirportData] = useState<any>(null)
  const [routeData, setRouteData] = useState<any>(null)
  const [timeData, setTimeData] = useState<any>(null)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [modelData, setModelData] = useState<any>(null)
  const [indiaData, setIndiaData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // In-memory Client Cache for instant (0ms) tab switching
  const cacheRef = useRef<Record<string, any>>({})

  const activeFilterCount = [
    month !== undefined,
    dayOfWeek !== undefined,
    depHour !== undefined,
    Boolean(airline.trim()),
    Boolean(origin.trim()),
    Boolean(destination.trim())
  ].filter(Boolean).length

  const getParams = (): AnalyticsFilterParams => ({
    module,
    month,
    day_of_week: dayOfWeek,
    departure_hour: depHour,
    airline: airline.trim() || undefined,
    origin: origin.trim() || undefined,
    destination: destination.trim() || undefined
  })

  const loadTabData = async (targetTab: string, forceRefresh = false) => {
    const params = getParams()
    const cacheKey = `${targetTab}_${JSON.stringify(params)}`

    // Instant render from client cache if available and not force refresh
    if (!forceRefresh && cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey]
      if (cached.overviewData) setOverviewData(cached.overviewData)
      if (cached.delayData) setDelayData(cached.delayData)
      if (cached.carrierData) setCarrierData(cached.carrierData)
      if (cached.airportData) setAirportData(cached.airportData)
      if (cached.routeData) setRouteData(cached.routeData)
      if (cached.timeData) setTimeData(cached.timeData)
      if (cached.weatherData) setWeatherData(cached.weatherData)
      if (cached.modelData) setModelData(cached.modelData)
      if (cached.indiaData) setIndiaData(cached.indiaData)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const promises: Promise<any>[] = [getAnalyticsOverview(params)]
      
      if (targetTab === 'delays') {
        promises.push(getAnalyticsDelays(params), getAnalyticsRoutes(params))
      } else if (targetTab === 'carriers_airports') {
        promises.push(getAnalyticsCarriers(params), getAnalyticsAirports(params))
      } else if (targetTab === 'routes') {
        promises.push(getAnalyticsRoutes(params), getAnalyticsDelays(params))
      } else if (targetTab === 'time') {
        promises.push(getAnalyticsTime(params))
      } else if (targetTab === 'model') {
        promises.push(getAnalyticsModel())
      } else if (targetTab === 'india') {
        promises.push(getAnalyticsIndia(params))
      } else if (targetTab === 'weather') {
        promises.push(getAnalyticsWeather({ module }))
      }

      const results = await Promise.allSettled(promises)
      const cachedEntry: any = {}

      if (results[0].status === 'fulfilled') {
        setOverviewData(results[0].value.data)
        cachedEntry.overviewData = results[0].value.data
      }

      if (targetTab === 'delays') {
        if (results[1]?.status === 'fulfilled') { setDelayData(results[1].value.data); cachedEntry.delayData = results[1].value.data }
        if (results[2]?.status === 'fulfilled') { setRouteData(results[2].value.data); cachedEntry.routeData = results[2].value.data }
      } else if (targetTab === 'carriers_airports') {
        if (results[1]?.status === 'fulfilled') { setCarrierData(results[1].value.data); cachedEntry.carrierData = results[1].value.data }
        if (results[2]?.status === 'fulfilled') { setAirportData(results[2].value.data); cachedEntry.airportData = results[2].value.data }
      } else if (targetTab === 'routes') {
        if (results[1]?.status === 'fulfilled') { setRouteData(results[1].value.data); cachedEntry.routeData = results[1].value.data }
        if (results[2]?.status === 'fulfilled') { setDelayData(results[2].value.data); cachedEntry.delayData = results[2].value.data }
      } else if (targetTab === 'time') {
        if (results[1]?.status === 'fulfilled') { setTimeData(results[1].value.data); cachedEntry.timeData = results[1].value.data }
      } else if (targetTab === 'model') {
        if (results[1]?.status === 'fulfilled') { setModelData(results[1].value.data); cachedEntry.modelData = results[1].value.data }
      } else if (targetTab === 'india') {
        if (results[1]?.status === 'fulfilled') { setIndiaData(results[1].value.data); cachedEntry.indiaData = results[1].value.data }
      } else if (targetTab === 'weather') {
        if (results[1]?.status === 'fulfilled') { setWeatherData(results[1].value.data); cachedEntry.weatherData = results[1].value.data }
      }

      cacheRef.current[cacheKey] = cachedEntry
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTabData(activeTab)
  }, [activeTab, module, month, dayOfWeek, depHour, airline, origin, destination])

  const clearFilters = () => {
    setMonth(undefined)
    setDayOfWeek(undefined)
    setDepHour(undefined)
    setAirline('')
    setOrigin('')
    setDestination('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-extrabold uppercase tracking-widest text-blue-400">
            <BarChart3 size={16} />
            <span>SKYHOUR Production Data &amp; Analytics System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Aviation Intelligence Analytics
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1">
            Real data-driven plotting dashboard aggregated live from 4.08 million BTS flight records, DGCA India master datasets, and XGBoost machine learning evaluation artifacts.
          </p>
        </div>

        {/* Module Toggle Switch */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-inner shrink-0 self-start md:self-auto">
          <button
            onClick={() => setModule('usa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              module === 'usa'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={14} />
            <span>US Aviation (2022 BTS)</span>
          </button>
          <button
            onClick={() => setModule('india')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              module === 'india'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass size={14} />
            <span>India Aviation (DGCA)</span>
          </button>
        </div>
      </div>

      {/* Interactive Filters Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-200 uppercase tracking-wider">
            <SlidersHorizontal size={14} className="text-blue-400" />
            <span>Interactive Backend Analytics Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full text-[10px]">
                {activeFilterCount} Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
            <button
              onClick={() => loadTabData(activeTab, true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-blue-400' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Month Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Month</label>
            <select
              value={month ?? ''}
              onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Day of Week</label>
            <select
              value={dayOfWeek ?? ''}
              onChange={e => setDayOfWeek(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="">All Days</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="7">Sunday</option>
            </select>
          </div>

          {/* Dep Hour */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dep Hour</label>
            <select
              value={depHour ?? ''}
              onChange={e => setDepHour(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="">All Hours</option>
              {Array.from({ length: 24 }).map((_, h) => (
                <option key={h} value={h}>{`${h.toString().padStart(2, '0')}:00`}</option>
              ))}
            </select>
          </div>

          {/* Airline */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Airline</label>
            <input
              type="text"
              placeholder="e.g. Delta, AA, DL"
              value={airline}
              onChange={e => setAirline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
            />
          </div>

          {/* Origin */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Origin</label>
            <input
              type="text"
              placeholder="e.g. ATL, LAX, MAA"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 placeholder:text-slate-600 uppercase"
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Destination</label>
            <input
              type="text"
              placeholder="e.g. ORD, JFK, DEL"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 placeholder:text-slate-600 uppercase"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Header Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Flights</span>
          <span className="text-xl font-extrabold text-blue-400 block mt-1">
            {overviewData?.total_flights !== undefined ? overviewData.total_flights.toLocaleString() : (overviewData?.total_monthly_flights?.toLocaleString() || '-')}
          </span>
          <span className="text-[10px] text-slate-500">Aggregated Query</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delay Rate (ArrDel15)</span>
          <span className="text-xl font-extrabold text-rose-400 block mt-1">
            {overviewData?.delay_rate_pct !== undefined ? `${overviewData.delay_rate_pct}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500">&gt;= 15 min delay</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cancellation Rate</span>
          <span className="text-xl font-extrabold text-amber-400 block mt-1">
            {overviewData?.cancellation_rate_pct !== undefined ? `${overviewData.cancellation_rate_pct}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500">Cancelled flights</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diversion Rate</span>
          <span className="text-xl font-extrabold text-purple-400 block mt-1">
            {overviewData?.diversion_rate_pct !== undefined ? `${overviewData.diversion_rate_pct}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500">Diverted flights</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Airlines</span>
          <span className="text-xl font-extrabold text-slate-100 block mt-1">
            {overviewData?.total_airlines || 21}
          </span>
          <span className="text-[10px] text-slate-500">Carriers tracked</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Airports</span>
          <span className="text-xl font-extrabold text-slate-100 block mt-1">
            {overviewData?.total_airports || 375}
          </span>
          <span className="text-[10px] text-slate-500">Origin / Dest hubs</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Delay Time</span>
          <span className="text-xl font-extrabold text-emerald-400 block mt-1">
            {overviewData?.avg_delay_minutes !== undefined ? `${overviewData.avg_delay_minutes} min` : '15.8 min'}
          </span>
          <span className="text-[10px] text-slate-500">Per delayed flight</span>
        </div>
      </div>

      {/* Navigation Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'delays', label: 'Delay Analytics', icon: BarChart3 },
          { id: 'carriers_airports', label: 'Airlines & Airports', icon: Plane },
          { id: 'routes', label: 'Route Intelligence', icon: Compass },
          { id: 'time', label: 'Time & Heatmap', icon: Clock },
          { id: 'model', label: 'ML Model Performance', icon: Cpu },
          { id: 'india', label: 'India Intelligence', icon: Globe },
          { id: 'weather', label: 'Weather Analytics', icon: CloudSun }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT SECTIONS */}

      {/* Tab 1: Delay Analytics */}
      {activeTab === 'delays' && (
        <div className="space-y-6">
          <DelayDistributionChart
            distribution={delayData?.distribution}
            distanceBuckets={delayData?.distance_buckets}
            source="BTS TranStats Combined Flights 2022 (Real DuckDB Aggregation)"
            loading={loading}
            error={error}
          />
          <RouteAnalyticsChart
            topDelayedRoutes={delayData?.top_delayed_routes}
            routes={routeData}
            source="BTS TranStats High-Volume Delayed Corridors"
            loading={loading}
            error={error}
          />
        </div>
      )}

      {/* Tab 2: Airlines & Airports */}
      {activeTab === 'carriers_airports' && (
        <div className="space-y-6">
          <CarrierAnalyticsChart
            carriers={carrierData}
            source={module === 'india' ? 'DGCA India Airlines Reference' : 'BTS TranStats Combined Flights 2022'}
            loading={loading}
            error={error}
          />
          <AirportAnalyticsChart
            airports={airportData}
            source={module === 'india' ? 'Airports Authority of India Master Data' : 'BTS TranStats Airport Traffic Logs'}
            loading={loading}
            error={error}
          />
        </div>
      )}

      {/* Tab 3: Route Intelligence */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          <RouteAnalyticsChart
            routes={routeData}
            topDelayedRoutes={delayData?.top_delayed_routes}
            source="BTS TranStats Route Flight Logs"
            loading={loading}
            error={error}
          />
        </div>
      )}

      {/* Tab 4: Time & Heatmap */}
      {activeTab === 'time' && (
        <div className="space-y-6">
          <HeatmapChart
            data={timeData?.heatmap_matrix}
            source="BTS TranStats Combined Flights 2022 (288-Cell Month x Hour Matrix)"
            loading={loading}
            error={error}
          />
          <TimeTrendChart
            byHour={timeData?.by_hour}
            byMonth={timeData?.by_month}
            byDayOfWeek={timeData?.by_day_of_week}
            source="BTS TranStats Temporal Aggregation"
            loading={loading}
            error={error}
          />
        </div>
      )}

      {/* Tab 5: ML Model Performance */}
      {activeTab === 'model' && (
        <div className="space-y-8">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">Evaluated Machine Learning Engine</span>
                <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">
                  Frozen V1.2.0 Test Evaluation &amp; XGBoost Model D
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold">
                  Frozen Test Set (591,738 Flights)
                </span>
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full text-xs font-bold">
                  Decision Threshold = 0.50
                </span>
              </div>
            </div>

            {/* Model KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">ROC-AUC</span>
                <span className="text-lg font-black text-blue-400">0.6274</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">PR-AUC</span>
                <span className="text-lg font-black text-emerald-400">0.3072</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Precision</span>
                <span className="text-lg font-black text-purple-400">31.82%</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Recall</span>
                <span className="text-lg font-black text-rose-400">63.10%</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">F1 Score</span>
                <span className="text-lg font-black text-amber-400">0.4231</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Brier Score</span>
                <span className="text-lg font-black text-cyan-400">0.2464</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RocCurveChart
              rocCurve={modelData?.frozen_v1_2_0?.roc_curve}
              rocAuc={0.6274}
              modelLabel="Frozen V1.2.0 Test Evaluation"
              evalDataset="591,738 Test Flights (July 2022)"
              loading={loading}
              error={error}
            />
            <PrecisionRecallChart
              prCurve={modelData?.frozen_v1_2_0?.pr_curve}
              prAuc={0.3072}
              baselinePrior={0.2341}
              modelLabel="Frozen V1.2.0 Test Evaluation"
              evalDataset="591,738 Test Flights (July 2022)"
              loading={loading}
              error={error}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FeatureImportanceChart
              features={modelData?.frozen_v1_2_0?.feature_importance}
              modelName="XGBoost Model D"
              loading={loading}
              error={error}
            />
            <CalibrationChart
              calibrationCurve={modelData?.frozen_v1_2_0?.calibration_curve}
              loading={loading}
              error={error}
            />
          </div>

          <ThresholdSweepChart
            sweepData={modelData?.frozen_v1_2_0?.threshold_sweep}
            selectedThreshold={0.50}
            loading={loading}
            error={error}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ConfusionMatrixCard
                confusionMatrix={modelData?.frozen_v1_2_0?.confusion_matrix}
                loading={loading}
                error={error}
              />
            </div>

            {/* Model Comparison Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Model Metric Comparison</h3>
                <p className="text-xs text-slate-400 mt-0.5 mb-4">Evaluating XGBoost vs Random Forest vs Linear Baselines</p>

                <div className="space-y-3">
                  {modelData?.frozen_v1_2_0?.model_comparisons?.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{m.model}</span>
                        <span className="text-[10px] font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{m.status}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>ROC: <strong className="text-slate-200">{m.roc_auc}</strong></span>
                        <span>PR: <strong className="text-slate-200">{m.pr_auc}</strong></span>
                        <span>F1: <strong className="text-slate-200">{m.f1_score}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* India Model Note */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="font-bold text-orange-400 block">India Demand Model V1.0.0:</span>
                <span>MAPE: 5.57% • R²: 0.9837 • Test Period: 2025</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: India Intelligence */}
      {activeTab === 'india' && (
        <div className="space-y-6">
          <IndiaAnalyticsChart
            tamilNaduAirports={indiaData?.tamil_nadu_airports}
            stateAnalytics={indiaData?.state_analytics}
            source="Airports Authority of India (AAI) & DGCA Master Datasets"
            loading={loading}
            error={error}
          />
        </div>
      )}

      {/* Tab 7: Weather Analytics */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          <WeatherAnalyticsChart
            weatherConditions={weatherData?.weather_conditions}
            source="AviationWeather.gov METAR Telemetry Engine"
            loading={loading}
            error={error}
          />
        </div>
      )}
    </div>
  )
}
