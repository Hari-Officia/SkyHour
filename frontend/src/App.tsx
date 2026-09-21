import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom'
import { Plane, Search, Activity, Compass } from 'lucide-react'
import { getHealth, getMapData } from './services/api'
import { Home } from './pages/Home'

const FlightFinder = lazy(() => import('./pages/FlightFinder').then(m => ({ default: m.FlightFinder })))
const SearchResults = lazy(() => import('./pages/SearchResults').then(m => ({ default: m.SearchResults })))
const FlightIntelligence = lazy(() => import('./pages/FlightIntelligence').then(m => ({ default: m.FlightIntelligence })))
const AirportIntelligence = lazy(() => import('./pages/AirportIntelligence').then(m => ({ default: m.AirportIntelligence })))
const RouteIntelligence = lazy(() => import('./pages/RouteIntelligence').then(m => ({ default: m.RouteIntelligence })))
const AirlineIntelligence = lazy(() => import('./pages/AirlineIntelligence').then(m => ({ default: m.AirlineIntelligence })))
const AviationMap = lazy(() => import('./pages/AviationMap').then(m => ({ default: m.AviationMap })))

function NavigationHeader() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [dataMode, setDataMode] = useState<string>('REAL DATA')
  const [isDemo, setIsDemo] = useState<boolean>(false)

  useEffect(() => {
    const checkStatus = () => {
      getHealth()
        .then(() => setApiOnline(true))
        .catch(() => setApiOnline(false))

      getMapData()
        .then(res => {
          setDataMode(res.data_mode || 'REAL DATA')
          setIsDemo(res.is_demo)
        })
        .catch(() => {
          setDataMode('DEMO MODE')
          setIsDemo(true)
        })
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-slate-100 group" to="/">
          <span className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            <Plane size={20} />
          </span>
          <span>SKYHOUR</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <NavLink to="/" end className={({ isActive }) => `px-3 py-1.5 rounded-xl transition-all ${isActive ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}>
            Home
          </NavLink>
          <NavLink to="/flights" className={({ isActive }) => `px-3 py-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <span className="flex items-center gap-1.5">
              <Compass size={16} />
              <span>Flight Finder</span>
            </span>
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `px-3 py-1.5 rounded-xl transition-all ${isActive ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}>
            Aviation Map
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Data Mode Provenance Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-semibold ${isDemo ? 'bg-amber-950/60 border-amber-700/80 text-amber-300' : 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'}`}>
          <Activity size={12} className={isDemo ? 'text-amber-400 animate-pulse' : 'text-emerald-400'} />
          <span>{dataMode}</span>
        </div>

        {/* API Health Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold">
          <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : apiOnline === false ? 'bg-red-500' : 'bg-amber-500'}`} />
          <span className="text-slate-300">{apiOnline === null ? 'Connecting' : apiOnline ? 'API Online' : 'API Offline'}</span>
        </div>

        <Link to="/flights?origin=MAA&destination=DEL" className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer">
          <Search size={14} /> Find Flights
        </Link>
      </div>
    </header>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        <NavigationHeader />

        <main className="flex-1">
          <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/flights" element={<FlightFinder />} />
              <Route path="/flight-finder" element={<FlightFinder />} />
              <Route path="/search-flights" element={<FlightFinder />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/flight/:flightId" element={<FlightIntelligence />} />
              <Route path="/airport/:airportCode" element={<AirportIntelligence />} />
              <Route path="/route" element={<RouteIntelligence />} />
              <Route path="/route/:origin/:destination" element={<RouteIntelligence />} />
              <Route path="/airline/:airlineCode" element={<AirlineIntelligence />} />
              <Route path="/map" element={<AviationMap />} />
            </Routes>
          </Suspense>
        </main>

        <footer className="bg-slate-950 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Plane size={14} className="text-blue-500" />
              <span className="font-semibold text-slate-400">SKYHOUR</span> — Airline Flight Intelligence &amp; Delay Prediction System
            </div>
            <span>Data Sources: OpenSky Network • AviationWeather.gov • BTS TranStats • DGCA India</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
