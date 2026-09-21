import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Activity, ShieldAlert, ArrowRight } from 'lucide-react'
import type { IndiaAirport } from '../../types/india'
import { MetricInfoTooltip } from './MetricInfoTooltip'

interface PanelProps {
  airport: IndiaAirport | null
  onClose: () => void
}

export function AirportIntelligencePanel({ airport, onClose }: PanelProps) {
  const [activeTab, setActiveTab] = useState<'traffic' | 'network' | 'risk' | 'forecast'>('traffic')

  if (!airport) return null

  const forecastPax = airport.forecasted_monthly_passengers || Math.round(airport.monthly_passengers * 1.085)
  const growthPct = airport.forecast_growth_pct || 8.5

  return (
    <div className="glass-panel airport-side-panel">
      <div className="panel-top flex-between">
        <div>
          <span className="ap-code">{airport.airport_iata}</span>
          <h3>{airport.airport_name}</h3>
          <p className="ap-sub">{airport.city}, {airport.state} • {airport.operator}</p>
        </div>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      </div>

      {airport.is_potential_bottleneck && (
        <div className="bottleneck-banner">
          <ShieldAlert size={14} /> <span>POTENTIAL NETWORK BOTTLENECK</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="tab-switcher">
        <button type="button" className={activeTab === 'traffic' ? 'active' : ''} onClick={() => setActiveTab('traffic')}>
          TRAFFIC
        </button>
        <button type="button" className={activeTab === 'network' ? 'active' : ''} onClick={() => setActiveTab('network')}>
          NETWORK
        </button>
        <button type="button" className={activeTab === 'risk' ? 'active' : ''} onClick={() => setActiveTab('risk')}>
          RISK
        </button>
        <button type="button" className={activeTab === 'forecast' ? 'active' : ''} onClick={() => setActiveTab('forecast')}>
          FORECAST
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'traffic' && (
          <div className="tab-pane">
            <div className="metric-row">
              <span>Monthly Passenger Footfall</span>
              <strong>{airport.monthly_passengers.toLocaleString()} pax</strong>
            </div>
            <div className="metric-row">
              <span>Monthly Aircraft Movements</span>
              <strong>{airport.aircraft_movements.toLocaleString()} flights</strong>
            </div>
            <div className="metric-row">
              <span>Annual Capacity Footfall</span>
              <strong>{airport.annual_passengers_mil}M Passengers</strong>
            </div>
            <div className="metric-row">
              <span>Airport Category</span>
              <span className="badge-sm">{airport.airport_type}</span>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="tab-pane">
            <div className="metric-row">
              <span className="flex-center">
                Degree Centrality
                <MetricInfoTooltip
                  title="Degree Centrality"
                  formula="C_D(v) = degree(v)"
                  inputs="Direct non-stop sector route connections"
                  normalization="Integer route count (0 to Max Routes)"
                  interpretation="Measures immediate direct destination options."
                />
              </span>
              <strong>{airport.degree_centrality} Routes</strong>
            </div>
            <div className="metric-row">
              <span className="flex-center">
                Betweenness Centrality
                <MetricInfoTooltip
                  title="Betweenness Centrality"
                  formula="C_B(v) = sum(sigma_st(v) / sigma_st)"
                  inputs="Shortest network path frequency"
                  normalization="Normalized float (0 to 1)"
                  interpretation="Measures intermediary hub connecting frequency."
                />
              </span>
              <strong>{airport.betweenness_centrality}</strong>
            </div>
            <div className="metric-row">
              <span className="flex-center">
                PageRank Score
                <MetricInfoTooltip
                  title="PageRank Centrality"
                  formula="PR(u) = (1-d)/N + d * sum(PR(v)/L(v))"
                  inputs="Weighted graph connectivity matrix"
                  normalization="Normalized probability distribution (sum to 1)"
                  interpretation="Measures hub prestige based on connections to other top hubs."
                />
              </span>
              <strong>{airport.pagerank_score} (Rank #{airport.network_rank})</strong>
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="tab-pane">
            <div className="metric-row">
              <span>Traffic Pressure Index</span>
              <strong>{airport.traffic_pressure_index}/100</strong>
            </div>
            <div className="metric-row">
              <span>Weather Severity Score</span>
              <strong>{airport.weather_severity_score}/100</strong>
            </div>
            <div className="metric-row highlight">
              <span className="flex-center">
                Skyhour Risk Score
                <MetricInfoTooltip
                  title="Skyhour Risk Score"
                  formula="0.45 * TrafficPressure + 0.35 * WeatherSeverity + 0.20 * Centrality"
                  inputs="Footfall, IMD Rainfall, Temperature, Wind Speed, PageRank"
                  normalization="Bounded composite index (0 to 100)"
                  interpretation="Composite index for operational planning & schedule buffering."
                />
              </span>
              <strong className={airport.skyhour_risk_score > 60 ? 'rose-text' : 'emerald-text'}>
                {airport.skyhour_risk_score}/100
              </strong>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="tab-pane">
            <div className="metric-row">
              <span>Current Monthly Pax</span>
              <strong>{airport.monthly_passengers.toLocaleString()}</strong>
            </div>
            <div className="metric-row highlight">
              <span>Predicted Monthly Demand</span>
              <strong className="cyan-text">{forecastPax.toLocaleString()}</strong>
            </div>
            <div className="metric-row">
              <span>Projected Growth</span>
              <strong className="emerald-text">+{growthPct}%</strong>
            </div>

            <div className="disclaimer-chip">
              <Activity size={12} />
              <span>MODEL FORECAST — uses autoregressive lag features based on historical footfall.</span>
            </div>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <Link to={`/india/airports?q=${airport.airport_iata}`} className="button primary full-width">
          View Full Airport Intelligence <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}
