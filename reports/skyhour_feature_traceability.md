# SKYHOUR: Feature Traceability Matrix

**Date**: September 20, 2026  

---

| User Requirement | Component / File Path | Implementation Details | Status |
| :--- | :--- | :--- | :--- |
| **1. Complete System Audit** | `reports/skyhour_functionality_recovery_audit.md` | Full feature audit categorizing components into WORKING, BROKEN, MOCKED, etc. | VERIFIED |
| **2. OpenSky OAuth2 Flow** | `R/services/opensky_service.R` | OAuth2 Bearer token auth via `opensky-network` realm with auto-refresh. | VERIFIED |
| **3. Real vs Demo Mode** | `frontend/src/App.tsx`, `api.ts` | Global Data Mode badge `[ REAL DATA ] / [ DEMO DATA ]` and explicit data provenance headers. | VERIFIED |
| **4. 10,000+ Synthetic Dataset**| `R/services/demo_flight_service.R` | 10,000 realistic flight records in `data/processed/synthetic_flights.rds`. | VERIFIED |
| **5. Time & Timezones** | `R/services/airport_service.R` | IANA timezone support (`Asia/Kolkata`, `America/New_York`) with local time strings. | VERIFIED |
| **6. 6-Bucket Time Distribution**| `R/services/airport_service.R` | 6 departure time buckets (06:00-09:00, 09:00-12:00, etc.) for traffic & delay rates. | VERIFIED |
| **7. Time-Aware Prediction** | `R/services/prediction_service.R` | Prediction horizon, hours to departure, prediction timestamp, pre-flight mode. | VERIFIED |
| **8. Pre-Flight vs Operational**| `R/services/prediction_service.R` | Pre-Flight mode using schedule/route features without future delay leakage. | VERIFIED |
| **9. Model V2 Evaluation** | `models/skyhour_delay_model_v2.rds` | Evaluated and serialized Model V2 without overwriting V1. | VERIFIED |
| **10. Entity-Specific Risk Variance**| `R/services/risk_service.R` | Dynamic non-constant risk score (0-100) calculated from entity traffic, delay, and weather. | VERIFIED |
| **11. Risk Factor Breakdown** | `R/services/risk_service.R` | Top contributing factors returned with impact level and point contributions. | VERIFIED |
| **12. Airport Intelligence** | `frontend/src/pages/AirportIntelligence.tsx` | Traffic distribution, METAR weather, airlines served, top routes, dynamic risk score. | VERIFIED |
| **13. Route Intelligence** | `frontend/src/pages/RouteIntelligence.tsx` | Distance, flight volume, delay stats, 6 time buckets, airline performance table. | VERIFIED |
| **14. Airline Intelligence** | `frontend/src/pages/AirlineIntelligence.tsx` | Factual delay & reliability metrics, operating hubs, top routes, dynamic risk score. | VERIFIED |
| **15. Universal Search** | `R/services/flight_search_service.R` | Normalized parsing for flight numbers, airports, routes, and airlines. | VERIFIED |
| **16. Map Search & Zoom** | `frontend/src/pages/AviationMap.tsx` | Search input flies map to selected entity and opens popup/panel. | VERIFIED |
| **17. Map Interactions** | `frontend/src/pages/AviationMap.tsx` | Traffic-scaled airport circles, route polylines, clickable aircraft markers. | VERIFIED |
| **18. OpenSky State Vector Handling**| `R/services/opensky_service.R` | Live state vectors returned when available; "Position unavailable" fallback. | VERIFIED |
| **19. Real-time Failure Demo Mode**| `R/14_plumber_api.R` | Automatic switch to DEMO MODE with visible banner when OpenSky fails. | VERIFIED |
| **20. Weather METAR Service** | `R/services/aviation_weather_service.R` | AviationWeather.gov REST METAR observations with fallback handling. | VERIFIED |
| **21. Frontend Routes** | `frontend/src/App.tsx` | Clean routes: `/`, `/search`, `/flight/:id`, `/airport/:code`, `/route/:origin/:destination`, `/airline/:code`, `/map`. | VERIFIED |
