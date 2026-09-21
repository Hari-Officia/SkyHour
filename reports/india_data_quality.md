# SKYHOUR INDIA — Data Quality & Provenance Audit Report

Generated: 2026-09-14 12:53:11 UTC

## 1. Executive Summary

This report documents the structural integrity, data completeness, schema validation, and source provenance for the **SKYHOUR INDIA** platform.

> [!IMPORTANT]
> **Data Policy Compliance**:
> All Indian aviation datasets are processed at their official reporting granularity. Monthly DGCA/MoCA traffic statistics are preserved as aggregate time-series observations and are NOT misrepresented as individual flight-level data.

---

## 2. Ingested Reference & Processed Datasets

| Dataset | File Path | Record Count | Column Count | Missing Value % | Key Identifiers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Airports Master Reference** | `data/india/reference/airports_india.csv` | 64 | 12 | 0.00% | `airport_iata`, `airport_icao` |
| **Airlines Master Reference** | `data/india/reference/airlines_india.csv` | 10 | 10 | 0.00% | `airline_code`, `iata_code` |
| **Monthly Traffic Dataset** | `data/india/processed/traffic/india_traffic_monthly.csv` | 3840 | 17 | 0.00% | `date`, `airport_iata` |
| **Master Parquet Dataset** | `data/india/master/india_aviation.parquet` | 3840 | 17 | 0.00% | `date`, `airport_iata` |
| **Routes Sector Dataset** | `data/india/processed/routes/routes_india.csv` | 22 | 9 | 0.00% | `route_id`, `origin`, `destination` |

---

## 3. Official Source Provenance

1. **Directorate General of Civil Aviation (DGCA)**:
   - **URL**: `https://www.dgca.gov.in/`
   - **Dataset**: Air Transport Monthly Statistics & Sector-level Load Factors
   - **Metrics Extracted**: Passengers carried, flights operated, seat load factors, aircraft movements.

2. **Ministry of Civil Aviation (MoCA)**:
   - **URL**: `https://www.civilaviation.gov.in/`
   - **Dataset**: Domestic Traffic Summaries & Airport Footfall Reports
   - **Metrics Extracted**: Monthly departing/arriving passengers and airport footfall.

3. **Airports Authority of India (AAI)**:
   - **URL**: `https://www.aai.aero/`
   - **Dataset**: Aeronautical Information Publication (AIP) & Airport Master
   - **Metrics Extracted**: Airport coordinates (lat/lon), elevation, runway count, operator attribution.

4. **India Meteorological Department (IMD)**:
   - **URL**: `https://imdpune.gov.in/` & `https://dsp.imdpune.gov.in/`
   - **Dataset**: High-resolution gridded temperature & monsoonal rainfall archive
   - **Mapping Method**: Lat/Lon nearest grid cell mapping to airport coordinates.

5. **OGD India / AirSewa & UDAN RCS Catalog**:
   - **URL**: `https://www.data.gov.in/catalog/airsewa`
   - **Dataset**: Regional Connectivity Scheme (RCS) route connectivity.

