# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 01: Data Audit and Profiling
# ==============================================================================
# Objective: Perform a memory-efficient audit of Combined_Flights_2022.parquet
# using Apache Arrow and dplyr to produce a comprehensive data quality report.
# ==============================================================================

library(arrow)
library(dplyr)
library(tidyr)
library(lubridate)
library(janitor)
library(stringr)

set.seed(42)

parquet_path <- "data/Combined_Flights_2022.parquet"
if (!file.exists(parquet_path)) {
  if (file.exists("data/raw/Combined_Flights_2022.parquet")) {
    parquet_path <- "data/raw/Combined_Flights_2022.parquet"
  } else {
    stop("Dataset parquet file not found in data/ or data/raw/!")
  }
}

cat("=== SKYHOUR DATA AUDIT STARTED ===\n")
cat("Opening Parquet Dataset:", parquet_path, "\n\n")

dataset <- open_dataset(parquet_path)

# 1. Row and Column counts
num_rows <- nrow(dataset)
num_cols <- ncol(dataset)
schema_obj <- dataset$schema
col_names <- names(schema_obj)

fmt_int <- function(x) format(as.numeric(x), big.mark = ",", scientific = FALSE)

cat(sprintf("1. Total Records: %s\n", fmt_int(num_rows)))
cat(sprintf("2. Total Columns: %d\n", num_cols))

# 3. Data types
col_types <- sapply(schema_obj$fields, function(f) f$type$ToString())
data_types_df <- data.frame(
  Column = col_names,
  Type = col_types,
  stringsAsFactors = FALSE
)

# 4 & 5. Missing values and percentages using Arrow query
cat("\nComputing column-level missingness via Arrow...\n")
null_counts_list <- list()

# Query in chunks of columns for speed
col_chunks <- split(col_names, ceiling(seq_along(col_names) / 10))
for (chunk in col_chunks) {
  exprs <- lapply(chunk, function(c) rlang::parse_expr(sprintf("sum(is.na(`%s`))", c)))
  names(exprs) <- chunk
  res <- dataset %>% summarize(!!!exprs) %>% collect()
  null_counts_list[[length(null_counts_list) + 1]] <- res
}
null_df <- bind_cols(null_counts_list)
null_summary <- data.frame(
  Column = names(null_df),
  Missing_Count = as.numeric(null_df[1, ]),
  Missing_Pct = round(as.numeric(null_df[1, ]) / num_rows * 100, 4),
  stringsAsFactors = FALSE
)

audit_col_summary <- left_join(data_types_df, null_summary, by = "Column")

# 6. Check duplicates (sample-based check for memory safety)
cat("Checking duplicate records...\n")
sample_df <- dataset %>% head(100000) %>% collect()
dups_in_sample <- sum(duplicated(sample_df))

# 7, 8, 9. Unique airlines, origin, dest
cat("Computing unique counts for key categorical fields...\n")
unique_marketing_airlines <- dataset %>% select(IATA_Code_Marketing_Airline) %>% distinct() %>% collect() %>% pull()
unique_operating_airlines <- dataset %>% select(IATA_Code_Operating_Airline) %>% distinct() %>% collect() %>% pull()
unique_airlines <- dataset %>% select(Airline) %>% distinct() %>% collect() %>% pull()
unique_origins <- dataset %>% select(Origin) %>% distinct() %>% collect() %>% pull()
unique_dests <- dataset %>% select(Dest) %>% distinct() %>% collect() %>% pull()

# 10. Date range
cat("Computing date range...\n")
date_range <- dataset %>% summarize(min_date = min(FlightDate), max_date = max(FlightDate)) %>% collect()

# 11 & 12. Cancelled and Diverted counts
cat("Auditing Cancelled and Diverted flights...\n")
status_counts <- dataset %>% 
  summarize(
    total_cancelled = sum(as.integer(Cancelled), na.rm = TRUE),
    total_diverted = sum(as.integer(Diverted), na.rm = TRUE)
  ) %>% collect()

# 13 & 14. Target ArrDel15 Distribution
cat("Auditing ArrDel15 Class Distribution...\n")
target_dist <- dataset %>% 
  group_by(ArrDel15) %>% 
  summarize(Count = n()) %>% 
  collect() %>% 
  mutate(
    Percentage = round(Count / sum(Count) * 100, 2),
    Label = case_when(
      is.na(ArrDel15) ~ "Missing / Invalid (Cancelled/Diverted)",
      ArrDel15 == 0 ~ "On-Time / Delay < 15m (0)",
      ArrDel15 == 1 ~ "Delayed >= 15m (1)"
    )
  )

# 15. Numerical summary for distance, CRS times
cat("Calculating numerical summary statistics...\n")
num_summary <- dataset %>% 
  select(Distance, CRSDepTime, CRSArrTime) %>% 
  collect() %>% 
  summarize(across(everything(), list(
    Min = ~min(.x, na.rm = TRUE),
    Q1 = ~quantile(.x, 0.25, na.rm = TRUE),
    Median = ~median(.x, na.rm = TRUE),
    Mean = ~mean(.x, na.rm = TRUE),
    Q3 = ~quantile(.x, 0.75, na.rm = TRUE),
    Max = ~max(.x, na.rm = TRUE),
    SD = ~sd(.x, na.rm = TRUE)
  )))

# Write clean report to reports/data_audit_report.md
report_path <- "reports/data_audit_report.md"
sink(report_path)

cat("# SKYHOUR Data Audit and Quality Report\n\n")
cat(sprintf("**Dataset File**: `%s`  \n", parquet_path))
cat(sprintf("**Audit Date**: %s  \n", Sys.Date()))
cat(sprintf("**R Version**: %s  \n\n", R.version.string))

cat("## 1. Executive Dataset Summary\n\n")
cat("| Metric | Value |\n")
cat("| :--- | :--- |\n")
cat(sprintf("| **Total Records** | %s |\n", fmt_int(num_rows)))
cat(sprintf("| **Total Columns** | %d |\n", num_cols))
cat(sprintf("| **Flight Date Range** | %s to %s |\n", as.character(date_range$min_date), as.character(date_range$max_date)))
cat(sprintf("| **Unique Marketing Carriers (IATA)** | %d |\n", length(unique_marketing_airlines[!is.na(unique_marketing_airlines)])))
cat(sprintf("| **Unique Operating Carriers (IATA)** | %d |\n", length(unique_operating_airlines[!is.na(unique_operating_airlines)])))
cat(sprintf("| **Unique Carrier Names** | %d |\n", length(unique_airlines[!is.na(unique_airlines)])))
cat(sprintf("| **Unique Origin Airports** | %d |\n", length(unique_origins[!is.na(unique_origins)])))
cat(sprintf("| **Unique Destination Airports** | %d |\n", length(unique_dests[!is.na(unique_dests)])))
cat(sprintf("| **Cancelled Flights** | %s (%.2f%%) |\n", fmt_int(status_counts$total_cancelled), status_counts$total_cancelled / num_rows * 100))
cat(sprintf("| **Diverted Flights** | %s (%.2f%%) |\n", fmt_int(status_counts$total_diverted), status_counts$total_diverted / num_rows * 100))
cat(sprintf("| **Sample Duplicate Check** | %d duplicates in first 100,000 rows |\n\n", dups_in_sample))

cat("## 2. Target Variable Class Distribution (`ArrDel15`)\n\n")
cat("| Category | Target Value (`ArrDel15`) | Count | Percentage |\n")
cat("| :--- | :--- | :--- | :--- |\n")
for (i in 1:nrow(target_dist)) {
  cat(sprintf("| %s | %s | %s | %.2f%% |\n", 
              target_dist$Label[i], 
              as.character(target_dist$ArrDel15[i]), 
              fmt_int(target_dist$Count[i]), 
              target_dist$Percentage[i]))
}
cat("\n")

cat("## 3. Key Numerical Features Summary Statistics\n\n")
cat("| Variable | Min | Q1 | Median | Mean | Q3 | Max | SD |\n")
cat("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n")
cat(sprintf("| **Distance (miles)** | %.0f | %.0f | %.0f | %.2f | %.0f | %.0f | %.2f |\n",
            num_summary$Distance_Min, num_summary$Distance_Q1, num_summary$Distance_Median,
            num_summary$Distance_Mean, num_summary$Distance_Q3, num_summary$Distance_Max, num_summary$Distance_SD))
cat(sprintf("| **CRSDepTime (HHMM)** | %.0f | %.0f | %.0f | %.2f | %.0f | %.0f | %.2f |\n",
            num_summary$CRSDepTime_Min, num_summary$CRSDepTime_Q1, num_summary$CRSDepTime_Median,
            num_summary$CRSDepTime_Mean, num_summary$CRSDepTime_Q3, num_summary$CRSDepTime_Max, num_summary$CRSDepTime_SD))
cat(sprintf("| **CRSArrTime (HHMM)** | %.0f | %.0f | %.0f | %.2f | %.0f | %.0f | %.2f |\n",
            num_summary$CRSArrTime_Min, num_summary$CRSArrTime_Q1, num_summary$CRSArrTime_Median,
            num_summary$CRSArrTime_Mean, num_summary$CRSArrTime_Q3, num_summary$CRSArrTime_Max, num_summary$CRSArrTime_SD))
cat("\n")

cat("## 4. Column Inventory & Missing Value Breakdown\n\n")
cat("| # | Column Name | Data Type | Missing Count | Missing Pct |\n")
cat("| :--- | :--- | :--- | :--- | :--- |\n")
for (i in 1:nrow(audit_col_summary)) {
  cat(sprintf("| %d | `%s` | `%s` | %s | %.2f%% |\n",
              i, audit_col_summary$Column[i], audit_col_summary$Type[i],
              fmt_int(audit_col_summary$Missing_Count[i]), audit_col_summary$Missing_Pct[i]))
}
sink()

cat("=== DATA AUDIT COMPLETE == \n")
cat("Report generated successfully at: ", report_path, "\n")
