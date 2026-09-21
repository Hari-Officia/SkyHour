# Skyhour Final System Architecture Specification

**Version**: 2.0.0 (Production Final)
**Authors**: Lead Data Scientist, Data Engineer, GIS Engineer & Software Architect
**Repository**: `Skyhour` (Unified USA & India Aviation Platform)

---

## 1. Problem Statement & Mission

Modern aviation platforms must balance global delay prediction with region-specific network topology. **Skyhour** provides a dual-module intelligence system:

1. **USA Flight Delay Risk Module**: Pre-flight arrival delay probability prediction based on BTS flight records.
2. **Skyhour India Intelligence System**: Spatial GIS mapping, graph network centrality, risk scoring, autoregressive demand forecasting, and scenario simulation based on official DGCA/AAI/IMD government data.

---

## 2. Platform Architecture & Data Flow

```
                                  SKYHOUR PLATFORM
                                         │
                                 R PLUMBER SERVER
                                  (Port 8000 REST)
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
       🇺🇸 USA MODULE                                         🇮🇳 SKYHOUR INDIA
  (bts_delay_model.rds v1.2.0)                          (india_airport_master.parquet)
              │                                                     │
   ┌──────────┴──────────┐                               ┌──────────┴──────────┐
   │                     │                               │                     │
Predict API         Live Board                      Spatial GIS Hub      Network Graph
 (/predict)       (/flight-lookup)                     (/india/map)       (/india/network)
                                                         │                     │
                                                   Risk Engine           Demand Forecast
                                                   (/india/what-if)   (/india/predict-demand)
```

---

## 3. USA Module (Frozen Pipeline v1.2.0)

- **Model File**: `models/skyhour_delay_model.rds` (v1.2.0)
- **Target**: Arrival delay $\ge 15$ minutes (Binary Classification).
- **Algorithm**: Tuned XGBoost Classifier ($0.50$ optimal threshold).
- **Zero Post-Flight Leakage**: Uses only pre-flight parameters (Scheduled Departure Hour, Month, Day of Week, Route ID, Distance, Time of Day).

---

## 4. Skyhour India Module Architecture

- **Airports Master**: 64 Indian airports (`airports_india.csv` & `india_airport_master.parquet`).
- **Airlines Master**: 10 active domestic carriers (`airlines_india.csv`).
- **Traffic Archive**: 3,840 monthly records (2021-2025).
- **Sector Routes**: 22 trunk and UDAN RCS corridors (`routes_india.csv`).

### A. Graph Network Centrality (`02_india_network_centrality.R`)
- **Degree Centrality**: $C_D(v) = \text{deg}(v)$
- **Betweenness Centrality**: $C_B(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}$
- **PageRank Centrality**: $PR(u) = \frac{1-d}{N} + d \sum_{v \in M(u)} \frac{PR(v)}{L(v)}$ ($d = 0.85$)

### B. Skyhour Risk Engine (`04_india_risk_engine.R`)
$$\text{Skyhour Risk Score} = 0.45 \times \text{Traffic Pressure} + 0.35 \times \text{Weather Severity} + 0.20 \times \text{Network Centrality Exposure}$$

### C. Demand Forecasting Model (`03_india_demand_forecasting.R`)
- **Algorithm**: XGBoost Regression ($R^2 = 0.9996$, $\text{MAPE} = 5.21\%$).
- **Features**: Autoregressive lags (`lag_1m_pax`, `lag_12m_pax`), peak season indicator, and IMD weather parameters.

---

## 5. Technology Stack & Deployment

- **Backend**: R v4.5.0 (`plumber`, `arrow`, `xgboost`, `dplyr`, `jsonlite`, `lubridate`).
- **Frontend**: React 18, TypeScript, Vite v8.3.0, TailwindCSS, Leaflet GIS (`react-leaflet`), Framer Motion.
- **REST Endpoints**: 27 verified endpoints hosted under a single Plumber router process on port 8000.
