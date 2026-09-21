# SKYHOUR: API Contract & Schema Specification

## 1. Response Standards

### Success Schema (HTTP 200)
```json
{
  "status": "SUCCESS",
  "query": "MAA",
  "data_mode": "REAL",
  "data": { ... },
  "timestamp": "2026-09-20T16:38:00Z"
}
```

### Error Schema (HTTP 400 / 404 / 500)
```json
{
  "status": "ERROR",
  "error_code": "ENTITY_NOT_FOUND",
  "message": "Airport code invalid",
  "timestamp": "2026-09-20T16:38:00Z"
}
```

## 2. Core Endpoint Index
- `GET /health` -> System health and version info.
- `GET /search?q={query}` -> Universal normalized search results.
- `GET /flight/{id}` -> Detailed flight intelligence & pre-flight prediction.
- `GET /airport/{code}` -> Airport traffic, METAR weather, and dynamic risk score.
- `GET /route/{origin}/{destination}` -> Pairwise route delay dynamics and trends.
- `GET /airline/{code}` -> Airline fleet and network metrics.
- `GET /map/data` -> GIS aircraft flight vectors, airport markers, and route polylines.
- `GET /prediction/flight/{id}?departure_hour={h}` -> XGBoost time-aware prediction.
