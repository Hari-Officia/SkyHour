# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 06: Chronological Train/Val/Test Split & Out-of-Fold (OOF) Encodings
# ==============================================================================
# Objective: Perform 70/15/15 chronological splitting by FlightDate and fit
# 5-fold out-of-fold target encodings with rare-route fallback hierarchy (N < 30)
# strictly on training data to prevent row self-leakage.
# ==============================================================================

library(arrow)
library(dplyr)
library(lubridate)
library(data.table)

set.seed(42)

parquet_path <- "data/processed/engineered_flights.parquet"
if (!file.exists(parquet_path)) stop("Engineered dataset not found!")

cat("=== SKYHOUR CHRONOLOGICAL SPLIT & OOF TARGET ENCODING STARTED ===\n")
dataset <- open_dataset(parquet_path)

# Collect dataset sorted chronologically by FlightDate
cat("Reading and sorting dataset chronologically...\n")
df <- dataset %>% arrange(FlightDate) %>% collect()
num_total <- nrow(df)

# Define 70% Train, 15% Validation, 15% Test boundary indices
idx_train_end <- floor(num_total * 0.70)
idx_val_end   <- floor(num_total * 0.85)

train_df <- df[1:idx_train_end, ]
val_df   <- df[(idx_train_end + 1):idx_val_end, ]
test_df  <- df[(idx_val_end + 1):num_total, ]

train_min_date <- min(train_df$FlightDate)
train_max_date <- max(train_df$FlightDate)
val_min_date   <- min(val_df$FlightDate)
val_max_date   <- max(val_df$FlightDate)
test_min_date  <- min(test_df$FlightDate)
test_max_date  <- max(test_df$FlightDate)

cat(sprintf("Training Set:   %s rows (%s to %s)\n", 
            format(nrow(train_df), big.mark=","), train_min_date, train_max_date))
cat(sprintf("Validation Set: %s rows (%s to %s)\n", 
            format(nrow(val_df), big.mark=","), val_min_date, val_max_date))
cat(sprintf("Test Set:       %s rows (%s to %s)\n", 
            format(nrow(test_df), big.mark=","), test_min_date, test_max_date))

# ------------------------------------------------------------------------------
# 5-Fold Out-of-Fold (OOF) Target Encoding on Training Data
# ------------------------------------------------------------------------------
cat("\nFitting 5-fold Out-of-Fold (OOF) Target Encodings on training set...\n")

global_prior <- mean(train_df$ArrDel15, na.rm = TRUE)
smoothing_m <- 10
min_count_N <- 30

# Function to compute smoothed target encoding table
compute_target_enc_table <- function(data_dt, group_col, prior, m = 10) {
  dt <- data_dt[, .(
    Count = .N,
    Delays = sum(ArrDel15)
  ), by = c(group_col)]
  dt[, TargetEnc := (Delays + m * prior) / (Count + m)]
  return(dt)
}

train_dt <- as.data.table(train_df)
train_dt[, fold := sample(rep(1:5, length.out = .N))]

# Initialize OOF feature vectors on training data
train_dt[, Carrier_TargetEnc := as.numeric(NA)]
train_dt[, Origin_TargetEnc := as.numeric(NA)]
train_dt[, Dest_TargetEnc := as.numeric(NA)]
train_dt[, Route_TargetEnc := as.numeric(NA)]
train_dt[, TimeOfDay_TargetEnc := as.numeric(NA)]

cat("Calculating out-of-fold encodings across 5 training folds...\n")
for (k in 1:5) {
  in_fold  <- train_dt[fold != k]
  out_fold <- train_dt[fold == k]
  
  fold_prior <- mean(in_fold$ArrDel15, na.rm = TRUE)
  
  # Tables
  c_tab <- compute_target_enc_table(in_fold, "IATA_Code_Marketing_Airline", fold_prior, smoothing_m)
  o_tab <- compute_target_enc_table(in_fold, "Origin", fold_prior, smoothing_m)
  d_tab <- compute_target_enc_table(in_fold, "Dest", fold_prior, smoothing_m)
  r_tab <- compute_target_enc_table(in_fold, "Route", fold_prior, smoothing_m)
  t_tab <- compute_target_enc_table(in_fold, "TimeOfDayCategory", fold_prior, smoothing_m)
  
  # Map into out_fold
  m_c <- merge(out_fold[, .(IATA_Code_Marketing_Airline)], c_tab, by = "IATA_Code_Marketing_Airline", all.x = TRUE)
  m_o <- merge(out_fold[, .(Origin)], o_tab, by = "Origin", all.x = TRUE)
  m_d <- merge(out_fold[, .(Dest)], d_tab, by = "Dest", all.x = TRUE)
  m_r <- merge(out_fold[, .(Route)], r_tab, by = "Route", all.x = TRUE)
  m_t <- merge(out_fold[, .(TimeOfDayCategory)], t_tab, by = "TimeOfDayCategory", all.x = TRUE)
  
  train_dt[fold == k, Carrier_TargetEnc := ifelse(is.na(m_c$TargetEnc), fold_prior, m_c$TargetEnc)]
  train_dt[fold == k, Origin_TargetEnc  := ifelse(is.na(m_o$TargetEnc), fold_prior, m_o$TargetEnc)]
  train_dt[fold == k, Dest_TargetEnc    := ifelse(is.na(m_d$TargetEnc), fold_prior, m_d$TargetEnc)]
  train_dt[fold == k, TimeOfDay_TargetEnc := ifelse(is.na(m_t$TargetEnc), fold_prior, m_t$TargetEnc)]
  
  # Rare Route Fallback Hierarchy (N < 30) for Route encoding
  # Route Prior -> (Origin + Dest Prior)/2 -> Carrier Prior -> Global Prior
  r_enc_val <- ifelse(!is.na(m_r$Count) & m_r$Count >= min_count_N, m_r$TargetEnc,
                ifelse(!is.na(m_o$TargetEnc) & !is.na(m_d$TargetEnc), (m_o$TargetEnc + m_d$TargetEnc)/2,
                ifelse(!is.na(m_c$TargetEnc), m_c$TargetEnc, fold_prior)))
  
  train_dt[fold == k, Route_TargetEnc := r_enc_val]
}

# Frequency encodings on full training set
c_freq <- train_dt[, .(Carrier_Freq = .N / nrow(train_dt)), by = IATA_Code_Marketing_Airline]
o_freq <- train_dt[, .(Origin_Freq = .N / nrow(train_dt)), by = Origin]
d_freq <- train_dt[, .(Dest_Freq = .N / nrow(train_dt)), by = Dest]
r_freq <- train_dt[, .(Route_Freq = .N / nrow(train_dt)), by = Route]

train_dt <- merge(train_dt, c_freq, by = "IATA_Code_Marketing_Airline", all.x = TRUE)
train_dt <- merge(train_dt, o_freq, by = "Origin", all.x = TRUE)
train_dt <- merge(train_dt, d_freq, by = "Dest", all.x = TRUE)
train_dt <- merge(train_dt, r_freq, by = "Route", all.x = TRUE)

# ------------------------------------------------------------------------------
# Full Training Set Mapping Tables (For Validation & Test Transformation)
# ------------------------------------------------------------------------------
cat("Building global training mapping tables for validation and test inference...\n")
c_full_tab <- compute_target_enc_table(train_dt, "IATA_Code_Marketing_Airline", global_prior, smoothing_m)
o_full_tab <- compute_target_enc_table(train_dt, "Origin", global_prior, smoothing_m)
d_full_tab <- compute_target_enc_table(train_dt, "Dest", global_prior, smoothing_m)
r_full_tab <- compute_target_enc_table(train_dt, "Route", global_prior, smoothing_m)
t_full_tab <- compute_target_enc_table(train_dt, "TimeOfDayCategory", global_prior, smoothing_m)

preprocessor_metadata <- list(
  global_prior = global_prior,
  smoothing_m = smoothing_m,
  min_count_N = min_count_N,
  c_full_tab = as.data.frame(c_full_tab),
  o_full_tab = as.data.frame(o_full_tab),
  d_full_tab = as.data.frame(d_full_tab),
  r_full_tab = as.data.frame(r_full_tab),
  t_full_tab = as.data.frame(t_full_tab),
  c_freq = as.data.frame(c_freq),
  o_freq = as.data.frame(o_freq),
  d_freq = as.data.frame(d_freq),
  r_freq = as.data.frame(r_freq),
  train_date_range = c(as.character(train_min_date), as.character(train_max_date)),
  val_date_range   = c(as.character(val_min_date), as.character(val_max_date)),
  test_date_range  = c(as.character(test_min_date), as.character(test_max_date))
)

saveRDS(preprocessor_metadata, "models/preprocessor.rds")
cat("OOF Preprocessor metadata saved to models/preprocessor.rds\n")

# Transform Function for Validation and Test Data
apply_oof_preprocessor <- function(df_split, prep) {
  dt <- as.data.table(df_split)
  
  gp <- prep$global_prior
  N  <- prep$min_count_N
  
  c_tab <- as.data.table(prep$c_full_tab)
  o_tab <- as.data.table(prep$o_full_tab)
  d_tab <- as.data.table(prep$d_full_tab)
  r_tab <- as.data.table(prep$r_full_tab)
  t_tab <- as.data.table(prep$t_full_tab)
  
  c_fr <- as.data.table(prep$c_freq)
  o_fr <- as.data.table(prep$o_freq)
  d_fr <- as.data.table(prep$d_freq)
  r_fr <- as.data.table(prep$r_freq)
  
  m_c <- merge(dt[, .(IATA_Code_Marketing_Airline)], c_tab, by = "IATA_Code_Marketing_Airline", all.x = TRUE)
  m_o <- merge(dt[, .(Origin)], o_tab, by = "Origin", all.x = TRUE)
  m_d <- merge(dt[, .(Dest)], d_tab, by = "Dest", all.x = TRUE)
  m_r <- merge(dt[, .(Route)], r_tab, by = "Route", all.x = TRUE)
  m_t <- merge(dt[, .(TimeOfDayCategory)], t_tab, by = "TimeOfDayCategory", all.x = TRUE)
  
  mc_fr <- merge(dt[, .(IATA_Code_Marketing_Airline)], c_fr, by = "IATA_Code_Marketing_Airline", all.x = TRUE)
  mo_fr <- merge(dt[, .(Origin)], o_fr, by = "Origin", all.x = TRUE)
  md_fr <- merge(dt[, .(Dest)], d_fr, by = "Dest", all.x = TRUE)
  mr_fr <- merge(dt[, .(Route)], r_fr, by = "Route", all.x = TRUE)
  
  dt[, Carrier_TargetEnc   := ifelse(is.na(m_c$TargetEnc), gp, m_c$TargetEnc)]
  dt[, Origin_TargetEnc    := ifelse(is.na(m_o$TargetEnc), gp, m_o$TargetEnc)]
  dt[, Dest_TargetEnc      := ifelse(is.na(m_d$TargetEnc), gp, m_d$TargetEnc)]
  dt[, TimeOfDay_TargetEnc := ifelse(is.na(m_t$TargetEnc), gp, m_t$TargetEnc)]
  
  # Fallback hierarchy for routes
  dt[, Route_TargetEnc := ifelse(!is.na(m_r$Count) & m_r$Count >= N, m_r$TargetEnc,
                          ifelse(!is.na(m_o$TargetEnc) & !is.na(m_d$TargetEnc), (m_o$TargetEnc + m_d$TargetEnc)/2,
                          ifelse(!is.na(m_c$TargetEnc), m_c$TargetEnc, gp)))]
  
  dt[, Carrier_Freq := ifelse(is.na(mc_fr$Carrier_Freq), 0, mc_fr$Carrier_Freq)]
  dt[, Origin_Freq  := ifelse(is.na(mo_fr$Origin_Freq), 0, mo_fr$Origin_Freq)]
  dt[, Dest_Freq    := ifelse(is.na(md_fr$Dest_Freq), 0, md_fr$Dest_Freq)]
  dt[, Route_Freq   := ifelse(is.na(mr_fr$Route_Freq), 0, mr_fr$Route_Freq)]
  
  return(as.data.frame(dt))
}

cat("Transforming validation and test sets with trained mapping tables...\n")
val_proc  <- apply_oof_preprocessor(val_df, preprocessor_metadata)
test_proc <- apply_oof_preprocessor(test_df, preprocessor_metadata)
train_proc <- as.data.frame(train_dt[, fold := NULL])

write_parquet(train_proc, "data/processed/train_data.parquet")
write_parquet(val_proc, "data/processed/val_data.parquet")
write_parquet(test_proc, "data/processed/test_data.parquet")

cat("=== CHRONOLOGICAL SPLIT & OOF ENCODING COMPLETED ===\n")
cat("Datasets saved: train_data.parquet, val_data.parquet, test_data.parquet\n")
