# ==============================================================================
# SKYHOUR: Universal Search & Data Normalization Service
# ==============================================================================
# Objective: Parses and normalizes search queries (airports, routes, flights, airlines)
# and returns structured, categorized search results fast.
# ==============================================================================

library(dplyr)
library(jsonlite)

source_if_needed <- function(filename) {
  candidates <- c(file.path("R/services", filename), file.path("services", filename), file.path("../R/services", filename))
  for (c in candidates) {
    if (file.exists(c)) { source(c); return(TRUE) }
  }
}

source_if_needed("demo_flight_service.R")

search_cache <- new.env(parent = emptyenv())
search_cache$initialized <- FALSE

load_search_masters <- function() {
  if (search_cache$initialized) return(TRUE)
  
  airports_df <- bind_rows(lapply(AIRPORT_MASTERS, function(m) {
    data.frame(
      iata = m$iata, icao = m$icao, city = m$city, country = m$country,
      lat = m$lat, lon = m$lon, name = paste(m$city, "Airport"),
      stringsAsFactors = FALSE
    )
  }))
  
  airlines_df <- bind_rows(lapply(AIRLINE_MASTERS, function(m) {
    data.frame(
      iata = m$iata, icao = m$icao, name = m$name, country = m$country,
      stringsAsFactors = FALSE
    )
  }))
  
  routes_df <- data.frame(
    origin = c("MAA", "DEL", "MAA", "BOM", "DEL", "BLR", "JFK", "SFO"),
    destination = c("DEL", "MAA", "BOM", "MAA", "BOM", "DEL", "LAX", "JFK"),
    distance = c(1100, 1100, 640, 640, 710, 1070, 2475, 2580),
    stringsAsFactors = FALSE
  )
  
  assign("airports_df", airports_df, envir = search_cache)
  assign("airlines_df", airlines_df, envir = search_cache)
  assign("routes_df", routes_df, envir = search_cache)
  search_cache$initialized <- TRUE
}

universal_search <- function(query = "") {
  raw_q <- trimws(query)
  if (nchar(raw_q) == 0) {
    return(list(status = "SUCCESS", query = "", total_results = 0, results = list()))
  }
  
  load_search_masters()
  airports_df <- get("airports_df", envir = search_cache)
  airlines_df <- get("airlines_df", envir = search_cache)
  routes_df   <- get("routes_df", envir = search_cache)
  
  clean_q <- toupper(raw_q)
  clean_alphanumeric <- gsub("[^A-Z0-9]", "", clean_q)
  
  results <- list()
  
  # 1. Route Check (e.g. "MAA DEL", "MAA-DEL", "Chennai Delhi")
  route_parts <- unlist(strsplit(gsub("[-_]", " ", clean_q), "\\s+"))
  if (length(route_parts) == 2) {
    orig_candidate <- route_parts[1]
    dest_candidate <- route_parts[2]
    
    match_o <- Filter(function(m) m$iata == orig_candidate || toupper(m$city) == orig_candidate, AIRPORT_MASTERS)
    match_d <- Filter(function(m) m$iata == dest_candidate || toupper(m$city) == dest_candidate, AIRPORT_MASTERS)
    
    if (length(match_o) > 0 && length(match_d) > 0) {
      o_code <- match_o[[1]]$iata
      d_code <- match_d[[1]]$iata
      results[[length(results) + 1]] <- list(
        type = "ROUTE",
        id = paste0(o_code, "-", d_code),
        title = paste0(match_o[[1]]$city, " (", o_code, ") → ", match_d[[1]]$city, " (", d_code, ")"),
        subtitle = "Direct Flight Route",
        origin = o_code,
        destination = d_code,
        url = paste0("/route/", o_code, "/", d_code)
      )
    }
  }
  
  # 2. Airport Check (e.g. "MAA", "VOMM", "Chennai", "Delhi")
  matching_airports <- airports_df |> filter(
    iata == clean_q | icao == clean_q | toupper(city) == clean_q | grepl(clean_q, toupper(name), fixed = TRUE)
  )
  if (nrow(matching_airports) > 0) {
    for (i in seq_len(nrow(matching_airports))) {
      row <- matching_airports[i, ]
      results[[length(results) + 1]] <- list(
        type = "AIRPORT",
        id = row$iata,
        title = paste0(row$name, " (", row$iata, ")"),
        subtitle = paste0(row$city, ", ", row$country),
        code = row$iata,
        icao = row$icao,
        latitude = row$lat,
        longitude = row$lon,
        url = paste0("/airport/", row$iata)
      )
    }
  }
  
  # 3. Airline Check (e.g. "IndiGo", "Air India", "6E", "AI", "Indigo")
  matching_airlines <- airlines_df |> filter(
    iata == clean_q | icao == clean_q | grepl(clean_q, toupper(name), fixed = TRUE)
  )
  if (nrow(matching_airlines) > 0) {
    for (i in seq_len(nrow(matching_airlines))) {
      row <- matching_airlines[i, ]
      results[[length(results) + 1]] <- list(
        type = "AIRLINE",
        id = row$iata,
        title = paste0(row$name, " (", row$iata, ")"),
        subtitle = paste0(row$country, " Flag Carrier"),
        code = row$iata,
        url = paste0("/airline/", row$iata)
      )
    }
  }
  
  # 4. Flight Check (e.g. "AI302", "6E123", "AI 302", "ai-302" - MUST contain numbers)
  if (grepl("^[A-Z0-9]{3,7}$", clean_alphanumeric) && grepl("[0-9]", clean_alphanumeric)) {
    df <- load_synthetic_dataset()
    matched_f <- df |> filter(toupper(gsub("[^A-Za-z0-9]", "", flight_number)) == clean_alphanumeric) |> head(1)
    
    f_num <- if (nrow(matched_f) > 0) matched_f$flight_number[1] else clean_alphanumeric
    airline_name <- if (nrow(matched_f) > 0) matched_f$airline[1] else "Scheduled Flight"
    orig <- if (nrow(matched_f) > 0) matched_f$origin[1] else "MAA"
    dest <- if (nrow(matched_f) > 0) matched_f$destination[1] else "DEL"
    
    results[[length(results) + 1]] <- list(
      type = "FLIGHT",
      id = f_num,
      title = paste0("Flight ", f_num, " (", airline_name, ")"),
      subtitle = paste0(orig, " → ", dest),
      flight_number = f_num,
      origin = orig,
      destination = dest,
      url = paste0("/flight/", f_num)
    )
  }
  
  list(
    status = "SUCCESS",
    query = raw_q,
    normalized_query = clean_alphanumeric,
    total_results = length(results),
    results = results
  )
}
