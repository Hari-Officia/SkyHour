import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { getIndiaRoutes } from '../../services/indiaApi'
import type { IndiaRoute } from '../../types/india'

export function IndiaRoutes() {
  const [routes, setRoutes] = useState<IndiaRoute[]>([])
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = () => {
    getIndiaRoutes(origin, dest).then(setRoutes).catch(console.error)
  }

  return (
    <section className="wrap page">
      <div className="page-header">
        <p className="eyebrow">SECTOR NETWORKS</p>
        <h1>Route Punctuality & Traffic Share</h1>
        <p>Sector-level passenger traffic, flight frequencies, and regional connectivity corridors.</p>
      </div>

      <div className="glass-panel search-card" style={{ marginBottom: 24 }}>
        <form
          className="input-grid"
          onSubmit={e => {
            e.preventDefault()
            fetchRoutes()
          }}
        >
          <div className="input-group">
            <label>Origin IATA</label>
            <input value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} placeholder="e.g. MAA" maxLength={3} />
          </div>
          <div className="input-group">
            <label>Destination IATA</label>
            <input value={dest} onChange={e => setDest(e.target.value.toUpperCase())} placeholder="e.g. DEL" maxLength={3} />
          </div>
          <button type="submit" className="button primary full-width" style={{ gridColumn: 'span 2', marginTop: 10 }}>
            Filter Sector Routes
          </button>
        </form>
      </div>

      <div className="routes-list-grid">
        {routes.map(r => (
          <div key={r.route_id} className="glass-panel route-card">
            <div className="route-card-top">
              <div className="route-pair">
                <strong>{r.origin}</strong>
                <ArrowRight size={16} />
                <strong>{r.destination}</strong>
              </div>
              <span className={r.category === 'UDAN RCS' ? 'tag udan' : 'tag trunk'}>{r.category}</span>
            </div>

            <div className="route-card-body">
              <div><span>Distance</span><b>{r.distance_km} km</b></div>
              <div><span>Monthly Flights</span><b>{r.monthly_flights.toLocaleString()} flights</b></div>
              <div><span>Monthly Passengers</span><b>{r.monthly_passengers.toLocaleString()} pax</b></div>
              <div><span>Primary Carrier</span><b>{r.top_airline} ({r.top_airline_share_pct}%)</b></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
