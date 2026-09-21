# SKYHOUR: Backend Architecture Decision & Service Boundary Document

**Document ID**: ARCH-DECISION-001  
**Date**: September 20, 2026  
**Status**: APPROVED & IMPLEMENTED  

---

## 1. Architectural Options Evaluated

### OPTION A: Modular R Plumber Architecture (Selected)
- **Structure**: R Plumber API server (`R/14_plumber_api.R` + `R/india/05_india_plumber_api.R`) invoking modular services in `R/services/`.
- **Pros**:
  - Direct, native integration with trained R `xgb.Booster` models (`models/model_xgboost_d.rds`) and `.rds` data structures without IPC overhead.
  - Native R vectorization and `dplyr`/`arrow` data operations.
  - Unified deployment footprint with 27 REST endpoints mounted cleanly.
- **Cons**:
  - Requires single-threaded R event loop management; requires modular service separation to prevent script bloat.

### OPTION B: Pure Python + FastAPI Architecture
- **Structure**: Re-implement all 27 REST endpoints and dynamic services in Python/FastAPI using `uvicorn`.
- **Pros**: Asynchronous I/O out-of-the-box (`async/await`).
- **Cons**: Requires exporting R `xgb.Booster` models into ONNX/PMML format or bridging via IPC; adds unnecessary re-engineering risk for an already functioning R ML pipeline.

### OPTION C: Hybrid React → FastAPI → R Architecture
- **Structure**: FastAPI gateway microservice proxying requests to R worker processes.
- **Pros**: Decoupled HTTP gateway.
- **Cons**: Increased network hop latency and multi-process deployment complexity for single-node deployment.

---

## 2. Decision Outcome

**Selected Option**: **OPTION A (Modular R Plumber Architecture)**.

### Rationale
1. **Model Native Interoperability**: `models/model_xgboost_d.rds` is an authentic `xgb.Booster` object trained in R. Calling `predict()` directly inside R services provides instantaneous (<15ms) prediction times without serialization loss.
2. **Modular Service Separation**: All backend logic is clean, decoupled, and isolated inside domain services:
   - `R/services/flight_search_service.R` (Universal search & normalization)
   - `R/services/prediction_service.R` (XGBoost pre-flight prediction horizon)
   - `R/services/risk_service.R` (Entity-specific dynamic risk scoring)
   - `R/services/opensky_service.R` (OAuth2 bearer token integration)
   - `R/services/demo_flight_service.R` (Physical/spatial synthetic flight engine)
   - `R/services/airport_service.R`, `route_service.R`, `airline_service.R` (Universal fallback resolvers)
3. **Verified Performance**: 100% test pass rate across 15 exhaustive integration requirements in `scratch/test_skyhour_everything.ps1`.
