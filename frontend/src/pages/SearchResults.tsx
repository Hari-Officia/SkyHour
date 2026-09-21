import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Plane, MapPin, Navigation, Building2, ArrowRight } from 'lucide-react'
import { searchUniversal } from '../services/api'
import type { UniversalSearchResponse, SearchResultItem } from '../services/api'

export function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UniversalSearchResponse | null>(null)

  useEffect(() => {
    if (query) {
      setLoading(true)
      searchUniversal(query)
        .then(res => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    }
  }, [query])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="text-blue-500" size={24} />
            Search Results for "{query}"
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Found {data?.total_results || 0} matching entities across flights, airports, routes, and airlines.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !data || data.results.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Plane className="mx-auto text-slate-600" size={48} />
          <h2 className="text-xl font-bold text-slate-200">No matching entities found</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try searching for a flight number like <strong className="text-slate-200">AI302</strong>, airport code <strong className="text-slate-200">MAA</strong>, route <strong className="text-slate-200">MAA DEL</strong>, or airline <strong className="text-slate-200">IndiGo</strong>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.results.map((item: SearchResultItem, index: number) => {
            const isAirport = item.type === 'AIRPORT'
            const isFlight = item.type === 'FLIGHT'
            const isRoute = item.type === 'ROUTE'
            const isAirline = item.type === 'AIRLINE'

            return (
              <Link
                key={index}
                to={item.url}
                className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-900 transition-all flex items-start justify-between group shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${isAirport ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' : isFlight ? 'bg-blue-950/80 text-blue-400 border border-blue-800/80' : isRoute ? 'bg-purple-950/80 text-purple-400 border border-purple-800/80' : 'bg-amber-950/80 text-amber-400 border border-amber-800/80'}`}>
                    {isAirport && <MapPin size={22} />}
                    {isFlight && <Plane size={22} />}
                    {isRoute && <Navigation size={22} />}
                    {isAirline && <Building2 size={22} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1 group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>

                <ArrowRight className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all mt-2" size={18} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
