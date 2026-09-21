# SKYHOUR: Full Repository Forensic Audit Report

**Date**: September 20, 2026  
**Auditor**: Senior Full-Stack & Machine Learning Engineering Lead  
**Scope**: Complete forensic audit across Frontend, Backend R Plumber APIs, Data Engineering, ML Models, OpenSky Telemetry, Weather Services, Maps, and Error Handling.

---

## Executive Summary of Audit Findings

The forensic audit evaluated the complete end-to-end data pipeline: `DATA` → `BACKEND` → `MODEL` → `API` → `FRONTEND`.

Key operational findings:
1. **Model Prediction Hardcoding**:
   - `predict_flight_delay_service` was returning hardcoded / empirical values (`0.48` / `0.54`) rather than evaluating the trained `xgb.Booster` model (`models/model_xgboost_d.rds`) against the 17-feature input matrix (`ScheduledDepartureHour`, `Origin_TargetEnc`, `Dest_TargetEnc`, `Carrier_TargetEnc`, `TimeOfDay_TargetEnc`, etc.).
   - As a result, changing departure hours (06:00 vs 10:00 vs 14:00 vs 18:00 vs 22:00) did not properly vary the model prediction output.
2. **OpenSky Token Caching & Rate Limiting**:
   - OpenSky OAuth token retrieval URL and header handling needed explicit HTTP Basic Auth / URL encoding and rate-limit handling for state vectors.
3. **Data Contract Alignment**:
   - Identified fields where frontend TypeScript interfaces expected camelCase while backend Plumber REST APIs returned snake_case or missing fields.
4. **API Diagnostic Suite**:
   - Need an exhaustive diagnostic script (`scratch/test_all_external_apis.R`) testing OpenSky auth, OpenSky states, AviationWeather.gov METAR, Open-Meteo, IMD, BTS, and India datasets.

---

## Comprehensive Component Classification Matrix

| Feature / Component | Path | Forensic Classification | Root Cause / Finding | Recovery Plan |
| :--- | :--- | :--- | :--- | :--- |
| **XGBoost Pre-Flight Delay Predictor** | `R/services/prediction_service.R` | `PARTIAL` | Loaded list metadata instead of invoking `readRDS("models/model_xgboost_d.rds")` Booster. | Feed 17-feature matrix into real `xgb.Booster` to produce dynamic, time-aware predictions across hours. |
| **OpenSky OAuth2 Authentication** | `R/services/opensky_service.R` | `REAL + WORKING` | OAuth2 Bearer token flow via `opensky-network` realm working; needs explicit rate-limit logging. | Keep token auto-refresh and log response metrics. |
| **Aviation Weather METAR Service** | `R/services/aviation_weather_service.R` | `REAL + WORKING` | AviationWeather.gov API integration working; handles 200/204/429/500 cleanly. | Retain METAR parser and server-side HTTP fetching. |
| **Universal Search Resolver** | `R/services/flight_search_service.R` | `REAL + WORKING` | Normalizes IATA, ICAO, city names, routes, and flight numbers. | Maintain unified `/search?q=` endpoint. |
| **Universal Airport Resolver** | `R/services/airport_service.R` | `REAL + WORKING` | Generates full airport intelligence for any requested IATA/ICAO code. | Retain universal resolver to prevent 404/Unavailable errors. |
| **Universal Route & Airline Resolvers**| `R/services/route_service.R`, `airline_service.R` | `REAL + WORKING` | Computes route distance, 6-bucket time distributions, airline comparisons, and dynamic risk. | Retain universal resolvers. |
| **Entity Dynamic Risk Engine** | `R/services/risk_service.R` | `REAL + WORKING` | Computes entity-specific composite risk scores (0-100) and factor attributions. | Retain dynamic risk engine. |
| **Interactive Aviation GIS Map** | `frontend/src/pages/AviationMap.tsx` | `REAL + WORKING` | Leaflet map search flies to coordinates; traffic-scaled airport circles; plane markers. | Retain Leaflet GIS component. |
| **Synthetic Aviation Dataset** | `R/services/demo_flight_service.R` | `MOCK / DEMO` | 10,000 synthetic records used during fallback mode. | Retain synthetic dataset with explicit `[ DEMO MODE ]` provenance labeling. |
| **API Diagnostic Script** | `scratch/test_all_external_apis.R` | `UNAVAILABLE` | Missing standalone API diagnostic script. | Build `scratch/test_all_external_apis.R`. |
| **Comprehensive Test Suite** | `scratch/test_skyhour_everything.ps1` | `UNAVAILABLE` | Missing exhaustive PowerShell test suite validating all 50 requirements. | Build `scratch/test_skyhour_everything.ps1`. |

---

## Action Plan for Final System Quality Assurance

1. **Build `scratch/test_all_external_apis.R`**: Test OpenSky OAuth, OpenSky states, AviationWeather.gov, Open-Meteo, IMD, BTS data, and India data, logging HTTP status, response size, record count, and latency.
2. **Wire Real XGBoost Booster (`models/model_xgboost_d.rds`)**: Feed actual 17-feature vectors (`ScheduledDepartureHour`, `Origin_TargetEnc`, `Dest_TargetEnc`, `Carrier_TargetEnc`, `TimeOfDay_TargetEnc`, etc.) into the trained XGBoost model booster in `R/services/prediction_service.R`. Verify predictions change dynamically across departure hours (06:00, 10:00, 14:00, 18:00, 22:00).
3. **Build `scratch/test_skyhour_everything.ps1`**: Validate all 50 requirements including search normalization, map flight navigation, risk variance, time-aware prediction variations, error handling, and data provenance.
4. **Document Data Limitations**: Create `reports/skyhour_data_limitations.md` and `reports/skyhour_final_functionality_report.md`.
