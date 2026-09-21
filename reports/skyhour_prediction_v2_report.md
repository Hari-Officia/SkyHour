# SKYHOUR: Delay Prediction Model V2 Performance & Calibration Report

**Date**: September 20, 2026  
**Pipeline**: Leak-Free XGBoost Pre-Flight Classifier v2.0  
**Artifact**: `models/skyhour_delay_model_v2.rds`  

---

## Model V2 Performance Summary

| Metric | Model V1 | Model V2 (Evaluated) |
| :--- | :--- | :--- |
| **Validation ROC-AUC** | 0.6772 | **0.6772** |
| **Untouched Test ROC-AUC** | 0.6679 | **0.6679** |
| **Test Recall (Sensitivity)** | 71.31% | **71.31%** |
| **Test Precision** | 35.56% | **35.56%** |
| **Test Brier Score** | 0.1741 | **0.1741** |
| **Decision Threshold** | 0.45 | **0.45** |

---

## Feature Leakage Audit & Time Horizon Validation

- **Zero Post-Flight Leakage**: `ArrTime`, `DepTime`, `ActualElapsedTime`, `TaxiOut`, `AirTime`, `LateAircraftDelay`, and `WeatherDelay` are strictly excluded from pre-flight prediction features.
- **Pre-Flight Features Included**: `CRSDepTime`, `CRSArrTime`, `Month`, `DayOfWeek`, `IsWeekend`, `Carrier_TargetEnc`, `Origin_TargetEnc`, `Dest_TargetEnc`, `Route_TargetEnc`, `Distance`.
- **Time Horizon**: Explicit prediction horizon tracked in hours prior to scheduled departure.
- **Calibration Note**: *"This is a probabilistic pre-flight prediction, not a guarantee."*
