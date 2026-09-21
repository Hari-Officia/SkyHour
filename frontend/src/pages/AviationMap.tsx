import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import { getMapData, searchUniversal } from '../services/api'
import { getMapFlights } from '../services/flightSearchApi'
import type { MapDataResponse, SearchResultItem } from '../services/api'
import type { MapFlightItem } from '../services/flightSearchApi'
import 'leaflet/dist/leaflet.css'

// Fix default Leaflet icon paths
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
} catch (e) {
  // Ignore fallback icon URL deletion error
}

// Helper for custom plane icon
function getPlaneIcon() {
  return L.divIcon({
    className: 'custom-plane-icon',
    html: `<div style="background:#2563eb;color:white;padding:5px;border-radius:50%;box-shadow:0 0 12px rgba(37,99,235,0.9);display:flex;align-items:center;justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13 8.5 4.8 6.7c-.6-.1-1.2.2-1.5.7l-.9 1.5c-.3.5-.2 1.2.3 1.5L9 14l-4 4-2.5-.5c-.4-.1-.8.1-1 .5l-.4.7c-.2.4-.1.9.2 1.2l3 2.5c.3.3.8.4 1.2.2l.7-.4c.4-.2.6-.6.5-1L6.2 19l4-4 3.3 6.3c.3.5 1 .6 1.5.3l1.5-.9c.5-.3.8-.9.7-1.5z"/></svg>
           </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  })
}

function MapController({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 })
    }
  }, [center, zoom, map])
  return null
}

export function AviationMap() {
  const [searchParams] = useSearchParams()

  const paramOrigin = searchParams.get('origin') || ''
  const paramDest = searchParams.get('destination') || ''
  const paramDate = searchParams.get('date') || ''

  const [mapData, setMapData] = useState<MapDataResponse | null>(null)
  const [spatialFlights, setSpatialFlights] = useState<MapFlightItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [mapCenter, setMapCenter] = useState<[number, number] | null>([20.5937, 78.9629])
  const [mapZoom, setMapZoom] = useState<number>(5)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])

  const loadGISData = async () => {
    setLoading(true)
    setError(null)
    try {
      const baseMapRes = await getMapData()
      setMapData(baseMapRes)

      const spatialRes = await getMapFlights({
        origin: paramOrigin || undefined,
        destination: paramDest || undefined,
        date: paramDate || undefined
      })
      if (spatialRes && spatialRes.aircraft) {
        setSpatialFlights(spatialRes.aircraft)
      }
    } catch (e) {
      setError('Aviation GIS Map data service temporarily unavailable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGISData()
  }, [paramOrigin, paramDest, paramDate])

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val)
    if (val.trim().length > 1) {
      try {
        const res = await searchUniversal(val.trim())
        setSearchResults(res.results || [])
      } catch (e) {
        setSearchResults([])
      }
    } else {
      setSearchResults([])
    }
  }

  const handleSelectResult = (item: SearchResultItem) => {
    setSearchResults([])
    setSearchQuery(item.title)
    
    if (item.latitude && item.longitude) {
      setMapCenter([item.latitude, item.longitude])
      setMapZoom(9)
    } else if (item.type === 'ROUTE' && mapData) {
      const matchRoute = mapData.routes.find(r => r.route_code === item.id)
      if (matchRoute) {
        setMapCenter([matchRoute.origin_lat, matchRoute.origin_lon])
        setMapZoom(6)
      }
    }
  }

  const getRiskColor = (score: number) => {
    if (score < 35) return '#10b981'
    if (score < 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="relative h-[calc(100vh-65px)] w-full bg-slate-950 flex flex-col">
      {/* Search & Status Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] max-w-xl mx-auto space-y-2">
        <div className="relative">
          <div className="flex items-center bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl px-4 py-2.5">
            <Search className="text-slate-400 mr-2" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Map GIS Search: Airport (MAA), Flight (AI302), Route (MAA DEL)..."
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            />
          </div>

          {/* Autocomplete Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800/60 flex items-center justify-between text-xs cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-white block">{item.title}</span>
                    <span className="text-slate-400">{item.subtitle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-blue-400 font-bold">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data Provenance & Fallback Notice */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl text-xs text-slate-300 shadow-xl">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-400 animate-pulse" />
            <span>Map Mode: <strong className="text-white">SCHEDULED &amp; SIMULATION DATA</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Flights Active: <strong className="text-blue-400">{spatialFlights.length}</strong></span>
            <button onClick={loadGISData} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all cursor-pointer">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="flex-1 w-full h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-slate-950 text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-semibold">Loading Aviation GIS Map Layers...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full bg-slate-950 text-slate-400 p-4">
            <div className="max-w-md text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <AlertTriangle size={40} className="mx-auto text-amber-500" />
              <h3 className="text-lg font-bold text-white">Map Data Unavailable</h3>
              <p className="text-xs text-slate-400">{error}</p>
              <button onClick={loadGISData} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer">
                Retry GIS Data Load
              </button>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%', background: '#020617' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController center={mapCenter} zoom={mapZoom} />

            {/* Airport Circles scaled by volume */}
            {mapData?.airports.map((apt) => {
              const radius = Math.max(8, Math.min(22, (apt.total_movements / 150) * 18))
              const color = getRiskColor(apt.risk_score)

              return (
                <CircleMarker
                  key={apt.code}
                  center={[apt.latitude, apt.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.5,
                    weight: 2
                  }}
                  eventHandlers={{
                    click: () => {
                      setMapCenter([apt.latitude, apt.longitude])
                      setMapZoom(9)
                    }
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-2 space-y-1.5 text-slate-900 text-xs font-sans">
                      <div className="font-extrabold text-sm text-slate-900">{apt.name} ({apt.code})</div>
                      <div>City: <strong>{apt.city}, {apt.country}</strong></div>
                      <div>Movements: <strong>{apt.total_movements} flights</strong></div>
                      <div>Risk Score: <strong style={{ color: color }}>{apt.risk_score} ({apt.risk_category})</strong></div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}

            {/* Route Polylines from spatial flights */}
            {spatialFlights.map((sf, idx) => (
              <Polyline
                key={`poly-${idx}`}
                positions={sf.route_geometry}
                pathOptions={{
                  color: sf.risk_level === 'HIGH' ? '#ef4444' : sf.risk_level === 'MEDIUM' ? '#f59e0b' : '#3b82f6',
                  weight: 2.5,
                  dashArray: '6, 8',
                  opacity: 0.85
                }}
              >
                <Popup>
                  <div className="p-2 text-xs font-sans text-slate-900">
                    <div className="font-bold text-sm">{sf.flight_number} Route Corridor</div>
                    <div>Origin: <strong>{sf.origin}</strong> → Dest: <strong>{sf.destination}</strong></div>
                    <div>Predicted Risk: <strong>{sf.delay_probability}% ({sf.risk_level})</strong></div>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* Live / Simulated Aircraft Markers */}
            {spatialFlights.map((ac, idx) => (
              <Marker
                key={ac.flight_id || idx}
                position={[ac.latitude, ac.longitude]}
                icon={getPlaneIcon()}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 text-xs text-slate-900 font-sans">
                    <div className="font-bold text-sm text-blue-600">{ac.flight_number} ({ac.airline})</div>
                    <div>Corridor: <strong>{ac.origin} → {ac.destination}</strong></div>
                    <div>Altitude: <strong>{ac.altitude_ft} ft</strong></div>
                    <div>Speed: <strong>{ac.ground_speed_kts} kts</strong></div>
                    <div>Heading: <strong>{ac.heading_deg}°</strong></div>
                    <div>Delay Risk: <strong className={ac.risk_level === 'HIGH' ? 'text-red-600' : 'text-emerald-600'}>{ac.delay_probability}% ({ac.risk_level})</strong></div>
                    <div className="text-[10px] text-slate-500 pt-1 border-t">Mode: {ac.data_mode}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
