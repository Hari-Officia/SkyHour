# SKYHOUR: System Functionality Recovery Audit Report

**Date**: September 20, 2026  
**Auditor**: Senior Full-Stack & Machine Learning Engineering Lead  
**Scope**: Complete repository audit across Frontend, Backend R Plumber APIs, Data Engineering, ML Models, OpenSky Telemetry, Weather Services, and Maps.

---

## Executive Audit Summary

The system audit evaluated all 26 core component areas of **SKYHOUR**. Prior to recovery, the system suffered from several key operational deficiencies:
1. **Hardcoded API Fallbacks**: `/flight/<id>` endpoint hardcoded query parameters to `"MAA"`, `"DEL"`, and `"AI"`, ignoring the requested flight identifier.
2. **Identical Risk Scores**: Multiple airports and routes were receiving constant fallback scores (`68/100`) due to uniform fallback logic during API failures.
3. **OpenSky Auth & Rate Limits**: OpenSky endpoint calls were failing or timing out due to missing OAuth2 client credential token flows.
4. **Map Search & Interaction Failure**: Map search bar was disconnected from Leaflet map bounds and markers were not reacting to entity selection.
5. **Silent Fallback to Fake Live Data**: When real-time APIs failed, dummy flight data was displayed under a `LIVE` label without indicating fallback status.

---

## Comprehensive Feature Classification Matrix

| Feature / Module | Component Path | Audit Classification | Cause / Technical Finding | Recovery Action |
| :--- | :--- | :--- | :--- | :--- |
| **OpenSky OAuth Token Flow** | `R/services/opensky_service.R` | `PARTIALLY WORKING` | Realm URL misconfigured (`b2c` instead of `opensky-network`). Auth token caching absent. | Update OAuth realm URL to `opensky-network`, implement Bearer token caching & auto-refresh. |
| **Flight Intelligence API** | `R/14_plumber_api.R` | `BROKEN` | Hardcoded `predict_flight_delay_service(clean_id, "MAA", "DEL", "AI")`. | Dynamically resolve flight metadata, route, carrier, and schedules from dataset. |
| **Risk Calculation Engine** | `R/services/risk_service.R` | `BROKEN` | Constant fallback score (`68`) returned when metrics array is empty. | Compute entity-specific risk using traffic volume, weather, cancellation rate & route density. |
| **Universal Search** | `R/services/flight_search_service.R` | `PARTIALLY WORKING` | Case sensitivity and hyphen/space handling issues for flight numbers (`AI 302` vs `ai302`). | Implement normalized indexing across IATA, ICAO, city names, airline codes, and flight numbers. |
| **Map Search & Marker Zoom** | `frontend/src/pages/AviationMap.tsx` | `BROKEN` | Search input did not fly map view to selected airport/flight position. | Bind map ref to search selection, dynamically zoom and open popups. |
| **Airport Intelligence Page** | `frontend/src/pages/AirportIntelligence.tsx` | `PARTIALLY WORKING` | Traffic breakdown showed flat averages across hours. | Implement 6-bucket time-of-day traffic distribution (06:00-09:00, etc.) from dataset. |
| **Route Intelligence Page** | `frontend/src/pages/RouteIntelligence.tsx` | `PARTIALLY WORKING` | Limited to MAA-DEL; generic route queries returned empty state. | Support any origin-destination pair using BTS/Synthetic data lookup. |
| **Airline Intelligence Page** | `frontend/src/pages/AirlineIntelligence.tsx` | `PARTIALLY WORKING` | Displayed arbitrary ranking numbers rather than factual operational metrics. | Replace arbitrary ranking with factual delay, cancellation, and route volume stats. |
| **Synthetic Dataset Engine** | `R/services/demo_flight_service.R` | `MOCKED` | Contained only ~50 sample rows instead of robust flight schedules. | Generate 10,000+ realistic flight records with strict physical & temporal logic. |
| **Data Mode Provenance Badge** | `frontend/src/App.tsx` | `UNAVAILABLE` | User could not distinguish Real vs Demo data states. | Add global Data Mode badge `[ REAL DATA ] / [ DEMO DATA ]` and provenance headers. |
| **Leak-Free XGBoost V2 Model** | `models/skyhour_delay_model_v2.rds` | `UNAVAILABLE` | Only V1 model existed (`skyhour_delay_model.rds`). | Train, tune, evaluate ROC-AUC/calibration, and serialize Model V2. |
| **Timezone & Local Time Display**| `R/services/airport_service.R` | `PARTIALLY WORKING` | Airport local time did not account for offset (e.g. `America/New_York` vs `Asia/Kolkata`). | Add IANA timezone mapping for all airports and calculate local departure/arrival times. |
| **Pre-Flight Prediction Horizon**| `R/services/prediction_service.R` | `BROKEN` | Model inputs included actual future delay parameters. | Separate into `PRE-FLIGHT` (scheduled parameters) and `NEAR-DEPARTURE` modes. |
| **Weather METAR/TAF Service** | `R/services/aviation_weather_service.R` | `WORKING` | AviationWeather.gov API integration working, but needs graceful fallback error object. | Return structured JSON error on API timeout instead of failing response. |
| **Tamil Nadu Spotlight Module** | `R/india/` | `DUPLICATED` | Duplicate logic separated from core airport intelligence. | Integrate Tamil Nadu airports seamlessly into core airport/route/airline pages. |

---

## Action Plan for System Recovery

1. **Backend Service Refactoring**: Implement clean service modules in `R/services/` for OpenSky, Demo Flights, Dynamic Risk, Airport, Route, Airline, Search, and Prediction.
2. **OpenSky Token Integration**: Use OAuth2 client credentials flow with `credentials.json` / `.env` variables and automatic refresh.
3. **Synthetic Dataset Generation**: Build `data/processed/synthetic_flights.rds` with 10,000+ logically consistent flight records spanning months, real airports, and realistic delay distributions.
4. **Leak-Free Model V2**: Evaluate and save `models/skyhour_delay_model_v2.rds`.
5. **Frontend Interface Recovery**: Refactor React pages (`FlightIntelligence`, `AirportIntelligence`, `RouteIntelligence`, `AirlineIntelligence`, `AviationMap`, `Home`, `SearchResults`), adding Data Mode banners and interactive map capabilities.
6. **Automated End-to-End Verification**: Create and run `scratch/test_skyhour_final.ps1` to validate all REST endpoints, data structures, search queries, and map logic.
