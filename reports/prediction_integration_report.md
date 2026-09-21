# SKYHOUR — XGBoost Model Prediction Pipeline Integration Report

**ML Loader**: `backend/app/ml/model_loader.py`  
**Feature Engineering**: `backend/app/ml/feature_engineering.py`  
**Model Weight File**: `models/model_xgboost_d.json`  

---

## 1. Feature Engineering & Prediction Parity

The XGBoost model ingests 17 pre-flight operational features:
- `ScheduledDepartureHour`, `ScheduledDepartureMinute`
- `ScheduledArrivalHour`, `ScheduledArrivalMinute`
- `Month`, `DayOfWeek` (Sunday = 1 to Saturday = 7 convention matching R `lubridate::wday()`)
- `IsWeekend`
- `Carrier_Freq`, `Carrier_TargetEnc`
- `Origin_Freq`, `Dest_Freq`
- `Distance`
- `Origin_TargetEnc`, `Dest_TargetEnc`
- `Route_Freq`, `Route_TargetEnc`
- `TimeOfDay_TargetEnc`

---

## 2. Prediction Horizon & Zero Data Leakage Enforcement

Every prediction generated declares:
- **Prediction Mode**: `PRE-FLIGHT`
- **Prediction Horizon**: Time remaining prior to scheduled departure.
- **Strict Control**: No post-flight actual arrival or actual delay features are passed into the model at inference time.
