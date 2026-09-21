import { useEffect, useState } from 'react'
import { getIndiaAirlines } from '../../services/indiaApi'
import type { IndiaAirline } from '../../types/india'

export function IndiaAirlines() {
  const [airlines, setAirlines] = useState<IndiaAirline[]>([])

  useEffect(() => {
    getIndiaAirlines().then(setAirlines).catch(console.error)
  }, [])

  return (
    <section className="wrap page">
      <div className="page-header">
        <p className="eyebrow">CARRIER MARKET SHARE</p>
        <h1>Indian Airlines Directory</h1>
        <p>Market share distribution, fleet sizes, headquarters, and operator status for active domestic carriers.</p>
      </div>

      <div className="airports-grid">
        {airlines.map(al => (
          <div key={al.airline_code} className="glass-panel ap-card">
            <div className="ap-card-header">
              <div className="ap-code">{al.airline_code} ({al.iata_code})</div>
              <div>
                <h3>{al.airline_name}</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{al.headquarters}</span>
              </div>
            </div>

            <div className="ap-metrics-grid">
              <div className="metric">
                <span className="lbl">Market Share</span>
                <strong className="val">{al.market_share_pct}%</strong>
              </div>
              <div className="metric">
                <span className="lbl">Fleet Size</span>
                <strong className="val">{al.fleet_size} Aircraft</strong>
              </div>
              <div className="metric">
                <span className="lbl">Operator</span>
                <span className="val badge-sm">{al.operator_type}</span>
              </div>
              <div className="metric">
                <span className="lbl">ICAO</span>
                <strong className="val font-mono">{al.icao_code}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
