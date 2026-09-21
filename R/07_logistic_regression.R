# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 07: Baseline Models & Logistic Regression
# ==============================================================================
# Objective: Train Majority Class Baseline and Logistic Regression Model on
# pre-flight engineered features and evaluate on validation set.
# ==============================================================================

library(arrow)
library(dplyr)
library(pROC)

set.seed(42)

cat("=== SKYHOUR LOGISTIC REGRESSION MODEL TRAINING STARTED ===\n")
train_df <- read_parquet("data/processed/train_data.parquet")
val_df <- read_parquet("data/processed/val_data.parquet")

# Feature columns
feature_cols <- c(
  "Distance", "ScheduledDepartureHour", "ScheduledDepartureMinute",
  "ScheduledArrivalHour", "ScheduledArrivalMinute", "DayOfWeek", "Month",
  "IsWeekend", "IsSummer", "Carrier_Freq", "Carrier_TargetEnc",
  "Origin_Freq", "Origin_TargetEnc", "Dest_Freq", "Dest_TargetEnc",
  "Route_Freq", "Route_TargetEnc", "TimeOfDay_TargetEnc"
)

cat("Selected", length(feature_cols), "pre-flight features for modelling.\n")

# Baseline 1: Majority Class Classifier
majority_pred <- rep(0, nrow(val_df))
majority_acc <- mean(majority_pred == val_df$ArrDel15)
cat(sprintf("Baseline 1 (Majority Class Naive) Accuracy on Validation: %.4f (%.2f%%)\n", 
            majority_acc, majority_acc * 100))

# Baseline 2 / Model 1: Logistic Regression
cat("Training Logistic Regression Model on 2.76M training rows...\n")

# Subsample 500k rows for logistic regression training speed and convergence stability
train_sub <- train_df %>% sample_n(min(500000, nrow(train_df)))

formula_glm <- as.formula(paste("ArrDel15 ~", paste(feature_cols, collapse = " + ")))
model_glm <- glm(formula_glm, data = train_sub, family = binomial(link = "logit"))

cat("Logistic Regression training complete. Generating predictions on Validation Set...\n")
val_probs_glm <- predict(model_glm, newdata = val_df, type = "response")

roc_glm <- roc(val_df$ArrDel15, val_probs_glm, quiet = TRUE)
auc_glm <- auc(roc_glm)

cat(sprintf("Logistic Regression Validation ROC-AUC: %.4f\n", as.numeric(auc_glm)))

saveRDS(model_glm, "models/model_logistic_regression.rds")
saveRDS(data.frame(ArrDel15 = val_df$ArrDel15, Prob = val_probs_glm), "data/processed/val_preds_logistic.rds")

cat("Logistic regression model saved to models/model_logistic_regression.rds\n")
cat("=== LOGISTIC REGRESSION COMPLETE ===\n")
