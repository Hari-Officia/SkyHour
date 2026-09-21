# SKYHOUR — Date & Route Intelligence Forensic System Audit Report

**Date**: 2026-09-20  
**Target Architecture**: Python FastAPI Backend + DuckDB + React TypeScript Frontend + Leaflet Spatial Visualizer  
**Status**: ACTIVE SYSTEM AUDIT

---

## 1. System Component Audit Summary

| Component | Status | Location / Tech | Audit Finding / Refactor Action Required |
| :--- | :--- | :--- | :--- |
| **Backend Core** | FastAPI | `backend/app/main.py` | FastAPI server active on `http://127.0.0.1:8100`. DuckDB in-memory analytical store connected. |
| **Data Engine** | DuckDB | `backend/app/repositories/duckdb_store.py` | Loaded `india_airports`, `india_routes`, `india_airlines`, `india_states`, `synthetic_flights`. Needs date and time-window filtering routines. |
| **Synthetic Flights** | Parquet | `data/processed/synthetic_flights.parquet` | Contains schema with `scheduled_departure`, `scheduled_arrival`, `status`, `delay_minutes`, `delay_probability`, `weather_condition`, `latitude`, `longitude`, `heading`. Needs expansion for multi-date scheduling. |
| **Search Engine** | API Endpoint | `backend/app/api/routes/search.py` | Currently simple universal search. Needs dedicated date & time-window search service (`GET /flights/search`). |
| **Risk Engine** | FastAPI ML | `backend/app/ml/feature_engineering.py` | XGBoost 17-feature prediction active. Needs transparent breakdown of individual delay factors (Carrier rate, Route rate, Origin airport, Destination airport, Time window, Weather). |
| **Map Engine** | React Leaflet | `frontend/src/pages/AviationMap.tsx` | Needs integration with `GET /map/flights` filter params (`date`, `origin`, `destination`, `time_window`, `risk`) and curved flight path interpolation. |
| **Frontend UI** | React + Vite | `frontend/src/` | Needs primary `/flights` Flight Finder workspace, flight comparison drawer (`COMPARE FLIGHTS`), date picker, time window dropdown, and Date × Time risk heatmap. |

---

## 2. Key Audit Discoveries & Engineering Action Plan

1. **Time Window Standardization**:
   - `MORNING`: 06:00 – 11:59
   - `AFTERNOON`: 12:00 – 16:59
   - `EVENING`: 17:00 – 20:59
   - `NIGHT`: 21:00 – 23:59
   - `MIDNIGHT`: 00:00 – 05:59
   - `ANY`: 00:00 – 23:59

2. **Date Classification & Mode Provenance**:
   - `PAST`: Queries historical flight dataset. Data Mode: `HISTORICAL BTS`.
   - `TODAY`: Combines live OpenSky telemetry (where available) + scheduled flights. Data Mode: `LIVE` / `SCHEDULED+MODELLED`.
   - `FUTURE`: Combines master airline flight schedule + XGBoost ML predictions + historical route/airport probabilities. Data Mode: `SCHEDULED+MODELLED`.

3. **Risk Score Decomposition**:
   - Avoid hardcoded static scores. Combine:
     - Carrier delay rate (`historical_airline_delay_rate`)
     - Route delay rate (`historical_route_delay_rate`)
     - Origin airport departure delay index
     - Destination airport arrival delay index
     - Departure hour congestion factor
     - Day of week factor
     - Weather severity index
     - XGBoost prediction output

4. **Search Query Normalization**:
   - Strip spaces and hyphens (`AI302`, `AI 302`, `AI-302` -> `AI302`).
   - Standardize airport IATA codes (`MAA`, `Chennai` -> `MAA`).
