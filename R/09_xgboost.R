# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 09: XGBoost Model Training
# ==============================================================================
# Objective: Train XGBoost Gradient Boosting model on pre-flight features,
# accounting for class imbalance via scale_pos_weight.
# ==============================================================================

library(arrow)
library(dplyr)
library(xgboost)
library(pROC)

set.seed(42)

cat("=== SKYHOUR XGBOOST MODEL TRAINING STARTED ===\n")
train_df <- read_parquet("data/processed/train_data.parquet")
val_df <- read_parquet("data/processed/val_data.parquet")

feature_cols <- c(
  "Distance", "ScheduledDepartureHour", "ScheduledDepartureMinute",
  "ScheduledArrivalHour", "ScheduledArrivalMinute", "DayOfWeek", "Month",
  "IsWeekend", "IsSummer", "Carrier_Freq", "Carrier_TargetEnc",
  "Origin_Freq", "Origin_TargetEnc", "Dest_Freq", "Dest_TargetEnc",
  "Route_Freq", "Route_TargetEnc", "TimeOfDay_TargetEnc"
)

# Convert features to numeric matrix for xgboost
train_x <- as.matrix(train_df[, feature_cols])
train_y <- train_df$ArrDel15

val_x <- as.matrix(val_df[, feature_cols])
val_y <- val_df$ArrDel15

scale_weight <- sum(train_y == 0) / sum(train_y == 1)
cat(sprintf("Class ratio scale_pos_weight: %.4f\n", scale_weight))

dtrain <- xgb.DMatrix(data = train_x, label = train_y)
dval <- xgb.DMatrix(data = val_x, label = val_y)

params <- list(
  booster = "gbtree",
  objective = "binary:logistic",
  eval_metric = "auc",
  eta = 0.08,
  max_depth = 6,
  subsample = 0.8,
  colsample_bytree = 0.8,
  scale_pos_weight = scale_weight
)

watchlist <- list(train = dtrain, val = dval)

cat("Training XGBoost (250 rounds, max_depth=6, eta=0.08)... \n")
model_xgb <- xgb.train(
  params = params,
  data = dtrain,
  nrounds = 250,
  watchlist = watchlist,
  early_stopping_rounds = 30,
  print_every_n = 25
)

cat("XGBoost training complete. Predicting on Validation Set...\n")
val_probs_xgb <- predict(model_xgb, newdata = dval)

roc_xgb <- roc(val_y, val_probs_xgb, quiet = TRUE)
auc_xgb <- auc(roc_xgb)

cat(sprintf("XGBoost Validation ROC-AUC: %.4f\n", as.numeric(auc_xgb)))

xgb.save(model_xgb, "models/model_xgboost.model")
saveRDS(model_xgb, "models/model_xgboost.rds")
saveRDS(data.frame(ArrDel15 = val_y, Prob = val_probs_xgb), "data/processed/val_preds_xgb.rds")

cat("XGBoost model saved to models/model_xgboost.rds and models/model_xgboost.model\n")
cat("=== XGBOOST COMPLETE ===\n")
