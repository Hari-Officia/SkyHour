# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 08: Random Forest Model Training
# ==============================================================================
# Objective: Train Random Forest using ranger on pre-flight features and
# evaluate on validation set.
# ==============================================================================

library(arrow)
library(dplyr)
library(ranger)
library(pROC)

set.seed(42)

cat("=== SKYHOUR RANDOM FOREST MODEL TRAINING STARTED ===\n")
train_df <- read_parquet("data/processed/train_data.parquet")
val_df <- read_parquet("data/processed/val_data.parquet")

feature_cols <- c(
  "Distance", "ScheduledDepartureHour", "ScheduledDepartureMinute",
  "ScheduledArrivalHour", "ScheduledArrivalMinute", "DayOfWeek", "Month",
  "IsWeekend", "IsSummer", "Carrier_Freq", "Carrier_TargetEnc",
  "Origin_Freq", "Origin_TargetEnc", "Dest_Freq", "Dest_TargetEnc",
  "Route_Freq", "Route_TargetEnc", "TimeOfDay_TargetEnc"
)

# Subsample 300,000 training rows for memory and compute efficiency in R ranger
cat("Subsampling 300,000 rows for Random Forest training...\n")
train_sub <- train_df %>% sample_n(min(300000, nrow(train_df)))

formula_rf <- as.formula(paste("factor(ArrDel15) ~", paste(feature_cols, collapse = " + ")))

cat("Training Random Forest (200 trees, mtry=4, min.node.size=50)... \n")
model_rf <- ranger(
  formula = formula_rf,
  data = train_sub,
  num.trees = 200,
  mtry = 4,
  min.node.size = 50,
  probability = TRUE,
  importance = "impurity",
  num.threads = 4,
  seed = 42
)

cat("Random Forest training complete. Predicting on Validation Set...\n")
val_pred_obj <- predict(model_rf, data = val_df)
val_probs_rf <- val_pred_obj$predictions[, "1"]

roc_rf <- roc(val_df$ArrDel15, val_probs_rf, quiet = TRUE)
auc_rf <- auc(roc_rf)

cat(sprintf("Random Forest Validation ROC-AUC: %.4f\n", as.numeric(auc_rf)))

saveRDS(model_rf, "models/model_random_forest.rds")
saveRDS(data.frame(ArrDel15 = val_df$ArrDel15, Prob = val_probs_rf), "data/processed/val_preds_rf.rds")

cat("Random forest model saved to models/model_random_forest.rds\n")
cat("=== RANDOM FOREST COMPLETE ===\n")
