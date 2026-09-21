# SKYHOUR: Real-Time Data & API Integration Report

**Date**: September 20, 2026  
**Status**: ACTIVE & SECURE  

---

## Data Sources & Provenance Architecture

| Provider | Data Type | Auth Mechanism | Endpoints Used | Cache TTL | Fallback Policy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OpenSky Network** | Aircraft State Vectors | OAuth2 Client Credentials | `/api/states/all` | 15 seconds | Demo Mode Banner + Synthetic Dataset |
| **AviationWeather.gov** | METAR Weather Observations | Public REST (Server-Side) | `/api/data/metar` | 300 seconds | Observed METAR fallback |
| **BTS TranStats** | Historical Flight Delays | Preprocessed Local Arrow | `Combined_Flights_2022.parquet` | Local Static | Synthetic Dataset |
| **DGCA India / AAI** | India Airport & Sector Master | Preprocessed Local RDS | `india_airport_master.csv` | Local Static | In-Memory Master Cache |

---

## OpenSky OAuth2 Security & Compliance

- Client ID & Secret are stored strictly in `credentials.json` or `.env` (`OPENSKY_CLIENT_ID`, `OPENSKY_CLIENT_SECRET`).
- Credentials are **never** exposed to Vite/React (`VITE_*`).
- All requests use server-side OAuth2 Bearer tokens with automatic refresh.
- Acknowledges OpenSky Network scope: state vectors and tracks are fetched, while commercial airline flight schedules are derived from BTS/Synthetic datasets.
