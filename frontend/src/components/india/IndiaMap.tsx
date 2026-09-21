import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Locate, MapPin, RefreshCw, X } from 'lucide-react'
import type { IndiaAirport, IndiaRoute } from '../../types/india'

interface IndiaMapProps {
  airports: IndiaAirport[]
  routes: IndiaRoute[]
  onSelectAirport: (airport: IndiaAirport) => void
  onSelectRoute?: (route: IndiaRoute) => void
  onDropPinSelect?: (lat: number, lng: number, nearestAirport?: IndiaAirport) => void
}

export function IndiaMap({ airports, routes, onSelectAirport, onSelectRoute, onDropPinSelect }: IndiaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const routesLayerRef = useRef<L.LayerGroup | null>(null)
  const dropPinLayerRef = useRef<L.LayerGroup | null>(null)

  const [activeLayer, setActiveLayer] = useState<'risk' | 'passengers' | 'traffic' | 'centrality' | 'rainfall'>('risk')
  const [showRoutes, setShowRoutes] = useState(true)
  const [showUdan, setShowUdan] = useState(true)
  const [dropPinMode, setDropPinMode] = useState(false)
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number; lng: number; nearestAirport: IndiaAirport | null; distanceKm: number } | null>(null)
  const [geoError, setGeoError] = useState('')

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Find nearest airport to given lat/lng
  const getNearestAirport = (lat: number, lng: number) => {
    if (!airports.length) return { airport: null, distanceKm: 0 }
    let nearest: IndiaAirport | null = null
    let minDistance = Infinity

    airports.forEach(ap => {
      const dist = calculateDistanceKm(lat, lng, ap.latitude, ap.longitude)
      if (dist < minDistance) {
        minDistance = dist
        nearest = ap
      }
    })

    return { airport: nearest, distanceKm: Math.round(minDistance) }
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
        attributionControl: true
      })

      // 100% Free Leaflet Basemap Architecture (CartoDB Dark Matter Primary with Esri Dark Canvas Fallback)
      const primaryTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
      const primaryAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

      const fallbackTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      const fallbackAttribution = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'

      const tileLayer = L.tileLayer(primaryTileUrl, {
        maxZoom: 18,
        subdomains: 'abcd',
        attribution: primaryAttribution
      })

      let fallbackTriggered = false
      tileLayer.on('tileerror', () => {
        if (!fallbackTriggered && mapInstanceRef.current) {
          fallbackTriggered = true
          mapInstanceRef.current.removeLayer(tileLayer)
          const fallbackLayer = L.tileLayer(fallbackTileUrl, {
            maxZoom: 18,
            attribution: fallbackAttribution
          })
          fallbackLayer.addTo(mapInstanceRef.current)
        }
      })

      tileLayer.addTo(map)

      markersLayerRef.current = L.layerGroup().addTo(map)
      routesLayerRef.current = L.layerGroup().addTo(map)
      dropPinLayerRef.current = L.layerGroup().addTo(map)

      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Handle Map Click for Drop Pin
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    function handleMapClick(e: L.LeafletMouseEvent) {
      if (!dropPinMode) return
      const { lat, lng } = e.latlng
      const { airport, distanceKm } = getNearestAirport(lat, lng)
      setPinnedLocation({ lat, lng, nearestAirport: airport, distanceKm })
      if (onDropPinSelect) onDropPinSelect(lat, lng, airport ?? undefined)
    }

    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [dropPinMode, airports])

  // Update Dropped Pin Marker
  useEffect(() => {
    const pinGroup = dropPinLayerRef.current
    if (!pinGroup) return
    pinGroup.clearLayers()

    if (pinnedLocation) {
      const customIcon = L.divIcon({
        className: 'custom-drop-pin-icon',
        html: `
          <div style="
            width: 32px; height: 32px;
            background: #ef4444; border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: grid; place-items: center;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
          ">
            <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })

      const marker = L.marker([pinnedLocation.lat, pinnedLocation.lng], { icon: customIcon })
      marker.bindTooltip(`Dropped Pin: ${pinnedLocation.lat.toFixed(4)}, ${pinnedLocation.lng.toFixed(4)}`)
      pinGroup.addLayer(marker)
    }
  }, [pinnedLocation])

  // Render Markers and Routes when activeLayer or dataset changes
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersGroup = markersLayerRef.current
    const routesGroup = routesLayerRef.current
    if (!map || !markersGroup || !routesGroup) return

    markersGroup.clearLayers()
    routesGroup.clearLayers()

    // 1. Draw Sector Routes
    if (showRoutes) {
      routes.forEach(route => {
        const orig = airports.find(a => a.airport_iata === route.origin)
        const dest = airports.find(a => a.airport_iata === route.destination)

        if (orig && dest) {
          const isUdan = route.category === 'UDAN RCS'
          if (isUdan && !showUdan) return

          const weight = Math.max(1.5, Math.min(6, route.monthly_passengers / 40000))
          const color = isUdan ? '#38bdf8' : '#818cf8'

          const polyline = L.polyline(
            [
              [orig.latitude, orig.longitude],
              [dest.latitude, dest.longitude]
            ],
            {
              color: color,
              weight: weight,
              opacity: isUdan ? 0.8 : 0.4,
              dashArray: isUdan ? '4, 6' : undefined
            }
          )

          polyline.bindTooltip(`${route.origin} ➔ ${route.destination} (${route.monthly_passengers.toLocaleString()} pax/mo)`)
          if (onSelectRoute) {
            polyline.on('click', () => onSelectRoute(route))
          }
          routesGroup.addLayer(polyline)
        }
      })
    }

    // 2. Draw Airport Circle Markers
    airports.forEach(airport => {
      let color = '#38bdf8'
      let radius = 6

      if (activeLayer === 'risk') {
        const score = airport.skyhour_risk_score || 30
        color = score >= 65 ? '#f43f5e' : score >= 50 ? '#f59e0b' : score >= 35 ? '#38bdf8' : '#10b981'
        radius = Math.max(6, Math.min(16, score / 6))
      } else if (activeLayer === 'traffic') {
        const p = airport.traffic_pressure_index || 40
        color = p >= 75 ? '#f43f5e' : p >= 55 ? '#f59e0b' : '#38bdf8'
        radius = Math.max(6, Math.min(16, p / 6))
      } else if (activeLayer === 'rainfall') {
        const rain = airport.rainfall_mm || 10
        color = rain > 200 ? '#3b82f6' : rain > 100 ? '#06b6d4' : '#10b981'
        radius = Math.max(5, Math.min(14, rain / 25))
      } else if (activeLayer === 'passengers') {
        const pax = airport.annual_passengers_mil || 1
        color = pax > 30 ? '#a855f7' : pax > 10 ? '#38bdf8' : '#64748b'
        radius = Math.max(5, Math.min(18, pax / 3))
      } else if (activeLayer === 'centrality') {
        const rank = airport.network_rank || 99
        color = rank <= 3 ? '#a855f7' : rank <= 10 ? '#38bdf8' : '#64748b'
        radius = rank <= 3 ? 14 : rank <= 10 ? 10 : 6
      }

      const circle = L.circleMarker([airport.latitude, airport.longitude], {
        radius: radius,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.85
      })

      const popupContent = `
        <div style="font-family: sans-serif; color: #080c14; padding: 4px;">
          <strong style="font-size: 15px;">${airport.airport_name} (${airport.airport_iata})</strong><br/>
          <span style="font-size: 12px; color: #475569;">${airport.city}, ${airport.state}</span><br/>
          <div style="margin-top: 8px; font-size: 12px; line-height: 1.5;">
            <b>Passengers:</b> ${airport.annual_passengers_mil}M / year<br/>
            <b>Skyhour Risk Score:</b> <span style="color: ${color}; font-weight: bold;">${airport.skyhour_risk_score || 'N/A'}</span><br/>
            <b>Weather:</b> ${airport.temperature_c}°C | ${airport.rainfall_mm}mm rain
          </div>
        </div>
      `

      circle.bindPopup(popupContent)
      circle.on('click', () => {
        if (!dropPinMode) onSelectAirport(airport)
      })
      markersGroup.addLayer(circle)
    })
  }, [airports, routes, activeLayer, showRoutes, showUdan, dropPinMode, onSelectAirport, onSelectRoute])

  // Reset Map View
  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([20.5937, 78.9629], 5)
    }
    setPinnedLocation(null)
    setDropPinMode(false)
    setActiveLayer('risk')
    setShowRoutes(true)
    setShowUdan(true)
    setGeoError('')
  }

  // Geolocation handler
  const handleUseMyLocation = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Browser geolocation is not supported.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 8)
        }
        const { airport, distanceKm } = getNearestAirport(latitude, longitude)
        setPinnedLocation({ lat: latitude, lng: longitude, nearestAirport: airport, distanceKm })
      },
      err => {
        setGeoError(`Location access denied: ${err.message}`)
      }
    )
  }

  return (
    <div className="gis-map-container" style={{ position: 'relative', width: '100%', height: '540px', borderRadius: '18px', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Layer Controls Bar */}
      <div className="map-layer-controls">
        <span className="control-label">LAYERS:</span>
        <button className={activeLayer === 'risk' ? 'active' : ''} onClick={() => setActiveLayer('risk')}>
          Skyhour Risk
        </button>
        <button className={activeLayer === 'passengers' ? 'active' : ''} onClick={() => setActiveLayer('passengers')}>
          Passenger Volume
        </button>
        <button className={activeLayer === 'traffic' ? 'active' : ''} onClick={() => setActiveLayer('traffic')}>
          Traffic Pressure
        </button>
        <button className={activeLayer === 'centrality' ? 'active' : ''} onClick={() => setActiveLayer('centrality')}>
          Centrality
        </button>
        <button className={activeLayer === 'rainfall' ? 'active' : ''} onClick={() => setActiveLayer('rainfall')}>
          IMD Rain
        </button>

        <span className="control-divider">|</span>
        <label className="toggle-label">
          <input type="checkbox" checked={showRoutes} onChange={e => setShowRoutes(e.target.checked)} />
          <span>Routes</span>
        </label>
        <label className="toggle-label">
          <input type="checkbox" checked={showUdan} onChange={e => setShowUdan(e.target.checked)} />
          <span>UDAN</span>
        </label>

        <span className="control-divider">|</span>
        <button className={dropPinMode ? 'active pin-btn' : 'pin-btn'} onClick={() => setDropPinMode(!dropPinMode)} title="Click map to drop location pin">
          <MapPin size={13} /> {dropPinMode ? 'Drop Pin ON' : 'Drop Pin'}
        </button>

        <button onClick={handleResetMap} className="reset-btn" title="Reset map view and layers">
          <RefreshCw size={13} /> Reset
        </button>
      </div>

      {/* Dynamic Layer Legend */}
      <div
        className="map-legend glass-panel"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 900,
          padding: '10px 14px',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px',
          color: '#cbd5e1'
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '6px', color: '#f8fafc', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
          {activeLayer === 'risk' && 'Skyhour Risk Score'}
          {activeLayer === 'passengers' && 'Annual Passengers'}
          {activeLayer === 'traffic' && 'Traffic Pressure Index'}
          {activeLayer === 'centrality' && 'Network Centrality Rank'}
          {activeLayer === 'rainfall' && 'Monthly Rainfall (mm)'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {activeLayer === 'risk' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> Low (&lt;35)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} /> Moderate (35 - 50)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> High (50 - 65)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f43f5e' }} /> Critical (&gt;65)</div>
            </>
          )}

          {activeLayer === 'passengers' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#a855f7' }} /> Mega Hub (&gt;30M pax)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} /> Major Hub (10M - 30M pax)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#64748b' }} /> Regional (&lt;10M pax)</div>
            </>
          )}

          {activeLayer === 'traffic' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f43f5e' }} /> Severe Capacity Stress (&gt;75)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> Moderate Pressure (55 - 75)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} /> Normal Operations (&lt;55)</div>
            </>
          )}

          {activeLayer === 'centrality' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#a855f7' }} /> Top 3 Hub (DEL, BOM, BLR)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} /> Key Regional Hubs (Rank 4 - 10)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#64748b' }} /> Secondary Network Nodes</div>
            </>
          )}

          {activeLayer === 'rainfall' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} /> Heavy Monsoon (&gt;200mm)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#06b6d4' }} /> Moderate Rain (100 - 200mm)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> Light / Clear (&lt;100mm)</div>
            </>
          )}
        </div>
      </div>

      {/* Floating Drop Pin Intelligence Panel */}
      {pinnedLocation && (
        <div
          className="drop-pin-panel glass-panel"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 900,
            width: '280px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>
              <MapPin size={15} style={{ color: '#ef4444' }} /> Pinned Location
            </div>
            <button
              onClick={() => setPinnedLocation(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
            <div><b>Latitude:</b> {pinnedLocation.lat.toFixed(4)}°</div>
            <div><b>Longitude:</b> {pinnedLocation.lng.toFixed(4)}°</div>

            {pinnedLocation.nearestAirport ? (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#38bdf8', fontWeight: 600 }}>Nearest Airport:</div>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {pinnedLocation.nearestAirport.airport_name} ({pinnedLocation.nearestAirport.airport_iata})
                </div>
                <div style={{ color: '#94a3b8' }}>
                  {pinnedLocation.nearestAirport.city}, {pinnedLocation.nearestAirport.state} • <b>{pinnedLocation.distanceKm} km away</b>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '8px', color: '#94a3b8' }}>Calculating nearest airport...</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px' }}>
            {pinnedLocation.nearestAirport && (
              <button
                className="button primary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => onSelectAirport(pinnedLocation.nearestAirport!)}
              >
                Inspect {pinnedLocation.nearestAirport.airport_iata} Intelligence
              </button>
            )}
            <button
              className="button secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={handleUseMyLocation}
            >
              <Locate size={13} /> Use My Device Location
            </button>
          </div>

          {geoError && <div style={{ fontSize: '11px', color: '#f43f5e', marginTop: '8px' }}>{geoError}</div>}
        </div>
      )}
    </div>
  )
}
