# ==============================================================================
# SKYHOUR: Dynamic Risk Engine (Entity-Specific Variance & Factor Attribution)
# ==============================================================================
# Objective: Calculates dynamic, non-constant risk scores (0-100) for airports,
# routes, airlines, and flights based strictly on actual entity-specific features.
# Provides explicit breakdown of top contributing factors.
# ==============================================================================

library(dplyr)

clamp_val <- function(x, min_v = 0, max_v = 100) pmax(min_v, pmin(max_v, x))

calculate_entity_risk <- function(entity_type = c("airport", "route", "airline", "flight"), entity_id, metrics = list()) {
  entity_type <- match.arg(entity_type)
  
  # Entity feature inputs with default fallback structures
  traffic_pressure <- as.numeric(metrics$traffic_pressure %||% metrics$movements_per_hour %||% 50)
  delay_rate      <- as.numeric(metrics$delay_rate %||% metrics$delayed_pct %||% 0.22)
  cancel_rate     <- as.numeric(metrics$cancellation_rate %||% metrics$cancelled_pct %||% 0.03)
  weather_severity<- as.numeric(metrics$weather_severity_score %||% 15)
  network_centrality <- as.numeric(metrics$centrality_score %||% 45)
  hour_peak_factor<- as.numeric(metrics$peak_hour_factor %||% 1.0)
  
  # Weighted Factor Components (Sum to 100 max)
  # 1. Delay & Cancellation Performance (0 - 35 pts)
  perf_component <- (delay_rate * 25) + (cancel_rate * 100 * 0.10)
  perf_pts <- clamp_val(perf_component, 0, 35)
  
  # 2. Traffic & Congestion Pressure (0 - 25 pts)
  traffic_pts <- clamp_val((traffic_pressure / 100) * 25 * hour_peak_factor, 0, 25)
  
  # 3. Weather Severity & Visibility Impact (0 - 20 pts)
  weather_pts <- clamp_val((weather_severity / 100) * 20, 0, 20)
  
  # 4. Network Centrality & Bottleneck Exposure (0 - 20 pts)
  network_pts <- clamp_val((network_centrality / 100) * 20, 0, 20)
  
  # Total composite score
  total_score <- round(clamp_val(perf_pts + traffic_pts + weather_pts + network_pts, 0, 100), 1)
  
  # Risk Category Mapping
  category <- if (total_score < 30) {
    "LOW RISK"
  } else if (total_score < 55) {
    "MODERATE RISK"
  } else if (total_score < 78) {
    "HIGH RISK"
  } else {
    "CRITICAL RISK"
  }
  
  # Factor contribution breakdown
  contributors <- list(
    list(factor = "Historical Delay Rate", impact = if (perf_pts > 20) "HIGH" else if (perf_pts > 10) "MODERATE" else "LOW", points = round(perf_pts, 1)),
    list(factor = "Traffic & Congestion Pressure", impact = if (traffic_pts > 15) "HIGH" else if (traffic_pts > 8) "MODERATE" else "LOW", points = round(traffic_pts, 1)),
    list(factor = "Weather & Environmental Severity", impact = if (weather_pts > 12) "HIGH" else if (weather_pts > 6) "MODERATE" else "LOW", points = round(weather_pts, 1)),
    list(factor = "Network Centrality & Route Density", impact = if (network_pts > 12) "HIGH" else if (network_pts > 6) "MODERATE" else "LOW", points = round(network_pts, 1))
  )
  
  list(
    entity_type = entity_type,
    entity_id = entity_id,
    risk_score = total_score,
    risk_category = category,
    timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
    source = "Skyhour Dynamic Risk Engine v2",
    top_contributors = contributors,
    metrics_used = list(
      traffic_pressure = traffic_pressure,
      delay_rate = round(delay_rate, 4),
      cancellation_rate = round(cancel_rate, 4),
      weather_severity = weather_severity,
      network_centrality = network_centrality
    )
  )
}
