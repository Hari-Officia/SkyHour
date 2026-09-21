# ==============================================================================
# SKYHOUR INDIA: India Aviation Traffic, Weather & Network Intelligence Platform
# Script 03: Airport Passenger Demand & Traffic Predictive ML Engine
# ==============================================================================
# Objective: Train and evaluate chronological time-series machine learning models
# (Linear Regression, Random Forest, XGBoost) to forecast Indian airport passenger demand.
# Split: Train (2021-2023), Validation (2024), Test (2025).
# Save frozen India model: models/india/india_demand_model.rds
# DO NOT TOUCH EXISTING U.S. MODEL FILES.
# ==============================================================================

library(dplyr)
library(lubridate)
library(xgboost)
library(jsonlite)
library(arrow)

cat("==============================================================================\n")
cat("SKYHOUR INDIA: Passenger Demand Forecasting ML Training\n")
cat("==============================================================================\n\n")

dir.create("models/india", recursive = TRUE, showWarnings = FALSE)

# Load Master Aviation Dataset
data <- read_parquet("data/india/master/india_aviation.parquet")

# Feature Engineering
data <- data %>%
  arrange(airport_iata, date) %>%
  group_by(airport_iata) %>%
  mutate(
    lag_1m_pax = lag(monthly_passengers, 1),
    lag_12m_pax = lag(monthly_passengers, 12),
    quarter = as.integer(quarter(as.Date(date))),
    is_peak_season = as.integer(month %in% c(10, 11, 12, 1, 5)) # Festival & Summer travel
  ) %>%
  ungroup() %>%
  filter(!is.na(lag_12m_pax)) # Filter initial NA lag rows

# Chronological Temporal Split
train_df <- data %>% filter(year <= 2023)
val_df   <- data %>% filter(year == 2024)
test_df  <- data %>% filter(year == 2025)

cat(sprintf("Train set (2021-2023): %d rows | Val set (2024): %d rows | Test set (2025): %d rows\n",
            nrow(train_df), nrow(val_df), nrow(test_df)))

feature_cols <- c("month", "quarter", "is_peak_season", "temperature_c", "rainfall_mm", "humidity_pct", "wind_speed_kmh", "lag_1m_pax", "lag_12m_pax")

# 1. Linear Baseline
lm_fit  <- lm(monthly_passengers ~ ., data = train_df[, c("monthly_passengers", feature_cols)])
lm_pred <- predict(lm_fit, newdata = test_df[, feature_cols])

# 2. XGBoost Demand Model
dtrain <- xgb.DMatrix(data = as.matrix(train_df[, feature_cols]), label = train_df$monthly_passengers)
dval   <- xgb.DMatrix(data = as.matrix(val_df[, feature_cols]), label = val_df$monthly_passengers)
dtest  <- xgb.DMatrix(data = as.matrix(test_df[, feature_cols]), label = test_df$monthly_passengers)

params <- list(
  booster = "gbtree",
  objective = "reg:squarederror",
  eta = 0.05,
  max_depth = 5,
  subsample = 0.8,
  colsample_bytree = 0.8
)

xgb_model <- xgb.train(
  params = params,
  data = dtrain,
  nrounds = 150,
  evals = list(train = dtrain, val = dval),
  early_stopping_rounds = 20,
  verbose = 0
)

xgb_pred <- predict(xgb_model, newdata = dtest)

# Evaluation Metrics Helper
calc_metrics <- function(actual, pred) {
  mae <- mean(abs(actual - pred))
  rmse <- sqrt(mean((actual - pred)^2))
  mape <- mean(abs((actual - pred) / actual)) * 100
  ss_tot <- sum((actual - mean(actual))^2)
  ss_res <- sum((actual - pred)^2)
  r2 <- 1 - (ss_res / ss_tot)
  list(mae = round(mae, 1), rmse = round(rmse, 1), mape_pct = round(mape, 2), r2 = round(r2, 4))
}

lm_metrics  <- calc_metrics(test_df$monthly_passengers, lm_pred)
xgb_metrics <- calc_metrics(test_df$monthly_passengers, xgb_pred)

cat("\n--- Test Set Evaluation Results (2025 Unseen Test Period) ---\n")
cat(sprintf("Linear Regression: MAE = %.1f | RMSE = %.1f | MAPE = %.2f%% | R² = %.4f\n",
            lm_metrics$mae, lm_metrics$rmse, lm_metrics$mape_pct, lm_metrics$r2))
cat(sprintf("XGBoost Model:     MAE = %.1f | RMSE = %.1f | MAPE = %.2f%% | R² = %.4f\n",
            xgb_metrics$mae, xgb_metrics$rmse, xgb_metrics$mape_pct, xgb_metrics$r2))

# Feature Importance
importance <- xgb.importance(model = xgb_model)
cat("\nTop Feature Importances:\n")
print(importance)

# Save Frozen India Demand Model Artifacts
india_pipeline <- list(
  model = xgb_model,
  feature_names = feature_cols,
  metrics = xgb_metrics,
  version = "1.0.0",
  trained_date = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC")
)

saveRDS(india_pipeline, "models/india/india_demand_model.rds")

meta <- list(
  model_name = "Skyhour India Airport Passenger Demand Forecaster",
  version = "1.0.0",
  target = "monthly_passengers",
  features = feature_cols,
  test_metrics = xgb_metrics,
  temporal_splits = list(train = "2021-2023", validation = "2024", test = "2025")
)

writeLines(toJSON(meta, auto_unbox = TRUE, pretty = TRUE), "models/india/india_model_metadata.json")

cat("\nSaved frozen India model pipeline to models/india/india_demand_model.rds\n")
cat("==============================================================================\n")
