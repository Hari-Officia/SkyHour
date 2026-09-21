# Skyhour Repository Health & Cleanup Audit Report

**Generated**: 2026-09-14
**Scope**: Workspace file integrity, secret exposure check, unused file classification.

---

## 1. Classification Matrix

| File / Path | Category | Rationale / Note |
| :--- | :--- | :--- |
| `models/skyhour_delay_model.rds` | **DO NOT TOUCH** | Frozen USA ML Pipeline (v1.2.0) — Critical core artifact. |
| `models/model_metadata.json` | **DO NOT TOUCH** | USA Model metadata and optimal classification threshold (0.50). |
| `models/india/india_demand_model.rds` | **DO NOT TOUCH** | Frozen India Passenger Demand XGBoost Model. |
| `models/india/india_model_metadata.json` | **DO NOT TOUCH** | India Demand Model metadata & temporal split information. |
| `R/01_data_audit.R` through `R/15_feature_transformer.R` | **KEEP** | Standardized USA R pipeline and feature transformation layer. |
| `R/14_plumber_api.R` | **KEEP** | USA Plumber API Server module. |
| `R/india/01_` through `R/india/05_` | **KEEP** | India data ingestion, network centrality, risk engine, and API. |
| `R/india/20_india_intelligence_engine.R` | **KEEP** | Skyhour India V2 Analytical Intelligence Engine. |
| `scratch/run_unified_plumber.R` | **KEEP** | Production entrypoint mounting USA & India routers on port 8000. |
| `scratch/test_india_intelligence.ps1` | **KEEP** | Automated 27-endpoint API verification test runner. |
| `data/india/reference/` | **KEEP** | Official reference datasets (`airports_india.csv`, `airlines_india.csv`). |
| `data/india/master/` | **KEEP** | Cleansed master Parquet datasets (`india_airport_master.parquet`). |
| `reports/india_data_quality.md` | **KEEP** | Official data quality & source provenance report. |
| `reports/india_intelligence_methodology.md` | **KEEP** | V2 mathematical formulas & methodology documentation. |
| `reports/india_final_verification.md` | **KEEP** | API verification test logs & baseline audit results. |
| `frontend/src/` | **KEEP** | React application source code, components, services, and pages. |
| `scratch/*.log` / temporary scratch outputs | **OPTIONAL / SCRATCH** | Generated background task logs in artifact scratch folder. |

---

## 2. Secrets & Credential Exposure Audit

- **`frontend/src/` Audit**: Verified zero embedded API keys, secret tokens, or private credentials in JSX/TypeScript files.
- **`.env.example` Audit**: Verified placeholders only (`AVIATION_STACK_API_KEY=your_key_here`).
- **AviationStack Key**: Sys.getenv backend handling only (`Sys.getenv("AVIATION_STACK_API_KEY")`). No client-side exposure.

---

## 3. Verdict

The workspace is **100% CLEAN**, securely partitioned, and ready for production deployment. No core pipeline files require deletion.
