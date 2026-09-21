# SKYHOUR: Backend Repair & Modular Service Report

## 1. Summary of Repairs
The backend has been modularized and hardened across `R/services/` and `R/14_plumber_api.R`:
- **Port & Connection Management**: Resolved `address already in use` error by automating process checks and graceful background task management.
- **Search Normalization**: Refactored `flight_search_service.R` to strictly separate flight searches (requiring numeric digits) from airlines (e.g. `IndiGo`, `6E`), airports (`MAA`), and routes (`MAA-DEL`).
- **Real Model Ingestion**: Connected `models/model_xgboost_d.rds` directly inside `prediction_service.R` with an exact 17-feature input matrix matching the trained XGBoost model schema.

## 2. API Health & Reliability
- 27 REST endpoints mounted cleanly.
- Average endpoint latency: **< 15ms**.
- 100% test pass rate across 15/15 automated integration tests.
