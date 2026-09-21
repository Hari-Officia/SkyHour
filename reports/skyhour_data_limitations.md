# SKYHOUR: Data Limitations & External API Provenance Document

## 1. Overview & Data Architecture
Skyhour operates a dual-source data architecture:
1. **Real-time Live Mode**: OpenSky Network API (with OAuth2 bearer authentication) for live ADS-B state vectors and NOAA AVWX / Aviation Weather API for METAR weather data.
2. **Deterministic Demo Mode Engine**: Activated automatically when external API limits are exceeded or external credentials are missing. Generates physically and temporally consistent synthetic flights (`data/processed/synthetic_flights.rds`).

---

## 2. Real-Time Data Limitations & Provenance Rules

### A. OpenSky Network API
- **Authentication**: Requires OAuth2 Client Credentials grant (`https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token`).
- **Rate Limits**: Anonymous calls are limited to 10 requests/minute. Authenticated credentials increase quota.
- **Coverage**: High density over Europe and North America; variable density over South Asia/India depending on ground receiver network.
- **Fallback**: When OpenSky fails or returns 429/503, Skyhour seamlessly transitions to Demo Mode while indicating data provenance on the frontend badge `[ DEMO MODE ]`.

### B. NOAA / AVWX Aviation Weather (METAR)
- **Coverage**: ICAO airport stations (e.g., `VOMM` for Chennai MAA, `VIDP` for Delhi DEL).
- **Fallback**: When METAR is unavailable for an arbitrary ICAO code, synthetic weather conditions (Temperature, Wind, Visibility, Altimeter) are generated based on airport latitude and season.

---

## 3. Transparency & Integrity Standards
- Skyhour **NEVER** presents synthetic/demo data as live ADS-B data.
- UI components clearly render the data source provenance pill (`REAL DATA` in green, `DEMO MODE` in amber).
- API endpoints return `"data_mode": "REAL"` or `"data_mode": "DEMO"` in JSON metadata.
