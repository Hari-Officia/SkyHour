# SKYHOUR: Synthetic Aviation Dataset & Demo Simulation Report

**Date**: September 20, 2026  
**Artifact**: `data/processed/synthetic_flights.rds`  
**Dataset Size**: 10,000 Flight Records  

---

## Logical & Physical Constraints Audit

1. **Physical Constraints**:
   - `CANCELLED` flights: `latitude = NA`, `longitude = NA`, `altitude = 0`, `ground_speed = 0`.
   - `LANDED` flights: `altitude = 0`, `ground_speed = 0` at destination airport coordinates.
   - `AIRBORNE` flights: Great-Circle linear interpolation between origin and destination coordinates.
2. **Correlation Rules**:
   - Peak departure hours (16:00-20:00) produce higher delay probabilities.
   - Severe weather conditions (`THUNDERSTORM`, `FOG`) increase delay probability by up to 25%.
3. **Data Mode Provenance**:
   - Every synthetic record contains `is_demo = TRUE` and `data_mode = "DEMO DATA"`.
   - UI displays clear **DEMO MODE** status banner when synthetic data is active.
