# Skyhour 5-Minute Demonstration Script

This script provides a timed, step-by-step presentation script for demonstrating the **Skyhour Aviation Platform** during project evaluation.

---

## Timed Presentation Sequence

### 00:00 – 00:30 | Problem Statement & Architecture
- *"Good morning evaluators. Today we present Skyhour, an aviation traffic, weather, and delay intelligence platform."*
- *"Skyhour solves two key problems: predicting flight arrival delays before takeoff in high-density markets like the US, and analyzing spatial network centrality, passenger footfall, and operational bottlenecks across Indian airspace."*
- *"Both modules are served over a single unified R Plumber REST API server running on port 8000."*

### 00:30 – 01:00 | USA Flight Delay Risk Prediction
- *"First, let's look at the US Pre-Flight Delay Module. Here, a traveler enters flight parameters like AA100 from JFK to LAX."*
- *"Our frozen XGBoost classifier evaluates departure hour, route priors, and carrier performance to output a pre-flight arrival delay probability."*
- *"Notice that we strictly enforce zero post-flight data leakage — we use no actual departure delay or taxi times."*

### 01:00 – 02:30 | Skyhour India GIS Map & Airport Intelligence
- *"Now let's toggle to Skyhour India. Here you see our interactive spatial GIS map built with Leaflet and CartoDB Dark Matter tiles."*
- *"We can toggle map layers: Skyhour Risk, Passenger Footfall, IMD Monsoonal Rainfall, and Hub Centrality."*
- *"Clicking on any airport marker — for instance Chennai (MAA) — opens our 360-degree Airport Intelligence Panel with tabs for Traffic, Network, Risk, and Forecast."*

### 02:30 – 03:30 | Tamil Nadu Spotlight & Airport Comparison
- *"We have a dedicated Tamil Nadu Regional Spotlight covering 6 airports: Chennai, Coimbatore, Trichy, Madurai, Salem, and Tuticorin."*
- *"Clicking 'Compare Tamil Nadu Airports' launches a side-by-side comparative matrix allowing evaluators to compare passenger footfall, flight traffic, and risk scores directly."*

### 03:30 – 04:15 | Bottleneck Watch & Graph Centrality
- *"Next, our Network Bottleneck Watch page identifies potential hub bottlenecks using a strict 85th percentile intersection rule across passenger volume, aircraft movements, and PageRank centrality."*
- *"Every graph metric — Degree, Betweenness, PageRank — includes a MetricInfoTooltip modal explaining the exact formula and inputs."*

### 04:15 – 05:00 | Demand Forecast, What-If Simulator & Conclusion
- *"Finally, our What-If Scenario Simulator recalculates operational risk scores live when traffic or weather parameters shift, clearly labeled as SCENARIO SIMULATION."*
- *"All 27 API endpoints are fully verified with 100% pass rates, and the React frontend compiles with 0 errors. Thank you."*
