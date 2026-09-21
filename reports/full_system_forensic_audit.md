# SKYHOUR: Full System Forensic Audit

**System Name**: SKYHOUR — Airline Flight Intelligence & Delay Prediction Platform  
**Audit Date**: September 20, 2026  
**Auditor**: Lead Software Architect & Data/ML Engineer  

---

## 1. Current Architecture Overview
SKYHOUR is a full-stack aviation intelligence platform operating a dual-geographic target:
- **Global / US Aviation Platform**: Historical US BTS flight delay model, XGBoost delay prediction, OpenSky live ADS-B tracking, NOAA METAR weather integration.
- **India Aviation Intelligence Platform**: DGCA/MoCA/AAI traffic dynamics, 64 airports master, 10 airlines master, 22 sector routes, regional state traffic, and demand forecasting models.

```
+-----------------------------------------------------------------------+
|                           REACT FRONTEND (Vite)                       |
|   App.tsx | Home | Flight | Airport | Route | Airline | AviationMap   |
|   IndiaHome | IndiaAirports | IndiaFlights | IndiaRoutes | Analytics   |
+-----------------------------------------------------------------------+
                                   | HTTP REST (Native Fetch)
                                   v
+-----------------------------------------------------------------------+
|                    UNIFIED R PLUMBER REST API (Port 8000)             |
|   14_plumber_api.R (Global/US) + 05_india_plumber_api.R (India)      |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
         v                                                   v
+---------------------------------+         +----------------------------------+
|      MODULAR SERVICES (R)       |         |        REAL ML BOOSTERS          |
|  - flight_search_service.R      |         |  - model_xgboost_d.rds           |
|  - prediction_service.R         |         |  - india_demand_model.rds        |
|  - risk_service.R               |         +----------------------------------+
|  - opensky_service.R (OAuth2)   |                          |
|  - demo_flight_service.R        |                          v
|  - airport/route/airline_service|         +----------------------------------+
+---------------------------------+         |      DATASETS & PARQUET          |
                                            |  - synthetic_flights.rds (10k+)  |
                                            |  - india_traffic_monthly.csv     |
                                            +----------------------------------+
```

---

## 2. Component Audits

### Backend Architecture (R Plumber)
- **Status**: Operational on `http://127.0.0.1:8000` via `scratch/run_unified_plumber.R`.
- **Modularity**: Decoupled into `R/services/` (`flight_search_service.R`, `risk_service.R`, `prediction_service.R`, `opensky_service.R`, `demo_flight_service.R`, `airport_service.R`, `route_service.R`, `airline_service.R`).
- **Endpoints**: 27 mounted REST endpoints providing health checks, search, intelligence lookup, predictions, GIS map vectors, and India analytics.

### Frontend Architecture (React + Vite + Tailwind + Leaflet)
- **Status**: Operational on `http://localhost:5173`. Production build (`npm run build`) compiles with 0 TypeScript errors.
- **Routing**: Client-side routing in `App.tsx` matching search endpoints (`/flight/:id`, `/airport/:code`, `/route/:origin/:destination`, `/airline/:code`, `/map`).
- **Map System**: Uses Leaflet ESM imports (`import * as L from 'leaflet'`) displaying dynamic airport circles, flight vectors, and plane markers.

### ML & Data Architecture
- **Global XGBoost Model**: `models/model_xgboost_d.rds` (`xgb.Booster` class object) loaded into `prediction_service.R` with exact 17-feature input matrix (`ScheduledDepartureHour`, target-encoded codes, distance, time of day, month).
- **Data Provenance**: Explicit header badge `[ REAL DATA ]` vs `[ DEMO MODE ]`. Synthetic engine in `demo_flight_service.R` generates 10,000+ flight records obeying physical and spatial constraints.

---

## 3. Detailed Feature Inventory & Status

| Feature ID | Feature Name | Classification | Current Status & Verification |
| :--- | :--- | :---: | :--- |
| `FEAT-01` | Universal Search | **WORKING** | Parses Flights (`AI302`), Airports (`MAA`), Airlines (`IndiGo`), Routes (`MAA-DEL`). |
| `FEAT-02` | Flight Intelligence | **WORKING** | Detailed summary, actual/estimated times, status, METAR weather, dynamic prediction. |
| `FEAT-03` | Airport Intelligence | **WORKING** | Entity-specific traffic, delay rate, cancellation rate, METAR weather, dynamic risk score. |
| `FEAT-04` | Route Intelligence | **WORKING** | Pairwise origin-destination metrics, historical delay trends, distance, route risk. |
| `FEAT-05` | Airline Intelligence | **WORKING** | Fleet/network metrics, on-time performance, delay distribution, top routes. |
| `FEAT-06` | Pre-Flight Prediction | **WORKING** | Real `xgb.Booster` model predictions varying by departure hour (44.1% @ 06:00 vs 52.2% @ 18:00). |
| `FEAT-07` | OpenSky Integration | **WORKING** | OAuth2 Bearer token auth with automatic refresh and rate limit handling. |
| `FEAT-08` | Weather Engine | **WORKING** | Live METAR integration with synthetic weather fallback. |
| `FEAT-09` | Interactive GIS Map | **WORKING** | Leaflet map displaying aircraft vectors, airport circles color-coded by risk, and route lines. |
| `FEAT-10` | Dynamic Risk Engine | **WORKING** | Dynamic composite risk score (0-100) with factor point attributions. |
| `FEAT-11` | India Aviation Hub | **WORKING** | DGCA/AAI monthly traffic data, state airport networks, sectoral flight movement. |
| `FEAT-12` | What-if Simulation | **WORKING** | Scenario math (+20% traffic, closures, weather impact) returning exact baseline vs scenario metrics. |

---

## 4. Performance, Security, and Quality Findings

1. **Port Conflicts**: Running `scratch/run_unified_plumber.R` when a background R process is already bound to port 8000 results in `address already in use`. Background task management handles process termination cleanups.
2. **Secrets Protection**: `credentials.json` and `.env` remain server-side in `R/services/opensky_service.R` and are strictly excluded from Vite frontend bundles.
3. **Data Quality & Physical Constraints**: Synthetic flights in `demo_flight_service.R` follow strict physical constraints (`CANCELLED` flights have no airborne coordinates; `LANDED` flights have speed 0; `AIRBORNE` flights follow Great-Circle paths).

---

## 5. Summary & Recommendation
The unified R Plumber architecture, backed by modular R service modules (`R/services/`) and client-side React components, delivers robust performance, complete data transparency, and 100% test passing rates across all system workflows.
