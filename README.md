# SKYHOUR: Airline Flight Delay Analysis and Prediction System

> **Data Science & Machine Learning Pipeline in R**  
> Predicts pre-flight airline arrival delays of 15 minutes or more (`ArrDel15`) using historical BTS 2022 domestic flight data (`Combined_Flights_2022.parquet`).

---

## Executive Overview

**SKYHOUR** is a reliable machine learning system designed to estimate the probability that a scheduled domestic flight in the United States will experience an arrival delay of 15 minutes or more.

- **Primary Target**: `ArrDel15`
  - `0` = On-Time / Arrival delay < 15 minutes
  - `1` = Delayed / Arrival delay $\ge$ 15 minutes
- **Data Engineering Principle**: Zero post-flight data leakage, Arrow-based lazy dataset querying, and chronological temporal splitting.
- **Model Choice**: XGBoost Gradient Boosted Decision Trees (ROC-AUC: **0.6679** on untouched Test Set).

---

## Project Directory Architecture

```text
Skyhour/
│
├── data/
│   ├── raw/                      # Raw parquet location
│   ├── processed/                # Arrow cleaned, engineered & split datasets
│   └── external/                 # Airport coordinates and external mappings
│
├── R/
│   ├── 01_data_audit.R           # Memory-efficient parquet data audit
│   ├── 02_data_cleaning.R        # Cancelled/Diverted filter & leakage audit
│   ├── 03_eda.R                  # 10 publication-quality ggplot2 visualizations
│   ├── 04_feature_engineering.R  # Schedule, route, and date feature engineering
│   ├── 05_statistical_analysis.R # Chi-Square & Wilcoxon rank-sum statistical tests
│   ├── 06_train_test_split.R     # 70/15/15 chronological split & target encoding
│   ├── 07_logistic_regression.R  # Majority class baseline & Logistic Regression
│   ├── 08_random_forest.R        # Random Forest model (ranger)
│   ├── 09_xgboost.R              # XGBoost model with class weight scaling
│   ├── 10_model_evaluation.R     # Validation ROC-AUC, threshold optimization & curves
│   ├── 11_feature_importance.R   # Permutation & relative gain feature ranking
│   ├── 12_save_final_model.R     # Untouched Test set evaluation & pipeline serialization
│   └── 13_predict_api_interface.R# Production prediction interface function
│
├── models/
│   ├── skyhour_delay_model.rds   # Complete serialized prediction pipeline
│   ├── model_metadata.rds        # Versioning & model metadata
│   ├── preprocessor.rds          # Fitted frequency & target encodings
│   └── model_xgboost.model       # Native XGBoost binary model
│
├── reports/
│   ├── data_audit_report.md      # Detailed dataset profiling report
│   ├── data_cleaning_log.md      # Record filtering & leakage audit log
│   ├── statistical_analysis_report.md # Hypothesis test results & academic interpretations
│   └── model_evaluation_report.md# Comparative model benchmark & test set results
│
├── plots/                        # 13 high-resolution visualization PNGs
│   ├── 01_class_distribution.png
│   ├── 02_delay_by_airline.png
│   ├── 03_delay_by_month.png
│   ├── 04_delay_by_dayofweek.png
│   ├── 05_delay_by_dep_hour.png
│   ├── 06_top15_origin_airports.png
│   ├── 07_top15_dest_airports.png
│   ├── 08_top15_routes.png
│   ├── 09_distance_vs_delay.png
│   ├── 10_correlation_matrix.png
│   ├── 11_roc_curves.png
│   └── 13_feature_importance.png
│
└── README.md
```

---

## Dataset Summary & Audit Findings

| Metric | Value |
| :--- | :--- |
| **Total Raw Flights (2022)** | 4,078,318 |
| **Cleaned Operated Flights** | 3,944,916 |
| **Cancelled / Diverted (Filtered)** | 133,402 (3.27%) |
| **Date Range** | Jan 1, 2022 to Jul 31, 2022 |
| **On-Time Rate (`ArrDel15 = 0`)** | 78.35% |
| **Delay Rate (`ArrDel15 = 1`)** | 21.65% |

---

## Model Benchmark & Performance Results

### Validation Set Comparison (Threshold = 0.50)

| Model Architecture | Accuracy | Precision | Recall | Specificity | F1-Score | ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Majority Class Baseline** | 75.99% | 0.0000 | 0.0000 | 1.0000 | 0.0000 | 0.5000 |
| **Logistic Regression** | 76.05% | 0.5833 | 0.0078 | 0.9982 | 0.0153 | 0.6598 |
| **Random Forest (`ranger`)** | 76.33% | 0.5472 | 0.0801 | 0.9791 | 0.1398 | 0.6621 |
| **XGBoost Classifier** | 64.19% | 0.3556 | 0.6056 | 0.6533 | 0.4481 | **0.6772** |

### Final Untouched Test Set Performance (Optimal Threshold = 0.45)

- **Test ROC-AUC**: **0.6679**
- **Test Recall (Sensitivity)**: **71.31%** (Detects 7 out of 10 delayed flights)
- **Test F1-Score**: **0.4377**
- **Test Balanced Accuracy**: **0.6203**

---

## Reproducibility Guide

To run the complete end-to-end pipeline in R:

```bash
# Execute scripts sequentially in R:
Rscript R/01_data_audit.R
Rscript R/02_data_cleaning.R
Rscript R/03_eda.R
Rscript R/04_feature_engineering.R
Rscript R/05_statistical_analysis.R
Rscript R/06_train_test_split.R
Rscript R/07_logistic_regression.R
Rscript R/08_random_forest.R
Rscript R/09_xgboost.R
Rscript R/10_model_evaluation.R
Rscript R/11_feature_importance.R
Rscript R/12_save_final_model.R
Rscript R/13_predict_api_interface.R
```

---

## Using the Saved Model for Live Predictions

```R
source("R/13_predict_api_interface.R")

payload <- list(
  Airline = "AA",
  Origin = "JFK",
  Destination = "LAX",
  CRSDepTime = 1830,
  CRSArrTime = 2145,
  FlightDate = "2026-07-15",
  Distance = 2475
)

result <- predict_skyhour_delay(payload)
print(result)
```

**Response Format**:
```json
{
  "prediction": "DELAYED",
  "delay_probability": 0.5233,
  "delay_percentage": 52.33,
  "risk_level": "MODERATE RISK",
  "decision_threshold": 0.45,
  "flight_summary": {
    "airline": "AA",
    "origin": "JFK",
    "destination": "LAX",
    "flight_date": "2026-07-15",
    "scheduled_departure": "1830",
    "scheduled_arrival": "2145",
    "distance_miles": 2475
  }
}
```
