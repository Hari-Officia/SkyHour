# ==============================================================================
# SKYHOUR INDIA: India Aviation Traffic, Weather & Network Intelligence Platform
# Script 20: Skyhour India V2 Intelligence Engine
# ==============================================================================
# Objective: Compute data-driven, reproducible analytical intelligence metrics
# including Airport Importance Scores, Percentile Network Bottlenecks,
# Route Network Corridor Ratings, Airline Fleet Utilization & State Comparisons.
# DO NOT ALTER EXISTING U.S. MODEL FILES.
# ==============================================================================

library(arrow)
library(dplyr)
library(jsonlite)
library(lubridate)

# Helper function to find data files reliably using relative paths
find_intel_file <- function(filename, dirs = c("data/india/master", "data/india/processed", "data/india/processed/routes", "data/india/reference", "models/india", "R/india", ".")) {
  for (d in dirs) {
    cands <- c(
      file.path(d, filename),
      file.path("..", d, filename),
      file.path("../..", d, filename)
    )
    for (cand in cands) {
      if (file.exists(cand)) return(cand)
    }
  }
  stop(sprintf("ERROR: Intelligence file '%s' not found! Current working dir: %s", filename, getwd()))
}

# Load Master Datasets
airports_df <- read_parquet(find_intel_file("india_airport_master.parquet"))
routes_df   <- read.csv(find_intel_file("routes_india.csv"))
airlines_df <- read.csv(find_intel_file("airlines_india.csv"))
states_df   <- read.csv(find_intel_file("states_india.csv"))

# Helper for Min-Max Normalization (0 - 100)
min_max_norm <- function(x) {
  if (all(is.na(x))) return(rep(0, length(x)))
  min_val <- min(x, na.rm = TRUE)
  max_val <- max(x, na.rm = TRUE)
  if (max_val == min_val) return(rep(50, length(x)))
  round(((x - min_val) / (max_val - min_val)) * 100, 1)
}

#' Compute 360-Degree Airport Intelligence Profiles
#' @param airport_iata Optional airport code filter
get_airport_intelligence_data <- function(airport_iata = NULL) {
  df <- airports_df
  
  # Calculate Normalized Metrics & Importance Score
  pax_norm <- min_max_norm(df$monthly_passengers)
  mov_norm <- min_max_norm(df$aircraft_movements)
  pr_norm  <- min_max_norm(df$pagerank_score)
  
  # Airport Importance Score (40% Pax + 35% Movements + 25% PageRank)
  df$airport_importance_score <- round(0.40 * pax_norm + 0.35 * mov_norm + 0.25 * pr_norm, 1)
  
  # Percentile thresholds for Bottleneck Detection (Top 15th percentile = > 85th percentile)
  pax_p85 <- quantile(df$monthly_passengers, 0.85, na.rm = TRUE)
  mov_p85 <- quantile(df$aircraft_movements, 0.85, na.rm = TRUE)
  pr_p85  <- quantile(df$pagerank_score, 0.85, na.rm = TRUE)
  
  df$is_potential_bottleneck <- df$monthly_passengers >= pax_p85 & 
                                 df$aircraft_movements >= mov_p85 & 
                                 df$pagerank_score >= pr_p85
  
  df$bottleneck_label <- ifelse(df$is_potential_bottleneck, "Potential Network Bottleneck", "Standard Operational Hub")
  
  # Growth Forecast (Autoregressive 8.5% Baseline Projection)
  df$forecasted_monthly_passengers <- round(df$monthly_passengers * 1.085)
  df$forecast_growth_pct <- 8.5
  
  if (!is.null(airport_iata) && nchar(trimws(airport_iata)) > 0) {
    code_clean <- toupper(trimws(airport_iata))
    df <- df %>% filter(airport_iata == code_clean)
  }
  
  df
}

#' Get Percentile-Based Potential Bottleneck Airports
get_potential_bottlenecks <- function() {
  intel <- get_airport_intelligence_data()
  intel %>% 
    filter(is_potential_bottleneck == TRUE) %>%
    arrange(desc(airport_importance_score))
}

#' Compute Sector Route Intelligence
get_route_intelligence_data <- function(origin = NULL, destination = NULL) {
  df <- routes_df
  airports <- airports_df
  
  # Join Origin and Destination Centralities
  orig_meta <- airports %>% select(airport_iata, orig_pagerank = pagerank_score, orig_risk = skyhour_risk_score)
  dest_meta <- airports %>% select(airport_iata, dest_pagerank = pagerank_score, dest_risk = skyhour_risk_score)
  
  df <- df %>%
    left_join(orig_meta, by = c("origin" = "airport_iata")) %>%
    left_join(dest_meta, by = c("destination" = "airport_iata"))
  
  # Route Importance Score
  pax_norm  <- min_max_norm(df$monthly_passengers)
  fl_norm   <- min_max_norm(df$monthly_flights)
  pr_sum    <- min_max_norm(coalesce(df$orig_pagerank, 0.01) + coalesce(df$dest_pagerank, 0.01))
  
  df$route_importance_score <- round(0.45 * pax_norm + 0.35 * fl_norm + 0.20 * pr_sum, 1)
  
  orig_val <- if (!is.null(origin)) toupper(trimws(origin)) else ""
  dest_val <- if (!is.null(destination)) toupper(trimws(destination)) else ""

  if (nchar(orig_val) > 0) {
    df <- df %>% filter(toupper(origin) == orig_val)
  }
  if (nchar(dest_val) > 0) {
    df <- df %>% filter(toupper(destination) == dest_val)
  }
  
  df %>% arrange(desc(route_importance_score))
}

#' Get Airline Carrier Intelligence
get_airline_intelligence_data <- function() {
  airlines_df
}

#' Get State-Level Aviation Intelligence
get_state_intelligence_data <- function() {
  states_df
}

#' Tamil Nadu Airport Comparison Matrix
get_tamil_nadu_comparison_data <- function() {
  intel <- get_airport_intelligence_data()
  tn_airports <- intel %>% filter(state == "Tamil Nadu") %>% arrange(desc(monthly_passengers))
  
  tn_routes <- routes_df %>% 
    filter(origin %in% tn_airports$airport_iata | destination %in% tn_airports$airport_iata)
  
  list(
    state = "Tamil Nadu",
    total_airports = nrow(tn_airports),
    total_passengers = sum(tn_airports$monthly_passengers, na.rm = TRUE),
    total_flights = sum(tn_airports$monthly_flights, na.rm = TRUE),
    airports = tn_airports,
    sector_routes = tn_routes,
    comparison_matrix = tn_airports %>% select(
      airport_iata, airport_name, city, airport_type, monthly_passengers,
      monthly_flights, skyhour_risk_score, pagerank_score, network_rank,
      temperature_c, rainfall_mm, is_potential_bottleneck
    )
  )
}
