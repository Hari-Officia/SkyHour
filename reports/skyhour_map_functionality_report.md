# SKYHOUR: Interactive Aviation Map Integration Report

**Date**: September 20, 2026  
**Component**: `frontend/src/pages/AviationMap.tsx`  

---

## Interactive Map Capabilities & GIS Features

1. **Map Search & Auto-Fly**:
   - Accepts airport codes (`MAA`), flight numbers (`AI302`), and routes (`MAA DEL`).
   - Autocomplete dropdown flies map to selected coordinates and adjusts zoom level.
2. **Traffic-Scaled Airport Circles**:
   - Circle markers scaled by total movements (8px to 22px).
   - Color-coded by dynamic risk score (Green: Low, Amber: Moderate, Red: High).
3. **Route Polylines**:
   - Drawn between origin and destination coordinates.
4. **Aircraft Markers**:
   - Displays callsign, altitude, speed, heading, and status in popups.
5. **Data Mode Banner**:
   - Automatically displays **DEMO MODE** banner when live OpenSky state vectors are unavailable.
