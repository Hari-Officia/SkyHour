# SKYHOUR PROJECT — REPORT SCREENSHOT MAPPING

This document maps all 40 verified screenshots captured from the **SKYHOUR** system to their respective academic project report chapters and figure designations.

---

## Chapter 10 — Exploratory Data Analysis & Baseline Statistics

| Figure No. | Chapter Section | Screenshot Filename | Feature / Description | Data Mode |
|---|---|---|---|---|
| **Figure 10.1** | Section 10.2: Target Class Balance | `17_target_class_distribution.png` | Binary delay target distribution (80.7% On-Time vs 19.3% Delayed) | HISTORICAL |
| **Figure 10.2** | Section 10.3: Carrier Reliability | `11_delay_rate_visualization.png` | Historical delay rate percentage (>15 mins) by commercial airline | HISTORICAL |
| **Figure 10.3** | Section 10.4: Seasonality Analysis | `12_monthly_delay_trend.png` | 12-Month delay trend highlighting winter fog & monsoon spikes | HISTORICAL |
| **Figure 10.4** | Section 10.5: Temporal Variation | `13_day_of_week_delay_visualization.png` | Day-of-week operational delay distribution showing Friday/Sunday peaks | HISTORICAL |
| **Figure 10.5** | Section 10.6: Hub Congestion | `14_top_delayed_airports.png` | Top 15 origin airports ranked by historical delay frequency | HISTORICAL |
| **Figure 10.6** | Section 10.7: Corridor Pressure | `15_top_delayed_routes.png` | Top 15 high-density flight corridors experiencing frequent delays | HISTORICAL |
| **Figure 10.7** | Section 10.8: Aggregate Analytics | `10_historical_analytics_dashboard.png` | Multi-year historical aviation baseline analytics overview | HISTORICAL |

---

## Chapter 11 — Statistical Analysis & Operational Risk Profiling

| Figure No. | Chapter Section | Screenshot Filename | Feature / Description | Data Mode |
|---|---|---|---|---|
| **Figure 11.1** | Section 11.1: Operator Benchmarking | `16_carrier_comparison.png` | Multi-carrier side-by-side delay probability & punctuality comparison | REAL DATA |
| **Figure 11.2** | Section 11.2: Hourly Risk Curves | `29_time_of_day_risk_view.png` | 24-Hour time-of-day departure window risk escalation curve | MODELLED |
| **Figure 11.3** | Section 11.3: Bottleneck Analysis | `32_india_bottleneck_analysis.png` | Airport runway hold time & ground bottleneck identification (DEL) | REAL DATA |
| **Figure 11.4** | Section 11.4: Regional Network Analysis | `36_tamil_nadu_comparison_analysis.png` | Tamil Nadu airport network throughput & punctuality comparative analysis | REAL DATA |

---

## Chapter 12 — System Architecture, Platform & User Interface

| Figure No. | Chapter Section | Screenshot Filename | Feature / Description | Data Mode |
|---|---|---|---|---|
| **Figure 12.1** | Section 12.1: Platform Overview | `01_skyhour_home_dashboard.png` | SKYHOUR primary home dashboard & universal aviation search interface | LIVE |
| **Figure 12.2** | Section 12.2: Flight Workspace | `02_flight_search_page.png` | Date-wise flight finder query interface with structured parameters | REAL DATA |
| **Figure 12.3** | Section 12.3: Results Grid | `03_flight_search_results.png` | Real-time flight search results grid with ML risk indicators | REAL DATA |
| **Figure 12.4** | Section 12.4: Flight Profile | `04_flight_details_page.png` | Single-flight deep dive showing schedule, distance, and aircraft | REAL DATA |
| **Figure 12.5** | Section 12.5: Airport Hubs | `07_airport_intelligence_page.png` | Operational intelligence dashboard for Chennai International Airport (MAA) | REAL DATA |
| **Figure 12.6** | Section 12.6: Route Corridors | `08_route_intelligence_page.png` | Trunk corridor performance analysis for Chennai to Delhi (MAA-DEL) | REAL DATA |
| **Figure 12.7** | Section 12.7: Airline Fleet Profile | `09_airline_intelligence_page.png` | Operator fleet utilization and punctuality hub (IndiGo - 6E) | REAL DATA |
| **Figure 12.8** | Section 12.8: Aviation GIS Map | `23_interactive_aviation_map.png` | Interactive OpenLayers/Leaflet GIS canvas with airport nodes | LIVE |
| **Figure 12.9** | Section 12.9: Flight Tracking | `24_map_with_flight_data.png` | Real-time active flight position markers and animated route arcs | LIVE |
| **Figure 12.10** | Section 12.10: Weather Engine | `25_weather_metar_information.png` | Decoded METAR weather parameters & operational impact severity score | LIVE |
| **Figure 12.11** | Section 12.11: Temporal Filters | `26_flight_finder_date_time_filtering.png` | Flight finder with travel date and departure time slot filtering | REAL DATA |
| **Figure 12.12** | Section 12.12: Flight Comparison | `27_flight_comparison_screen.png` | Side-by-side flight comparison modal overlay for options selection | REAL DATA |
| **Figure 12.13** | Section 12.13: Risk Calendar | `28_calendar_date_wise_risk_view.png` | 7-Day color-coded travel risk calendar for date optimization | MODELLED |
| **Figure 12.14** | Section 12.14: India Intelligence | `30_india_aviation_intelligence_dashboard.png` | Indian domestic aviation operational overview dashboard | REAL DATA |
| **Figure 12.15** | Section 12.15: Indian Hub Profile | `31_india_airport_intelligence.png` | Indian airport hub operational stats & runway status (MAA) | REAL DATA |
| **Figure 12.16** | Section 12.16: Indian Metro Routes | `33_india_route_intelligence.png` | Indian domestic trunk route intelligence (MAA-DEL) | REAL DATA |
| **Figure 12.17** | Section 12.17: Indian Carriers | `34_india_airline_intelligence.png` | Domestic market leadership & operational analytics (IndiGo) | REAL DATA |
| **Figure 12.18** | Section 12.18: State Infrastructure | `35_india_state_intelligence.png` | State-level aviation infrastructure intelligence (Tamil Nadu) | REAL DATA |
| **Figure 12.19** | Section 12.19: Airspace GIS Map | `37_india_aviation_map.png` | Regional Indian airspace GIS map with flight corridors and nodes | LIVE |
| **Figure 12.20** | Section 12.20: REST API Service | `38_api_backend_health_status.png` | Production FastAPI Swagger UI / OpenAPI specification interface | LIVE |

---

## Chapter 13 — Machine Learning Delay Prediction Results & Evaluation

| Figure No. | Chapter Section | Screenshot Filename | Feature / Description | Data Mode |
|---|---|---|---|---|
| **Figure 13.1** | Section 13.1: Prediction Engine | `05_flight_prediction_result.png` | XGBoost real-time delay risk prediction result card | MODELLED |
| **Figure 13.2** | Section 13.2: Probability & Risk | `06_prediction_probability_risk_display.png` | Delay risk percentage, confidence level, and contributing factors | MODELLED |
| **Figure 13.3** | Section 13.3: Threshold Calibration | `18_model_evaluation_result.png` | Decision threshold tradeoff curve (Precision vs Recall vs F1) | MODELLED |
| **Figure 13.4** | Section 13.4: ROC Discrimination | `19_roc_curve.png` | Receiver Operating Characteristic (ROC) curve comparison (AUC = 0.842) | MODELLED |
| **Figure 13.5** | Section 13.5: Precision-Recall | `20_precision_recall_curve.png` | Precision-Recall (PR) curve under imbalanced target distribution | MODELLED |
| **Figure 13.6** | Section 13.6: Confusion Matrix | `21_confusion_matrix.png` | XGBoost model confusion matrix (N = 591,738 test set flights) | MODELLED |
| **Figure 13.7** | Section 13.7: Model Interpretability | `22_feature_importance.png` | XGBoost feature importance ranking and SHAP contribution factors | MODELLED |

---

## Chapter 17 — Verification, Testing & Production Build Evidence

| Figure No. | Chapter Section | Screenshot Filename | Feature / Description | Data Mode |
|---|---|---|---|---|
| **Figure 17.1** | Section 17.1: Automated Unit Tests | `39_final_test_evidence.png` | Pytest backend test suite execution (17 passed in 15.16s, 100% pass rate) | LIVE |
| **Figure 17.2** | Section 17.2: Production Build | `40_frontend_build_test_evidence.png` | Frontend TypeScript & Vite bundle compilation (0 errors in 1.97s) | LIVE |

---
