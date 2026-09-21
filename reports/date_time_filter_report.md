# SKYHOUR — Date & Time Window Filtering Technical Report

**Backend Normalization**: `backend/app/services/search_normalization.py`  
**API Endpoints**: `GET /flights/search`, `GET /map/flights`  

---

## 1. Time Window Definitions & Backend Implementation

Time windows are mapped to exact scheduled departure hour intervals in DuckDB:

| Time Window | Label | Hour Range | SQL Filter |
| :--- | :--- | :--- | :--- |
| `MORNING` | Morning | 06:00 – 11:59 | `departure_hour BETWEEN 6 AND 11` |
| `AFTERNOON` | Afternoon | 12:00 – 16:59 | `departure_hour BETWEEN 12 AND 16` |
| `EVENING` | Evening | 17:00 – 20:59 | `departure_hour BETWEEN 17 AND 20` |
| `NIGHT` | Night | 21:00 – 23:59 | `departure_hour BETWEEN 21 AND 23` |
| `MIDNIGHT` | Midnight / Early Morning | 00:00 – 05:59 | `departure_hour BETWEEN 0 AND 5` |
| `ANY` | Any Time | 00:00 – 23:59 | `departure_hour BETWEEN 0 AND 23` |

---

## 2. Date Support & Provenance Classification

The backend evaluates target date relative to current UTC/local time:
- **PAST Dates**: Queries historical BTS flight dataset. Data Mode: `HISTORICAL BTS`.
- **TODAY**: Combines live OpenSky telemetry state vectors + scheduled flights. Data Mode: `LIVE` / `SCHEDULED+MODELLED`.
- **FUTURE Dates**: Synthesizes master airline schedules with XGBoost ML predictions and historical route/airport statistics. Data Mode: `FUTURE SCHEDULED+MODELLED`.
