import { useEffect, useState } from 'react'
import { Search, MapPin, Activity, Thermometer, Wind } from 'lucide-react'
import { motion } from 'framer-motion'
import { getIndiaAirportIntelligence } from '../../services/indiaApi'
import type { IndiaAirport } from '../../types/india'
import { MetricInfoTooltip } from '../../components/india/MetricInfoTooltip'

export function IndiaAirports() {
  const [airports, setAirports] = useState<IndiaAirport[]>([])
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'volume' | 'traffic' | 'pagerank' | 'risk' | 'importance'>('volume')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialQ = params.get('q') || ''
    setQuery(initialQ)
    fetchAirports(initialQ)
  }, [])

  const fetchAirports = (qStr: string) => {
    setLoading(true)
    getIndiaAirportIntelligence(qStr)
      .then(setAirports)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // Sorted Airports List
  const sortedAirports = [...airports].sort((a, b) => {
    if (sortBy === 'volume') return b.monthly_passengers - a.monthly_passengers
    if (sortBy === 'traffic') return b.aircraft_movements - a.aircraft_movements
    if (sortBy === 'pagerank') return b.pagerank_score - a.pagerank_score
    if (sortBy === 'risk') return b.skyhour_risk_score - a.skyhour_risk_score
    if (sortBy === 'importance') return (b.airport_importance_score || 0) - (a.airport_importance_score || 0)
    return 0
  })

  return (
    <section className="wrap page">
      <div className="page-header">
        <p className="eyebrow">AIRPORT INTELLIGENCE DIRECTORY</p>
        <h1>Indian Airports Intelligence & Rankings</h1>
        <p>Inspect footfall, aircraft movements, weather severity, network centrality, and Skyhour risk scores across 64 Indian airports.</p>
      </div>

      <div className="glass-panel search-card" style={{ marginBottom: 24 }}>
        <form
          className="search-input-row"
          onSubmit={e => {
            e.preventDefault()
            fetchAirports(query)
          }}
        >
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by IATA, Airport Name, City, or State (e.g. MAA, Chennai, Tamil Nadu)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="button primary">
            Search Airports
          </button>
        </form>

        {/* Sort & Rank Controls */}
        <div className="sort-controls-strip flex-between" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--card-border)' }}>
          <span className="kpi-label">SORT AIRPORTS BY METRIC:</span>
          <div className="region-switcher">
            <button type="button" className={`region-btn ${sortBy === 'volume' ? 'active' : ''}`} onClick={() => setSortBy('volume')}>
              Passenger Volume
            </button>
            <button type="button" className={`region-btn ${sortBy === 'traffic' ? 'active' : ''}`} onClick={() => setSortBy('traffic')}>
              Aircraft Traffic
            </button>
            <button type="button" className={`region-btn ${sortBy === 'pagerank' ? 'active' : ''}`} onClick={() => setSortBy('pagerank')}>
              PageRank Centrality
            </button>
            <button type="button" className={`region-btn ${sortBy === 'risk' ? 'active' : ''}`} onClick={() => setSortBy('risk')}>
              Skyhour Risk
            </button>
            <button type="button" className={`region-btn ${sortBy === 'importance' ? 'active' : ''}`} onClick={() => setSortBy('importance')}>
              Importance Score
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel center-content" style={{ padding: 40 }}>
          <Activity className="pulse-icon" size={32} />
        </div>
      ) : (
        <div className="airports-grid">
          {sortedAirports.map(ap => (
            <motion.div key={ap.airport_iata} className="glass-panel ap-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="ap-card-header">
                <div>
                  <span className="ap-code">{ap.airport_iata}</span>
                  <h3>{ap.airport_name}</h3>
                  <small style={{ color: 'var(--text-muted)' }}><MapPin size={12} /> {ap.city}, {ap.state}</small>
                </div>
                <span className={`risk-badge ${ap.skyhour_risk_score > 60 ? 'risk-high' : ap.skyhour_risk_score > 40 ? 'risk-med' : 'risk-low'}`}>
                  Risk {ap.skyhour_risk_score}/100
                </span>
              </div>

              <div className="ap-metrics-grid">
                <div className="metric">
                  <span className="lbl">Monthly Footfall</span>
                  <strong className="val">{ap.monthly_passengers.toLocaleString()} pax</strong>
                </div>
                <div className="metric">
                  <span className="lbl">Monthly Flights</span>
                  <strong className="val">{ap.monthly_flights.toLocaleString()}</strong>
                </div>
                <div className="metric">
                  <span className="lbl">
                    PageRank Rank
                    <MetricInfoTooltip
                      title="PageRank Rank"
                      formula="PR(u) = (1-d)/N + d * sum(PR(v)/L(v))"
                      inputs="National Route Network Graph"
                      normalization="Ordinal Rank (1 to 64)"
                      interpretation="National prestige rank."
                    />
                  </span>
                  <strong className="val">#{ap.network_rank}</strong>
                </div>
                <div className="metric">
                  <span className="lbl">Importance Score</span>
                  <strong className="val cyan-text">{ap.airport_importance_score || 50}/100</strong>
                </div>
              </div>

              <div className="ap-card-footer">
                <span><Thermometer size={13} /> {ap.temperature_c}°C | <Wind size={13} /> {ap.rainfall_mm}mm rain</span>
                <span className="badge-sm">{ap.airport_type}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
