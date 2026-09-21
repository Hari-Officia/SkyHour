import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, Building2, MapPin, Navigation, Plane, ShieldAlert } from 'lucide-react'
import { IndiaMap } from '../../components/india/IndiaMap'
import { AirportIntelligencePanel } from '../../components/india/AirportIntelligencePanel'
import { SmartSearch } from '../../components/india/SmartSearch'
import { getIndiaAirlines, getIndiaMapData, getIndiaOverview } from '../../services/indiaApi'
import type { IndiaAirline, IndiaAirport, IndiaOverview, IndiaRoute } from '../../types/india'

export function IndiaHome() {
  const [overview, setOverview] = useState<IndiaOverview | null>(null)
  const [airports, setAirports] = useState<IndiaAirport[]>([])
  const [routes, setRoutes] = useState<IndiaRoute[]>([])
  const [airlines, setAirlines] = useState<IndiaAirline[]>([])
  const [selectedAirport, setSelectedAirport] = useState<IndiaAirport | null>(null)
  const [loading, setLoading] = useState(true)

  // Quick Check My Flight Form State
  const [flightNumberInput, setFlightNumberInput] = useState('6E1234')
  const [flightError, setFlightError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getIndiaOverview(), getIndiaMapData(), getIndiaAirlines()])
      .then(([ov, mapData, alData]) => {
        setOverview(ov)
        setAirports(mapData.airports)
        setRoutes(mapData.routes)
        setAirlines(alData)
        if (mapData.airports.length > 0) {
          setSelectedAirport(mapData.airports[0]) // Default DEL
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleFlightSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFlightError('')
    const cleaned = flightNumberInput.trim().toUpperCase()
    if (!cleaned) {
      setFlightError('Please enter a valid flight number (e.g. 6E1234, AI101).')
      return
    }
    navigate(`/india/flights?fn=${encodeURIComponent(cleaned)}`)
  }

  return (
    <section className="wrap page">
      {/* Page Header */}
      <div className="page-header">
        <div className="badge-pill">
          <span>INDIA AVIATION TRAFFIC, WEATHER & NETWORK INTELLIGENCE</span>
        </div>
        <h1>
          Skyhour India<br />
          <em>National Aviation Platform</em>
        </h1>
        <p>Interactive spatial mapping, airport traffic pressure, weather risks, and network centrality across Indian airspace.</p>
      </div>

      {/* Smart Search & Check My Flight Hero Section */}
      <div className="home-search-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', marginBottom: '8px' }}>
            ASSISTED SMART SEARCH
          </div>
          <SmartSearch
            airports={airports}
            routes={routes}
            airlines={airlines}
            onSelectAirport={ap => setSelectedAirport(ap)}
            onSelectRoute={r => navigate(`/india/routes?origin=${r.origin}&dest=${r.destination}`)}
            onSelectFlight={fn => navigate(`/india/flights?fn=${encodeURIComponent(fn)}`)}
            onSelectAirline={al => navigate(`/india/airlines?code=${al.airline_code}`)}
            onSelectCity={c => navigate(`/india/airports?q=${encodeURIComponent(c)}`)}
            onSelectState={s => navigate(`/india/airports?q=${encodeURIComponent(s)}`)}
          />
        </div>

        {/* Check My Flight Workflow Box */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(56, 189, 248, 0.3)', background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Plane size={18} style={{ color: '#38bdf8' }} />
            <strong style={{ fontSize: '15px', color: '#f8fafc' }}>CHECK MY FLIGHT</strong>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
            Lookup schedule status, route map & delay risk profile.
          </p>

          <form onSubmit={handleFlightSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={flightNumberInput}
              onChange={e => setFlightNumberInput(e.target.value)}
              placeholder="e.g. 6E1234, AI101"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button type="submit" className="button primary" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
              Check <ArrowRight size={14} />
            </button>
          </form>
          {flightError && <div style={{ fontSize: '11px', color: '#f43f5e', marginTop: '6px' }}>{flightError}</div>}
        </div>
      </div>

      {/* National Metric KPI Strip */}
      {overview && (
        <div className="kpi-grid">
          <div className="kpi-card glass-panel">
            <span className="kpi-label">ACTIVE AIRPORTS</span>
            <span className="kpi-value">{overview.total_airports}</span>
            <span className="kpi-sub">Domestic & International</span>
          </div>
          <div className="kpi-card glass-panel">
            <span className="kpi-label">MONTHLY FOOTFALL</span>
            <span className="kpi-value">{(overview.total_monthly_passengers / 1e6).toFixed(1)}M</span>
            <span className="kpi-sub">DGCA / MoCA Traffic</span>
          </div>
          <div className="kpi-card glass-panel">
            <span className="kpi-label">PRIMARY HUB</span>
            <span className="kpi-value" style={{ fontSize: 20 }}>{overview.top_hub}</span>
            <span className="kpi-sub">Rank #1 Network Centrality</span>
          </div>
          <div className="kpi-card glass-panel">
            <span className="kpi-label">LEADING CARRIER</span>
            <span className="kpi-value" style={{ fontSize: 20 }}>{overview.top_airline}</span>
            <span className="kpi-sub">{overview.top_airline_market_share_pct}% Market Share</span>
          </div>
        </div>
      )}

      {/* Main Interactive Map & Side Panel Workspace */}
      <div className="workspace-grid" style={{ marginTop: 24, gridTemplateColumns: '1.4fr 0.8fr' }}>
        <div className="map-column">
          {loading ? (
            <div className="glass-panel" style={{ height: 540, display: 'grid', placeItems: 'center' }}>
              <Activity className="pulse-icon" size={32} />
            </div>
          ) : (
            <IndiaMap
              airports={airports}
              routes={routes}
              onSelectAirport={setSelectedAirport}
              onSelectRoute={r => navigate(`/india/routes?origin=${r.origin}&dest=${r.destination}`)}
            />
          )}
        </div>

        {/* Airport Intelligence Side Panel */}
        <div className="side-panel-column">
          {selectedAirport ? (
            <AirportIntelligencePanel airport={selectedAirport} onClose={() => setSelectedAirport(null)} />
          ) : (
            <div className="glass-panel empty-state" style={{ height: 540 }}>
              <MapPin size={28} />
              <p>Select an airport marker or drop a pin on the map to inspect intelligence profile.</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Quick Links Grid */}
      <div className="airports-grid" style={{ marginTop: 40, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Link className="glass-panel ap-card" to="/india/airports">
          <Building2 size={24} className="icon-cyan" />
          <h3>Airport Intelligence</h3>
          <p className="kpi-sub">Detailed traffic pressure, footfall, and operator attributes.</p>
        </Link>
        <Link className="glass-panel ap-card" to="/india/bottlenecks">
          <ShieldAlert size={24} className="icon-rose" />
          <h3>Bottleneck Watch</h3>
          <p className="kpi-sub">Percentile-derived operational bottleneck indicators.</p>
        </Link>
        <Link className="glass-panel ap-card" to="/india/routes">
          <Navigation size={24} className="icon-indigo" />
          <h3>Route Network</h3>
          <p className="kpi-sub">Sector-level passenger volumes and UDAN connectivity.</p>
        </Link>
        <Link className="glass-panel ap-card" to="/india/tamil-nadu">
          <Plane size={24} className="icon-emerald" />
          <h3>Tamil Nadu Spotlight</h3>
          <p className="kpi-sub">Dedicated regional focus on Chennai, Coimbatore, Trichy, & Madurai.</p>
        </Link>
      </div>
    </section>
  )
}
