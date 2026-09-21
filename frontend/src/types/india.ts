export interface IndiaAirport {
  airport_iata: string
  airport_icao: string
  airport_name: string
  city: string
  state: string
  latitude: number
  longitude: number
  elevation_ft: number
  operator: string
  airport_type: string
  annual_passengers_mil: number
  monthly_passengers: number
  monthly_flights: number
  aircraft_movements: number
  temperature_c: number
  rainfall_mm: number
  humidity_pct: number
  wind_speed_kmh: number
  weather_severity_score: number
  degree_centrality: number
  betweenness_centrality: number
  weighted_passenger_degree: number
  pagerank_score: number
  network_rank: number
  traffic_pressure_index: number
  skyhour_risk_score: number
  airport_importance_score?: number
  is_potential_bottleneck?: boolean
  bottleneck_label?: string
  forecasted_monthly_passengers?: number
  forecast_growth_pct?: number
}

export interface IndiaRoute {
  route_id: string
  origin: string
  destination: string
  distance_km: number
  monthly_flights: number
  monthly_passengers: number
  category: string
  top_airline: string
  top_airline_share_pct: number
  orig_pagerank?: number
  dest_pagerank?: number
  orig_risk?: number
  dest_risk?: number
  route_importance_score?: number
}

export interface IndiaAirline {
  airline_code: string
  airline_name: string
  iata_code: string
  icao_code: string
  headquarters: string
  fleet_size: number
  market_share_pct: number
  operator_type: string
  status: string
}

export interface IndiaFlightSchedule {
  flight_number: string
  airline: string
  airline_name: string
  origin: string
  origin_name: string
  destination: string
  destination_name: string
  dep_time: string
  arr_time: string
  status: string
}

export interface IndiaOverview {
  total_airports: number
  total_active_airlines: number
  total_monthly_passengers: number
  total_monthly_flights: number
  top_hub: string
  top_airline: string
  top_airline_market_share_pct: number
}

export interface WhatIfResponse {
  airport_iata: string
  airport_name: string
  scenario_inputs: { traffic_delta_pct: number; weather_delta_pct: number }
  baseline: { skyhour_risk_score: number; risk_category: string }
  scenario: { skyhour_risk_score: number; risk_category: string }
  risk_delta: number
  disclaimer: string
}

export interface TamilNaduResponse {
  state: string
  capital: string
  total_airports: number
  total_monthly_passengers: number
  airports: IndiaAirport[]
  sector_routes: IndiaRoute[]
  comparison_matrix?: IndiaAirport[]
}

export interface MetricExplanation {
  metric_name: string
  formula: string
  inputs: string
  normalization: string
  interpretation: string
}
