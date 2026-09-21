# Skyhour Data Quality & Anti-Mock Verification Report

**Date:** September 19, 2026  
**Status:** 100% Mock-Free & Empirical Data Verified  

---

## 1. Zero Mock Data Policy Audit

A workspace-wide scan was conducted to ensure zero fake coordinates, mock flight statuses, or fabricated statistics remain in active code paths:

1. **No Fake Aircraft Coordinates**: OpenSky position markers are rendered only when real state vectors are retrieved. Unavailable telemetry explicitly displays `"Aircraft position unavailable"`.
2. **No Fake "Live" Airline Status**: Flight status labels reflect scheduled, departed, landed, or telemetry state without inventing commercial status.
3. **No Manually Fabricated Factors**: Model factor contributions (carrier delay rate, origin congestion, route delay history, time of day) are calculated dynamically from XGBoost target encodings.

---

## 2. Dataset Lineage & Sources

| Metric / Card | Primary Source | File / Endpoint Path | Validation Status |
| :--- | :--- | :--- | :--- |
| **Airport Passenger Volume** | DGCA India / BTS | `india_airport_master.parquet` | VERIFIED |
| **Sector On-Time %** | DGCA Sector Reports | `routes_india.csv` | VERIFIED |
| **Live METAR Weather** | AviationWeather.gov | `/api/data/metar` | VERIFIED |
| **Live Aircraft Telemetry** | OpenSky Network | `/api/states/all` | VERIFIED |
| **Pre-Flight Delay Risk** | Frozen XGBoost Pipeline | `models/skyhour_delay_model.rds` | VERIFIED |
