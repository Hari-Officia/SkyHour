const API_BASE_URL = 'http://127.0.0.1:8100'

export interface RiskBreakdown {
  airline_delay_rate: number
  route_delay_rate: number
  origin_airport_delay: number
  destination_airport_delay: number
  time_window_effect: number
  weather_impact: string
  ml_prediction_probability: number
}

export interface FlightOptionItem {
  flight_id: string
  flight_number: string
  airline: string
  airline_iata: string
  airline_icao: string
  origin: string
  origin_city: string
  destination: string
  destination_city: string
  scheduled_departure: string
  scheduled_arrival: string
  duration_formatted: string
  stops: number
  aircraft_type: string
  historical_delay_rate: number
  predicted_delay_probability: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  expected_delay_range: string
  weather_condition: string
  data_mode: string
  risk_breakdown?: RiskBreakdown
  cancellation_rate?: number
}

export interface CalendarDayRisk {
  date: string
  day_name: string
  total_flights: number
  avg_predicted_risk: number
  historical_delay_rate: number
  weather_status: string
  risk_category: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface CalendarRiskResponse {
  success: boolean
  origin: string
  destination: string
  days: CalendarDayRisk[]
  meta: {
    data_mode: string
    generated_at: string
  }
}

export interface TimeRiskCell {
  time_window: string
  label: string
  dates_risk: Record<string, number>
}

export interface TimeRiskMatrixResponse {
  success: boolean
  origin: string
  destination: string
  dates: string[]
  time_windows: TimeRiskCell[]
}

export interface MapFlightItem {
  flight_id: string
  flight_number: string
  airline: string
  origin: string
  destination: string
  latitude: number
  longitude: number
  altitude_ft: number
  ground_speed_kts: number
  heading_deg: number
  status: string
  risk_level: string
  delay_probability: number
  data_mode: string
  route_geometry: [number, number][]
}

export interface DateSearchResponse {
  success: boolean
  data: {
    query: {
      origin: string
      destination: string
      date: string
      time_window: string
      airline?: string
      nonstop?: boolean
      risk_max?: number
    }
    flights: FlightOptionItem[]
  }
  meta: {
    data_mode: string
    timestamp: string
    source: string
    total_results: number
  }
}

export async function searchFlights(params: {
  origin: string
  destination: string
  date: string
  time_window?: string
  airline?: string
  nonstop?: boolean
  risk_max?: number
}): Promise<DateSearchResponse> {
  const query = new URLSearchParams()
  query.append('origin', params.origin)
  query.append('destination', params.destination)
  query.append('date', params.date)
  if (params.time_window) query.append('time_window', params.time_window)
  if (params.airline) query.append('airline', params.airline)
  if (params.nonstop !== undefined) query.append('nonstop', String(params.nonstop))
  if (params.risk_max !== undefined) query.append('risk_max', String(params.risk_max))

  const res = await fetch(`${API_BASE_URL}/flights/search?${query.toString()}`)
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

export async function getCalendarRisk(params: {
  origin: string
  destination: string
  date?: string
}): Promise<CalendarRiskResponse> {
  const query = new URLSearchParams({ origin: params.origin, destination: params.destination })
  if (params.date) query.append('date', params.date)
  const res = await fetch(`${API_BASE_URL}/flights/calendar?${query.toString()}`)
  if (!res.ok) throw new Error('Calendar failed')
  return res.json()
}

export async function getTimeRiskMatrix(params: {
  origin: string
  destination: string
  date?: string
}): Promise<TimeRiskMatrixResponse> {
  const query = new URLSearchParams({ origin: params.origin, destination: params.destination })
  if (params.date) query.append('date', params.date)
  const res = await fetch(`${API_BASE_URL}/flights/time-risk?${query.toString()}`)
  if (!res.ok) throw new Error('Time risk failed')
  return res.json()
}

export async function compareFlights(flightIds: string[], date?: string): Promise<{ success: boolean; flights: FlightOptionItem[] }> {
  const query = new URLSearchParams({ flight_ids: flightIds.join(',') })
  if (date) query.append('date', date)
  const res = await fetch(`${API_BASE_URL}/flights/compare?${query.toString()}`)
  if (!res.ok) throw new Error('Compare failed')
  return res.json()
}

export async function getMapFlights(params?: {
  date?: string
  origin?: string
  destination?: string
  time_window?: string
  risk?: string
}): Promise<{ status: string; aircraft: MapFlightItem[]; data_mode: string }> {
  const query = new URLSearchParams()
  if (params?.date) query.append('date', params.date)
  if (params?.origin) query.append('origin', params.origin)
  if (params?.destination) query.append('destination', params.destination)
  if (params?.time_window) query.append('time_window', params.time_window)
  if (params?.risk) query.append('risk', params.risk)

  const res = await fetch(`${API_BASE_URL}/map/flights?${query.toString()}`)
  if (!res.ok) throw new Error('Map flights failed')
  return res.json()
}
