import { useEffect, useState } from 'react'
import { getIndiaAirports } from '../../services/indiaApi'
import type { IndiaAirport } from '../../types/india'

export function IndiaAnalytics() {
  const [airports, setAirports] = useState<IndiaAirport[]>([])

  useEffect(() => {
    getIndiaAirports().then(setAirports).catch(console.error)
  }, [])

  const sortedByPax = [...airports].sort((a, b) => b.annual_passengers_mil - a.annual_passengers_mil).slice(0, 8)
  const sortedByRisk = [...airports].sort((a, b) => (b.skyhour_risk_score || 0) - (a.skyhour_risk_score || 0)).slice(0, 8)

  return (
    <section className="wrap page">
      <div className="page-header">
        <p className="eyebrow">NATIONAL ANALYTICS & RANKINGS</p>
        <h1>Indian Aviation Leaders & Risk Patterns</h1>
        <p>Traffic volume leaderboards, network centrality ranks, and weather risk exposure.</p>
      </div>

      <div className="analytics-split-grid">
        <div className="glass-panel ranking-panel">
          <div className="panel-header">TOP AIRPORTS BY PASSENGER VOLUME</div>
          <div className="bars-list">
            {sortedByPax.map(ap => (
              <div className="bar-item" key={ap.airport_iata}>
                <span className="ap-code">{ap.airport_iata}</span>
                <div className="bar-track">
                  <div className="bar-fill cyan" style={{ width: `${(ap.annual_passengers_mil / 75) * 100}%` }} />
                </div>
                <b>{ap.annual_passengers_mil}M</b>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel ranking-panel">
          <div className="panel-header">HIGHEST SKYHOUR RISK SCORE AIRPORTS</div>
          <div className="bars-list">
            {sortedByRisk.map(ap => (
              <div className="bar-item" key={ap.airport_iata}>
                <span className="ap-code">{ap.airport_iata}</span>
                <div className="bar-track">
                  <div className="bar-fill rose" style={{ width: `${ap.skyhour_risk_score || 35}%` }} />
                </div>
                <b>{ap.skyhour_risk_score || 35} / 100</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
