import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Plane, MapPin, ArrowRight, Activity, Compass, ShieldCheck } from 'lucide-react'

export function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-6xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-400 text-xs font-semibold shadow-lg shadow-blue-950/50">
          <Activity size={14} className="animate-pulse" />
          <span>Next-Gen Date-Wise Flight Intelligence &amp; Delay Prediction</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          SKYHOUR
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
          Investigate flights by date, route, and time window. Compare carrier delay risk, weather forecasts, and machine learning delay probabilities.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/flights"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-base shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Compass size={20} />
            <span>FIND FLIGHTS &amp; DELAY RISK</span>
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/map"
            className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-2xl text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MapPin size={20} className="text-purple-400" />
            <span>Explore Aviation GIS Map</span>
          </Link>
        </div>

        {/* Large Universal Search Box */}
        <form onSubmit={handleSearch} className="mt-8 relative max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400" size={22} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search flight (e.g. AI302), airport (MAA), route (MAA DEL), or airline (IndiGo)..."
              className="w-full pl-12 pr-32 py-4 bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-2xl text-base font-medium transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Search</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Example Search Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Popular Queries:</span>
          <button onClick={() => navigate('/flights?origin=MAA&destination=DEL')} className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-slate-200 transition-all cursor-pointer">
            🛫 MAA → DEL (Flight Finder)
          </button>
          <button onClick={() => navigate('/flight/AI302')} className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-slate-200 transition-all cursor-pointer">
            ✈️ AI302
          </button>
          <button onClick={() => navigate('/airport/MAA')} className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-slate-200 transition-all cursor-pointer">
            📍 MAA (Chennai)
          </button>
          <button onClick={() => navigate('/airline/6E')} className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-slate-200 transition-all cursor-pointer">
            🏢 IndiGo (6E)
          </button>
        </div>
      </div>

      {/* Grid Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center font-bold">
            <Compass size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Date-Wise Flight Finder</h3>
          <p className="text-sm text-slate-400">
            Investigate flight options by date, departure time window, and airline with ML delay probability breakdown.
          </p>
          <Link to="/flights" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300">
            Open Flight Finder →
          </Link>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Airport &amp; Route Risk</h3>
          <p className="text-sm text-slate-400">
            Entity-specific dynamic risk scores derived from actual traffic pressure, cancellation rates, and weather severity.
          </p>
          <Link to="/airport/MAA" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300">
            View MAA Intelligence →
          </Link>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center font-bold">
            <Plane size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Carrier Comparison</h3>
          <p className="text-sm text-slate-400">
            Compare operators side-by-side on historical delay rate, cancellation percentage, and arrival reliability.
          </p>
          <Link to="/route/MAA/DEL" className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300">
            Compare Carriers on MAA-DEL →
          </Link>
        </div>
      </div>
    </div>
  )
}
