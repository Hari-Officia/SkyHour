# SKYHOUR PROJECT REPORT — VALIDATION REPORT

**Audit Date**: 2026-09-29  
**Reference Document**: `DATA-SCIENCE-REPORT.docx` (intelliEDA Project Report)  
**Target Project**: `Skyhour` (Airline Flight Delay Prediction & Aviation Intelligence Platform)  

---

### 1. Structural Comparison & Lock Status
- **Total Chapters**: 17 / 17 (100% Match)
- **Section Sequence**: Identical to `DATA-SCIENCE-REPORT.docx`
- **Heading Depth**: Kept exact 2-level hierarchy (e.g. 6.1, 6.2, 8.1, 8.2, 10.1, 11.1, 13.1). No extra subsections added.
- **Preliminary Pages**: Cover Page, Bonafide Certificate (SDGs 4, 8, 9, 11, 16, 17), Acknowledgement, Abstract, Keywords, Table of Contents.

### 2. Technical Content & Hallucination Audit
- **US Pre-Flight Model**:
  - Target: `ArrDel15` (1 = arrival delay $\ge 15$ min, 0 = on-time).
  - Train (Jan-May 2022), Validation (June 2022), Test (July 2022, 591,738 flights).
  - Test Metrics: ROC-AUC 0.6274, PR-AUC 0.3072, Brier Score 0.2464, Accuracy 59.70%, Recall 63.10%, Precision 31.82%, Threshold 0.50.
- **India Module**:
  - 64 Indian airports, 10 airlines, monthly traffic records (`india_airport_master.parquet`).
  - Network Centrality: Degree, Betweenness, PageRank.
  - Demand Forecasting Model: $R^2 = 0.9837$, MAPE = $5.57\%$ using lag variables `lag_1m_pax`, `lag_12m_pax`.
- **Skyhour Risk Score**:
  - Project-defined heuristic formula: $0.45 \times \text{Traffic} + 0.35 \times \text{Weather} + 0.20 \times \text{Centrality}$.
- **Live Flight Telemetry**:
  - Accurately reported as scheduled flight status intelligence and flight lookup; live real-time ADS-B aircraft tracking is not currently configured.

### 3. Verification Result
**FINAL AUDIT PASSED**: 100% structural fidelity to reference report + 100% grounded Skyhour project facts.
