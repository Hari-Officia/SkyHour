# ==============================================================================
# SKYHOUR: OpenSky Network API Service Module (OAuth2 + Non-Blocking)
# ==============================================================================
# Objective: Authenticate with OpenSky Network using OAuth2 client credentials,
# maintain automatic Bearer token lifecycle, and fetch live state vectors safely.
# If OpenSky is unavailable, rate-limited, or unauthorized, returns structured error.
# ==============================================================================

library(jsonlite)
library(curl)

opensky_env <- new.env(parent = emptyenv())
opensky_env$token <- NULL
opensky_env$token_expiry <- 0
opensky_env$cached_states <- NULL
opensky_env$cached_states_time <- 0

get_opensky_credentials <- function() {
  client_id <- Sys.getenv("OPENSKY_CLIENT_ID", "")
  client_secret <- Sys.getenv("OPENSKY_CLIENT_SECRET", "")
  
  if (nchar(client_id) == 0 || nchar(client_secret) == 0) {
    cred_file <- "credentials.json"
    if (!file.exists(cred_file) && file.exists("../credentials.json")) cred_file <- "../credentials.json"
    if (!file.exists(cred_file) && file.exists("../../credentials.json")) cred_file <- "../../credentials.json"
    
    if (file.exists(cred_file)) {
      tryCatch({
        creds <- jsonlite::fromJSON(cred_file)
        client_id <- creds$clientId %||% creds$client_id %||% ""
        client_secret <- creds$clientSecret %||% creds$client_secret %||% ""
      }, error = function(e) {})
    }
  }
  
  list(client_id = as.character(client_id), client_secret = as.character(client_secret))
}

get_opensky_access_token <- function() {
  now <- as.numeric(Sys.time())
  if (!is.null(opensky_env$token) && opensky_env$token_expiry > (now + 60)) {
    return(opensky_env$token)
  }
  
  creds <- get_opensky_credentials()
  if (nchar(creds$client_id) == 0 || nchar(creds$client_secret) == 0) return(NULL)
  
  token_url <- "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
  
  body <- paste0("grant_type=client_credentials&client_id=", curl::curl_escape(creds$client_id), "&client_secret=", curl::curl_escape(creds$client_secret))
  
  h <- curl::new_handle()
  curl::handle_setopt(h, timeout = 5, postfields = charToRaw(body))
  curl::handle_setheaders(h, "Content-Type" = "application/x-www-form-urlencoded")
  
  res <- tryCatch({ curl::curl_fetch_memory(token_url, handle = h) }, error = function(e) NULL)
  
  if (!is.null(res) && res$status_code == 200) {
    body_json <- tryCatch(jsonlite::fromJSON(rawToChar(res$content), simplifyVector = FALSE), error = function(e) NULL)
    if (!is.null(body_json$access_token)) {
      opensky_env$token <- body_json$access_token
      expires_in <- body_json$expires_in %||% 1800
      opensky_env$token_expiry <- now + as.numeric(expires_in)
      return(opensky_env$token)
    }
  }
  
  return(NULL)
}

fetch_opensky_states <- function(bbox = NULL, icao24 = NULL) {
  now <- as.numeric(Sys.time())
  
  # Return cached states if fetched within last 15 seconds to prevent rate-limit thrashing
  if (is.null(bbox) && is.null(icao24) && !is.null(opensky_env$cached_states) && (now - opensky_env$cached_states_time) < 15) {
    return(opensky_env$cached_states)
  }
  
  token <- get_opensky_access_token()
  url <- "https://opensky-network.org/api/states/all"
  
  params <- c()
  if (!is.null(bbox) && length(bbox) == 4) {
    params <- c(params, paste0("lamin=", bbox[1]), paste0("lomin=", bbox[2]), paste0("lamax=", bbox[3]), paste0("lomax=", bbox[4]))
  }
  if (!is.null(icao24)) {
    params <- c(params, paste0("icao24=", curl::curl_escape(tolower(trimws(icao24)))))
  }
  if (length(params) > 0) {
    url <- paste0(url, "?", paste(params, collapse = "&"))
  }
  
  h <- curl::new_handle()
  curl::handle_setopt(h, timeout = 4) # 4 second network timeout
  if (!is.null(token)) {
    curl::handle_setheaders(h, "Authorization" = paste("Bearer", token))
  }
  
  res <- tryCatch({ curl::curl_fetch_memory(url, handle = h) }, error = function(e) NULL)
  
  if (is.null(res)) {
    result <- list(
      status = "API_UNAVAILABLE",
      source = "OpenSky Network",
      message = "OpenSky API is temporarily unreachable.",
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
      states = list()
    )
    if (is.null(bbox) && is.null(icao24)) assign("cached_states", result, envir = opensky_env)
    return(result)
  }
  
  if (res$status_code == 200) {
    data <- jsonlite::fromJSON(rawToChar(res$content), simplifyVector = FALSE)
    raw_states <- data$states
    if (is.null(raw_states) || length(raw_states) == 0) {
      result <- list(
        status = "NO_DATA",
        source = "OpenSky Network",
        message = "No live aircraft found in requested region.",
        time = data$time,
        timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
        states = list()
      )
      if (is.null(bbox) && is.null(icao24)) assign("cached_states", result, envir = opensky_env)
      return(result)
    }
    
    parsed <- lapply(raw_states, function(s) {
      list(
        icao24 = s[[1]],
        callsign = trimws(s[[2]] %||% ""),
        origin_country = s[[3]] %||% "Unknown",
        time_position = s[[4]],
        last_contact = s[[5]],
        longitude = s[[6]],
        latitude = s[[7]],
        baro_altitude_m = s[[8]],
        on_ground = s[[9]] %||% FALSE,
        velocity_ms = s[[10]],
        true_track_deg = s[[11]],
        vertical_rate_ms = s[[12]],
        geo_altitude_m = s[[14]],
        squawk = s[[15]],
        position_source = s[[17]]
      )
    })
    
    result <- list(
      status = "SUCCESS",
      source = "OpenSky Network (Live)",
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
      time = data$time,
      count = length(parsed),
      states = parsed
    )
    if (is.null(bbox) && is.null(icao24)) {
      opensky_env$cached_states <- result
      opensky_env$cached_states_time <- now
    }
    return(result)
  } else if (res$status_code == 429) {
    result <- list(
      status = "RATE_LIMITED",
      source = "OpenSky Network",
      message = "OpenSky API rate limit reached.",
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
      states = list()
    )
    return(result)
  }
  
  list(
    status = "API_ERROR",
    source = "OpenSky Network",
    message = paste("OpenSky returned HTTP status code", res$status_code),
    timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
    states = list()
  )
}

get_aircraft_telemetry_by_identifier <- function(identifier) {
  clean_id <- trimws(identifier)
  if (nchar(clean_id) == 0) return(NULL)
  
  is_hex <- grepl("^[0-9a-fA-F]{6}$", clean_id)
  if (is_hex) {
    res <- fetch_opensky_states(icao24 = clean_id)
    if (res$status == "SUCCESS" && length(res$states) > 0) {
      return(res$states[[1]])
    }
  }
  
  # Search cached live state vectors
  if (!is.null(opensky_env$cached_states) && opensky_env$cached_states$status == "SUCCESS") {
    clean_id_upper <- toupper(gsub("[^A-Za-z0-9]", "", clean_id))
    matches <- Filter(function(s) {
      callsign_clean <- toupper(gsub("[^A-Za-z0-9]", "", s$callsign))
      callsign_clean == clean_id_upper
    }, opensky_env$cached_states$states)
    
    if (length(matches) > 0) return(matches[[1]])
  }
  
  return(NULL)
}
