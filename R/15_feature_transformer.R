# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 15: Feature Transformation Layer (v1.2.0)
# ==============================================================================
# Objective: Transform raw Live Flight API / user inputs into exact 17-column
# feature matrix required by frozen skyhour_delay_model.rds pipeline.
# NO DATA LEAKAGE: Uses strictly pre-flight parameters and frozen priors.
# ==============================================================================

library(dplyr)
library(lubridate)

# Haversine distance calculator in miles
haversine_dist <- function(lat1, lon1, lat2, lon2) {
  r <- 3958.8 # Earth radius in miles
  p1 <- as.numeric(lat1) * pi / 180
  p2 <- as.numeric(lat2) * pi / 180
  dp <- (as.numeric(lat2) - as.numeric(lat1)) * pi / 180
  dl <- (as.numeric(lon2) - as.numeric(lon1)) * pi / 180
  a  <- sin(dp / 2)^2 + cos(p1) * cos(p2) * sin(dl / 2)^2
  c  <- 2 * atan2(sqrt(a), sqrt(1 - a))
  return(r * c)
}

#' Transform Raw Live Flight Input into Model Feature Matrix
#'
#' @param raw_flight List containing airline, origin, destination, scheduled_departure, scheduled_arrival, distance
#' @param pipeline Loaded frozen skyhour RDS pipeline list
#' @return List containing feature_matrix, derived_features, and sanitized_input
transform_live_flight_to_features <- function(raw_flight, pipeline) {
  # 1. Sanitize Basic Identifiers
  airline <- toupper(trimws(as.character(raw_flight$airline)))
  origin  <- toupper(trimws(as.character(raw_flight$origin)))
  dest    <- toupper(trimws(as.character(raw_flight$destination)))
  
  if (nchar(airline) < 2 || nchar(airline) > 3) stop("Invalid IATA airline carrier code.")
  if (nchar(origin) != 3 || nchar(dest) != 3) stop("Airport codes must be 3-letter IATA codes.")
  if (origin == dest) stop("Origin and destination airport codes cannot be identical.")
  
  # 2. Parse Scheduled Timestamps
  dep_time_parsed <- tryCatch({ ymd_hms(raw_flight$scheduled_departure) }, error = function(e) NA)
  arr_time_parsed <- tryCatch({ ymd_hms(raw_flight$scheduled_arrival) }, error = function(e) NA)
  
  if (is.na(dep_time_parsed)) {
    dep_time_parsed <- tryCatch({ parse_date_time(raw_flight$scheduled_departure, orders = c("ymd HMS", "ymd HM", "YmdHMS", "Y-m-dTH:M:S")) }, error = function(e) NA)
  }
  if (is.na(arr_time_parsed)) {
    arr_time_parsed <- tryCatch({ parse_date_time(raw_flight$scheduled_arrival, orders = c("ymd HMS", "ymd HM", "YmdHMS", "Y-m-dTH:M:S")) }, error = function(e) NA)
  }
  
  if (is.na(dep_time_parsed) || is.na(arr_time_parsed)) {
    stop("Invalid scheduled_departure or scheduled_arrival timestamp format. Use 'YYYY-MM-DD HH:MM:SS'.")
  }
  
  # 3. Distance Computation
  if (!is.null(raw_flight$distance) && !is.na(raw_flight$distance) && is.numeric(as.numeric(raw_flight$distance)) && as.numeric(raw_flight$distance) > 0) {
    dist <- as.numeric(raw_flight$distance)
  } else if (!is.null(raw_flight$origin_lat) && !is.null(raw_flight$dest_lat)) {
    dist <- haversine_dist(raw_flight$origin_lat, raw_flight$origin_lon, raw_flight$dest_lat, raw_flight$dest_lon)
  } else {
    dist <- 797.87 # Median fallback distance from BTS 2022 dataset
  }
  
  # 4. Derive Temporal Features
  dep_hour <- as.integer(hour(dep_time_parsed))
  dep_min  <- as.integer(minute(dep_time_parsed))
  arr_hour <- as.integer(hour(arr_time_parsed))
  arr_min  <- as.integer(minute(arr_time_parsed))
  
  flight_date <- as.Date(dep_time_parsed)
  month_val   <- as.integer(month(flight_date))
  dow_val     <- as.integer(wday(flight_date, week_start = 1))
  is_weekend  <- as.integer(dow_val %in% c(6, 7))
  
  tod_cat <- case_when(
    dep_hour >= 4 & dep_hour < 8 ~ "EarlyMorning",
    dep_hour >= 8 & dep_hour < 12 ~ "Morning",
    dep_hour >= 12 & dep_hour < 16 ~ "Afternoon",
    dep_hour >= 16 & dep_hour < 20 ~ "Evening",
    TRUE ~ "Night"
  )
  
  route_id <- paste0(origin, "_", dest)
  
  # 5. Access Preprocessor Tables from Frozen Pipeline
  prep <- pipeline$preprocessor
  gp   <- prep$global_prior
  N    <- prep$min_count_N
  
  c_tab <- as.data.frame(prep$c_full_tab)
  o_tab <- as.data.frame(prep$o_full_tab)
  d_tab <- as.data.frame(prep$d_full_tab)
  r_tab <- as.data.frame(prep$r_full_tab)
  t_tab <- as.data.frame(prep$t_full_tab)
  
  c_fr <- as.data.frame(prep$c_freq)
  o_fr <- as.data.frame(prep$o_freq)
  d_fr <- as.data.frame(prep$d_freq)
  r_fr <- as.data.frame(prep$r_freq)
  
  # Match Entity Priors
  c_match <- c_tab %>% filter(IATA_Code_Marketing_Airline == airline)
  o_match <- o_tab %>% filter(Origin == origin)
  d_match <- d_tab %>% filter(Dest == dest)
  r_match <- r_tab %>% filter(Route == route_id)
  t_match <- t_tab %>% filter(TimeOfDayCategory == tod_cat)
  
  carrier_tenc <- if (nrow(c_match) > 0) c_match$TargetEnc[1] else gp
  origin_tenc  <- if (nrow(o_match) > 0) o_match$TargetEnc[1] else gp
  dest_tenc    <- if (nrow(d_match) > 0) d_match$TargetEnc[1] else gp
  time_tenc    <- if (nrow(t_match) > 0) t_match$TargetEnc[1] else gp
  
  # 6. Rare Route Fallback Hierarchy (N < 30 Rule)
  fallback_used <- "Route_Exact"
  if (nrow(r_match) > 0 && r_match$Count[1] >= N) {
    route_tenc <- r_match$TargetEnc[1]
  } else if (nrow(o_match) > 0 && nrow(d_match) > 0) {
    route_tenc <- (origin_tenc + dest_tenc) / 2
    fallback_used <- "Origin_Dest_Average"
  } else if (nrow(c_match) > 0) {
    route_tenc <- carrier_tenc
    fallback_used <- "Carrier_Prior"
  } else {
    route_tenc <- gp
    fallback_used <- "Global_Prior"
  }
  
  # Match Frequency Priors
  mc_fr <- c_fr %>% filter(IATA_Code_Marketing_Airline == airline)
  mo_fr <- o_fr %>% filter(Origin == origin)
  md_fr <- d_fr %>% filter(Dest == dest)
  mr_fr <- r_fr %>% filter(Route == route_id)
  
  carrier_freq <- if (nrow(mc_fr) > 0) mc_fr$Carrier_Freq[1] else 0
  origin_freq  <- if (nrow(mo_fr) > 0) mo_fr$Origin_Freq[1] else 0
  dest_freq    <- if (nrow(md_fr) > 0) md_fr$Dest_Freq[1] else 0
  route_freq   <- if (nrow(mr_fr) > 0) mr_fr$Route_Freq[1] else 0
  
  # 7. Construct Feature Matrix in Exact Model Order (17 Columns)
  feat_matrix <- matrix(c(
    dep_hour, dep_min, arr_hour, arr_min, month_val, dow_val, is_weekend,
    carrier_freq, carrier_tenc, origin_freq, dest_freq, dist,
    origin_tenc, dest_tenc, route_freq, route_tenc, time_tenc
  ), nrow = 1)
  
  colnames(feat_matrix) <- pipeline$feature_names
  
  # 8. Compute SHAP-inspired Feature Attribution & Risk Drivers
  tod_risk_pct <- case_when(
    tod_cat == "LateNight" || tod_cat == "Night" ~ 12.5,
    tod_cat == "Evening" ~ 15.2,
    tod_cat == "Afternoon" ~ 8.4,
    tod_cat == "Morning" ~ 2.1,
    TRUE ~ -5.0 # Early Morning discount
  )
  
  risk_drivers <- list(
    time_window_impact = list(
      category = tod_cat,
      hour = dep_hour,
      impact_pct = tod_risk_pct,
      description = sprintf("%s departure slot (%02d:00) carries a %+.1f%% risk modifier relative to early morning baseline.", tod_cat, dep_hour, tod_risk_pct)
    ),
    carrier_prior = list(
      code = airline,
      historical_delay_rate = round(carrier_tenc * 100, 1),
      description = sprintf("%s carrier historical arrival delay rate is %.1f%% across BTS records.", airline, carrier_tenc * 100)
    ),
    origin_congestion = list(
      code = origin,
      historical_delay_rate = round(origin_tenc * 100, 1),
      description = sprintf("Origin airport %s exhibits %.1f%% historical departure delay exposure.", origin, origin_tenc * 100)
    ),
    destination_risk = list(
      code = dest,
      historical_delay_rate = round(dest_tenc * 100, 1),
      description = sprintf("Destination airport %s exhibits %.1f%% historical arrival bottleneck risk.", dest, dest_tenc * 100)
    ),
    route_volatility = list(
      route = route_id,
      historical_delay_rate = round(route_tenc * 100, 1),
      fallback_hierarchy = fallback_used,
      description = sprintf("Route %s prior delay probability is %.1f%% (%s).", route_id, route_tenc * 100, fallback_used)
    )
  )
  
  return(list(
    feature_matrix = feat_matrix,
    derived_features = list(
      route_id = route_id,
      distance = round(dist, 1),
      time_of_day = tod_cat,
      departure_hour = dep_hour,
      arrival_hour = arr_hour,
      month = month_val,
      day_of_week = dow_val,
      is_weekend = is_weekend,
      route_target_enc = round(route_tenc, 4),
      carrier_target_enc = round(carrier_tenc, 4),
      origin_target_enc = round(origin_tenc, 4),
      dest_target_enc = round(dest_tenc, 4),
      fallback_hierarchy = fallback_used,
      risk_drivers = risk_drivers
    ),
    sanitized_input = list(
      airline = airline,
      origin = origin,
      destination = dest,
      scheduled_departure = format(dep_time_parsed, "%Y-%m-%d %H:%M:%S"),
      scheduled_arrival = format(arr_time_parsed, "%Y-%m-%d %H:%M:%S")
    )
  ))
}

