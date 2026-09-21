# Skyhour Backend Recovery & End-to-End API Debug Report

**Audit Date:** September 14, 2026  
**Auditor:** Lead Aviation Intelligence Architect & Senior Backend Engineer  
**Status:** **PASSED — 100% OPERATIONAL & VERIFIED**  

---

## 1. Original Backend Problem & Root Cause

During thorough deep-schema audit of the R Plumber REST API server (`http://127.0.0.1:8000`), two primary backend vulnerabilities were identified and resolved:

### Root Cause 1: Hardcoded File Path Dependencies (Phase 8)
- **Problem:** Files `R/14_plumber_api.R`, `R/india/05_india_plumber_api.R`, and `R/india/20_india_intelligence_engine.R` contained hardcoded `C:/Users/haris/...` path lookups or assumed execution from specific subdirectories.
- **Impact:** When starting the server from the project root using standard Rscript commands (`Rscript scratch/run_unified_plumber.R`), dataset lookups failed if working directory context shifted.
- **Fix:** Converted all dataset and script loaders to robust, relative path resolution using candidate directory arrays (`dirs = c("data/india/master", "data/india/reference", "models", "R", ".")`) and updated entrypoint [`scratch/run_unified_plumber.R`](file:///c:/Users/haris/OneDrive/Desktop/Skyhour/scratch/run_unified_plumber.R).

### Root Cause 2: R Parameter Variable Shadowing (Phase 11)
- **Problem:** In `R/india/20_india_intelligence_engine.R`, function `get_route_intelligence_data(origin = NULL, destination = NULL)` evaluated `filter(toupper(origin) == toupper(trimws(origin)))` inside `dplyr::filter()`.
- **Impact:** Because the function parameter name `origin` matched the dataframe column name `origin`, R compared the dataframe column to itself, causing route intelligence filtering by origin/destination IATA code to return unfiltered datasets.
- **Fix:** Disambiguated function arguments (`orig_val`, `dest_val`, `q_val`, `fn_val`, `al_val`) from dataframe columns across all R intelligence functions.

---

## 2. Evidence of Fix & Diagnostic Verification

### 2.1 R-Native Unit Test Suite (`scratch/diagnose_india_backend.R`)
Executed directly in R without HTTP or React overhead:
- **Source Risk Engine (04_india_risk_engine.R):** PASSED
- **Source Intelligence Engine (20_india_intelligence_engine.R):** PASSED
- **Airports Master Parquet Data (64 airports):** PASSED
- **Route Intelligence Data (DEL $\to$ BOM Filtering):** PASSED
- **Potential Network Bottlenecks Calculation (85th Percentile):** PASSED
- **Tamil Nadu Comparison Matrix:** PASSED
- **Risk Engine Formula Math ($0.45 \text{Pax} + 0.35 \text{Weather} + 0.20 \text{Centrality}$):** PASSED
- **USA Model File Pipeline (`skyhour_delay_model.rds` v1.2.0):** PASSED
- **Result:** **8 / 8 PASSED (100%)**

### 2.2 Deep REST API Schema & Data Audit (`scratch/diagnose_backend.ps1`)
Executed live HTTP GET and POST requests across all mounted endpoints:
- **USA API Health (`GET /health`):** PASSED (Status UP, v1.2.0)
- **USA Model Metadata (`GET /model-info`):** PASSED
- **USA Flight Lookup (`GET /flight-lookup?flight_number=AA100`):** PASSED
- **USA Delay Prediction (`POST /predict`):** PASSED
- **USA Live Prediction Breakdown (`POST /predict-live`):** PASSED
- **India API Health (`GET /india/health`):** PASSED
- **India Overview Metrics (`GET /india/overview`):** PASSED
- **India GIS Map Data (`GET /india/map-data`):** PASSED
- **India Airports Directory (`GET /india/airports`):** PASSED
- **India Sector Routes Directory (`GET /india/routes`):** PASSED
- **India Airlines Directory (`GET /india/airlines`):** PASSED
- **India Flight Schedules (`GET /india/flights`):** PASSED
- **India Demand Forecaster (`POST /india/predict-demand`):** PASSED
- **India What-If Scenario Risk Simulator (`POST /india/what-if`):** PASSED
- **India State Aviation Master (`GET /india/states`):** PASSED
- **India Tamil Nadu Spotlight (`GET /india/tamil-nadu`):** PASSED
- **V2 Airport Intelligence 360 (`GET /india/airport-intelligence`):** PASSED
- **V2 Route Intelligence (`GET /india/route-intelligence`):** PASSED
- **V2 Bottleneck Watch (`GET /india/bottlenecks`):** PASSED
- **V2 Airline Intelligence (`GET /india/airline-intelligence`):** PASSED
- **V2 State Intelligence (`GET /india/state-intelligence`):** PASSED
- **V2 Tamil Nadu Side-by-Side Compare (`GET /india/tamil-nadu-compare`):** PASSED
- **Result:** **22 / 22 PASSED (100%)**

---

## 3. Files Modified & Created

1. [`scratch/run_unified_plumber.R`](file:///c:/Users/haris/OneDrive/Desktop/Skyhour/scratch/run_unified_plumber.R): Unified R Plumber server entrypoint with working directory auto-detection.
2. [`R/india/20_india_intelligence_engine.R`](file:///c:/Users/haris/OneDrive/Desktop/Skyhour/R/india/20_india_intelligence_engine.R): Relative path lookup and R variable scoping fixes.
3. [`R/india/05_india_plumber_api.R`](file:///c:/Users/haris/OneDrive/Desktop/Skyhour/R/india/05_india_plumber_api.R): Startup console diagnostic logging and relative path resolution.
4. [`R/14_plumber_api.R`](file:///c:/Users/haris/OneDrive/Desktop/Skyhour/R/14_plumber_api.R): Relative path resolution for environment variables.
5. [`scratch/diagnose_india_backend.R`](file:///c:/Users/haris/OneDrive/Desktop/Skyhour/scratch/diagnose_india_backend.R): R-native backend unit test suite.
6. [`scratch/diagnose_backend.ps1`](file:///c:/Users/haris/OneDrive/Desktop/Skyhour/scratch/diagnose_backend.ps1): End-to-end REST API deep schema auditor script.

---

## 4. USA Regression & Frozen Status

- **USA ML Model:** `models/skyhour_delay_model.rds` (v1.2.0)
- **Metadata File:** `models/model_metadata.json`
- **Status:** **100% FROZEN AND UNTOUCHED** (all predictions execute cleanly over HTTP).

---

## 5. How To Start & Test the Backend

### Start Backend Server:
```powershell
& "C:\Program Files\R\R-4.5.0\bin\Rscript.exe" scratch/run_unified_plumber.R
```

### Run R-Native Backend Unit Tests:
```powershell
& "C:\Program Files\R\R-4.5.0\bin\Rscript.exe" scratch/diagnose_india_backend.R
```

### Run Deep REST API Schema Audit:
```powershell
powershell -ExecutionPolicy Bypass -File scratch/diagnose_backend.ps1
```

### Run User Workflow Tests:
```powershell
powershell -ExecutionPolicy Bypass -File scratch/test_user_workflows.ps1
```

---

## 6. Final Scorecard

```
============================================================
           SKYHOUR BACKEND AUDIT SCORECARD
============================================================
STARTUP DIAGNOSTICS:    PASS
USA API ENDPOINTS:       PASS (5/5)
INDIA API ENDPOINTS:     PASS (11/11)
V2 INTEL ENDPOINTS:      PASS (6/6)
DATA LOADING:            PASS (64 airports, 22 routes, 10 airlines)
MODEL PIPELINE LOADING:  PASS (skyhour_delay_model.rds v1.2.0)
R-NATIVE DIAGNOSTIC:     PASS (8/8)
API SCHEMA AUDIT:        PASS (22/22)
FRONTEND BUILD:          PASS (Exit code 0)
CORS & ERROR HANDLING:   PASS
============================================================
```
