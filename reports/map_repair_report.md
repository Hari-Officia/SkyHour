# SKYHOUR — Spatial GIS Map Repair & Integration Report

**Frontend Page**: `AviationMap.tsx`  
**API Endpoint**: `GET /map/flights`, `GET /map/data`  

---

## 1. Map Rebuild Summary

The Leaflet GIS Map visualizer was completely audited and updated to support parameter-driven flight rendering:

1. **Parameter Sync**: Connected map queries directly to `GET /map/flights` accepting `origin`, `destination`, `date`, `time_window`, and `risk` parameters.
2. **Curved Flight Paths**: Renders interpolated polylines (`route_geometry`) between origin and destination airports for every active spatial flight option.
3. **Interactive Marker Panels**:
   - **Airport Markers**: Scaled by flight movement volume, displaying city, country, movements, and dynamic risk score.
   - **Flight Aircraft Markers**: Displays flight number, callsign, altitude (ft), ground speed (kts), heading (°), delay risk %, and data mode provenance.
   - **Route Polylines**: Displays corridor code, origin/destination, distance, and predicted risk.
4. **Data Provenance & Error Fallbacks**: Explicitly labels map mode (`LIVE OPENSKY` vs `SCHEDULED & SIMULATION DATA`), displaying a clean fallback banner when telemetry data is unavailable.
