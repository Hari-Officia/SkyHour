# Skyhour India Aviation Intelligence System — Viva & Technical Review Q&A

This document provides a comprehensive set of 35 technical examination questions and detailed answers designed for academic viva voce, technical reviews, and engineering audits of the Skyhour platform.

---

## 1. System Architecture & Backend Framework

### Q1: What is the core architecture of Skyhour and how does it handle dual-country intelligence?
**Answer:** Skyhour follows a decoupled, service-oriented architecture:
- **Backend:** Powered by R Plumber operating on REST principles. It serves as a unified backend hosting both USA and India endpoints under a single process (`http://127.0.0.1:8000`).
- **Frontend:** Built with React, TypeScript, and Vite, using dynamic component routing and Leaflet/Recharts for visual intelligence.
- **Dual-Country Partitioning:** USA routes (`/predict`, `/analytics`, `/predict-live`) deliver flight-level regression delay predictions based on U.S. DOT BTS dataset features. India routes (`/india/overview`, `/india/airports`, `/india/routes`, `/india/bottlenecks`, `/india/tamil-nadu`) deliver macro-level aviation network intelligence, traffic demand forecasting, and graph-based centrality analysis suited to DGCA/AAI data availability.

### Q2: Why was R Plumber chosen for the backend instead of Python FastAPI or Node.js Express?
**Answer:** R was selected because the core predictive modeling, spatial graph algorithms (igraph, pageRank), and statistical time-series handling were native to R. R Plumber allows turning R script functions into production-ready HTTP REST endpoints directly using annotations (`#* @get`, `#* @post`), eliminating cross-language serialization friction between R data pipelines and the API layer.

### Q3: How does the Plumber backend handle CORS (Cross-Origin Resource Sharing) and error safety?
**Answer:** The Plumber filter `@filter cors` dynamically injects required CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Methods`). Global error handling is implemented via `pr_set_error()`, ensuring all unhandled R errors return clean JSON payloads with HTTP 500 status codes rather than leaking R stack traces or crashing the server thread.

### Q4: How is data shared between Plumber endpoints without re-reading CSV files on every request?
**Answer:** In `R/india/05_india_plumber_api.R` and initialization scripts, data structures (airports data frame, monthly traffic panel, route edge lists, adjacency matrices, and spatial coordinates) are loaded into environment memory at startup. Read-only graph and lookup structures are kept in memory, granting sub-millisecond response times for route and airport endpoints.

### Q5: How do the USA and India APIs co-exist on port 8000 without endpoint collisions?
**Answer:** Endpoint namespaces are strictly separated. USA endpoints occupy root subpaths (`/health`, `/predict`, `/analytics`, `/model-info`), while all Indian aviation endpoints are mounted under the `/india/` parent prefix (`/india/health`, `/india/overview`, `/india/airports`, etc.), preventing route collisions and allowing independent versioning.

---

## 2. Machine Learning & USA Delay Regression

### Q6: What machine learning algorithm powers the USA Flight Delay Prediction Engine?
**Answer:** The USA Delay Prediction Engine uses XGBoost (Extreme Gradient Boosting) regression (`xgboost::xgb.train` in R), wrapped with feature encoders and metadata into `models/skyhour_delay_model.rds` (v1.2.0).

### Q7: What are the primary feature sets used for USA delay prediction?
**Answer:**
1. **Temporal Features:** Scheduled departure hour (`CRS_DEP_TIME`), day of week (`DAY_OF_WEEK`), month of year (`MONTH`).
2. **Spatial / Distance Features:** Distance between origin and destination (`DISTANCE`).
3. **Carrier & Airport Categorical Encoding:** Origin airport, destination airport, and operating airline carrier code, target-encoded and transformed into numerical representations.
4. **Weather / Congestion Aggregates:** Historical arrival/departure congestion vectors.

### Q8: What metrics were used to evaluate the USA Delay Regression model?
**Answer:**
- **Root Mean Squared Error (RMSE):** Evaluates overall prediction magnitude error in minutes.
- **Mean Absolute Error (MAE):** Measures average absolute deviation, robust against extreme outlier delays.
- **Coefficient of Determination ($R^2$):** Measures proportion of variance explained by model features.

### Q9: Why is the USA model frozen (v1.2.0) and marked immutable?
**Answer:** The USA model achieved target stability and validation benchmarks during Phase 1. Freezing `skyhour_delay_model.rds` ensures complete reproducibility across deployments and prevents unintentional feature drift or regression while enhancing the India intelligence tier.

### Q10: How does `/predict-live` integrate real-time external data for USA flights?
**Answer:** `/predict-live` queries the AviationStack REST API using an active API key to fetch real-time flight telemetry (actual vs scheduled times, status, aircraft, live weather). If the API rate limit is reached or real-time data is unavailable, it gracefully degrades to model inference fallback based on scheduled parameters.

### Q11: How are missing or unknown categorical variables handled during live inference?
**Answer:** Unknown airport or carrier codes not present in the training vocabulary map to a default background frequency bucket (`__UNKNOWN__`), ensuring zero runtime `NA` crashes during model evaluation.

### Q12: What is the difference between regression delay prediction and binary delay classification?
**Answer:** Regression predicts continuous target variables (exact delay in minutes, e.g., $+18.4 \text{ mins}$), whereas classification outputs discrete probabilities ($P(\text{Delay} > 15 \text{ mins})$). Skyhour USA utilizes continuous regression to provide actionable ETA adjustments.

---

## 3. India Traffic Demand & Autoregressive Forecasting

### Q13: Why is Indian aviation analyzed at a macro/monthly level rather than flight-level like USA BTS?
**Answer:** Indian civil aviation data released by DGCA (Directorate General of Civil Aviation) and AAI (Airports Authority of India) is published as monthly airport traffic statistics, passenger movements, aircraft movements, freight tonnage, and city-pair passenger totals. Attempting to force synthetic flight-level minute data onto Indian aviation would be inaccurate; Skyhour models Indian aviation at its native, authentic granularity.

### Q14: What features drive the India Monthly Passenger Traffic Demand Model?
**Answer:**
- **Autoregressive Features:** $1$-month lag traffic (`lag_1m_pax`) and $12$-month seasonal lag traffic (`lag_12m_pax`).
- **Airport Tier & Infrastructure:** Category (Metro, Major, Tier-2, Regional), runway count, terminal capacity.
- **Temporal Indicators:** Year, Month, seasonality indices.

### Q15: The India demand model achieves $R^2 = 0.9996$ and MAPE = 5.21%. Is this model suffering from Data Leakage?
**Answer:** **No.** The model is **Validated with Context**. High $R^2$ is natural in autoregressive time-series panel models because an airport's traffic last month (`lag_1m_pax`) and same month last year (`lag_12m_pax`) strongly determine current monthly volume. Crucially, validation followed strict **Chronological Split**:
- **Train Set:** Years $\le 2023$
- **Validation Set:** Year $2024$
- **Test Set:** Year $2025$
Because future information was never visible to past training folds, there is zero temporal data leakage.

### Q16: What is MAPE and why is it useful for evaluating airport demand across different airport sizes?
**Answer:** MAPE (Mean Absolute Percentage Error) calculates percentage error relative to actual volume:
$$\text{MAPE} = \frac{1}{n} \sum_{i=1}^{n} \left| \frac{Y_i - \hat{Y}_i}{Y_i} \right| \times 100\%$$
Because Indira Gandhi International (DEL) handles $5.5\text{M}$ passengers/month while a regional airport handles $20,000$, absolute error (MAE) would heavily bias toward major hubs. MAPE normalizes error across all airport tiers.

### Q17: How does Skyhour handle airport demand forecasting for newly operational airports with no 12-month history?
**Answer:** For newly opened regional airports under the UDAN scheme, missing lag features default to regional tier mean imputation derived from similar category airports, preventing calculation errors.

### Q18: What is the Tamil Nadu Aviation Cluster Analysis feature in Skyhour India V2?
**Answer:** It isolates all 7 commercial airports in Tamil Nadu (MAA, TRZ, CJB, IXM, TCR, COK nearby cluster, MAA Metro) to compute state-level market share, passenger density, growth trajectory, and connectivity bottlenecks, accessible via `/india/tamil-nadu`.

---

## 4. Graph Theory & Network Centrality Analysis

### Q19: How is the Indian Aviation Network represented as a graph structure?
**Answer:** The network is modeled as a directed, weighted graph $G = (V, E, W)$:
- **Vertices ($V$):** 64 Indian airports.
- **Edges ($E$):** Scheduled flight sector routes connecting origin-destination pairs.
- **Weights ($W$):** Flight frequency, available seat capacity, and passenger volume.

### Q20: What is PageRank in the context of aviation networks and how is it calculated?
**Answer:** PageRank measures the global authority of an airport based on the incoming connections from other highly connected airports. An airport is high-ranking if it receives heavy traffic from other major hubs:
$$PR(u) = \frac{1-d}{|V|} + d \sum_{v \in \text{In}(u)} \frac{PR(v)}{|\text{Out}(v)|}$$
where $d = 0.85$ is the damping factor. DEL and BOM exhibit top PageRank scores in India.

### Q21: What is Betweenness Centrality and how does it identify aviation network bottlenecks?
**Answer:** Betweenness Centrality quantifies how frequently an airport acts as a bridge along the shortest travel path between all pairs of airports:
$$C_B(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}$$
Airports with high Betweenness Centrality (e.g., DEL, BOM, BLR) are structural bottlenecks—if operations freeze at these airports, routing options across the entire national airspace degrade rapidly.

### Q22: What is Degree Centrality and how does In-Degree differ from Out-Degree?
**Answer:**
- **In-Degree:** Number of direct incoming sector routes to an airport.
- **Out-Degree:** Number of direct outgoing sector routes from an airport.
In a balanced commercial network, In-Degree and Out-Degree are symmetric for scheduled commercial flights.

### Q23: How does `/india/bottlenecks` compute network vulnerability scores?
**Answer:** It ranks airports by combining Betweenness Centrality, passenger volume density, and single-point-of-failure metrics to isolate airports where disruption risks propagate to secondary routes.

---

## 5. Skyhour Risk Engine & Multi-Factor Scoring

### Q24: What is the formula for the Skyhour Risk Score?
**Answer:** The Skyhour Risk Score combines operational stress factors into a normalized score $[0, 100]$:
$$\text{Risk Score} = 0.45 \times \text{Traffic Pressure} + 0.35 \times \text{Weather Severity} + 0.20 \times \text{Network Centrality}$$

### Q25: What variables make up the Traffic Pressure component?
**Answer:** Traffic Pressure evaluates actual monthly passenger volume relative to terminal design capacity and runway throughput limits:
$$\text{Traffic Pressure} = \min\left(100, \frac{\text{Monthly Pax}}{\text{Design Capacity}} \times 100\right)$$

### Q26: How is Weather Severity quantified for Indian airports?
**Answer:** Weather Severity incorporates monsoon impact, thunderstorm frequency, visibility restrictions (fog/smog in Northern India during winter), and extreme temperature events on a scale of $0$ to $100$.

### Q27: Why is Network Centrality weighted at 20% in the Risk Score formula?
**Answer:** An isolated airport experiencing weather disruption affects only local travel. However, disruption at a central hub (high network centrality) causes cascading delays across multiple domestic routes. The 20% weight ensures hub criticality is factored into risk prioritization.

---

## 6. Frontend Architecture, GIS & User Experience

### Q28: How is the Leaflet Map integrated with React for rendering airport markers and routes?
**Answer:** The frontend uses `react-leaflet` with custom vector layer styling:
- **Airports:** Rendered as interactive `CircleMarker` elements color-coded by Skyhour Risk Level (Green = Low, Orange = Moderate, Red = High).
- **Routes:** Rendered as animated `Polyline` arcs representing flight paths, with line weight proportional to sector traffic volume.

### Q29: How does the application maintain fast initial load times despite rich interactive dashboards?
**Answer:** `React.lazy()` and dynamic imports (`Suspense`) split page bundles by route (`IndiaOverview`, `IndiaAirports`, `IndiaBottlenecks`, `IndiaTamilNadu`, `Predictions`). Map tiles and large dataset assets load lazily, ensuring core bundle sizes remain under $300\text{ KB}$.

### Q30: How are tooltips and metric explanations implemented to make complex ML/Graph metrics accessible to users?
**Answer:** The custom `MetricInfoTooltip.tsx` component provides inline popovers explaining domain terms (e.g., PageRank, Betweenness Centrality, Autoregressive Lag, MAPE) when users hover over metric headers, bridging data science concepts with user clarity.

### Q31: How is mobile responsiveness handled across small screens ($<480\text{px}$)?
**Answer:** `index.css` defines mobile breakpoints:
- Leaflet map heights adjust dynamically to `380px`.
- Multi-column metric grids collapse to single-column flex layouts.
- Tables wrap inside overflow containers with touch scrolling (`-webkit-overflow-scrolling: touch`).
- Minimum touch targets of $44\text{px} \times 44\text{px}$ prevent misclicks on touchscreens.

### Q32: What state management approach is used in the frontend?
**Answer:** Light local state is managed with React `useState` and `useEffect` combined with custom API fetch hooks. Centralized route state uses `react-router-dom` v6, keeping memory lightweight without unnecessary global Redux overhead.

---

## 7. Security, Verification & Deployment

### Q33: How is API security enforced on the Plumber server?
**Answer:**
- Input parameters undergo strict validation and type casting (numeric bounds checking for hour, month, coordinates).
- String inputs are sanitized against SQL/command injection.
- Unhandled exceptions are caught by global try-catch blocks returning standard error JSON wrappers (`{"status": "error", "message": "..."}`).

### Q34: How is automated test verification executed for Skyhour?
**Answer:** Verification is conducted using a PowerShell integration test suite (`scratch/test_india_intelligence.ps1`). It fires automated REST calls across all 27 USA and India API endpoints, validating status codes ($200\text{ OK}$), JSON schema keys, and value bounds, achieving a **100% (27/27) pass rate**.

### Q35: What steps are required to run Skyhour in a production environment?
**Answer:**
1. **Backend Daemon:** Launch Plumber backend via R:
   `Rscript scratch/run_unified_plumber.R` (Listens on port 8000).
2. **Frontend Production Build:** Execute Vite production build:
   `cd frontend && npm run build`
3. **Static File Serving / Nginx:** Serve `frontend/dist` static assets via Nginx or Caddy with proxy pass `/api/` pointing to `http://127.0.0.1:8000`.
