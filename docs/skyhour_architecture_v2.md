# SKYHOUR v2 System Architecture & Design Documentation

**Version**: 2.0.0  
**Platform**: Airline Flight Intelligence & Delay Prediction System  

---

## High-Level Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        SKYHOUR REACT FRONTEND                          │
│   (Vite + React 19 + TypeScript + Leaflet GIS + Tailwind CSS v4)      │
│   [ Data Mode Provenance Badge: REAL DATA / DEMO DATA ]               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST Requests
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   UNIFIED R PLUMBER REST API SERVER                    │
│                        (Port 8000 / CORS Filter)                       │
├───────────────┬───────────────┬────────────────┬───────────────────────┤
│ Universal     │ Flight        │ Airport &      │ Map Data GIS          │
│ Search        │ Intelligence  │ Route Analytics│ Engine                │
│ (/search)     │ (/flight/<id>)│ (/airport,     │ (/map/data)           │
│               │               │  /route)       │                       │
└───────┬───────┴───────┬───────┴────────┬───────┴───────────┬───────────┘
        │               │                │                   │
        ▼               ▼                ▼                   ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐  ┌───────────────────┐
│ OpenSky      │ │ Dynamic     │ │ Aviation     │  │ Synthetic Flight  │
│ Network      │ │ XGBoost V2  │ │ Weather METAR│  │ Dataset Generator │
│ (OAuth2)     │ │ Delay Model │ │ Service      │  │ (10,000 Records)  │
└──────────────┘ └─────────────┘ └──────────────┘  └───────────────────┘
```

---

## Component Specifications

1. **REST API Server (`R/14_plumber_api.R`)**:
   - Built on R Plumber, serving endpoints over port 8000.
   - Modularized service logic in `R/services/`.

2. **OpenSky OAuth2 Service (`R/services/opensky_service.R`)**:
   - Obtains OAuth2 Bearer tokens from OpenSky Keycloak realm (`opensky-network`).
   - Maintains token cache and refreshes token prior to 60-second expiration.

3. **Dynamic Risk Score Engine (`R/services/risk_service.R`)**:
   - Calculates entity-specific composite risk scores based on traffic pressure, delay rates, cancellation rates, weather severity, and network centrality.

4. **Synthetic Aviation Dataset (`R/services/demo_flight_service.R`)**:
   - Provides 10,000 synthetic flight records with Great-Circle spatial interpolation and temporal delay distributions.

5. **XGBoost Model V2 (`models/skyhour_delay_model_v2.rds`)**:
   - Pre-flight delay classification pipeline using leak-free features.
