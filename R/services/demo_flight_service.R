# ==============================================================================
# SKYHOUR: Synthetic Flight Dataset Generator & Demo Simulation Engine
# ==============================================================================
# Objective: Provides a 10,000+ record synthetic flight dataset with physical,
# temporal, and spatial logical consistency. Used for DEMO MODE when real-time APIs
# are unavailable or when requested.
# ==============================================================================

library(dplyr)
library(lubridate)
library(jsonlite)

demo_env <- new.env(parent = emptyenv())
demo_env$flights_df <- NULL

# Master Airport Database with real coordinates and IANA timezones
AIRPORT_MASTERS <- list(
  MAA = list(iata = "MAA", icao = "VOMM", city = "Chennai", country = "India", lat = 12.9941, lon = 80.1709, tz = "Asia/Kolkata"),
  DEL = list(iata = "DEL", icao = "VIDP", city = "Delhi", country = "India", lat = 28.5562, lon = 77.1000, tz = "Asia/Kolkata"),
  BOM = list(iata = "BOM", icao = "VABB", city = "Mumbai", country = "India", lat = 19.0896, lon = 72.8656, tz = "Asia/Kolkata"),
  BLR = list(iata = "BLR", icao = "VOBL", city = "Bengaluru", country = "India", lat = 13.1986, lon = 77.7066, tz = "Asia/Kolkata"),
  CCU = list(iata = "CCU", icao = "VECC", city = "Kolkata", country = "India", lat = 22.6547, lon = 88.4467, tz = "Asia/Kolkata"),
  HYD = list(iata = "HYD", icao = "VOHS", city = "Hyderabad", country = "India", lat = 17.2403, lon = 78.4294, tz = "Asia/Kolkata"),
  JFK = list(iata = "JFK", icao = "KJFK", city = "New York", country = "USA", lat = 40.6413, lon = -73.7781, tz = "America/New_York"),
  LAX = list(iata = "LAX", icao = "KLAX", city = "Los Angeles", country = "USA", lat = 33.9416, lon = -118.4085, tz = "America/Los_Angeles"),
  ORD = list(iata = "ORD", icao = "KORD", city = "Chicago", country = "USA", lat = 41.9742, lon = -87.9073, tz = "America/Chicago"),
  DFW = list(iata = "DFW", icao = "KDFW", city = "Dallas", country = "USA", lat = 32.8998, lon = -97.0403, tz = "America/Chicago"),
  SFO = list(iata = "SFO", icao = "KSFO", city = "San Francisco", country = "USA", lat = 37.6213, lon = -122.3790, tz = "America/Los_Angeles"),
  LHR = list(iata = "LHR", icao = "EGLL", city = "London", country = "UK", lat = 51.4700, lon = -0.4543, tz = "Europe/London")
)

AIRLINE_MASTERS <- list(
  "6E" = list(iata = "6E", icao = "IGO", name = "IndiGo", country = "India"),
  "AI" = list(iata = "AI", icao = "AIC", name = "Air India", country = "India"),
  "SG" = list(iata = "SG", icao = "SEJ", name = "SpiceJet", country = "India"),
  "UK" = list(iata = "UK", icao = "VTI", name = "Vistara", country = "India"),
  "AA" = list(iata = "AA", icao = "AAL", name = "American Airlines", country = "USA"),
  "DL" = list(iata = "DL", icao = "DAL", name = "Delta Air Lines", country = "USA"),
  "UA" = list(iata = "UA", icao = "UAL", name = "United Airlines", country = "USA"),
  "BA" = list(iata = "BA", icao = "BAW", name = "British Airways", country = "UK")
)

calc_haversine_miles <- function(lat1, lon1, lat2, lon2) {
  R <- 3958.8 # Radius of Earth in miles
  dlat <- (lat2 - lat1) * pi / 180
  dlon <- (lon2 - lon1) * pi / 180
  a <- sin(dlat/2)^2 + cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * sin(dlon/2)^2
  c <- 2 * atan2(sqrt(a), sqrt(1 - a))
  round(R * c)
}

generate_synthetic_dataset <- function(n_records = 10000) {
  cat(sprintf("Generating %d realistic synthetic flight records...\n", n_records))
  set.seed(42) # Reproducible deterministic generation
  
  airports <- names(AIRPORT_MASTERS)
  airlines <- names(AIRLINE_MASTERS)
  
  routes_pool <- list(
    c("MAA", "DEL"), c("DEL", "MAA"), c("MAA", "BOM"), c("BOM", "MAA"),
    c("DEL", "BOM"), c("BOM", "DEL"), c("BLR", "DEL"), c("DEL", "BLR"),
    c("MAA", "BLR"), c("BLR", "MAA"), c("CCU", "DEL"), c("HYD", "BOM"),
    c("JFK", "LAX"), c("LAX", "JFK"), c("ORD", "DFW"), c("DFW", "ORD"),
    c("SFO", "JFK"), c("JFK", "LHR"), c("LHR", "JFK"), c("LAX", "ORD")
  )
  
  statuses <- c("SCHEDULED", "BOARDING", "DEPARTED", "AIRBORNE", "LANDED", "CANCELLED")
  status_weights <- c(0.20, 0.10, 0.10, 0.35, 0.20, 0.05)
  
  base_date <- as.Date("2026-09-01")
  
  records <- vector("list", n_records)
  
  for (i in seq_len(n_records)) {
    route_pair <- routes_pool[[sample(length(routes_pool), 1)]]
    orig_code <- route_pair[1]
    dest_code <- route_pair[2]
    
    orig_info <- AIRPORT_MASTERS[[orig_code]]
    dest_info <- AIRPORT_MASTERS[[dest_code]]
    
    carrier_code <- if (orig_info$country == "India") {
      sample(c("6E", "AI", "SG", "UK"), 1, prob = c(0.5, 0.25, 0.15, 0.10))
    } else {
      sample(c("AA", "DL", "UA", "BA"), 1, prob = c(0.35, 0.30, 0.25, 0.10))
    }
    
    airline_info <- AIRLINE_MASTERS[[carrier_code]]
    
    f_num <- sample(100:999, 1)
    flight_num <- paste0(carrier_code, f_num)
    callsign <- paste0(airline_info$icao, f_num)
    
    day_offset <- sample(0:30, 1)
    flight_date <- base_date + day_offset
    
    dep_hour <- sample(5:23, 1, prob = c(rep(0.04, 2), rep(0.08, 4), rep(0.06, 5), rep(0.08, 4), rep(0.04, 4)))
    dep_min <- sample(c(0, 15, 30, 45), 1)
    
    sch_dep_time <- sprintf("%02d%02d", dep_hour, dep_min)
    dist <- calc_haversine_miles(orig_info$lat, orig_info$lon, dest_info$lat, dest_info$lon)
    flight_duration_mins <- round((dist / 450) * 60 + 30) # Average speed 450 mph + 30 min taxi
    
    arr_hour <- (dep_hour + (flight_duration_mins %/% 60)) %% 24
    arr_min <- (dep_min + (flight_duration_mins %% 60)) %% 60
    sch_arr_time <- sprintf("%02d%02d", arr_hour, arr_min)
    
    # Traffic pressure & Weather severity factors
    traffic_pressure <- round(runif(1, 40, 95), 1)
    weather_sev <- sample(c("CLEAR", "PARTLY CLOUDY", "RAIN", "THUNDERSTORM", "FOG"), 1, prob = c(0.50, 0.25, 0.15, 0.07, 0.03))
    
    # Realistic delay calculation (peak hours 16-20 have higher delays)
    is_peak <- dep_hour >= 16 && dep_hour <= 20
    delay_prob <- clamp((0.15 + (is_peak * 0.18) + (traffic_pressure / 300) + ifelse(weather_sev %in% c("THUNDERSTORM", "FOG"), 0.25, 0)), 0.05, 0.92)
    
    is_delayed <- runif(1) < delay_prob
    arr_delay_mins <- if (is_delayed) round(rexp(1, rate = 1/35) + 15) else round(rnorm(1, mean = 0, sd = 5))
    arr_delay_mins <- max(-15, arr_delay_mins)
    
    dep_delay_mins <- if (is_delayed) max(0, round(arr_delay_mins * runif(1, 0.8, 1.1))) else max(-10, round(rnorm(1, -2, 4)))
    
    status <- sample(statuses, 1, prob = status_weights)
    cancelled <- status == "CANCELLED"
    diverted <- FALSE
    
    if (cancelled) {
      arr_delay_mins <- 0
      dep_delay_mins <- 0
    }
    
    # Physical aircraft parameters
    ac_type <- sample(c("A320neo", "A321neo", "B737-800", "B787-9", "B777-300ER"), 1)
    icao24_hex <- sprintf("%06x", sample(1000000:16000000, 1))
    reg <- paste0(if (orig_info$country == "India") "VT-" else "N", sample(100:999, 1), sample(LETTERS, 2, replace = TRUE) |> paste(collapse=""))
    
    if (status == "CANCELLED") {
      lat <- NA; lon <- NA; alt <- 0; speed <- 0; heading <- 0
    } else if (status == "LANDED") {
      lat <- dest_info$lat; lon <- dest_info$lon; alt <- 0; speed <- 0; heading <- 0
    } else if (status %in% c("SCHEDULED", "BOARDING")) {
      lat <- orig_info$lat; lon <- orig_info$lon; alt <- 0; speed <- 0; heading <- 0
    } else {
      # AIRBORNE / DEPARTED / CRUISE - Great Circle Interpolation
      progress <- runif(1, 0.15, 0.85)
      lat <- round(orig_info$lat + progress * (dest_info$lat - orig_info$lat), 4)
      lon <- round(orig_info$lon + progress * (dest_info$lon - orig_info$lon), 4)
      alt <- round(runif(1, 28000, 38000))
      speed <- round(runif(1, 420, 490))
      heading <- round((atan2(dest_info$lon - orig_info$lon, dest_info$lat - orig_info$lat) * 180 / pi) %% 360)
    }
    
    records[[i]] <- list(
      flight_id = paste0(flight_num, "-", gsub("-", "", as.character(flight_date))),
      flight_number = flight_num,
      callsign = callsign,
      airline = airline_info$name,
      airline_iata = carrier_code,
      airline_icao = airline_info$icao,
      origin = orig_code,
      destination = dest_code,
      origin_city = orig_info$city,
      destination_city = dest_info$city,
      origin_icao = orig_info$icao,
      destination_icao = dest_info$icao,
      scheduled_departure = sch_dep_time,
      scheduled_arrival = sch_arr_time,
      estimated_departure = sch_dep_time,
      estimated_arrival = sch_arr_time,
      actual_departure = if (!cancelled && status != "SCHEDULED") sprintf("%02d%02d", (dep_hour + (dep_delay_mins %/% 60)) %% 24, (dep_min + (dep_delay_mins %% 60)) %% 60) else NA,
      actual_arrival = if (status == "LANDED") sprintf("%02d%02d", (arr_hour + (arr_delay_mins %/% 60)) %% 24, (arr_min + (arr_delay_mins %% 60)) %% 60) else NA,
      status = status,
      delay_minutes = arr_delay_mins,
      arrival_delay_minutes = arr_delay_mins,
      departure_delay_minutes = dep_delay_mins,
      cancelled = cancelled,
      diverted = diverted,
      aircraft_registration = reg,
      aircraft_type = ac_type,
      icao24 = icao24_hex,
      latitude = lat,
      longitude = lon,
      altitude = alt,
      ground_speed = speed,
      heading = heading,
      distance = dist,
      route = paste0(orig_code, "-", dest_code),
      day_of_week = wday(flight_date, label = TRUE, abbr = TRUE) |> as.character(),
      month = month(flight_date, label = TRUE, abbr = TRUE) |> as.character(),
      departure_hour = dep_hour,
      arrival_hour = arr_hour,
      weather_condition = weather_sev,
      temperature = round(runif(1, 15, 34), 1),
      wind_speed = round(runif(1, 4, 22), 1),
      visibility = round(runif(1, 3, 10), 1),
      rain = weather_sev %in% c("RAIN", "THUNDERSTORM"),
      traffic_pressure = traffic_pressure,
      historical_route_delay_rate = round(delay_prob, 4),
      historical_airline_delay_rate = round(delay_prob * 0.9, 4),
      delay_probability = round(delay_prob, 4),
      is_demo = TRUE,
      data_mode = "DEMO DATA"
    )
  }
  
  df <- bind_rows(records)
  
  save_dir <- "data/processed"
  if (!dir.exists(save_dir)) dir.create(save_dir, recursive = TRUE)
  saveRDS(df, file.path(save_dir, "synthetic_flights.rds"))
  cat(sprintf("Saved %d synthetic flight records to data/processed/synthetic_flights.rds\n", nrow(df)))
  df
}

clamp <- function(val, min_v, max_v) pmax(min_v, pmin(max_v, val))

load_synthetic_dataset <- function() {
  if (!is.null(demo_env$flights_df)) return(demo_env$flights_df)
  
  path <- "data/processed/synthetic_flights.rds"
  if (!file.exists(path) && file.exists("../data/processed/synthetic_flights.rds")) path <- "../data/processed/synthetic_flights.rds"
  
  if (file.exists(path)) {
    demo_env$flights_df <- readRDS(path)
  } else {
    demo_env$flights_df <- generate_synthetic_dataset(10000)
  }
  
  demo_env$flights_df
}
