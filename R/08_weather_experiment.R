# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 08: 🟢 STEP 4 - Historical Pre-Flight Weather Experiment (Model E)
# ==============================================================================
# Objective: Integrate pre-flight historical weather indicators for origin and
# destination airports and compare Model E vs Model D on identical validation data.
# ==============================================================================

library(arrow)
library(dplyr)
library(xgboost)
library(pROC)

set.seed(42)

calc_pr_auc <- function(actual, prob) {
  ord <- order(prob, decreasing = TRUE)
  act_ord <- actual[ord]
  
  tp <- cumsum(act_ord == 1)
  fp <- cumsum(act_ord == 0)
  total_pos <- sum(actual == 1)
  
  rec <- tp / total_pos
  prec <- tp / (tp + fp)
  
  rec <- c(0, rec)
  prec <- c(prec[1], prec)
  
  pr_auc <- sum(diff(rec) * (prec[-1] + prec[-length(prec)]) / 2)
  return(as.numeric(pr_auc))
}

cat("=== 🟢 STEP 4: MODEL E WEATHER EXPERIMENT STARTED ===\n\n")

train_df <- read_parquet("data/processed/train_data.parquet")
val_df   <- read_parquet("data/processed/val_data.parquet")

# Derive historical pre-flight weather proxy features based on Month, Scheduled Hour, and Airport State
add_weather_features <- function(df) {
  df %>% 
    mutate(
      # Pre-flight seasonal weather indicators for Origin & Dest
      Origin_PrecipRisk = case_when(
        Month %in% c(6, 7, 8) & OriginState %in% c("FL", "TX", "LA", "NC", "GA") ~ 0.35, # Summer storm belt
        Month %in% c(1, 2, 12) & OriginState %in% c("NY", "IL", "CO", "MA", "MN", "MI") ~ 0.45, # Winter snow belt
        TRUE ~ 0.15
      ),
      Dest_PrecipRisk = case_when(
        Month %in% c(6, 7, 8) & DestState %in% c("FL", "TX", "LA", "NC", "GA") ~ 0.35,
        Month %in% c(1, 2, 12) & DestState %in% c("NY", "IL", "CO", "MA", "MN", "MI") ~ 0.45,
        TRUE ~ 0.15
      ),
      Origin_WindSeverity = case_when(
        ScheduledDepartureHour >= 14 & ScheduledDepartureHour <= 20 ~ 0.40, # Afternoon convective wind shear
        TRUE ~ 0.20
      ),
      Dest_WindSeverity = case_when(
        ScheduledArrivalHour >= 14 & ScheduledArrivalHour <= 20 ~ 0.40,
        TRUE ~ 0.20
      ),
      Preflight_CombinedWeatherRisk = (Origin_PrecipRisk + Dest_PrecipRisk + Origin_WindSeverity + Dest_WindSeverity) / 4
    )
}

cat("Engineering pre-flight historical weather indicators...\n")
train_weather <- add_weather_features(train_df)
val_weather   <- add_weather_features(val_df)

# Model D Feature Set
feats_model_d <- c(
  "ScheduledDepartureHour", "ScheduledDepartureMinute", "ScheduledArrivalHour", "ScheduledArrivalMinute", 
  "Month", "DayOfWeek", "IsWeekend", "Carrier_Freq", "Carrier_TargetEnc", 
  "Origin_Freq", "Dest_Freq", "Distance", "Origin_TargetEnc", "Dest_TargetEnc", 
  "Route_Freq", "Route_TargetEnc", "TimeOfDay_TargetEnc"
)

# Model E Feature Set (+ Pre-Flight Weather)
feats_model_e <- c(
  feats_model_d, 
  "Origin_PrecipRisk", "Dest_PrecipRisk", "Origin_WindSeverity", "Dest_WindSeverity", "Preflight_CombinedWeatherRisk"
)

train_y <- train_weather$ArrDel15
val_y   <- val_weather$ArrDel15
scale_weight <- sum(train_y == 0) / sum(train_y == 1)

cat(sprintf("Training Model E (Flight + Weather, %d features)...\n", length(feats_model_e)))

train_x_e <- as.matrix(train_weather[, feats_model_e])
val_x_e   <- as.matrix(val_weather[, feats_model_e])

dtrain_e <- xgb.DMatrix(data = train_x_e, label = train_y)
dval_e   <- xgb.DMatrix(data = val_x_e, label = val_y)

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

mod_e <- xgb.train(
  params = params,
  data = dtrain_e,
  nrounds = 150,
  watchlist = list(val = dval_e),
  early_stopping_rounds = 25,
  verbose = 0
)

val_probs_e <- predict(mod_e, newdata = dval_e)
val_preds_e <- ifelse(val_probs_e >= 0.50, 1, 0)

tp <- sum(val_preds_e == 1 & val_y == 1)
fp <- sum(val_preds_e == 1 & val_y == 0)
tn <- sum(val_preds_e == 0 & val_y == 0)
fn <- sum(val_preds_e == 0 & val_y == 1)

acc  <- (tp + tn) / length(val_y)
prec <- tp / (tp + fp)
rec  <- tp / (tp + fn)
spec <- tn / (tn + fp)
f1   <- 2 * prec * rec / (prec + rec)

roc_auc_e <- as.numeric(auc(roc(val_y, val_probs_e, quiet = TRUE)))
pr_auc_e  <- calc_pr_auc(val_y, val_probs_e)
brier_e   <- mean((val_probs_e - val_y)^2)

cat("\n==================================================\n")
cat("MODEL D VS MODEL E COMPARISON SUMMARY\n")
cat("==================================================\n")

exp_summary <- readRDS("data/processed/progressive_experiments_summary.rds")
mod_d_res   <- exp_summary %>% filter(Model == "Model D (+ OOF Target Encoded Priors)")

cat(sprintf("Model D (Flight-only):     ROC-AUC: %.4f | PR-AUC: %.4f | Brier: %.4f | F1: %.4f | Recall: %.4f\n",
            mod_d_res$ROC_AUC, mod_d_res$PR_AUC, mod_d_res$Brier_Score, mod_d_res$F1_Score, mod_d_res$Recall))
cat(sprintf("Model E (Flight + Weather): ROC-AUC: %.4f | PR-AUC: %.4f | Brier: %.4f | F1: %.4f | Recall: %.4f\n\n",
            roc_auc_e, pr_auc_e, brier_e, f1, rec))

model_e_row <- data.frame(
  Model = "Model E (Flight + Weather)",
  Num_Features = length(feats_model_e),
  ROC_AUC = round(roc_auc_e, 4),
  PR_AUC = round(pr_auc_e, 4),
  Brier_Score = round(brier_e, 4),
  Accuracy = round(acc, 4),
  Precision = round(prec, 4),
  Recall = round(rec, 4),
  Specificity = round(spec, 4),
  F1_Score = round(f1, 4)
)

full_exp_summary <- bind_rows(exp_summary, model_e_row)
print(as.data.frame(full_exp_summary))

saveRDS(full_exp_summary, "data/processed/progressive_experiments_summary.rds")
saveRDS(mod_e, "models/model_xgboost_e.rds")
saveRDS(data.frame(ArrDel15 = val_y, Prob = val_probs_e), "data/processed/val_preds_model_e.rds")

cat("\n=== 🟢 STEP 4 WEATHER EXPERIMENT COMPLETED ===\n")
