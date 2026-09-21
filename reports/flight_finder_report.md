# SKYHOUR — Date-Wise Flight Finder & Comparison Report

**Feature**: Primary Date-Wise Flight Finder (`/flights`, `/flight-finder`, `/search-flights`)  
**Backend API**: `GET /flights/search`, `GET /flights/calendar`, `GET /flights/time-risk`, `GET /flights/compare`  
**Frontend Component**: `FlightFinder.tsx`, `FlightComparisonModal.tsx`, `DateTimeRiskHeatmap.tsx`  

---

## 1. Overview & Architecture

The **Flight Finder** workspace evolves SKYHOUR from a single-flight lookup into a primary decision-making platform. Users enter **Origin**, **Destination**, **Date**, and **Time Window** (`Morning`, `Afternoon`, `Evening`, `Night`, `Midnight`, `Any Time`).

All queries execute dynamically against DuckDB on the FastAPI backend (`backend/app/services/flight_search_service.py`), returning:
- Real-time scheduled flight options matching the origin-destination corridor and time window.
- Factual historical delay rates (%) and predicted delay probabilities (%) calculated by the XGBoost ML engine.
- Data Mode provenance badges (`SCHEDULED+MODELLED`, `HISTORICAL BTS`, `LIVE`).

---

## 2. Key Features Implemented

1. **Simple Search Workspace**: Clean 4-input controls with quick date shortcut buttons (`Today`, `Tomorrow`, `+2 Days`, `+7 Days`) and filter drop-downs (`All Airlines`, `Risk Threshold`).
2. **7-Day Risk Calendar**: Interactive date strip displaying expected daily operational flight volume, average predicted delay risk, and weather status across a 7-day range.
3. **Carrier Corridor Statistics**: Real-time aggregation of operator metrics on the selected city pair (e.g. Air India vs IndiGo flight counts and historical delay rates).
4. **Side-by-Side Flight Comparison Modal**: Multi-flight checkbox selection (`☑ Compare`) opening a side-by-side comparison drawer comparing schedules, predicted risk levels, historical delay rates, expected delay windows, weather forecasts, and aircraft types.
5. **Date × Time Heatmap Matrix**: 5×7 matrix visualizing delay probability across 5 departure time windows and 5 dates.
