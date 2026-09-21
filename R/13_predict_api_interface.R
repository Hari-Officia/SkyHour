# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 13: Live API Compatibility Predictor Interface
# ==============================================================================
# Objective: Provide a clean, standalone prediction interface function that
# transforms raw live flight API payloads into model inputs and outputs probability.
# ==============================================================================

library(arrow)
library(dplyr)
library(lubridate)
library(xgboost)
library(jsonlite)

set.seed(42)

# Load saved pipeline artifact
model_pipeline_path <- "models/skyhour_delay_model.rds"
if (!file.exists(model_pipeline_path)) stop("Model pipeline rds file not found!")

skyhour_pipeline <- readRDS(model_pipeline_path)

# Haversine distance function (fallback if API payload omits distance)
haversine_distance <- function(lat1, lon1, lat2, lon2) {
  r <- 3958.8 # miles
  phi1 <- lat1 * pi / 180
  phi2 <- lat2 * pi / 180
  delta_phi <- (lat2 - lat1) * pi / 180
  delta_lambda <- (lon2 - lon1) * pi / 180
  
  a <- sin(delta_phi / 2)^2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2)^2
  c <- 2 * atan2(sqrt(a), sqrt(1 - a))
  return(r * c)
}

#' Predict Flight Delay for Skyhour API
#' 
#' @param flight_payload List or Data Frame containing flight input attributes:
#'   - Airline: Marketing carrier code (e.g. "AA", "DL", "UA", "WN")
#'   - Origin: Origin airport code (e.g. "JFK", "LAX", "ORD")
#'   - Destination: Destination airport code (e.g. "SFO", "MIA", "ATL")
#'   - CRSDepTime: Scheduled departure time in HHMM integer format (e.g. 1830 for 6:30 PM)
#'   - CRSArrTime: Scheduled arrival time in HHMM integer format (e.g. 2145 for 9:45 PM)
#'   - FlightDate: Date string (YYYY-MM-DD) or Date object
#'   - Distance: (Optional) Flight distance in miles
#'   - OriginLat, OriginLon, DestLat, DestLon: (Optional) Airport coordinates
#' @param threshold Custom decision threshold (default: pipeline optimal threshold = 0.45)
#' @return Formatted JSON / List prediction response object
predict_skyhour_delay <- function(flight_payload, threshold = NULL) {
  if (is.null(threshold)) {
    threshold <- skyhour_pipeline$optimal_threshold
  }
  
  # Parse inputs
  carrier <- as.character(flight_payload$Airline)
  origin  <- as.character(flight_payload$Origin)
  dest    <- as.character(flight_payload$Destination)
  crs_dep <- as.integer(flight_payload$CRSDepTime)
  crs_arr <- as.integer(flight_payload$CRSArrTime)
  fdate   <- as.Date(flight_payload$FlightDate)
  
  # Distance calculation or lookup
  if (!is.null(flight_payload$Distance) && !is.na(flight_payload$Distance)) {
    dist <- as.numeric(flight_payload$Distance)
  } else if (!is.null(flight_payload$OriginLat) && !is.null(flight_payload$DestLat)) {
    dist <- haversine_distance(flight_payload$OriginLat, flight_payload$OriginLon,
                               flight_payload$DestLat, flight_payload$DestLon)
  } else {
    dist <- 797.87 # Global median default
  }
  
  # Temporal engineering
  dep_hour <- crs_dep %/% 100
  dep_min  <- crs_dep %% 100
  arr_hour <- crs_arr %/% 100
  arr_min  <- crs_arr %% 100
  
  month_val <- as.integer(month(fdate))
  dow_val   <- as.integer(wday(fdate, week_start = 1))
  
  tod_cat <- case_when(
    dep_hour >= 4 & dep_hour < 8 ~ "EarlyMorning",
    dep_hour >= 8 & dep_hour < 12 ~ "Morning",
    dep_hour >= 12 & dep_hour < 16 ~ "Afternoon",
    dep_hour >= 16 & dep_hour < 20 ~ "Evening",
    TRUE ~ "Night"
  )
  
  is_weekend <- as.integer(dow_val %in% c(6, 7))
  is_summer  <- as.integer(month_val %in% c(6, 7, 8))
  route_id   <- paste0(origin, "_", dest)
  
  prep <- skyhour_pipeline$preprocessor
  global_prior <- prep$global_prior
  
  # Map fitted encodings
  c_enc <- prep$carrier_enc %>% filter(IATA_Code_Marketing_Airline == carrier)
  o_enc <- prep$origin_enc %>% filter(Origin == origin)
  d_enc <- prep$dest_enc %>% filter(Dest == dest)
  r_enc <- prep$route_enc %>% filter(Route == route_id)
  t_enc <- prep$time_enc %>% filter(TimeOfDayCategory == tod_cat)
  
  carrier_freq <- if(nrow(c_enc) > 0) c_enc$Carrier_Freq[1] else 0
  carrier_tenc <- if(nrow(c_enc) > 0) c_enc$Carrier_TargetEnc[1] else global_prior
  
  origin_freq <- if(nrow(o_enc) > 0) o_enc$Origin_Freq[1] else 0
  origin_tenc <- if(nrow(o_enc) > 0) o_enc$Origin_TargetEnc[1] else global_prior
  
  dest_freq <- if(nrow(d_enc) > 0) d_enc$Dest_Freq[1] else 0
  dest_tenc <- if(nrow(d_enc) > 0) d_enc$Dest_TargetEnc[1] else global_prior
  
  route_freq <- if(nrow(r_enc) > 0) r_enc$Route_Freq[1] else 0
  route_tenc <- if(nrow(r_enc) > 0) r_enc$Route_TargetEnc[1] else global_prior
  
  time_tenc <- if(nrow(t_enc) > 0) t_enc$TimeOfDay_TargetEnc[1] else global_prior
  
  # Assemble feature vector
  feat_matrix <- matrix(c(
    dist, dep_hour, dep_min, arr_hour, arr_min, dow_val, month_val,
    is_weekend, is_summer, carrier_freq, carrier_tenc,
    origin_freq, origin_tenc, dest_freq, dest_tenc,
    route_freq, route_tenc, time_tenc
  ), nrow = 1)
  
  colnames(feat_matrix) <- skyhour_pipeline$feature_names
  
  dmat <- xgb.DMatrix(data = feat_matrix)
  prob <- as.numeric(predict(skyhour_pipeline$model, newdata = dmat))
  
  status_pred <- ifelse(prob >= threshold, "DELAYED", "ON-TIME")
  risk_level <- case_when(
    prob >= 0.70 ~ "HIGH RISK",
    prob >= 0.45 ~ "MODERATE RISK",
    TRUE ~ "LOW RISK"
  )
  
  res <- list(
    prediction = status_pred,
    delay_probability = round(prob, 4),
    delay_percentage = round(prob * 100, 2),
    risk_level = risk_level,
    decision_threshold = threshold,
    flight_summary = list(
      airline = carrier,
      origin = origin,
      destination = dest,
      flight_date = as.character(fdate),
      scheduled_departure = sprintf("%04d", crs_dep),
      scheduled_arrival = sprintf("%04d", crs_arr),
      distance_miles = round(dist, 1)
    )
  )
  
  return(res)
}

# ------------------------------------------------------------------------------
# Demonstration Test
# ------------------------------------------------------------------------------
cat("=== TESTING SKYHOUR LIVE API INTERFACE ===\n\n")

sample_flight_1 <- list(
  Airline = "AA",
  Origin = "JFK",
  Destination = "LAX",
  CRSDepTime = 1830,
  CRSArrTime = 2145,
  FlightDate = "2026-07-15",
  Distance = 2475
)

sample_flight_2 <- list(
  Airline = "DL",
  Origin = "ATL",
  Destination = "ORD",
  CRSDepTime = 0715,
  CRSArrTime = 0845,
  FlightDate = "2026-03-10",
  Distance = 606
)

pred1 <- predict_skyhour_delay(sample_flight_1)
pred2 <- predict_skyhour_delay(sample_flight_2)

cat("Sample Flight 1 Response (Evening JFK -> LAX):\n")
cat(toJSON(pred1, pretty = TRUE, auto_unbox = TRUE), "\n\n")

cat("Sample Flight 2 Response (Early Morning ATL -> ORD):\n")
cat(toJSON(pred2, pretty = TRUE, auto_unbox = TRUE), "\n\n")

cat("=== LIVE API PREDICTOR INTERFACE READY ===\n")
