# SKYHOUR — Route Intelligence & Corridor Performance Report

**API Endpoint**: `GET /route/intelligence`  
**Frontend Route**: `/route/:origin/:destination`  

---

## 1. Overview

Corridor analysis provides factual operational statistics for any city pair (e.g. `MAA → DEL`, `BOM → BLR`):
- **Distance & Duration**: Flight distance in miles/km and standard direct flight duration.
- **Corridor Performance Summary**: Logged flight operations, average delay minutes, proportion of delayed flights (≥15m), and cancellation percentage.
- **Hourly Delay Distribution**: Hourly delay rate breakdown across 6 departure slots.
- **Carrier Route Leaderboard**: Operator table ranking airlines by flight volume, delay rate, and average delay minutes.

---

## 2. Interactive Features Added
- Interactive risk factor breakdown popovers (`Distance & Airway Congestion`, `Origin Hub Congestion`, `Destination Arrival Holds`).
- Interactive metric summary cards with operational definitions.
- Departure hour slot popups providing travel guidance for peak congestion windows.
