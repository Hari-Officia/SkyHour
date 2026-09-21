# ==============================================================================
# SKYHOUR: Open-Meteo API Service Module
# ==============================================================================
# Purpose: Free weather forecast & historical feature retrieval per lat/lon.
# Uses 'curl' and 'jsonlite'.
# ==============================================================================

library(jsonlite)
library(curl)

openmeteo_cache <- new.env(parent = emptyenv())

get_openmeteo_weather <- function(lat, lon) {
  if (is.null(lat) || is.null(lon) || is.na(lat) || is.na(lon)) return(NULL)
  
  lat <- round(as.numeric(lat), 3)
  lon <- round(as.numeric(lon), 3)
  cache_key <- paste0("om_", lat, "_", lon)
  now <- as.numeric(Sys.time())
  
  if (exists(cache_key, envir = openmeteo_cache)) {
    entry <- get(cache_key, envir = openmeteo_cache)
    if (entry$expiry > now) return(entry$data)
  }
  
  url <- sprintf("https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&current_weather=true&timezone=UTC", lat, lon)
  h <- curl::new_handle()
  curl::handle_setopt(h, timeout = 8)
  
  res <- tryCatch({ curl::curl_fetch_memory(url, handle = h) }, error = function(e) NULL)
  
  if (is.null(res)) {
    return(list(status = "API_UNAVAILABLE", message = "Open-Meteo service unreachable."))
  }
  
  if (res$status_code == 200) {
    body <- jsonlite::fromJSON(rawToChar(res$content), simplifyVector = FALSE)
    curr <- body$current_weather
    
    result <- list(
      status = "SUCCESS",
      source = "Open-Meteo",
      latitude = lat,
      longitude = lon,
      temp_c = curr$temperature,
      wind_speed_kmh = curr$windspeed,
      wind_dir_deg = curr$winddirection,
      weather_code = curr$weathercode,
      time = curr$time
    )
    
    assign(cache_key, list(data = result, expiry = now + 900), envir = openmeteo_cache)
    return(result)
  }
  
  return(list(status = "API_ERROR", message = paste("Open-Meteo returned HTTP", res$status_code)))
}
