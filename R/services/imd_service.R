# ==============================================================================
# SKYHOUR: IMD Weather Service Module
# ==============================================================================

source_rel <- function(f) {
  paths <- c(file.path("R/services", f), file.path("services", f), file.path("../R/services", f), f)
  for (p in paths) if (file.exists(p)) { source(p); return() }
}
source_rel("aviation_weather_service.R")
source_rel("openmeteo_service.R")

get_india_airport_weather <- function(station_code, lat = NULL, lon = NULL) {
  code <- toupper(trimws(station_code))
  
  icao_code <- code
  if (nchar(code) == 3) {
    iata_to_icao <- c(
      "MAA" = "VOMM", "DEL" = "VIDP", "BOM" = "VABB", "BLR" = "VOBL",
      "HYD" = "VOHS", "CCU" = "VECC", "COK" = "VOCI", "TRV" = "VOTV",
      "AMD" = "VAAH", "PNQ" = "VAPO", "GOI" = "VOGO", "IXM" = "VOMD"
    )
    if (code %in% names(iata_to_icao)) icao_code <- iata_to_icao[[code]]
  }
  
  metar_res <- get_airport_metar(icao_code)
  if (!is.null(metar_res) && metar_res$status == "SUCCESS") {
    metar_res$source <- "AviationWeather / IMD Synoptic Network"
    return(metar_res)
  }
  
  if (!is.null(lat) && !is.null(lon)) {
    om_res <- get_openmeteo_weather(lat, lon)
    if (!is.null(om_res) && om_res$status == "SUCCESS") {
      om_res$station <- code
      om_res$source <- "Open-Meteo (IMD Fallback)"
      return(om_res)
    }
  }
  
  list(status = "UNAVAILABLE", message = paste("Weather currently unavailable for station", code), station = code)
}
