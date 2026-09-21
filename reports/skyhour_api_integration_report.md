# Skyhour External API Integration Report

**Date:** September 19, 2026  
**Status:** All 6 Primary APIs Connected & Hardened  

---

## 1. Connected API Stack

| API Source | Auth Method | Endpoints Used | Cache TTL | Fallback Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **OpenSky Network** | OAuth2 Client Credentials (`credentials.json`) | `/api/states/all` | 60 seconds | Falls back to "Aircraft position unavailable" badge. Never fabricates telemetry coordinates. |
| **AviationWeather.gov** | Public OpenAPI v4.0 Spec | `/api/data/metar`, `/api/data/taf` | 600 seconds (METAR), 1800s (TAF) | Falls back to IMD Synoptic or Open-Meteo airport weather. |
| **Open-Meteo** | Free REST API (Lat/Lon) | `/v1/forecast` | 900 seconds | Falls back to static regional climate baseline. |
| **IMD (India Meteorological Dept)** | Station Code / Synoptic | Aviation Synoptic Network | 600 seconds | Falls back to Open-Meteo airport weather. |
| **BTS TranStats (U.S.)** | Master Parquet Storage | `Combined_Flights_2022.parquet` | Static Memory Cache | Serves historical U.S. delay ground truth & target encodings. |
| **DGCA / AAI (India)** | Parquet & CSV Master Storage | `india_airport_master.parquet`, `routes_india.csv` | Static Memory Cache | Serves Indian aviation traffic, passenger, and route network metrics. |

---

## 2. OpenSky OAuth2 Authentication Details

- **Token Endpoint**: `https://auth.opensky-network.org/auth/realms/b2c/protocol/openid-connect/token`
- **Client ID**: Configured via `OPENSKY_CLIENT_ID` / `credentials.json`
- **Security Rule**: Tokens are managed purely on the R backend server (`R/services/opensky_service.R`). The frontend NEVER receives client secrets.

---

## 3. Error Handling Verification

- **API Failure**: Displays `"Flight data temporarily unavailable."`
- **No Telemetry**: Displays `"Aircraft position unavailable from OpenSky Network"`.
- **Not Found**: Returns HTTP 404 with structured JSON error payload.
