# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 04: Pre-Flight Feature Engineering
# ==============================================================================
# Objective: Derive pre-flight temporal, schedule, route, and calendar features
# without introducing data leakage.
# ==============================================================================

library(arrow)
library(dplyr)
library(lubridate)
library(stringr)

set.seed(42)

# Haversine distance calculator helper function (for API compatibility validation)
haversine_distance <- function(lat1, lon1, lat2, lon2) {
  r <- 3958.8 # Earth radius in miles
  phi1 <- lat1 * pi / 180
  phi2 <- lat2 * pi / 180
  delta_phi <- (lat2 - lat1) * pi / 180
  delta_lambda <- (lon2 - lon1) * pi / 180
  
  a <- sin(delta_phi / 2)^2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2)^2
  c <- 2 * atan2(sqrt(a), sqrt(1 - a))
  return(r * c)
}

parquet_path <- "data/processed/cleaned_flights.parquet"
if (!file.exists(parquet_path)) stop("Cleaned dataset not found!")

cat("=== SKYHOUR FEATURE ENGINEERING STARTED ===\n")
dataset <- open_dataset(parquet_path)

# Feature engineering transformer function applied to Arrow dataset/data.frame
engineer_features_df <- function(df) {
  df %>% 
    mutate(
      # Schedule Time Parsing
      ScheduledDepartureHour = as.integer(CRSDepTime %/% 100),
      ScheduledDepartureMinute = as.integer(CRSDepTime %% 100),
      ScheduledArrivalHour = as.integer(CRSArrTime %/% 100),
      ScheduledArrivalMinute = as.integer(CRSArrTime %% 100),
      
      # Time of Day Block
      TimeOfDayCategory = case_when(
        ScheduledDepartureHour >= 4 & ScheduledDepartureHour < 8 ~ "EarlyMorning",
        ScheduledDepartureHour >= 8 & ScheduledDepartureHour < 12 ~ "Morning",
        ScheduledDepartureHour >= 12 & ScheduledDepartureHour < 16 ~ "Afternoon",
        ScheduledDepartureHour >= 16 & ScheduledDepartureHour < 20 ~ "Evening",
        TRUE ~ "Night"
      ),
      
      # Date / Seasonal Features
      WeekOfYear = as.integer(isoweek(as.Date(FlightDate))),
      IsWeekend = as.integer(DayOfWeek %in% c(6, 7)),
      IsSummer = as.integer(Month %in% c(6, 7, 8)),
      IsWinter = as.integer(Month %in% c(12, 1, 2)),
      
      # Route Identifier
      Route = paste0(Origin, "_", Dest)
    )
}

output_path <- "data/processed/engineered_flights.parquet"
cat("Writing engineered dataset to:", output_path, "...\n")

# Process and write using Arrow
df_raw <- dataset %>% collect()
df_engineered <- engineer_features_df(df_raw)

write_parquet(df_engineered, output_path)

cat(sprintf("Engineered dataset written successfully! Rows: %s, Columns: %d\n",
            format(nrow(df_engineered), big.mark=","), ncol(df_engineered)))

cat("=== FEATURE ENGINEERING COMPLETE ===\n")
