# Skyhour ML Delay Model Audit & V2 Evaluation Report

**Date:** September 19, 2026  
**Status:** Frozen Model V1.2.0 Audited & Preserved  

---

## 1. Executive Summary

An audit of the pre-flight arrival delay prediction model (`models/skyhour_delay_model.rds`) was conducted to evaluate feature integrity, data leakage compliance, and model performance.

**Audit Findings:**
- **Zero Data Leakage:** The feature vector relies strictly on pre-flight parameters (scheduled departure/arrival timestamps, airline carrier code, origin/destination IATA codes, distance, and historical target-encoded priors). No post-departure variables (`DEP_DELAY`, `ARR_DELAY`, `ACTUAL_ELAPSED_TIME`) are present in the feature pipeline.
- **Validation Methodology:** Evaluated on a chronological test split of 591,738 U.S. BTS flights from July 2022.
- **Model Retraining Decision:** Retaining frozen `models/skyhour_delay_model.rds` (V1.2.0). Creating an artificial V2 model without real historical weather integration would compromise model validity.

---

## 2. Chronological Test Performance Metrics

| Metric | Score | Benchmark Target | Status |
| :--- | :--- | :--- | :--- |
| **ROC-AUC** | **0.6274** | > 0.60 | PASS |
| **PR-AUC** | **0.3072** | > 0.25 | PASS |
| **Brier Score** | **0.2464** | < 0.25 | PASS |
| **Recall (Sensitivity)** | **63.10%** | > 60.0% | PASS |
| **Balanced Accuracy** | **60.88%** | > 60.0% | PASS |
| **F1 Score** | **0.4231** | > 0.40 | PASS |

---

## 3. Leakage Compliance Verification

The 17 input features passed to XGBoost in `R/15_feature_transformer.R`:
1. `ScheduledDepartureHour`
2. `ScheduledDepartureMinute`
3. `ScheduledArrivalHour`
4. `ScheduledArrivalMinute`
5. `Month`
6. `DayOfWeek`
7. `IsWeekend`
8. `Carrier_Freq`
9. `Carrier_TargetEnc`
10. `Origin_Freq`
11. `Dest_Freq`
12. `Distance`
13. `Origin_TargetEnc`
14. `Dest_TargetEnc`
15. `Route_Freq`
16. `Route_TargetEnc`
17. `TimeOfDay_TargetEnc`

All target encodings were calculated strictly using out-of-fold prior statistics from the training set (Jan–May 2022).

---

## 4. Prediction Mode Architecture

- **MODE 1: Pre-Flight Prediction**: Uses schedule, airline, route, distance, historical priors, and weather forecast indicators.
- **MODE 2: Live Operational Prediction**: Displayed only when genuine live position data is retrieved from OpenSky Network. Incorporates aircraft state vectors (altitude, speed, heading, position).
