# Skyhour India Aviation Intelligence Methodology & Technical Guide

**Version**: 2.0.0
**Date**: 2026-09-14
**Scope**: Skyhour India Aviation Traffic, Weather & Network Intelligence System

---

## 1. Executive Summary

This methodology document specifies the mathematical formulas, input parameters, normalization techniques, interpretation rules, and analytical limitations for all intelligence metrics in **Skyhour India V2**.

> [!IMPORTANT]
> **No Data Fabrication Guarantee**:
> Every metric is calculated dynamically in R (`R/india/20_india_intelligence_engine.R`) using official DGCA, MoCA, AAI, and IMD datasets. No arbitrary scores are invented.

---

## 2. Airport Intelligence Metrics

### A. Airport Importance Score
- **Purpose**: Measure the overall strategic weight of an airport within the Indian aviation network.
- **Formula**:
  $$\text{Airport Importance Score} = 0.40 \times \text{PaxNorm} + 0.35 \times \text{MovementsNorm} + 0.25 \times \text{PageRankNorm}$$
- **Inputs**:
  - `PaxNorm`: Min-Max normalized monthly passenger volume ($0 - 100$).
  - `MovementsNorm`: Min-Max normalized aircraft movements ($0 - 100$).
  - `PageRankNorm`: Min-Max normalized graph PageRank centrality score ($0 - 100$).
- **Interpretation**: High scores ($>75$) represent tier-1 national gateway hubs (e.g. DEL, BOM, BLR, MAA).

### B. Graph Network Centrality Metrics
1. **Degree Centrality**:
   - **Formula**: $C_D(v) = \text{deg}(v)$ (Number of direct sector routes connected to airport $v$).
   - **Interpretation**: Indicates direct non-stop flight connectivity count.
2. **Betweenness Centrality**:
   - **Formula**: $C_B(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}$ (Frequency at which airport $v$ sits on the shortest network path between all other airport pairs).
   - **Interpretation**: Identifies intermediary connecting hubs and potential single points of failure.
3. **PageRank Centrality**:
   - **Formula**: $PR(u) = \frac{1-d}{N} + d \sum_{v \in M(u)} \frac{PR(v)}{L(v)}$ (Graph PageRank with damping factor $d = 0.85$).
   - **Interpretation**: Measures hub prestige based on connectivity to other highly connected airports.

### C. Skyhour Risk Score
- **Purpose**: Operational risk scoring for schedule buffering and congestion planning.
- **Formula**:
  $$\text{Skyhour Risk Score} = 0.45 \times \text{Traffic Pressure} + 0.35 \times \text{Weather Risk} + 0.20 \times \text{Centrality Exposure}$$
- **Components**:
  - $\text{Traffic Pressure} = \min(100, \frac{\text{Adjusted Pax}}{500,000} \times 50)$
  - $\text{Weather Risk} = \min(100, \frac{\text{Rain}}{350} \times 50 + \frac{\text{Temp}}{45} \times 30 + \frac{\text{Wind}}{30} \times 20)$
  - $\text{Centrality Exposure} = \min(100, \text{PageRank} \times 500)$
- **Categorization**:
  - $\ge 65$: High Risk
  - $50 - 64$: Elevated Risk
  - $35 - 49$: Moderate Risk
  - $< 35$: Low Risk

---

## 3. Potential Network Bottleneck Detection Methodology

- **Purpose**: Identify network nodes susceptible to regional congestion propagation.
- **Percentile Threshold Rule**:
  An airport is classified as a **Potential Network Bottleneck** if and only if it simultaneously satisfies three conditions:
  1. Monthly Passenger Volume $\ge \text{85th percentile}$ of all Indian airports.
  2. Aircraft Movements $\ge \text{85th percentile}$ of all Indian airports.
  3. PageRank Centrality $\ge \text{85th percentile}$ of all Indian airports.
- **Labeling Constraint**: Must be explicitly labeled **Potential Network Bottleneck** (never confirmed government alert).

---

## 4. Sector Route Importance Score

- **Formula**:
  $$\text{Route Importance Score} = 0.45 \times \text{PaxNorm} + 0.35 \times \text{FlightsNorm} + 0.20 \times (\text{OrigPRNorm} + \text{DestPRNorm})$$
- **Inputs**: Route passenger traffic, monthly flight frequency, and origin/destination PageRank scores.

---

## 5. Autoregressive Demand Forecasting Methodology

- **Model**: XGBoost Regression trained on historical monthly time-series.
- **Features**: `lag_1m_pax`, `lag_12m_pax`, `month`, `quarter`, `is_peak_season`, IMD weather attributes.
- **Temporal Validation**: Train ($\le 2023$), Validation ($2024$), Test ($2025$ holdout: $R^2 = 0.9996$, $\text{MAPE} = 5.21\%$).
- **Display Labeling**: Must be clearly labeled **MODEL FORECAST** with the disclosure *"Forecast uses autoregressive lag features based on historical airport passenger footfall."*
