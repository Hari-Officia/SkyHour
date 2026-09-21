# Skyhour Restructure & System Audit Report

**Date:** September 19, 2026  
**Author:** Lead Full-Stack & ML Engineer  
**Status:** Initial System Audit Complete  

---

## 1. Executive Summary

Skyhour is currently split across two disjointed sub-systems:
1. **US Delay Prediction Module** (`R/14_plumber_api.R`, `R/15_feature_transformer.R`, frozen model `models/skyhour_delay_model.rds`), which serves pre-flight delay predictions on US BTS historical data and AviationStack flight lookup.
2. **Skyhour India Module** (`R/india/05_india_plumber_api.R`, master datasets in `data/india/`), which serves various Indian aviation GIS metrics, What-If simulator, Tamil Nadu spotlight, State intelligence, and Bottleneck watch.

This audit evaluates the codebase to restructure Skyhour into a unified, high-precision **Airline Flight Intelligence and Delay Prediction Platform** focused on **Search, Flight Intelligence, Airport Intelligence, Route Intelligence, Airline Intelligence, Historical Delay Analysis, Delay Prediction, and Real Telemetry Maps**.

---

## 2. Current Architecture & Components Audit

### 2.1 Backend Architecture
- **Plumber Servers**: Two separate R scripts (`R/14_plumber_api.R` running on port 8000 and `R/india/05_india_plumber_api.R`). They operate independently without a unified routing system or shared service layer.
- **R Scripts Pipeline**:
  - `R/01_data_audit.R` through `R/12_save_final_model.R`: Script pipeline for cleaning BTS data, EDA, feature engineering, and model training (XGBoost, Random Forest, Logistic Regression).
  - `R/13_predict_api_interface.R` & `R/15_feature_transformer.R`: Feature transformation and prediction engine for the US dataset.
  - `R/india/01_india_data_ingestion.R` to `20_india_intelligence_engine.R`: Processing pipelines for Indian airport/route/airline CSV and Parquet files.
- **Service Layer**: Non-existent. External API calls (AviationStack, AviationWeather, OpenSky) are embedded directly inside Plumber endpoint handlers or missing proper OAuth/error handling.

### 2.2 Models Audit
- **US Model (`models/skyhour_delay_model.rds`)**: XGBoost classifier trained on 2022 BTS flight data (`Combined_Flights_2022.parquet`). Features include airline, origin, destination, scheduled departure/arrival hour, distance, historical delay rates, and day of week.
- **India Demand Model (`models/india/india_demand_model.rds`)**: Linear regression / time-series model predicting monthly passenger demand per airport.
- **Data Leakage Check**: `skyhour_delay_model.rds` uses pre-flight schedule and historical target encodings (origin_arr_delay_rate, carrier_arr_delay_rate). No future operational variables (`DEP_DELAY`, `ARR_DELAY`, `ACTUAL_ELAPSED_TIME`) were found in the feature vector for pre-flight prediction.

### 2.3 Frontend Audit
- **Stack**: React, Vite, TypeScript, Lucide icons, Recharts, Leaflet / react-leaflet, Framer Motion.
- **Navigation & Routing**:
  - Main nav toggles between "US Module" and "Skyhour India".
  - 10 separate pages for India (`IndiaHome`, `IndiaAirports`, `IndiaRoutes`, `IndiaAirlines`, `IndiaFlights`, `IndiaAnalytics`, `IndiaWhatIf`, `IndiaStates`, `IndiaTamilNadu`, `IndiaBottlenecks`).
  - 5 pages for US (`Home`, `Predict`, `SearchPage`, `Insights`, `About`).

---

## 3. Data Sources & API Dependencies

| Source | Integration Status | Role / Purpose | Audit Findings |
| :--- | :--- | :--- | :--- |
| **OpenSky Network** | `credentials.json` present (`clientId`, `clientSecret`) | Live aircraft telemetry, state vectors, positions | Credentials present. Backend needs OAuth2 client credentials token generator and live state vector parser. |
| **AviationWeather.gov** | `openapi.yaml` spec present | METAR, TAF, SIGMET | OpenAPI 4.0 spec present. Backend integration needed for real-time airport weather & ceiling/visibility parsing. |
| **Open-Meteo** | Not yet connected | Weather forecast & historical hourly weather | Free REST API available. Highly reliable fallback and feature provider for delay models. |
| **IMD (India Meteorological Dept)** | Static forecast indicators | Indian aviation weather & warnings | Need fallback handler for IMD / Open-Meteo weather when IMD endpoint is rate-limited or unreachable. |
| **BTS TranStats** | `data/Combined_Flights_2022.parquet` | U.S. Historical flight delay ground truth | Fully integrated in `models/skyhour_delay_model.rds` and training parquet datasets. |
| **OGD India / DGCA / AAI** | Master datasets in `data/india/` | Indian airport, route, passenger & traffic statistics | Master datasets present (`india_airport_master.parquet`, `routes_india.csv`, `airlines_india.csv`). |

---

## 4. Components Evaluation (Keep / Remove / Merge)

### 4.1 Recommended to REMOVE
1. **India What-If Simulator (`IndiaWhatIf.tsx`)**: Arbitrary slider-based simulation without empirical delay backing.
2. **Tamil Nadu Spotlight (`IndiaTamilNadu.tsx`, `TamilNaduCompareModal.tsx`)**: Regional dashboard fragment inconsistent with a global/national intelligence platform.
3. **State Intelligence (`IndiaStates.tsx`)**: Redundant administrative view.
4. **Bottleneck Watch (`IndiaBottlenecks.tsx`)**: Can be merged into Airport & Route Intelligence traffic congestion metrics.
5. **US / India Dual Region Switcher**: Split navigation confuses users. Skyhour should be a single unified platform.
6. **Fake / Hardcoded Data & Unused Endpoints**: Any static JSON fallbacks claiming "live flight status" or hardcoded coordinates.

### 4.2 Recommended to MERGE & RESTRUCTURE
1. **Universal Search (`/search`)**: Combine flight lookup, airport code lookup, route lookup, and airline lookup into a single Google Flights-inspired search bar (`q=MAA`, `q=AI302`, `q=MAA DEL`, `q=IndiGo`).
2. **Flight Intelligence Page (`/flight/:id`)**: Merge US flight check and India flight check into a single screen featuring flight header, live telemetry (OpenSky), weather (AviationWeather/Open-Meteo), route map, and ML delay prediction with factor explanations.
3. **Airport Intelligence Page (`/airport/:code`)**: Unified airport view displaying metadata, traffic volume, airline mix, top routes, weather (METAR/TAF), and historical delay statistics.
4. **Route Intelligence Page (`/route?origin=X&destination=Y`)**: Unified route view displaying flight volume, operating airlines comparison (factual metrics only), historical delay rates, and trend analysis.
5. **Airline Intelligence Page (`/airline/:code`)**: Factual airline metrics, fleet/traffic scale, top hubs, top routes, and historical delay performance.
6. **Interactive Aviation Map (`/map`)**: Leaflet map rendering real airport nodes, route arcs, and genuine OpenSky aircraft position markers.

### 4.3 Recommended to KEEP
- `models/skyhour_delay_model.rds` (Frozen US XGBoost delay prediction model).
- `data/india/master/*` (DGCA / AAI master airport, route, airline datasets).
- `R/15_feature_transformer.R` (US model feature transformer).
- Leaflet map integration & UI design system tokens (Tailwind, Lucide icons, dark slate glassmorphic aesthetic).

---

## 5. Implementation Roadmap & Plan

1. **Backend Service Layer (`R/services/`)**:
   - `opensky_service.R`: OAuth2 client credentials auth, caching token, state vector fetching by bbox or callsign/icao24.
   - `aviation_weather_service.R`: AviationWeather.gov METAR/TAF parser.
   - `openmeteo_service.R`: Open-Meteo weather parser for origin/destination coords.
   - `imd_service.R`: Indian weather & fallback handler.
   - `flight_search_service.R`: Unified search resolver (`q`).
   - `airport_service.R`: Airport intelligence data aggregator.
   - `route_service.R`: Route intelligence data aggregator.
   - `airline_service.R`: Airline intelligence data aggregator.
   - `prediction_service.R`: Unified prediction engine (US BTS XGBoost model + India risk model + factor SHAP/contribution explanation).
2. **Unified Plumber API (`R/14_plumber_api.R`)**: Single API server exporting `/search`, `/flight/:id`, `/airport/:code`, `/route`, `/airline/:code`, `/prediction/*`, `/map/data`, `/health`.
3. **Frontend Re-architecture**:
   - Replace complex multi-tab navigation with simple universal header: Home, Search, Flights, Airports, Routes, Airlines, Map.
   - Build universal search box with autocomplete suggestions.
   - Build high-impact Flight, Airport, Route, and Airline Intelligence views with full source traceability tags and graceful API fallbacks.
