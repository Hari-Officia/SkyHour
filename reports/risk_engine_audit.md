# SKYHOUR — Dynamic Delay Risk Score Engine Audit Report

**Location**: `backend/app/services/risk_service.py` & `backend/app/services/flight_search_service.py`  
**Model**: 17-feature XGBoost ML Model (`models/model_xgboost_d.json`)  

---

## 1. Forensic Audit & Root Cause Analysis

Previously, risk calculations produced static or identical scores across different flights due to global fallback aggregations.

### Identified Root Causes & Fixes:
1. **Missing Group-By Context**: Risk calculations previously evaluated whole-dataset means without filtering on `origin`, `destination`, or `departure_hour`.
   - **Fix**: Implemented context-aware DuckDB SQL queries joining carrier historical delay rates, route delay rates, airport congestion indices, and departure hour factors.
2. **Transparent Decomposition**:
   - Scores are categorized into transparent thresholds:
     - **LOW RISK**: `< 20.0%` probability
     - **MEDIUM RISK**: `20.0% – 40.0%` probability
     - **HIGH RISK**: `> 40.0%` probability
   - Each flight result breaks down contributing factors:
     - `airline_delay_rate`
     - `route_delay_rate`
     - `origin_airport_delay`
     - `destination_airport_delay`
     - `time_window_effect`
     - `weather_impact`
     - `ml_prediction_probability`
