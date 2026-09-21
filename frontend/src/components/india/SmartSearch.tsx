import { useEffect, useRef, useState } from 'react'
import { Building2, Compass, MapPin, Navigation, Plane, Search, X } from 'lucide-react'
import type { IndiaAirline, IndiaAirport, IndiaRoute } from '../../types/india'

export interface SearchResultItem {
  id: string
  category: 'AIRPORT' | 'AIRLINE' | 'FLIGHT' | 'ROUTE' | 'STATE' | 'CITY'
  title: string
  subtitle: string
  badge?: string
  data: {
    airport?: IndiaAirport
    route?: IndiaRoute
    airline?: IndiaAirline
    flightNumber?: string
    city?: string
    state?: string
  }
}

interface SmartSearchProps {
  airports: IndiaAirport[]
  routes: IndiaRoute[]
  airlines: IndiaAirline[]
  onSelectAirport?: (airport: IndiaAirport) => void
  onSelectRoute?: (route: IndiaRoute) => void
  onSelectFlight?: (flightNumber: string) => void
  onSelectAirline?: (airline: IndiaAirline) => void
  onSelectCity?: (cityName: string) => void
  onSelectState?: (stateName: string) => void
  placeholder?: string
}

export function SmartSearch({
  airports,
  routes,
  airlines,
  onSelectAirport,
  onSelectRoute,
  onSelectFlight,
  onSelectAirline,
  onSelectCity,
  onSelectState,
  placeholder = 'Smart Search (e.g. MAA, Chennai, 6E1234, MAA DEL, IndiGo, Tamil Nadu)...'
}: SmartSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Process Search Query with Debouncing & Intent Recognition
  useEffect(() => {
    const trimmed = query.trim().toUpperCase()
    if (!trimmed) {
      setResults([])
      setIsOpen(false)
      setSelectedIndex(-1)
      return
    }

    const timer = setTimeout(() => {
      const items: SearchResultItem[] = []
      const searchLower = query.trim().toLowerCase()

      // 1. ROUTE MATCH (e.g. "MAA DEL", "MAA-DEL", "MAA TO DEL", "MAA -> DEL")
      const routeClean = trimmed.replace(/\s*(?:->|TO|-|➔)\s*/g, ' ')
      const routeParts = routeClean.split(/\s+/).filter(Boolean)
      if (routeParts.length >= 2) {
        const origQuery = routeParts[0]
        const destQuery = routeParts[1]
        const matchedRoutes = routes.filter(r => {
          const origMatch = r.origin.includes(origQuery) || r.route_id.includes(origQuery)
          const destMatch = r.destination.includes(destQuery) || r.route_id.includes(destQuery)
          return origMatch && destMatch
        })

        matchedRoutes.forEach(r => {
          items.push({
            id: `route-${r.route_id}`,
            category: 'ROUTE',
            title: `${r.origin} ➔ ${r.destination}`,
            subtitle: `${r.monthly_passengers.toLocaleString()} pax/mo | ${r.category} | Top: ${r.top_airline}`,
            badge: `${r.distance_km} km`,
            data: { route: r }
          })
        })
      }

      // 2. FLIGHT MATCH (e.g. "6E1234", "AI101", "SG8123", "6E 204", "UK955")
      const flightPattern = /^([A-Z0-9]{2,3})\s*(\d{1,4})$/i
      const flightMatch = trimmed.match(flightPattern)
      if (flightMatch || /^\d{3,4}$/.test(trimmed) || (trimmed.length >= 3 && /\d/.test(trimmed))) {
        const fnFormatted = flightMatch ? `${flightMatch[1]}${flightMatch[2]}` : trimmed
        items.push({
          id: `flight-${fnFormatted}`,
          category: 'FLIGHT',
          title: `Flight ${fnFormatted}`,
          subtitle: `Inspect schedule, route map & delay risk profile`,
          badge: `FLIGHT SEARCH`,
          data: { flightNumber: fnFormatted }
        })
      }

      // 3. AIRPORT MATCH (IATA, City, Name)
      const matchedAirports = airports.filter(a =>
        a.airport_iata.toLowerCase().includes(searchLower) ||
        a.airport_name.toLowerCase().includes(searchLower) ||
        a.city.toLowerCase().includes(searchLower)
      )

      matchedAirports.slice(0, 5).forEach(a => {
        items.push({
          id: `airport-${a.airport_iata}`,
          category: 'AIRPORT',
          title: `${a.airport_name} (${a.airport_iata})`,
          subtitle: `${a.city}, ${a.state} | ${a.annual_passengers_mil}M pax/yr | Risk Score: ${a.skyhour_risk_score ?? 'N/A'}`,
          badge: a.airport_type || 'AIRPORT',
          data: { airport: a }
        })
      })

      // 4. CITY MATCH
      const uniqueCities = Array.from(new Set(airports.map(a => a.city))).filter(c => c.toLowerCase().includes(searchLower))
      uniqueCities.slice(0, 3).forEach(c => {
        const count = airports.filter(a => a.city.toLowerCase() === c.toLowerCase()).length
        items.push({
          id: `city-${c}`,
          category: 'CITY',
          title: `${c}`,
          subtitle: `${count} airport(s) serving this region`,
          badge: 'CITY',
          data: { city: c }
        })
      })

      // 5. STATE MATCH
      const uniqueStates = Array.from(new Set(airports.map(a => a.state))).filter(s => s.toLowerCase().includes(searchLower))
      uniqueStates.slice(0, 3).forEach(s => {
        const count = airports.filter(a => a.state.toLowerCase() === s.toLowerCase()).length
        items.push({
          id: `state-${s}`,
          category: 'STATE',
          title: `${s}`,
          subtitle: `${count} airport(s) in state network`,
          badge: 'STATE',
          data: { state: s }
        })
      })

      // 6. AIRLINE MATCH
      const matchedAirlines = airlines.filter(al =>
        al.airline_name.toLowerCase().includes(searchLower) ||
        al.iata_code.toLowerCase().includes(searchLower) ||
        al.airline_code.toLowerCase().includes(searchLower)
      )

      matchedAirlines.forEach(al => {
        items.push({
          id: `airline-${al.airline_code}`,
          category: 'AIRLINE',
          title: `${al.airline_name} (${al.iata_code})`,
          subtitle: `Market Share: ${al.market_share_pct}% | Fleet: ${al.fleet_size} aircraft`,
          badge: 'AIRLINE',
          data: { airline: al }
        })
      })

      setResults(items)
      setIsOpen(items.length > 0)
      setSelectedIndex(-1)
    }, 150)

    return () => clearTimeout(timer)
  }, [query, airports, routes, airlines])

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false)
    if (item.category === 'AIRPORT' && item.data.airport && onSelectAirport) {
      onSelectAirport(item.data.airport)
    } else if (item.category === 'ROUTE' && item.data.route && onSelectRoute) {
      onSelectRoute(item.data.route)
    } else if (item.category === 'FLIGHT' && item.data.flightNumber && onSelectFlight) {
      onSelectFlight(item.data.flightNumber)
    } else if (item.category === 'AIRLINE' && item.data.airline && onSelectAirline) {
      onSelectAirline(item.data.airline)
    } else if (item.category === 'CITY' && item.data.city && onSelectCity) {
      onSelectCity(item.data.city)
    } else if (item.category === 'STATE' && item.data.state && onSelectState) {
      onSelectState(item.data.state)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex])
      } else if (results.length > 0) {
        handleSelect(results[0])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Group results by category
  const categories: Array<'AIRPORT' | 'FLIGHT' | 'ROUTE' | 'AIRLINE' | 'CITY' | 'STATE'> = [
    'FLIGHT', 'AIRPORT', 'ROUTE', 'AIRLINE', 'CITY', 'STATE'
  ]

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'AIRPORT': return <Building2 size={15} className="text-cyan" />
      case 'FLIGHT': return <Plane size={15} className="text-sky" />
      case 'ROUTE': return <Navigation size={15} className="text-indigo" />
      case 'AIRLINE': return <Compass size={15} className="text-emerald" />
      default: return <MapPin size={15} className="text-amber" />
    }
  }

  return (
    <div className="smart-search-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div className="smart-search-bar glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderRadius: '14px', gap: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(15, 23, 42, 0.75)' }}>
        <Search size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          placeholder={placeholder}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '15px' }}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); inputRef.current?.focus(); }}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Panel */}
      {isOpen && results.length > 0 && (
        <div
          className="smart-search-dropdown glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '420px',
            overflowY: 'auto',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {categories.map(cat => {
            const catItems = results.filter(r => r.category === cat)
            if (catItems.length === 0) return null

            return (
              <div key={cat} className="search-group" style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ padding: '4px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getCategoryIcon(cat)} <span>{cat}</span>
                </div>

                {catItems.map(item => {
                  const globalIdx = results.findIndex(r => r.id === item.id)
                  const isSelected = globalIdx === selectedIndex

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{item.subtitle}</div>
                      </div>
                      {item.badge && (
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
