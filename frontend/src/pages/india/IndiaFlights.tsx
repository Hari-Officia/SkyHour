import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertCircle, ArrowRight, Clock, Info, Navigation, Plane, Search, ShieldCheck } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getIndiaAirports, getIndiaFlights } from '../../services/indiaApi'
import type { IndiaAirport, IndiaFlightSchedule } from '../../types/india'

export function IndiaFlights() {
  const location = useLocation()
  const [flights, setFlights] = useState<IndiaFlightSchedule[]>([])
  const [airports, setAirports] = useState<IndiaAirport[]>([])
  const [selectedFlight, setSelectedFlight] = useState<IndiaFlightSchedule | null>(null)

  const [fn, setFn] = useState('')
  const [airline, setAirline] = useState('')
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const miniMapContainerRef = useRef<HTMLDivElement>(null)
  const miniMapInstanceRef = useRef<L.Map | null>(null)

  const fetchFlights = (overrideFn?: string) => {
    setLoading(true)
    setErrorMsg('')
    const targetFn = overrideFn !== undefined ? overrideFn : fn

    getIndiaFlights(targetFn, airline, origin, dest)
      .then(res => {
        setFlights(res)
        if (res.length > 0) {
          setSelectedFlight(res[0])
        } else {
          setSelectedFlight(null)
          if (targetFn) {
            setErrorMsg(`No active scheduled flight record found for "${targetFn}". Try 6E1234, AI101, or SG8123.`)
          }
        }
      })
      .catch(err => {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to query flight schedules.')
      })
      .finally(() => setLoading(false))
  }

  // Parse query parameters from URL on load
  useEffect(() => {
    getIndiaAirports().then(setAirports).catch(console.error)

    const params = new URLSearchParams(location.search)
    const fnParam = params.get('fn') || ''
    if (fnParam) {
      setFn(fnParam)
      fetchFlights(fnParam)
    } else {
      fetchFlights('')
    }
  }, [location.search])

  // Render Mini Route Map for Selected Flight
  useEffect(() => {
    if (!selectedFlight || !miniMapContainerRef.current) return

    const origAp = airports.find(a => a.airport_iata === selectedFlight.origin)
    const destAp = airports.find(a => a.airport_iata === selectedFlight.destination)

    if (!miniMapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      })

      const primaryTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
      const fallbackTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'

      const tileLayer = L.tileLayer(primaryTileUrl, {
        maxZoom: 18,
        subdomains: 'abcd'
      })

      let fallbackTriggered = false
      tileLayer.on('tileerror', () => {
        if (!fallbackTriggered && miniMapInstanceRef.current) {
          fallbackTriggered = true
          miniMapInstanceRef.current.removeLayer(tileLayer)
          const fallbackLayer = L.tileLayer(fallbackTileUrl, { maxZoom: 18 })
          fallbackLayer.addTo(miniMapInstanceRef.current)
        }
      })

      tileLayer.addTo(map)
      miniMapInstanceRef.current = map
    }

    const map = miniMapInstanceRef.current

    // Clear previous layers
    map.eachLayer(layer => {
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    if (origAp && destAp) {
      const bounds = L.latLngBounds(
        [origAp.latitude, origAp.longitude],
        [destAp.latitude, destAp.longitude]
      )
      map.fitBounds(bounds, { padding: [40, 40] })

      // Draw Route Polyline
      L.polyline(
        [
          [origAp.latitude, origAp.longitude],
          [destAp.latitude, destAp.longitude]
        ],
        { color: '#38bdf8', weight: 3, dashArray: '6, 8' }
      ).addTo(map)

      // Draw Origin and Destination Markers
      L.circleMarker([origAp.latitude, origAp.longitude], {
        radius: 7,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
      }).bindTooltip(`Origin: ${origAp.airport_name} (${origAp.airport_iata})`).addTo(map)

      L.circleMarker([destAp.latitude, destAp.longitude], {
        radius: 7,
        fillColor: '#f43f5e',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
      }).bindTooltip(`Destination: ${destAp.airport_name} (${destAp.airport_iata})`).addTo(map)
    }
  }, [selectedFlight, airports])

  return (
    <section className="wrap page">
      <div className="page-header">
        <div className="badge-pill">
          <span>FLIGHT INTELLIGENCE WORKFLOW</span>
        </div>
        <h1>Check My Flight</h1>
        <p>Inspect flight schedule details, status, timestamps, route maps, and operational reliability.</p>
      </div>

      {/* Data Transparency Banner */}
      <div className="glass-panel alert-box" style={{ marginBottom: 24, padding: '14px 18px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: '#38bdf8', fontWeight: 700, fontSize: '13px' }}>
          <Info size={16} /> DATA SOURCE & TELEMETRY TRANSPARENCY
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
          <strong>Published Schedules:</strong> Flight itineraries, departure/arrival windows, and statuses originate from DGCA / AirSewa published commercial flight data.<br />
          <strong>Live ADS-B Aircraft Position:</strong> Satellite tracking is <em>not configured</em>. Published route vectors are displayed on the flight map without fabricating aircraft coordinates.
        </p>
      </div>

      {/* Flight Search Form Card */}
      <div className="glass-panel search-card" style={{ marginBottom: 24, padding: '20px', borderRadius: '18px' }}>
        <form
          className="search-form-grid"
          onSubmit={e => {
            e.preventDefault()
            fetchFlights()
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '14px', alignItems: 'end' }}
        >
          <div className="input-group">
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Flight Code</label>
            <input
              value={fn}
              onChange={e => setFn(e.target.value.toUpperCase())}
              placeholder="e.g. 6E1234, AI101"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Airline</label>
            <input
              value={airline}
              onChange={e => setAirline(e.target.value.toUpperCase())}
              placeholder="e.g. IndiGo, Air India"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Origin IATA</label>
            <input
              value={origin}
              onChange={e => setOrigin(e.target.value.toUpperCase())}
              placeholder="e.g. DEL, MAA"
              maxLength={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Destination IATA</label>
            <input
              value={dest}
              onChange={e => setDest(e.target.value.toUpperCase())}
              placeholder="e.g. BOM, BLR"
              maxLength={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
            />
          </div>

          <button type="submit" className="button primary" disabled={loading} style={{ height: '40px', padding: '0 20px', whiteSpace: 'nowrap' }}>
            {loading ? 'Searching...' : 'Check Flight'} <Search size={15} />
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}
      </div>

      {/* Selected Flight Intelligence Details */}
      {selectedFlight && (
        <div className="flight-intelligence-workspace" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '32px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.08em' }}>FLIGHT INTELLIGENCE</span>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0 0' }}>
                  {selectedFlight.flight_number}
                </h2>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>{selectedFlight.airline_name} ({selectedFlight.airline})</span>
              </div>
              <span className="status-tag" style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                {selectedFlight.status || 'Scheduled'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '20px', borderRadius: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>{selectedFlight.origin}</div>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{selectedFlight.origin_name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> Departure: {selectedFlight.dep_time}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Plane size={22} style={{ color: '#38bdf8' }} />
                <ArrowRight size={20} style={{ color: '#64748b' }} />
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>{selectedFlight.destination}</div>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{selectedFlight.destination_name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <Clock size={13} /> Arrival: {selectedFlight.arr_time}
                </div>
              </div>
            </div>

            {/* Flight Metadata Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>DATA SOURCE</span>
                <strong style={{ color: '#cbd5e1' }}>DGCA / AirSewa Schedule</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>SCHEDULE TYPE</span>
                <strong style={{ color: '#cbd5e1' }}>Published Commercial Flight</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>TIMESTAMP</span>
                <strong style={{ color: '#cbd5e1' }}>{new Date().toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

          {/* Flight Map & Telemetry Warning Card */}
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '18px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Navigation size={14} style={{ color: '#38bdf8' }} /> ROUTE MAP
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                {selectedFlight.origin} ➔ {selectedFlight.destination}
              </span>
            </div>

            <div ref={miniMapContainerRef} style={{ width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }} />

            {/* Explicit Notice about Live Aircraft Telemetry */}
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Live Aircraft Position Unavailable</strong>
                Showing published route vector. Real-time satellite ADS-B tracking is unavailable for this domestic flight schedule.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Schedule Catalog List */}
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldCheck size={18} style={{ color: '#38bdf8' }} /> Available Scheduled Flights ({flights.length})
      </h3>

      <div className="flights-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {flights.map(f => {
          const isSelected = selectedFlight?.flight_number === f.flight_number
          return (
            <div
              key={f.flight_number}
              onClick={() => setSelectedFlight(f)}
              className="glass-panel flight-item-card"
              style={{
                padding: '16px',
                borderRadius: '14px',
                cursor: 'pointer',
                border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15,23,42,0.6)',
                transition: 'all 0.15s ease'
              }}
            >
              <div className="fl-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{f.flight_number}</h4>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.airline_name}</span>
                </div>
                <span className="status-tag" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
                  {f.status || 'Scheduled'}
                </span>
              </div>

              <div className="fl-route" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <div>
                  <strong style={{ color: '#f8fafc' }}>{f.origin}</strong>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{f.dep_time}</div>
                </div>
                <ArrowRight size={16} style={{ color: '#38bdf8' }} />
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#f8fafc' }}>{f.destination}</strong>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{f.arr_time}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
