# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 02: Data Cleaning & Pre-Flight Leakage Prevention
# ==============================================================================
# Objective: Filter non-operated (cancelled/diverted) flights, exclude all
# post-flight outcome variables, and save a clean pre-flight dataset.
# ==============================================================================

library(arrow)
library(dplyr)
library(stringr)

set.seed(42)

parquet_path <- "data/Combined_Flights_2022.parquet"
if (!file.exists(parquet_path)) {
  if (file.exists("data/raw/Combined_Flights_2022.parquet")) {
    parquet_path <- "data/raw/Combined_Flights_2022.parquet"
  } else {
    stop("Dataset parquet file not found!")
  }
}

cat("=== SKYHOUR DATA CLEANING STARTED ===\n")
dataset <- open_dataset(parquet_path)
initial_rows <- nrow(dataset)

# 1. Filter out Cancelled/Diverted flights where ArrDel15 is NA
cat("Filtering records with invalid/missing ArrDel15 target...\n")
cleaned_dataset <- dataset %>% 
  filter(!is.na(ArrDel15)) %>% 
  filter(Cancelled == FALSE | Cancelled == 0) %>% 
  filter(Diverted == FALSE | Diverted == 0)

# Collect count safely
cleaned_rows <- cleaned_dataset %>% summarize(n = n()) %>% collect() %>% pull(n)
removed_rows <- initial_rows - cleaned_rows

cat(sprintf("Initial Records: %s\n", format(initial_rows, big.mark = ",")))
cat(sprintf("Cleaned Operated Records: %s\n", format(cleaned_rows, big.mark = ",")))
cat(sprintf("Removed Records (Cancelled/Diverted): %s (%.2f%%)\n", 
            format(removed_rows, big.mark = ","), removed_rows / initial_rows * 100))

# 2. Select pre-flight features + target (ArrDel15)
preflight_columns <- c(
  "FlightDate", "Year", "Quarter", "Month", "DayofMonth", "DayOfWeek",
  "IATA_Code_Marketing_Airline", "IATA_Code_Operating_Airline", "Airline",
  "Origin", "OriginCityName", "OriginState",
  "Dest", "DestCityName", "DestState",
  "CRSDepTime", "CRSArrTime", "DepTimeBlk", "ArrTimeBlk", "Distance",
  "ArrDel15"
)

# Verify no leak columns are included in preflight_columns
leak_columns_check <- c(
  "ArrDelay", "ArrDelayMinutes", "ArrTime", "DepDelay", "DepDelayMinutes", 
  "DepDel15", "DepTime", "ActualElapsedTime", "AirTime", "TaxiOut", "TaxiIn", 
  "WheelsOff", "WheelsOn", "DepartureDelayGroups", "ArrivalDelayGroups"
)

leak_found <- intersect(preflight_columns, leak_columns_check)
if (length(leak_found) > 0) {
  stop(paste("CRITICAL ERROR: Data leakage detected! Found post-flight columns:", paste(leak_found, collapse = ", ")))
}

cat("Pre-flight columns selected successfully. Zero leakage columns present.\n")

# 3. Write cleaned dataset to data/processed/cleaned_flights.parquet
output_path <- "data/processed/cleaned_flights.parquet"
cat("Writing cleaned dataset to:", output_path, "...\n")

cleaned_dataset %>% 
  select(all_of(preflight_columns)) %>% 
  write_parquet(output_path)

cat("Cleaned parquet written successfully!\n")

# 4. Generate Data Cleaning Log Report
log_path <- "reports/data_cleaning_log.md"
sink(log_path)

cat("# SKYHOUR Data Cleaning & Leakage Audit Log\n\n")
cat(sprintf("**Date**: %s  \n", Sys.Date()))
cat(sprintf("**Input Dataset**: `%s`  \n", parquet_path))
cat(sprintf("**Output Cleaned Dataset**: `%s`  \n\n", output_path))

cat("## 1. Record Filtering Summary\n\n")
cat("| Metric | Value |\n")
cat("| :--- | :--- |\n")
cat(sprintf("| **Raw Input Records** | %s |\n", format(initial_rows, big.mark = ",")))
cat(sprintf("| **Removed Cancelled/Diverted Flights (NA ArrDel15)** | %s (%.2f%%) |\n", format(removed_rows, big.mark = ","), removed_rows / initial_rows * 100))
cat(sprintf("| **Final Cleaned Operated Flights** | %s (%.2f%%) |\n\n", format(cleaned_rows, big.mark = ","), cleaned_rows / initial_rows * 100))

cat("## 2. Rationale for Record Exclusion\n\n")
cat("Cancelled and diverted flights do not have a valid arrival delay duration or standard target value (`ArrDel15 = NA`).  \n")
cat("Treating cancelled flights as arrival delayed would introduce significant label noise.  \n")
cat("Therefore, for the primary arrival delay prediction model, we restrict training and evaluation strictly to operated flights with verified arrival outcomes.  \n\n")

cat("## 3. Pre-Flight Feature Schema & Data Leakage Audit\n\n")
cat("| Feature Name | Type | Purpose | Pre-Flight Status |\n")
cat("| :--- | :--- | :--- | :--- |\n")
cat("| `FlightDate` | Timestamp | Temporal Split & Seasonal Feature | Allowed |\n")
cat("| `Year`, `Quarter`, `Month` | Integer | Seasonal indicators | Allowed |\n")
cat("| `DayofMonth`, `DayOfWeek` | Integer | Weekly schedule indicators | Allowed |\n")
cat("| `IATA_Code_Marketing_Airline` | String | Marketing Carrier Code | Allowed |\n")
cat("| `IATA_Code_Operating_Airline` | String | Operating Carrier Code | Allowed |\n")
cat("| `Airline` | String | Carrier Full Name | Allowed |\n")
cat("| `Origin`, `Dest` | String | Airport Codes | Allowed |\n")
cat("| `OriginCityName`, `DestCityName` | String | City Identifiers | Allowed |\n")
cat("| `CRSDepTime`, `CRSArrTime` | Integer | Scheduled Times (HHMM) | Allowed |\n")
cat("| `DepTimeBlk`, `ArrTimeBlk` | String | Scheduled Hourly Time Blocks | Allowed |\n")
cat("| `Distance` | Double | Flight Route Distance (miles) | Allowed |\n")
cat("| `ArrDel15` | Double | Target Variable (0 = On-Time, 1 = Delayed) | **TARGET ONLY** |\n\n")

cat("### Excluded Leakage Columns List\n")
cat("The following 15 post-flight operational columns were **EXCLUDED** from the model schema:\n")
for (col in leak_columns_check) {
  cat(sprintf("- `%s` (Post-flight actual outcome)\n", col))
}

sink()

cat("=== DATA CLEANING COMPLETE ===\n")
cat("Log file created at:", log_path, "\n")
