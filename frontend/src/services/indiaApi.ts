import type { IndiaAirline, IndiaAirport, IndiaFlightSchedule, IndiaOverview, IndiaRoute, TamilNaduResponse, WhatIfResponse } from '../types/india'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8100'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options?.headers }
    })
    const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Request failed with status ${response.status}`)
    }
    return payload as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The request timed out. Please retry.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export function getIndiaOverview() {
  return request<IndiaOverview>('/india/overview')
}

export function getIndiaMapData() {
  return request<{ airports: IndiaAirport[]; routes: IndiaRoute[] }>('/india/map-data')
}

export function getIndiaAirports(query?: string) {
  const q = query ? `?q=${encodeURIComponent(query)}` : ''
  return request<IndiaAirport[]>(`/india/airports${q}`)
}

export function getIndiaRoutes(origin?: string, dest?: string) {
  const params = new URLSearchParams()
  if (origin) params.append('origin', origin)
  if (dest) params.append('destination', dest)
  const q = params.toString() ? `?${params.toString()}` : ''
  return request<IndiaRoute[]>(`/india/routes${q}`)
}

export function getIndiaAirlines() {
  return request<IndiaAirline[]>('/india/airlines')
}

export function getIndiaFlights(fn?: string, airline?: string, origin?: string, dest?: string) {
  const params = new URLSearchParams()
  if (fn) params.append('flight_number', fn)
  if (airline) params.append('airline', airline)
  if (origin) params.append('origin', origin)
  if (dest) params.append('destination', dest)
  const q = params.toString() ? `?${params.toString()}` : ''
  return request<IndiaFlightSchedule[]>(`/india/flights${q}`)
}

export function runWhatIfScenario(airportIata: string, trafficDeltaPct: number, weatherDeltaPct: number) {
  return request<WhatIfResponse>('/india/what-if', {
    method: 'POST',
    body: JSON.stringify({
      airport_iata: airportIata,
      traffic_delta_pct: trafficDeltaPct,
      weather_delta_pct: weatherDeltaPct
    })
  })
}

export function getTamilNaduSpotlight() {
  return request<TamilNaduResponse>('/india/tamil-nadu')
}

// --- V2 INTELLIGENCE ENDPOINTS ---
export function getIndiaAirportIntelligence(query?: string) {
  const q = query ? `?q=${encodeURIComponent(query)}` : ''
  return request<IndiaAirport[]>(`/india/airport-intelligence${q}`)
}

export function getIndiaRouteIntelligence(origin?: string, dest?: string) {
  const params = new URLSearchParams()
  if (origin) params.append('origin', origin)
  if (dest) params.append('destination', dest)
  const q = params.toString() ? `?${params.toString()}` : ''
  return request<IndiaRoute[]>(`/india/route-intelligence${q}`)
}

export function getIndiaBottlenecks() {
  return request<IndiaAirport[]>('/india/bottlenecks')
}

export function getIndiaAirlineIntelligence() {
  return request<IndiaAirline[]>('/india/airline-intelligence')
}

export function getIndiaStateIntelligence() {
  return request<unknown[]>('/india/state-intelligence')
}

export function getTamilNaduComparison() {
  return request<TamilNaduResponse>('/india/tamil-nadu-compare')
}
