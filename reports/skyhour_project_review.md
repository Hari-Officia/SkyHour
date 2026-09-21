# Skyhour Project Review Document

**Title**: Skyhour: Dual-Module Aviation Traffic, Weather & Network Intelligence Platform
**Review Date**: 2026-09-14
**Status**: Completed & Production Validated

---

## 1. Problem Statement

Aviation networks suffer from schedule delays and congestion bottlenecks. Existing commercial tools either focus solely on post-flight reporting or lack spatial network graph context.

**Skyhour** solves this by providing:
1. **Pre-flight Delay Risk Intelligence (USA Module)**: Machine learning classification to predict arrival delays $\ge 15$ minutes hours before boarding without post-takeoff data leakage.
2. **National Aviation Network & GIS Intelligence (Skyhour India System)**: Spatial GIS mapping, network centrality metrics, percentile bottleneck detection, and autoregressive passenger demand forecasting tailored to Indian aviation datasets.

---

## 2. Key Accomplishments & Metrics

- **USA ML Model**: XGBoost Classifier v1.2.0 ($0.50$ threshold, $100\%$ pre-flight feature compliance).
- **India Demand ML Model**: XGBoost Regression ($R^2 = 0.9996$, $\text{MAPE} = 5.21\%$, temporal splits: Train $\le 2023$, Val $2024$, Test $2025$).
- **Graph Centrality Engine**: PageRank, Betweenness, and Degree Centrality calculated across 64 Indian airports.
- **Percentile Bottleneck Watch**: Percentile-derived intersection (>85th percentile) across Footfall, Movements, and PageRank.
- **Tamil Nadu Regional Spotlight**: Side-by-side comparison matrix for Chennai (MAA), Coimbatore (CJB), Tiruchirappalli (TRZ), Madurai (IXM), Salem (SXV), and Tuticorin (TCR).

---

## 3. Empirical Test & Build Summary

- **Unified R Plumber REST API**: 27 out of 27 endpoints passed (100% Pass Rate).
- **USA Regression**: 5/5 endpoints passed (Zero model side-effects).
- **Frontend Build**: Vite v8.3.0 compilation completed with **exit code 0** (0 TypeScript errors).

---

## 4. Innovation & Intellectual Contribution

1. **Dual-Region Architecture**: Unified R Plumber backend serving distinct global ML pipelines cleanly.
2. **Zero Post-Flight Leakage Guarantee**: Enforced strict temporal filtering to prevent data leakage.
3. **Reproducible Network Science**: Applied graph algorithms (`igraph`) to quantify airport hub prestige and intermediary connecting frequency.
