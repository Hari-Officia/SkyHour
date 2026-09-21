export interface UniversalAirportResult {
  iata_code: string
  icao_code?: string
  airport_name: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  monthly_flights?: number
  monthly_passengers?: number
  on_time_performance_pct?: number
  avg_arr_delay_min?: number
  cancellation_rate_pct?: number
}

export interface UniversalRouteResult {
  origin_iata: string
  dest_iata: string
  route_name?: string
  distance_km?: number
  avg_delay_min?: number
  on_time_pct?: number
}

export interface UniversalAirlineResult {
  airline_name: string
  iata_code: string
  icao_code?: string
  country?: string
  status?: string
}

export interface UniversalFlightResult {
  flight_number: string
  carrier_code: string
  airline_name: string
  origin_iata: string
  dest_iata: string
  scheduled_departure: string
  scheduled_arrival: string
  status: string
}

export interface UniversalSearchResults {
  flights: UniversalFlightResult[]
  airports: UniversalAirportResult[]
  routes: UniversalRouteResult[]
  airlines: UniversalAirlineResult[]
}

export interface UniversalSearchResponse {
  query: string
  results: UniversalSearchResults
}

export interface WeatherData {
  status: string
  source?: string
  station?: string
  raw_text?: string
  temp_c?: number
  dewpoint_c?: number
  wind_dir_deg?: number
  wind_speed_kt?: number
  wind_speed_kmh?: number
  visibility_statute_miles?: number
  flight_category?: string
  wx_string?: string
}

export interface AirportIntelligenceResponse {
  status: string
  message?: string
  data_sources?: {
    airport_master: string
    weather: string
    delay_analytics: string
  }
  airport: UniversalAirportResult
  weather?: WeatherData
  metrics: {
    monthly_flights: number
    monthly_passengers: number
    on_time_pct: number
    historical_delay_pct: number
    avg_delay_minutes: number
    cancellation_pct: number
  }
  operating_airlines: UniversalAirlineResult[]
  top_routes: UniversalRouteResult[]
}

export interface OperatingAirlineStat {
  airline_name: string
  iata_code: string
  monthly_flights: number
  on_time_pct: number
  avg_delay_min: number
  cancellation_pct: number
}

export interface RouteTrendItem {
  day?: string
  period?: string
  delay_rate_pct: number
  avg_delay_min: number
}

export interface RouteIntelligenceResponse {
  status: string
  message?: string
  source?: string
  route: {
    origin: UniversalAirportResult
    destination: UniversalAirportResult
    distance_km: number
    typical_flight_time_min: number
    monthly_flights: number
    on_time_pct: number
    historical_delay_pct: number
    avg_delay_min: number
    cancellation_pct: number
  }
  airlines_comparison: OperatingAirlineStat[]
  trends: {
    day_of_week: RouteTrendItem[]
    time_of_day: RouteTrendItem[]
  }
}

export interface AirlineHubItem {
  airport_name: string
  iata_code: string
  monthly_flights: number
}

export interface AirlineIntelligenceResponse {
  status: string
  message?: string
  source?: string
  airline: UniversalAirlineResult
  metrics: {
    total_monthly_flights: number
    active_routes_count: number
    on_time_pct: number
    avg_delay_min: number
    cancellation_pct: number
  }
  top_hubs: AirlineHubItem[]
  top_routes: UniversalRouteResult[]
}

export interface FactorItem {
  factor: string
  value?: string
  impact: string
}

export interface AircraftTelemetry {
  icao24: string
  callsign: string
  origin_country: string
  longitude: number
  latitude: number
  baro_altitude_m: number
  velocity_ms: number
  true_track_deg: number
  on_ground: boolean
}

export interface FlightPredictionResponse {
  status: string
  message?: string
  prediction_mode: string
  prediction_timestamp: string
  prediction_horizon: string
  flight: UniversalFlightResult
  prediction: {
    delay_probability_pct: number
    risk_category: string
    threshold_used: number
    is_delayed_predicted: boolean
  }
  factors: FactorItem[]
  telemetry?: AircraftTelemetry | { status: string; message: string }
}

export interface MapDataResponse {
  status: string
  timestamp: string
  sources: {
    airports: string
    routes: string
    aircraft: string
  }
  airports: UniversalAirportResult[]
  routes: UniversalRouteResult[]
  aircraft: AircraftTelemetry[]
}

export interface HealthResponse {
  status: string
  service: string
  version: string
  timestamp: string
}
