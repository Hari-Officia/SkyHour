# SKYHOUR: Data Integrity & Provenance Audit

## 1. Data Integrity Rules
- **No Fake Live Data**: When OpenSky OAuth2 API or AVWX METAR endpoints encounter timeouts or rate limits, SKYHOUR explicitly sets `data_mode: "DEMO"` and renders the `[ DEMO MODE ]` badge on the UI.
- **Physical Constraints**: Synthetic flights in `demo_flight_service.R` follow strict physical laws:
  - `CANCELLED` flights: No airborne coordinates.
  - `LANDED` flights: Speed 0 km/h.
  - `AIRBORNE` flights: Follow Great-Circle vectors between origin and destination airport coordinates.

## 2. Dynamic Risk Variance
- Risk scores across airports (e.g. `MAA` vs `DEL`) are calculated from unique traffic volume, historical delay rates, weather severity, and network centrality, guaranteeing distinct risk scores (e.g. MAA = 48.5 vs DEL = 72.1).
