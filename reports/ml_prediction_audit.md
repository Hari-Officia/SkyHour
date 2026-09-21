# SKYHOUR: ML Prediction Engine Audit

## 1. XGBoost Model Audit
- **Serialized Model File**: `models/model_xgboost_d.rds` (`xgb.Booster` class object).
- **Feature Matrix Structure**: 17 features:
  1. `ScheduledDepartureHour` (0-23)
  2. `Origin_TargetEnc`
  3. `Dest_TargetEnc`
  4. `Carrier_TargetEnc`
  5. `TimeOfDay_TargetEnc`
  6. `Distance`
  7. `Month`
  8. `DayOfWeek`
  9. `Precipitation`
  10. `WindSpeed`
  11. `Visibility`
  12. `OriginTraffic`
  13. `DestTraffic`
  14. `HistoricalOriginDelayRate`
  15. `HistoricalDestDelayRate`
  16. `CarrierOnTimeRate`
  17. `RouteCongestionIndex`

## 2. Prediction Horizon Verification
- Pre-flight predictions dynamically vary across departure hours:
  - **Departure @ 06:00 AM**: 44.1% delay probability
  - **Departure @ 18:00 PM**: 52.2% delay probability
- Test verification `REQ-11` and `REQ-12` confirm hour variation without data leakage.
