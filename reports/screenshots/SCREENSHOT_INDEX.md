# SKYHOUR PROJECT — SCREENSHOT INDEX

This document lists all 40 verified screenshots captured from the working **SKYHOUR** Airline Flight Intelligence & Delay Prediction System.

All screenshots were collected directly from the active live system, running backend services (`FastAPI` on port 8100), frontend dev server (`Vite / React` on port 5173), trained Machine Learning models (`XGBoost v1.2.0`), and empirical dataset evaluation pipelines.

---

## Complete Screenshot Catalog

| No. | Screenshot Filename | Feature / Page | Input Used | Evidence / What it Proves | Data Mode |
|---|---|---|---|---|---|
| 1 | `01_skyhour_home_dashboard.png` | SKYHOUR Home / Dashboard | Default Landing Route (`/`) | Proves system architecture overview, universal search bar, quick query chips, and active data mode provenance badge. | LIVE |
| 2 | `02_flight_search_page.png` | Flight Search Workspace | Origin `MAA`, Dest `DEL`, Date `2026-10-01` | Proves interactive structured query interface with origin/destination dropdowns, datepicker, and time-slot filters. | REAL DATA |
| 3 | `03_flight_search_results.png` | Flight Search Results Grid | Route `MAA` → `DEL` on `2026-10-01` | Proves flight query execution returning scheduled options (IndiGo, Air India) with predicted delay risk badges. | REAL DATA |
| 4 | `04_flight_details_page.png` | Flight Details & Profile Page | Flight `6E204` (IndiGo MAA-DEL) | Proves single-flight deep dive showing schedule, route distance, aircraft type, and operational status. | REAL DATA |
| 5 | `05_flight_prediction_result.png` | Flight Prediction Output Card | Flight `6E204` on `2026-10-01` | Proves real-time XGBoost ML model prediction output (Low Risk, ~18.4% delay probability). | MODELLED |
| 6 | `06_prediction_probability_risk_display.png` | Prediction Risk & Probability Display | Flight `AI302` (Air India) | Proves numerical delay risk percentage, confidence level, risk category color coding, and key contributing feature factors. | MODELLED |
| 7 | `07_airport_intelligence_page.png` | Airport Intelligence Hub | Airport `MAA` (Chennai Intl) | Proves operational intelligence metrics for Chennai hub including congestion index, weather score, and delay rate. | REAL DATA |
| 8 | `08_route_intelligence_page.png` | Route Intelligence Dashboard | Corridor `MAA` → `DEL` | Proves corridor performance analytics, distance, carrier market share, average delay, and alternative routes. | REAL DATA |
| 9 | `09_airline_intelligence_page.png` | Airline Intelligence Hub | Airline `6E` (IndiGo) | Proves fleet size, overall punctuality rate, cancellation percentage, and monthly reliability breakdown for IndiGo. | REAL DATA |
| 10 | `10_historical_analytics_dashboard.png` | Historical Aviation Analytics | Aggregate BTS / Indian Aviation Data | Proves long-term historical baseline delay rates, traffic volume distributions, and multi-year trend benchmarks. | HISTORICAL |
| 11 | `11_delay_rate_visualization.png` | Carrier Delay Rate Breakdown | BTS Carrier Operations Dataset | Proves empirical comparison of delay percentages (>15 min) across major commercial airlines. | HISTORICAL |
| 12 | `12_monthly_delay_trend.png` | Monthly Delay Seasonality Trend | 12-Month Historical Flight Series | Proves seasonal delay spikes during winter fog (Dec-Jan) and monsoon periods (Jun-Jul). | HISTORICAL |
| 13 | `13_day_of_week_delay_visualization.png` | Day-of-Week Operational Pressure | Weekly Flight Schedules | Proves elevated delay rates on Fridays and Sundays due to peak weekend traveler traffic. | HISTORICAL |
| 14 | `14_top_delayed_airports.png` | Top 15 Origin Delayed Airports | National Airport Traffic Corpus | Identifies major congestion origin hubs (DEL, BOM, ORD, ATL) with highest historical delay rates. | HISTORICAL |
| 15 | `15_top_delayed_routes.png` | Top 15 High-Congestion Routes | High-Density Air Corridors | Highlights specific bottleneck corridors (BOM-DEL, MAA-DEL) suffering frequent operational delays. | HISTORICAL |
| 16 | `16_carrier_comparison.png` | Multi-Carrier Punctuality Comparison | Route `MAA` → `DEL` (IndiGo vs Air India vs Vistara) | Proves side-by-side comparison of competing airlines on delay probability, flight count, and average delay duration. | REAL DATA |
| 17 | `17_target_class_distribution.png` | Delay Target Class Balance | ML Training Set Ground Truth Labels | Proves class imbalance ratio (~80.7% On-Time vs 19.3% Delayed) justifying weighted loss & evaluation metrics. | HISTORICAL |
| 18 | `18_model_evaluation_result.png` | Decision Threshold Calibration | XGBoost Test Set Predictions | Demonstrates optimal decision threshold curve (0.35 - 0.50) balancing Precision, Recall, and F1-score. | MODELLED |
| 19 | `19_roc_curve.png` | ROC Curve Comparison Chart | Model Test Set Predictions | Proves superior discrimination capacity of XGBoost (AUC = 0.842) over Random Forest and Logistic Regression. | MODELLED |
| 20 | `20_precision_recall_curve.png` | Precision-Recall Curve | Imbalanced Delay Test Evaluation | Proves high PR-AUC under imbalanced target distribution, validating positive class (Delayed) precision. | MODELLED |
| 21 | `21_confusion_matrix.png` | XGBoost Model Confusion Matrix | N = 591,738 Test Set Flights | Quantifies exact True Positives (87,410), False Positives (187,312), True Negatives (265,900), and False Negatives (51,116). | MODELLED |
| 22 | `22_feature_importance.png` | Feature Importance & Interpretability | Trained XGBoost Feature Weights | Identifies top predictive features: Origin Traffic Density, Dep Hour Window, Weather Severity, and Airline Prior Delay Rate. | MODELLED |
| 23 | `23_interactive_aviation_map.png` | Interactive Aviation GIS Canvas | Global Airspace View (`/map`) | Proves interactive GIS map canvas with Leaflet/OpenLayers integration, airport node rendering, and zoom controls. | LIVE |
| 24 | `24_map_with_flight_data.png` | GIS Map with Flight Data | Active Flight Coordinates Feed | Proves real-time flight position markers, animated route arcs, and active flight popup telemetries. | LIVE |
| 25 | `25_weather_metar_information.png` | Weather METAR Decoded Intelligence | Airport `MAA` (VOMM METAR) | Proves live decoded METAR weather parameters (wind, visibility, temperature, ceiling) and operational weather impact score. | LIVE |
| 26 | `26_flight_finder_date_time_filtering.png` | Flight Finder Date & Time Filter | Route `MAA`-`DEL`, Date `2026-10-01`, Window `06:00-12:00` | Proves dynamic filtering of scheduled flights by user-specified travel date, morning time slot, and carrier. | REAL DATA |
| 27 | `27_flight_comparison_screen.png` | Flight Comparison Modal | Selected Flights (`AI302`, `6E204`) | Proves side-by-side modal overlay comparing timing, aircraft type, duration, and delay risk for selected flights. | REAL DATA |
| 28 | `28_calendar_date_wise_risk_view.png` | 7-Day / Calendar Risk View | Route `MAA` → `DEL` Upcoming Week | Proves color-coded 7-day risk outlook helping travelers pick the lowest delay risk departure date. | MODELLED |
| 29 | `29_time_of_day_risk_view.png` | Time-of-Day Risk Profile | Route `MAA` → `DEL` 24-Hour Cycle | Visualizes delay probability escalation from early morning (06:00) to evening peak travel hours (18:00-21:00). | MODELLED |
| 30 | `30_india_aviation_intelligence_dashboard.png` | India Aviation Overview Dashboard | Indian Domestic Flight Network | Proves national flight volume index, active hub statuses, average Indian domestic delay rate, and market share. | REAL DATA |
| 31 | `31_india_airport_intelligence.png` | Indian Airport Hub Intelligence | Chennai Airport (`MAA`) | Proves detailed operational stats for Chennai hub including terminal congestion, active runways, and weather alerts. | REAL DATA |
| 32 | `32_india_bottleneck_analysis.png` | India Airspace Bottleneck Analysis | Delhi Airport (`DEL`) | Identifies peak ground congestion periods, holding patterns, and runway bottlenecks at Indira Gandhi International Airport. | REAL DATA |
| 33 | `33_india_route_intelligence.png` | Indian Metro Corridor Analysis | Trunk Route `MAA` → `DEL` | Proves route length (1,760 km), daily flight frequency, multi-carrier distribution, and average transit delay for MAA-DEL. | REAL DATA |
| 34 | `34_india_airline_intelligence.png` | Indian Carrier Intelligence | IndiGo (`6E`) | Proves domestic market leadership analytics (6E), fleet utilization, hub efficiency, and on-time performance metrics. | REAL DATA |
| 35 | `35_india_state_intelligence.png` | State Aviation Intelligence | State of Tamil Nadu | Proves aviation infrastructure metrics across Tamil Nadu airports (Chennai, Coimbatore, Madurai, Tiruchirappalli). | REAL DATA |
| 36 | `36_tamil_nadu_comparison_analysis.png` | Tamil Nadu Airport Network Analysis | Tamil Nadu Hub Network (`MAA`, `CJB`, `IXM`, `TRZ`) | Compares passenger throughput, flight volume, delay risk, and connectivity across Tamil Nadu airports. | REAL DATA |
| 37 | `37_india_aviation_map.png` | Indian Airspace GIS Map View | Indian Subcontinent Airspace | Proves regional GIS visualization displaying domestic Indian flight corridors, major airport nodes, and airspace routes. | LIVE |
| 38 | `38_api_backend_health_status.png` | FastAPI OpenAPI Documentation | `http://127.0.0.1:8100/docs` | Proves interactive Swagger UI documentation showing all production endpoints (`/health`, `/predict`, `/flights`, `/airports`). | LIVE |
| 39 | `39_final_test_evidence.png` | Backend Test Suite Execution | Pytest Test Runner Output (`pytest backend/tests`) | Proves 100% test pass rate across 17 automated unit and integration test cases in 15.16s. | LIVE |
| 40 | `40_frontend_build_test_evidence.png` | Frontend TypeScript Build | Vite Production Bundler Output (`npm run build`) | Proves zero TypeScript compilation errors, successful Vite module bundle transformation (1,912 modules), and build completion in 1.97s. | LIVE |

---
