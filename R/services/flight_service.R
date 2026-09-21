# ==============================================================================
# SKYHOUR: Flight Intelligence & Real-Time Telemetry Service
# ==============================================================================
# Objective: Resolves flight queries dynamically against datasets and live OpenSky
# state vectors. Attaches pre-flight delay predictions and live telemetry.
# ==============================================================================

library(dplyr)
library(lubridate)

source_if_needed <- function(filename) {
  candidates <- c(file.path("R/services", filename), file.path("services", filename), file.path("../R/services", filename))
  for (c in candidates) {
    if (file.exists(c)) { source(c); return(TRUE) }
  }
}

source_if_needed("demo_flight_service.R")
source_if_needed("opensky_service.R")
source_if_needed("prediction_service.R")
source_if_needed("aviation_weather_service.R")

get_flight_details_service <- function(flight_id) {
  clean_id <- toupper(gsub("[^A-Za-z0-9]", "", flight_id))
  if (nchar(clean_id) == 0) {
    return(list(status = "INVALID_QUERY", message = "Flight identifier is required."))
  }
  
  df <- load_synthetic_dataset()
  
  # Search dataset for matching flight number or ID
  matched_flights <- df |> filter(
    toupper(gsub("[^A-Za-z0-9]", "", flight_number)) == clean_id |
    toupper(gsub("[^A-Za-z0-9]", "", flight_id)) == clean_id |
    toupper(gsub("[^A-Za-z0-9]", "", callsign)) == clean_id
  )
  
  flight_rec <- if (nrow(matched_flights) > 0) matched_flights[1, ] else NULL
  
  if (is.null(flight_rec)) {
    # Generate structured default for query if not in dataset
    carrier_code <- substr(clean_id, 1, 2)
    orig <- "MAA"
    dest <- "DEL"
    flight_num <- clean_id
    airline_name <- if (carrier_code == "6E") "IndiGo" else if (carrier_code == "AI") "Air India" else "Domestic Flight"
    sch_dep <- "1830"
    sch_arr <- "2115"
    ac_type <- "A320neo"
    status_str <- "AIRBORNE"
    is_demo_rec <- TRUE
  } else {
    carrier_code <- flight_rec$airline_iata
    orig <- flight_rec$origin
    dest <- flight_rec$destination
    flight_num <- flight_rec$flight_number
    airline_name <- flight_rec$airline
    sch_dep <- flight_rec$scheduled_departure
    sch_arr <- flight_rec$scheduled_arrival
    ac_type <- flight_rec$aircraft_type
    status_str <- flight_rec$status
    is_demo_rec <- flight_rec$is_demo %||% TRUE
  }
  
  # Fetch Live Telemetry from OpenSky Network
  telemetry <- get_aircraft_telemetry_by_identifier(clean_id)
  is_live_telemetry <- !is.null(telemetry)
  
  # Generate Pre-Flight Delay Prediction using real query params
  prediction_res <- predict_flight_delay_service(
    flight_id = flight_num,
    origin = orig,
    destination = dest,
    carrier = carrier_code
  )
  
  # Fetch Weather at Origin Airport
  origin_weather <- tryCatch(get_india_airport_weather(orig), error = function(e) list(status = "UNAVAILABLE"))
  
  orig_master <- AIRPORT_MASTERS[[orig]] %||% list(city = orig, tz = "UTC", lat = 12.99, lon = 80.17)
  dest_master <- AIRPORT_MASTERS[[dest]] %||% list(city = dest, tz = "UTC", lat = 28.55, lon = 77.10)
  
  # Time Calculations
  now_utc <- Sys.time()
  dep_time_str <- paste(as.character(Sys.Date()), sprintf("%s:%s:00", substr(sch_dep, 1, 2), substr(sch_dep, 3, 4)))
  dep_datetime <- tryCatch(ymd_hms(dep_time_str, tz = "UTC"), error = function(e) now_utc + 3600*3)
  
  time_to_dep_sec <- as.numeric(difftime(dep_datetime, now_utc, units = "secs"))
  time_to_dep_hrs <- max(0, round(time_to_dep_sec / 3600, 1))
  
  list(
    status = "SUCCESS",
    data_mode = if (is_live_telemetry) "REAL (OpenSky Telemetry)" else "DEMO MODE",
    is_demo = !is_live_telemetry,
    flight_summary = list(
      flight_id = flight_num,
      flight_number = flight_num,
      callsign = paste0(carrier_code, clean_id),
      airline = airline_name,
      airline_iata = carrier_code,
      origin = orig,
      destination = dest,
      origin_city = orig_master$city,
      destination_city = dest_master$city,
      scheduled_departure = sch_dep,
      scheduled_arrival = sch_arr,
      status = status_str,
      aircraft_type = ac_type,
      departure_timezone = orig_master$tz,
      arrival_timezone = dest_master$tz
    ),
    time_intelligence = list(
      prediction_timestamp = format(now_utc, "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
      scheduled_departure_utc = format(dep_datetime, "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
      hours_to_departure = time_to_dep_hrs,
      prediction_horizon = paste0(time_to_dep_hrs, " hours prior to departure"),
      prediction_mode = "PRE-FLIGHT"
    ),
    prediction = prediction_res,
    live_telemetry = list(
      is_available = is_live_telemetry,
      source = if (is_live_telemetry) "OpenSky Network (Live)" else "Position unavailable — Demo dataset active",
      telemetry_data = telemetry %||% list(
        latitude = if (!is.null(flight_rec)) flight_rec$latitude else orig_master$lat,
        longitude = if (!is.null(flight_rec)) flight_rec$longitude else orig_master$lon,
        altitude_ft = if (!is.null(flight_rec)) flight_rec$altitude else 32000,
        ground_speed_knots = if (!is.null(flight_rec)) flight_rec$ground_speed else 440,
        heading_deg = if (!is.null(flight_rec)) flight_rec$heading else 45,
        status = status_str
      )
    ),
    origin_weather = origin_weather
  )
}
