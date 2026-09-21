const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8100'

export interface SearchResultItem {
  type: 'FLIGHT' | 'AIRPORT' | 'ROUTE' | 'AIRLINE'
  id: string
  title: string
  subtitle: string
  url: string
  code?: string
  origin?: string
  destination?: string
  flight_number?: string
  latitude?: number
  longitude?: number
}

export interface UniversalSearchResponse {
  status: string
  query: string
  total_results: number
  results: SearchResultItem[]
}

export interface FlightIntelligenceResponse {
  status: string
  data_mode: string
  is_demo: boolean
  flight_summary: {
    flight_id: string
    flight_number: string
    callsign: string
    airline: string
    airline_iata: string
    origin: string
    destination: string
    origin_city: string
    destination_city: string
    scheduled_departure: string
    scheduled_arrival: string
    status: string
    aircraft_type: string
    departure_timezone: string
    arrival_timezone: string
  }
  time_intelligence: {
    prediction_timestamp: string
    scheduled_departure_utc: string
    hours_to_departure: number
    prediction_horizon: string
    prediction_mode: string
  }
  prediction: {
    prediction: string
    delay_probability: number
    delay_percentage: number
    decision_threshold: number
    risk_level: string
    contributing_factors: Array<{ factor: string; impact: string; weight: string }>
    model_metadata: {
      model_name: string
      validation_roc_auc: number
      calibration_note: string
    }
  }
  live_telemetry: {
    is_available: boolean
    source: string
    telemetry_data: {
      latitude: number
      longitude: number
      altitude_ft: number
      ground_speed_knots: number
      heading_deg: number
      status: string
    }
  }
  origin_weather?: any
}

export interface AirportIntelligenceResponse {
  status: string
  data_mode: string
  airport: {
    code: string
    iata: string
    icao: string
    city: string
    country: string
    latitude: number
    longitude: number
    timezone: string
    local_time: string
    utc_time: string
  }
  metrics: {
    total_movements: number
    departures_count: number
    arrivals_count: number
    avg_delay_minutes: number
    median_delay_minutes: number
    delayed_percentage: number
    cancellation_percentage: number
  }
  traffic_by_hour: Record<string, number>
  airlines_served: Array<{ airline: string; airline_iata: string; flights_count: number }>
  top_routes: Array<{ destination: string; destination_city: string; flight_count: number; delay_rate: number }>
  risk_assessment: {
    risk_score: number
    risk_category: string
    timestamp: string
    source: string
    top_contributors: Array<{ factor: string; impact: string; points: number }>
  }
  weather?: any
}

export interface RouteIntelligenceResponse {
  status: string
  route: {
    origin: string
    destination: string
    origin_city: string
    destination_city: string
    distance_miles: number
    route_code: string
  }
  summary: {
    total_flights: number
    avg_delay_minutes: number
    median_delay_minutes: number
    delayed_percentage: number
    cancellation_percentage: number
  }
  delay_by_hour: Record<string, { label: string; delay_rate: number; flights: number }>
  airline_performance: Array<{ airline: string; airline_iata: string; flights_operated: number; delay_rate: number; avg_delay: number }>
  risk_assessment: {
    risk_score: number
    risk_category: string
    timestamp: string
    top_contributors: Array<{ factor: string; impact: string; points: number }>
  }
}

export interface AirlineIntelligenceResponse {
  status: string
  airline: {
    name: string
    iata: string
    icao: string
    country: string
  }
  metrics: {
    total_flights: number
    airports_served_count: number
    routes_count: number
    avg_delay_minutes: number
    median_delay_minutes: number
    delayed_percentage: number
    cancellation_percentage: number
  }
  top_airports: Array<{ origin: string; origin_city: string; departures_count: number }>
  top_routes: Array<{ route: string; origin: string; destination: string; flights_count: number; delay_rate: number }>
  risk_assessment: {
    risk_score: number
    risk_category: string
  }
}

export interface MapDataResponse {
  status: string
  data_mode: string
  is_demo: boolean
  timestamp: string
  sources: {
    airports: string
    routes: string
    aircraft: string
  }
  airports: Array<{
    code: string
    iata: string
    name: string
    city: string
    country: string
    latitude: number
    longitude: number
    total_movements: number
    risk_score: number
    risk_category: string
  }>
  routes: Array<{
    route_code: string
    origin: string
    destination: string
    origin_lat: number
    origin_lon: number
    dest_lat: number
    dest_lon: number
    distance_miles: number
    flight_volume: number
    delay_category: string
  }>
  aircraft: Array<{
    icao24: string
    callsign: string
    flight_number?: string
    airline?: string
    origin?: string
    destination?: string
    latitude: number
    longitude: number
    baro_altitude_m: number
    velocity_ms: number
    true_track_deg: number
    status?: string
    is_demo?: boolean
  }>
}

export const getHealth = async () => {
  const res = await fetch(`${API_BASE_URL}/health`)
  return res.json()
}

export const searchUniversal = async (q: string): Promise<UniversalSearchResponse> => {
  const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(q)}`)
  return res.json()
}

export const getFlightDetails = async (flightId: string): Promise<FlightIntelligenceResponse> => {
  const res = await fetch(`${API_BASE_URL}/flight/${encodeURIComponent(flightId)}`)
  return res.json()
}

export const getAirportDetails = async (airportCode: string): Promise<AirportIntelligenceResponse> => {
  const res = await fetch(`${API_BASE_URL}/airport/${encodeURIComponent(airportCode)}`)
  return res.json()
}

export const getRouteDetails = async (origin: string, destination: string): Promise<RouteIntelligenceResponse> => {
  const res = await fetch(`${API_BASE_URL}/route/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`)
  return res.json()
}

export const getAirlineDetails = async (airlineCode: string): Promise<AirlineIntelligenceResponse> => {
  const res = await fetch(`${API_BASE_URL}/airline/${encodeURIComponent(airlineCode)}`)
  return res.json()
}

export const getMapData = async (): Promise<MapDataResponse> => {
  const res = await fetch(`${API_BASE_URL}/map/data`)
  return res.json()
}
