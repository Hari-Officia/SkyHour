# SKYHOUR: Backend API Inventory & Migration Specification

## 1. Executive Summary
This document provides a comprehensive inventory of all endpoints, HTTP contracts, query parameters, schemas, and underlying dependencies currently implemented in the legacy R Plumber backend (`R/14_plumber_api.R` and `R/india/05_india_plumber_api.R`) to guide the migration to a production-grade **Python FastAPI** backend under `backend/`.

---

## 2. R Plumber API Endpoint Inventory

### A. Global / Core Aviation Endpoints (`R/14_plumber_api.R`)

| Endpoint Path | HTTP Method | Query / Path Params | Response Summary | Service / Model Dependency | Frontend Consumer |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/health` | `GET` | None | `{ status: "UP", service: "...", version: "2.0.0", timestamp: "..." }` | System health check | `api.ts` -> `getHealth()` |
| `/search` | `GET` | `q`: search string | `{ status, query, total_results, results: [...] }` | `flight_search_service.R` | `api.ts` -> `searchUniversal()` |
| `/flight/{flight_id}` | `GET` | `flight_id` (path) | Flight summary, time intelligence, XGBoost prediction, live telemetry | `flight_service.R`, `prediction_service.R` (`xgb.Booster`), `opensky_service.R` | `api.ts` -> `getFlightDetails()` |
| `/flight/{flight_id}/status` | `GET` | `flight_id` (path) | `{ status, source, flight_id, telemetry }` | `opensky_service.R` | Flight Details modal |
| `/flight/{flight_id}/position` | `GET` | `flight_id` (path) | `{ status, source, flight_id, position }` | `opensky_service.R` | Live map tracking |
| `/airport/{airport_code}` | `GET` | `airport_code` (path) | Airport details, movement metrics, traffic by hour, top routes, dynamic risk score | `airport_service.R`, `risk_service.R`, `aviation_weather_service.R` | `api.ts` -> `getAirportDetails()` |
| `/airport/{airport_code}/weather` | `GET` | `airport_code` (path) | METAR station weather observation object | `aviation_weather_service.R` | Airport Weather Card |
| `/airport/{airport_code}/traffic` | `GET` | `airport_code` (path) | Hourly movement traffic distribution | `airport_service.R` | Airport Traffic Chart |
| `/route` or `/route/intelligence` | `GET` | `origin`, `destination` (query) | Route metrics, distance, delay by hour, airline breakdown, route risk score | `route_service.R`, `risk_service.R` | Route Page query lookup |
| `/route/{origin}/{destination}` | `GET` | `origin`, `destination` (path) | Pairwise route intelligence object | `route_service.R`, `risk_service.R` | `api.ts` -> `getRouteDetails()` |
| `/airline/{airline_code}` | `GET` | `airline_code` (path) | Airline identity, metrics, top airports, top routes, airline risk score | `airline_service.R`, `risk_service.R` | `api.ts` -> `getAirlineDetails()` |
| `/prediction/flight/{flight_id}` | `GET`/`POST` | `flight_id`, `origin`, `destination`, `carrier`, `departure_hour`, `departure_min` | XGBoost pre-flight prediction, delay probability, risk level, contributing factors | `prediction_service.R` (`model_xgboost_d.rds`), `xgb.Booster` | Flight Intelligence Page |
| `/map/data` | `GET` | None | `{ data_mode, is_demo, timestamp, airports, routes, aircraft }` | `opensky_service.R`, `demo_flight_service.R`, `risk_service.R` | `api.ts` -> `getMapData()` |

---

### B. India Aviation Intelligence Endpoints (`R/india/05_india_plumber_api.R`)

| Endpoint Path | HTTP Method | Query / Body Params | Response Summary | Service / Model Dependency | Frontend Consumer |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/india/health` | `GET` | None | `{ status: "UP", service: "...", total_airports, total_routes }` | India health check | System Monitor |
| `/india/overview` | `GET` | None | Total airports, active airlines, monthly passengers, top hub, IndiGo market share | `airports_master.parquet` | `indiaApi.ts` -> `getIndiaOverview()` |
| `/india/map-data` | `GET` | None | `{ airports: [...], routes: [...] }` | Master GIS datasets | `indiaApi.ts` -> `getIndiaMapData()` |
| `/india/airports` | `GET` | `q` (optional filter) | Filtered array of Indian airports | `airports_master.parquet` | `indiaApi.ts` -> `getIndiaAirports()` |
| `/india/routes` | `GET` | `origin`, `destination` | Filtered array of Indian sector routes | `routes_india.csv` | `indiaApi.ts` -> `getIndiaRoutes()` |
| `/india/airlines` | `GET` | None | Array of Indian airlines & market share | `airlines_india.csv` | `indiaApi.ts` -> `getIndiaAirlines()` |
| `/india/flights` | `GET` | `flight_number`, `airline`, `origin`, `destination` | AirSewa schedule list | AirSewa schedule dataset | `indiaApi.ts` -> `getIndiaFlights()` |
| `/india/predict-demand` | `POST` | JSON: `{ airport_iata }` | Forecasted monthly passengers & 8.5% growth model | `india_demand_model.rds` | `IndiaAirports.tsx` demand forecaster |
| `/india/what-if` | `POST` | JSON: `{ airport_iata, traffic_delta_pct, weather_delta_pct }` | Baseline vs scenario risk score and risk delta | `04_india_risk_engine.R` | `indiaApi.ts` -> `runWhatIfScenario()` |
| `/india/states` | `GET` | None | Array of Indian state aviation metrics | `states_india.csv` | `IndiaHome.tsx` |
| `/india/tamil-nadu` | `GET` | None | Tamil Nadu spotlight airports & routes | `airports_master.parquet` | `indiaApi.ts` -> `getTamilNaduSpotlight()` |
| `/india/airport-intelligence` | `GET` | `q` (optional filter) | 360-degree airport metrics array | `20_india_intelligence_engine.R` | `indiaApi.ts` -> `getIndiaAirportIntelligence()` |
| `/india/route-intelligence` | `GET` | `origin`, `destination` | 360-degree route metrics array | `20_india_intelligence_engine.R` | `indiaApi.ts` -> `getIndiaRouteIntelligence()` |
| `/india/bottlenecks` | `GET` | None | High congestion bottleneck airports | `20_india_intelligence_engine.R` | `indiaApi.ts` -> `getIndiaBottlenecks()` |
| `/india/airline-intelligence` | `GET` | None | Carrier intelligence array | `20_india_intelligence_engine.R` | `indiaApi.ts` -> `getIndiaAirlineIntelligence()` |
| `/india/state-intelligence` | `GET` | None | State intelligence array | `20_india_intelligence_engine.R` | `indiaApi.ts` -> `getIndiaStateIntelligence()` |
| `/india/tamil-nadu-compare` | `GET` | None | Side-by-side TN airport comparison | `20_india_intelligence_engine.R` | `indiaApi.ts` -> `getTamilNaduComparison()` |

---

## 3. Migration Strategy for ML Models & R Data Science Integration

### Preserving R for Data Science & Training
- **R Role**: R scripts (`R/01_data_audit.R` through `R/12_save_final_model.R`) handle data cleaning, feature engineering, statistical modeling, cross-validation, and model training.
- **Python XGBoost Serving**: `models/model_xgboost_d.rds` contains the trained XGBoost booster. We will extract/export the XGBoost booster representation (or bridge via R inference script) to ensure **100% exact numerical prediction equivalence** between R and Python predictions.

---

## 4. Proposed FastAPI Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI Application Entrypoint
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py             # Pydantic BaseSettings & Environment Variables
│   │   └── logging.py              # Structured JSON/Console Logger
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/                 # APIRouter Endpoint Handlers
│   │       ├── health.py
│   │       ├── search.py
│   │       ├── flights.py
│   │       ├── airports.py
│   │       ├── routes.py
│   │       ├── airlines.py
│   │       ├── predictions.py
│   │       ├── map.py
│   │       └── india.py
│   ├── schemas/                    # Pydantic Schemas
│   │   ├── common.py
│   │   ├── search.py
│   │   ├── flight.py
│   │   ├── airport.py
│   │   ├── route.py
│   │   ├── airline.py
│   │   ├── prediction.py
│   │   ├── map.py
│   │   └── india.py
│   ├── services/                   # Core Business Logic Services
│   │   ├── search_service.py
│   │   ├── flight_service.py
│   │   ├── airport_service.py
│   │   ├── route_service.py
│   │   ├── airline_service.py
│   │   ├── prediction_service.py
│   │   ├── risk_service.py
│   │   ├── map_service.py
│   │   └── india_service.py
│   ├── providers/                  # External Data Adapters
│   │   ├── opensky_provider.py
│   │   ├── weather_provider.py
│   │   └── demo_provider.py
│   ├── ml/                         # ML Model Inference & Preprocessing
│   │   ├── model_loader.py
│   │   ├── feature_engineering.py
│   │   └── prediction_pipeline.py
│   ├── repositories/               # Data Storage & Queries
│   │   ├── flight_repository.py
│   │   ├── airport_repository.py
│   │   └── duckdb_store.py
│   └── utils/                      # Helper Utilities
│       ├── normalization.py
│       └── datetime_utils.py
├── tests/                          # pytest Suite
│   ├── unit/
│   ├── integration/
│   ├── api/
│   └── ml/
├── requirements.txt
├── .env.example
└── README.md
```
