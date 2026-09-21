# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 07: STEPS 2 & 3 - Baseline Model A and Progressive Models B, C, D
# ==============================================================================
# Objective: Train and evaluate Model A (Clean Baseline), Model B (+Airline),
# Model C (+Route & Distance), and Model D (+OOF Priors) on identical validation data.
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

cat("=== 🟠 STEP 2 & 🟡 STEP 3: PROGRESSIVE MODELS A, B, C, D STARTED ===\n\n")

train_df <- read_parquet("data/processed/train_data.parquet")
val_df   <- read_parquet("data/processed/val_data.parquet")

train_y <- train_df$ArrDel15
val_y   <- val_df$ArrDel15
scale_weight <- sum(train_y == 0) / sum(train_y == 1)

# Feature Sets
feats_model_a <- c("ScheduledDepartureHour", "ScheduledDepartureMinute", 
                   "ScheduledArrivalHour", "ScheduledArrivalMinute", 
                   "Month", "DayOfWeek", "IsWeekend")

feats_model_b <- c(feats_model_a, "Carrier_Freq", "Carrier_TargetEnc")

feats_model_c <- c(feats_model_b, "Origin_Freq", "Dest_Freq", "Distance", 
                   "Origin_TargetEnc", "Dest_TargetEnc", "Route_Freq")

feats_model_d <- c(feats_model_c, "Route_TargetEnc", "TimeOfDay_TargetEnc")

experiments <- list(
  "Model A (Schedule + Temporal Baseline)"    = feats_model_a,
  "Model B (+ Airline)"                       = feats_model_b,
  "Model C (+ Route & Distance)"              = feats_model_c,
  "Model D (+ OOF Target Encoded Priors)"     = feats_model_d
)

results_list <- list()

for (exp_name in names(experiments)) {
  f_cols <- experiments[[exp_name]]
  cat(sprintf("Training %s (%d features)...\n", exp_name, length(f_cols)))
  
  train_x <- as.matrix(train_df[, f_cols])
  val_x   <- as.matrix(val_df[, f_cols])
  
  dtrain <- xgb.DMatrix(data = train_x, label = train_y)
  dval   <- xgb.DMatrix(data = val_x, label = val_y)
  
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
  
  mod <- xgb.train(
    params = params,
    data = dtrain,
    nrounds = 150,
    watchlist = list(val = dval),
    early_stopping_rounds = 25,
    verbose = 0
  )
  
  val_probs <- predict(mod, newdata = dval)
  val_preds <- ifelse(val_probs >= 0.50, 1, 0)
  
  tp <- sum(val_preds == 1 & val_y == 1)
  fp <- sum(val_preds == 1 & val_y == 0)
  tn <- sum(val_preds == 0 & val_y == 0)
  fn <- sum(val_preds == 0 & val_y == 1)
  
  acc  <- (tp + tn) / length(val_y)
  prec <- ifelse(tp + fp == 0, 0, tp / (tp + fp))
  rec  <- ifelse(tp + fn == 0, 0, tp / (tp + fn))
  spec <- ifelse(tn + fp == 0, 0, tn / (tn + fp))
  f1   <- ifelse(prec + rec == 0, 0, 2 * prec * rec / (prec + rec))
  
  roc_auc <- as.numeric(auc(roc(val_y, val_probs, quiet = TRUE)))
  pr_auc  <- calc_pr_auc(val_y, val_probs)
  brier   <- mean((val_probs - val_y)^2)
  
  cat(sprintf("   - ROC-AUC: %.4f | PR-AUC: %.4f | Brier: %.4f | F1: %.4f | Recall: %.4f | Precision: %.4f\n\n", 
              roc_auc, pr_auc, brier, f1, rec, prec))
  
  results_list[[exp_name]] <- data.frame(
    Model = exp_name,
    Num_Features = length(f_cols),
    ROC_AUC = round(roc_auc, 4),
    PR_AUC = round(pr_auc, 4),
    Brier_Score = round(brier, 4),
    Accuracy = round(acc, 4),
    Precision = round(prec, 4),
    Recall = round(rec, 4),
    Specificity = round(spec, 4),
    F1_Score = round(f1, 4)
  )
  
  if (exp_name == "Model D (+ OOF Target Encoded Priors)") {
    saveRDS(mod, "models/model_xgboost_d.rds")
    saveRDS(data.frame(ArrDel15 = val_y, Prob = val_probs), "data/processed/val_preds_model_d.rds")
  }
}

exp_summary_df <- bind_rows(results_list)

cat("==================================================\n")
cat("PROGRESSIVE EXPERIMENTS SUMMARY (MODELS A–D)\n")
cat("==================================================\n")
print(as.data.frame(exp_summary_df))

saveRDS(exp_summary_df, "data/processed/progressive_experiments_summary.rds")

cat("\n=== 🟠 STEP 2 & 🟡 STEP 3 COMPLETED SUCCESSFULLY ===\n")
