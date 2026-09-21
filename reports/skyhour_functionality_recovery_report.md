# SKYHOUR: Functionality Recovery Report

**Date**: September 20, 2026  
**Status**: COMPLETED & VERIFIED  

---

## Executive Summary

The **SKYHOUR** system functionality recovery has successfully resolved all hardcoded query parameters, identical risk score fallbacks, OpenSky authentication failures, search parsing issues, and map interaction bugs. The system now delivers a fully functional, time-aware, multi-source flight intelligence platform backed by real APIs (OpenSky, AviationWeather.gov, BTS TranStats, DGCA India) and a 10,000+ realistic synthetic aviation dataset for fallback in **DEMO MODE**.

---

## Summary of Core Changes & Bug Resolutions

1. **Resolution of Hardcoded API Parameters**:
   - Previously: `/flight/<flight_id>` hardcoded origin `"MAA"`, destination `"DEL"`, and carrier `"AI"`.
   - Resolution: Implemented `R/services/flight_service.R` which dynamically extracts exact flight schedules, route origins/destinations, aircraft types, and carriers from dataset & OpenSky telemetry.

2. **Resolution of Constant Risk Scores**:
   - Previously: Airports and routes received uniform fallback scores of `68/100` during null checks.
   - Resolution: Built `R/services/risk_service.R` calculating entity-specific composite risk scores (0-100) using traffic pressure, delay rates, cancellation rates, weather severity, and network centrality.

3. **OpenSky OAuth2 Client Credentials Flow**:
   - Implemented OAuth2 Bearer token authentication at `https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token` with automatic token caching and 60-second pre-expiry refresh.

4. **Universal Search Normalization**:
   - `universal_search()` parses flight numbers (`AI302`, `ai-302`), airport codes (`MAA`, `VIDP`, `Chennai`), routes (`MAA DEL`), and airlines (`IndiGo`, `6E`).

5. **Aviation Map Enhancements**:
   - Integrated Leaflet map search, airport circles scaled by traffic volume and color-coded by dynamic risk score, route polylines, clickable aircraft markers, and an automatic **DEMO MODE** status banner.
