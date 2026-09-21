# Skyhour India Final Verification Report

**Date**: 2026-09-14
**Environment**: Windows OS / R v4.5.0 / Node v20 / Vite v8.3.0
**API Base URL**: `http://127.0.0.1:8000`

---

## 1. Architecture Overview

```
                         SKYHOUR PLATFORM
                                │
                        R PLUMBER :8000
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
           🇺🇸 USA                              🇮🇳 INDIA
              │                                   │
          /health                             /india/health
          /model-info                         /india/overview
          /predict                            /india/map-data
          /flight-lookup                      /india/airports
          /predict-live                       /india/routes
                                             /india/airlines
                                             /india/flights
                                             /india/predict-demand
                                             /india/what-if
                                             /india/states
                                             /india/tamil-nadu
```

The unified R Plumber backend (`scratch/run_unified_plumber.R`) mounts both USA API (`R/14_plumber_api.R`) and India API (`R/india/05_india_plumber_api.R`) on port 8000. 

---

## 2. Backend Verification

- **Server Status**: **PASS**
- **Mounting Mechanism**: Unified Plumber router mounted on `http://127.0.0.1:8000`.
- **CORS Handling**: `Access-Control-Allow-Origin: *` configured across pre-flight OPTIONS and GET/POST handlers.
- **Port Conflict Safeguards**: Dedicated task daemon running smoothly with zero crash events.

---

## 3. API Endpoints Verification Matrix

### A. India API Endpoints (12 Endpoints Tested)

| Endpoint | Method | Expected Status | Actual Status | Record Count / Metric | Result |
|---|---|---|---|---|---|
| `/india/health` | `GET` | 200 | 200 | 64 Airports, 22 Routes | **PASS** |
| `/india/overview` | `GET` | 200 | 200 | Delhi DEL Top Hub, 42.98M Monthly Pax | **PASS** |
| `/india/map-data` | `GET` | 200 | 200 | 64 Airports, 22 Route Corridors | **PASS** |
| `/india/airports` | `GET` | 200 | 200 | 64 Airport Records | **PASS** |
| `/india/airports?q=MAA` | `GET` | 200 | 200 | 1 Record (Chennai MAA) | **PASS** |
| `/india/routes` | `GET` | 200 | 200 | 22 Sector Corridors | **PASS** |
| `/india/airlines` | `GET` | 200 | 200 | 10 Active Carriers (IndiGo 61.8%) | **PASS** |
| `/india/flights` | `GET` | 200 | 200 | 6 Flight Schedules | **PASS** |
| `/india/states` | `GET` | 200 | 200 | 31 State Profiles | **PASS** |
| `/india/tamil-nadu` | `GET` | 200 | 200 | 6 TN Airports (MAA, CJB, TRZ, IXM, SXV, TCR) | **PASS** |
| `/india/predict-demand` | `POST` | 200 | 200 | Current: 2.53M ➔ Forecast: 2.75M (+8.5%) | **PASS** |
| `/india/what-if` | `POST` | 200 | 200 | Baseline: 67.6 ➔ Scenario: 67.7 (Delta: +0.1) | **PASS** |

### B. USA Regression API Endpoints (5 Endpoints Tested)

| Endpoint | Method | Expected Status | Actual Status | Output Summary | Result |
|---|---|---|---|---|---|
| `/health` | `GET` | 200 | 200 | Skyhour Flight Delay Prediction API (v1.2.0) | **PASS** |
| `/model-info` | `GET` | 200 | 200 | Threshold: 0.50, Frozen Pipeline v1.2.0 | **PASS** |
| `/flight-lookup` | `GET` | 200 | 200 | Schedule Lookup (`AA100`: JFK ➔ LHR) | **PASS** |
| `/predict` | `POST` | 200 | 200 | Prediction: `DELAY` (50.3% Risk) | **PASS** |
| `/predict-live` | `POST` | 200 | 200 | Prediction: `ON-TIME` (48.2% Risk) | **PASS** |

### C. API Negative Testing

| Scenario | Endpoint / Payload | Expected | Actual Status | Result |
|---|---|---|---|---|
| Unknown Airport Query | `GET /india/airports?q=INVALID99` | 200 (Empty Array) | 200 (`[]`) | **PASS** |
| Unknown Flight Search | `GET /india/flights?flight_number=XYZ999` | 200 (Empty Array) | 200 (`[]`) | **PASS** |
| Empty POST Payload | `POST /predict` (`{}`) | 400 Bad Request | 400 Bad Request | **PASS** |
| Same Origin & Destination | `POST /predict` (`JFK ➔ JFK`) | 400 Validation Error | 400 Validation Error | **PASS** |

---

## 4. USA Regression Test Summary

- **USA Model Preservation**: `models/skyhour_delay_model.rds` (v1.2.0) and `models/model_metadata.json` remain **100% frozen and untouched**.
- **Execution Result**: **PASS** — USA delay risk prediction and live feature transformation layers operate with 0 side-effects from India module additions.

---

## 5. Frontend & Navigation Verification

- **Frontend Router (`App.tsx`)**: **PASS** — Supports both USA (`/`, `/predict`, `/search`, `/insights`, `/about`) and India (`/india`, `/india/airports`, `/india/routes`, `/india/airlines`, `/india/flights`, `/india/analytics`, `/india/what-if`, `/india/states`, `/india/tamil-nadu`).
- **Region Switcher**: **PASS** — Topbar toggle cleanly switches between `[ 🇺🇸 US Module ]` and `[ 🇮🇳 Skyhour India ]` without route errors or state leaks.
- **Browser History**: **PASS** — Back/forward navigation works cleanly across all views.

---

## 6. Leaflet Map Verification

- **Route**: `/india`
- **Center**: India coordinates (`20.5937, 78.9629`, Zoom Level 5).
- **Tile Layer**: CartoDB Dark Matter tile layer.
- **Layer Controls**: Interactive layer toggles for `[Risk]`, `[Passengers]`, `[Rainfall]`, `[Centrality]`, `[Routes]`, `[UDAN]`.
- **Interactivity**: Clicking markers opens the Airport Intelligence Side Panel with footfall, aircraft movements, weather, and centrality metrics.
- **Status**: **PASS**

---

## 7. Search & Filtering Verification

- **Airports Search (`/india/airports`)**: Supports lookup by IATA (`MAA`), ICAO (`VOMM`), City (`Chennai`), State (`Tamil Nadu`), or Airport Name.
- **Route Search (`/india/routes`)**: Supports origin/destination IATA sector filtering.
- **Flight Search (`/india/flights`)**: AirSewa schedule lookup with debounced autocomplete.
- **Status**: **PASS**

---

## 8. Tamil Nadu Regional Spotlight Verification

- **Route**: `/india/tamil-nadu`
- **Covered Airports**: 6 Airports — Chennai (`MAA`), Coimbatore (`CJB`), Tiruchirappalli (`TRZ`), Madurai (`IXM`), Salem (`SXV`), Tuticorin (`TCR`).
- **Data Provenance**: All stats originate directly from AAI/DGCA monthly footfall data (`3.30M` monthly state footfall, `2` UDAN RCS airports).
- **Status**: **PASS**

---

## 9. Demand Model Audit (Step 20)

- **Model File**: `models/india/india_demand_model.rds`
- **Methodology**: XGBoost Regression on monthly airport passenger time-series (`data/india/master/india_aviation.parquet`).
- **Temporal Split**: Train (2021-2023), Validation (2024), Test (2025 holdout).
- **Reported Metrics**: $R^2 = 0.9996$, $\text{MAPE} = 5.21\%$.
- **Audit Findings**:
  1. **Autoregressive Lags**: The model uses `lag_1m_pax` (previous month footfall) and `lag_12m_pax` (same month last year). Because airport footfall is highly persistent (e.g. DEL carries ~2M pax monthly), including 1-month and 12-month autoregressive lags accounts for over 95% of target variance.
  2. **Target Leakage Check**: Strict temporal splitting was preserved (no future leakage). Lags are strictly prior-period observations.
  3. **Credibility Verdict**: **VALIDATED WITH CONTEXT**. $R^2 = 0.9996$ is credible for an autoregressive time-series model on aggregate monthly footfall, but should be described as a lag-augmented autoregressive forecaster rather than purely weather-driven.

---

## 10. Risk Engine Audit (Step 21)

- **Script**: `R/india/04_india_risk_engine.R`
- **Formula**:
  $$\text{Traffic Pressure} = \min(100, (\frac{\text{Pax}}{500000}) \times 50)$$
  $$\text{Weather Severity} = \min(100, (\frac{\text{Rain}}{350}) \times 50 + (\frac{\text{Temp}}{45}) \times 30 + (\frac{\text{Wind}}{30}) \times 20)$$
  $$\text{Network Centrality} = \min(100, \text{PageRank} \times 500)$$
  $$\text{Skyhour Risk Score} = 0.45 \times \text{Traffic Pressure} + 0.35 \times \text{Weather Severity} + 0.20 \times \text{Network Centrality}$$
- **Naming Enforcement**: Strictly labeled **Skyhour Risk Score** (composite operational risk index for planning context), never mislabeled as official government/DGCA alerts.
- **Verdict**: **VALIDATED**.

---

## 11. Data Quality & Provenance Audit (Step 22)

- **Report**: `reports/india_data_quality.md`
- **Master Files**:
  - `airports_india.csv`: 64 airports, 0 missing coordinates.
  - `airlines_india.csv`: 10 active carriers, 0 missing identifiers.
  - `india_aviation.parquet`: 3,840 monthly records (2021-2025).
  - `routes_india.csv`: 22 sector corridors.
- **Verdict**: **PASS**.

---

## 12. Frontend Build Verification (Step 27)

- **Command**: `npm run build`
- **Build Result**: `exit code 0`
- **Duration**: `954 ms`
- **Asset Chunks**: `index-Duyj94Ee.css` (40.86 kB), `index-CnxWDGIW.js` (597.19 kB).
- **TypeScript & JSX Errors**: `0 errors`.
- **Verdict**: **PASS**.

---

## 13. Overall System Verification Summary

```
OVERALL PLATFORM STATUS: PASS

Backend Server:        PASS
USA Regression Test:   PASS
India API Test Suite:  PASS (100% Pass Rate across 21 Test Cases)
Frontend Build:        PASS (Exit Code 0)
India Leaflet Map:     PASS
Search & Intelligence: PASS
Tamil Nadu Spotlight:  PASS
Demand Model Audit:    VALIDATED (Autoregressive Lag Forecaster)
Risk Engine Audit:     VALIDATED (Skyhour Composite Risk Score)
Data Quality Audit:    PASS
```
