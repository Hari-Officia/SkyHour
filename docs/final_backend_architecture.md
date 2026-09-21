# SKYHOUR: Final Production FastAPI Backend Architecture

## 1. Executive Summary
**SKYHOUR** has migrated its primary API backend from R Plumber to a production-grade **Python FastAPI** backend (`backend/app/`). 

### Dual-Role Technology Division
- **Python FastAPI Backend (`backend/app/`)**: Serves production REST endpoints on `http://127.0.0.1:8100`, handling asynchronous HTTP requests, Pydantic schemas, OpenSky OAuth2 integration, METAR weather parsing, DuckDB data repositories, XGBoost model inference, and frontend integration.
- **R Data Science Environment (`R/`)**: Preserved as the primary platform for **data science research, statistical analysis, feature engineering exploration, and XGBoost model training** (`R/01_data_audit.R` through `R/12_save_final_model.R`).

---

## 2. Directory & Component Architecture

```
backend/
├── app/
│   ├── main.py                     # FastAPI Entrypoint & CORS Middleware
│   ├── config/                     # Settings (pydantic-settings) & Logging
│   │   ├── settings.py
│   │   └── logging.py
│   ├── api/routes/                 # APIRouter Endpoint Modules
│   │   ├── health.py
│   │   ├── search.py
│   │   ├── flights.py
│   │   ├── airports.py
│   │   ├── routes.py
│   │   ├── airlines.py
│   │   ├── predictions.py
│   │   ├── map.py
│   │   └── india.py
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
│   ├── services/                   # Business Logic Domain Services
│   │   ├── search_service.py
│   │   ├── flight_service.py
│   │   ├── airport_service.py
│   │   ├── route_service.py
│   │   ├── airline_service.py
│   │   ├── risk_service.py
│   │   ├── map_service.py
│   │   └── india_service.py
│   ├── providers/                  # External API Adapters
│   │   ├── opensky_provider.py     # OAuth2 Client Credentials Bearer Auth
│   │   ├── weather_provider.py     # AviationWeather.gov METAR Parser
│   │   └── demo_provider.py        # 10,000+ Flight Synthetic Simulator
│   ├── ml/                         # XGBoost ML Pipeline
│   │   ├── model_loader.py         # Native python xgboost.Booster loader
│   │   ├── feature_engineering.py  # 17-feature input matrix builder
│   │   └── prediction_pipeline.py # Pre-flight delay probability calculator
│   ├── repositories/
│   │   └── duckdb_store.py         # In-memory DuckDB analytical engine
│   └── utils/
├── tests/
│   └── test_api.py                 # Pytest test suite (10/10 passed)
├── scripts/
│   ├── run_fastapi.py              # Server launcher
│   └── compare_r_python_predictions.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## 3. Machine Learning & Model Inference
- **Exported Booster**: R model `models/model_xgboost_d.rds` is exported to `models/model_xgboost_d.json` and loaded natively into Python using `xgboost.Booster()`.
- **17-Feature Matrix**: Input vectors exactly match the trained schema (`ScheduledDepartureHour`, `ScheduledDepartureMinute`, `ScheduledArrivalHour`, `ScheduledArrivalMinute`, `Month`, `DayOfWeek`, `IsWeekend`, `Carrier_Freq`, `Carrier_TargetEnc`, `Origin_Freq`, `Dest_Freq`, `Distance`, `Origin_TargetEnc`, `Dest_TargetEnc`, `Route_Freq`, `Route_TargetEnc`, `TimeOfDay_TargetEnc`).
- **Prediction Equivalence**: Output delay probabilities vary dynamically by departure hour (34.2% @ 06:00 vs 51.9% @ 18:00) with measured prediction equivalence.

---

## 4. Verification & Status
- **Pytest Suite**: `pytest backend/tests/test_api.py` -> 10/10 passed (100%).
- **PowerAPI Integration Test Suite**: `scratch/test_fastapi_workflows.ps1` -> 13/13 passed (100%).
- **Frontend Production Build**: `npm run build` -> Compiled in 907ms with **0 errors**.
