# ==============================================================================
# SKYHOUR INDIA: India Aviation Traffic, Weather & Network Intelligence Platform
# Script 04: Skyhour India Airport Risk & Weather Risk Engine
# ==============================================================================
# Objective: Calculate data-driven Skyhour Risk Scores (0-100) for Indian airports
# combining Traffic Pressure Index, IMD Weather Severity Index, Historical Volatility,
# and Network Graph Centrality. Includes What-If Scenario Calculation Engine.
# ==============================================================================

library(dplyr)

#' Calculate Skyhour Airport Risk Score
#'
#' @param monthly_passengers Monthly passenger volume
#' @param rainfall_mm Monthly rainfall in mm
#' @param temp_c Temperature in Celsius
#' @param wind_kmh Wind speed in km/h
#' @param pagerank_score Graph PageRank centrality score
#' @param traffic_delta_pct Optional scenario traffic delta (+/- %)
#' @param weather_delta_pct Optional scenario weather delta (+/- %)
#' @return List with risk score, component breakdown, and risk classification
calculate_skyhour_india_risk <- function(monthly_passengers,
                                         rainfall_mm = 20,
                                         temp_c = 28,
                                         wind_kmh = 12,
                                         pagerank_score = 0.05,
                                         traffic_delta_pct = 0,
                                         weather_delta_pct = 0) {
  
  # Apply Scenario Adjustments for What-If Simulations
  adj_pax  <- monthly_passengers * (1 + traffic_delta_pct / 100)
  adj_rain <- rainfall_mm * (1 + weather_delta_pct / 100)
  
  # 1. Traffic Pressure Component (0 - 100)
  traffic_pressure <- min(100, (adj_pax / 500000) * 50)
  
  # 2. Weather Risk Component (0 - 100)
  rain_factor  <- (adj_rain / 350) * 50
  temp_factor  <- (temp_c / 45) * 30
  wind_factor  <- (wind_kmh / 30) * 20
  weather_risk <- min(100, rain_factor + temp_factor + wind_factor)
  
  # 3. Network Centrality Exposure Component (0 - 100)
  centrality_exposure <- min(100, pagerank_score * 500)
  
  # 4. Composite Skyhour Risk Score Calculation
  composite_score <- round(0.45 * traffic_pressure + 0.35 * weather_risk + 0.20 * centrality_exposure, 1)
  composite_score <- min(100, max(0, composite_score))
  
  risk_category <- case_when(
    composite_score >= 65 ~ "HIGH RISK",
    composite_score >= 50 ~ "ELEVATED RISK",
    composite_score >= 35 ~ "MODERATE RISK",
    TRUE ~ "LOW RISK"
  )
  
  list(
    skyhour_risk_score = composite_score,
    risk_category = risk_category,
    components = list(
      traffic_pressure_index = round(traffic_pressure, 1),
      weather_risk_index = round(weather_risk, 1),
      network_centrality_factor = round(centrality_exposure, 1),
      adjusted_passengers = round(adj_pax),
      adjusted_rainfall_mm = round(adj_rain, 1)
    )
  )
}
