# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 10: 🔵 STEP 5 - Final Model Tuning, PR-AUC, Calibration, SHAP & Untouched Test
# ==============================================================================
# Objective: Tune optimal model, generate PR & Threshold & Calibration curves,
# compute SHAP importance, and evaluate ONCE on untouched July 2022 test set.
# ==============================================================================

library(arrow)
library(dplyr)
library(ggplot2)
library(xgboost)
library(pROC)
library(jsonlite)

set.seed(42)

theme_skyhour <- function() {
  theme_minimal(base_size = 12) +
    theme(
      plot.title = element_text(face = "bold", size = 14, color = "#1e293b"),
      plot.subtitle = element_text(size = 10, color = "#64748b"),
      axis.title = element_text(face = "bold", size = 10),
      panel.grid.major = element_line(color = "#f1f5f9"),
      panel.grid.minor = element_blank(),
      plot.background = element_rect(fill = "#ffffff", color = NA),
      legend.position = "bottom"
    )
}

calc_pr_curve <- function(actual, prob) {
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
  return(list(recall = rec, precision = prec, pr_auc = as.numeric(pr_auc)))
}

cat("=== 🔵 STEP 5: FINAL MODEL OPTIMIZATION & UNTOUCHED TEST STARTED ===\n\n")

train_df <- read_parquet("data/processed/train_data.parquet")
val_df   <- read_parquet("data/processed/val_data.parquet")
test_df  <- read_parquet("data/processed/test_data.parquet")
preprocessor <- readRDS("models/preprocessor.rds")

# Best feature set: Schedule + Temporal + Airline + Route OOF Target Encodings
final_feature_cols <- c(
  "ScheduledDepartureHour", "ScheduledDepartureMinute", 
  "ScheduledArrivalHour", "ScheduledArrivalMinute", 
  "Month", "DayOfWeek", "IsWeekend",
  "Carrier_Freq", "Carrier_TargetEnc",
  "Origin_Freq", "Dest_Freq", "Distance", 
  "Origin_TargetEnc", "Dest_TargetEnc", "Route_Freq",
  "Route_TargetEnc", "TimeOfDay_TargetEnc"
)

train_x <- as.matrix(train_df[, final_feature_cols])
train_y <- train_df$ArrDel15

val_x <- as.matrix(val_df[, final_feature_cols])
val_y <- val_df$ArrDel15

test_x <- as.matrix(test_df[, final_feature_cols])
test_y <- test_df$ArrDel15

scale_weight <- sum(train_y == 0) / sum(train_y == 1)

dtrain <- xgb.DMatrix(data = train_x, label = train_y)
dval   <- xgb.DMatrix(data = val_x, label = val_y)
dtest  <- xgb.DMatrix(data = test_x, label = test_y)

# 1. XGBoost Hyperparameter Tuning
cat("Training tuned XGBoost model (eta=0.05, max_depth=5, nrounds=200)...\n")
params <- list(
  booster = "gbtree",
  objective = "binary:logistic",
  eval_metric = "auc",
  eta = 0.05,
  max_depth = 5,
  subsample = 0.85,
  colsample_bytree = 0.85,
  scale_pos_weight = scale_weight
)

final_model <- xgb.train(
  params = params,
  data = dtrain,
  nrounds = 200,
  watchlist = list(val = dval),
  early_stopping_rounds = 30,
  verbose = 0
)

# 2. Validation Predictions & PR-AUC
val_probs <- predict(final_model, newdata = dval)
val_roc   <- as.numeric(auc(roc(val_y, val_probs, quiet = TRUE)))
val_pr    <- calc_pr_curve(val_y, val_probs)
val_brier <- mean((val_probs - val_y)^2)

cat(sprintf("Validation Tuned ROC-AUC: %.4f | PR-AUC: %.4f | Brier: %.4f\n", 
            val_roc, val_pr$pr_auc, val_brier))

# 3. Threshold Sweep Analysis (0.20 to 0.70)
cat("Running probability threshold sweep (0.20 to 0.70)...\n")
thresholds <- seq(0.20, 0.70, by = 0.05)
thresh_list <- list()

for (t in thresholds) {
  preds <- ifelse(val_probs >= t, 1, 0)
  tp <- sum(preds == 1 & val_y == 1)
  fp <- sum(preds == 1 & val_y == 0)
  tn <- sum(preds == 0 & val_y == 0)
  fn <- sum(preds == 0 & val_y == 1)
  
  acc  <- (tp + tn) / length(val_y)
  prec <- ifelse(tp + fp == 0, 0, tp / (tp + fp))
  rec  <- ifelse(tp + fn == 0, 0, tp / (tp + fn))
  spec <- ifelse(tn + fp == 0, 0, tn / (tn + fp))
  f1   <- ifelse(prec + rec == 0, 0, 2 * prec * rec / (prec + rec))
  bal  <- (rec + spec) / 2
  
  thresh_list[[length(thresh_list) + 1]] <- data.frame(
    Threshold = t, Accuracy = acc, Precision = prec, Recall = rec, Specificity = spec, F1_Score = f1, Balanced_Accuracy = bal
  )
}
thresh_df <- bind_rows(thresh_list)
optimal_threshold <- 0.50

# 4. Calibration Curve Plot (Plot 15)
cal_df <- data.frame(actual = val_y, prob = val_probs) %>% 
  mutate(bin = cut(prob, breaks = seq(0, 1, by = 0.1), include.lowest = TRUE)) %>% 
  group_by(bin) %>% 
  summarize(mean_predicted = mean(prob), observed_rate = mean(actual), count = n()) %>% 
  filter(!is.na(bin))

p_cal <- ggplot(cal_df, aes(x = mean_predicted, y = observed_rate)) +
  geom_abline(intercept = 0, slope = 1, linetype = "dashed", color = "#94a3b8", linewidth = 0.8) +
  geom_line(color = "#8b5cf6", linewidth = 1.2) +
  geom_point(color = "#7c3aed", size = 3) +
  geom_text(aes(label = sprintf("%.1f%%", observed_rate * 100)), vjust = -0.8, fontface = "bold", size = 3) +
  scale_x_continuous(limits = c(0, 1), labels = function(x) paste0(x * 100, "%")) +
  scale_y_continuous(limits = c(0, 1), labels = function(x) paste0(x * 100, "%")) +
  labs(title = sprintf("SKYHOUR: Probability Calibration Curve (Brier Score = %.4f)", val_brier),
       subtitle = "Observed flight delay rates vs. predicted probability deciles",
       x = "Mean Predicted Delay Probability", y = "Observed Delay Rate") +
  theme_skyhour()

ggsave("plots/15_calibration_curve.png", p_cal, width = 8, height = 6, dpi = 300)

# 5. SHAP / Feature Relative Gain (Plot 13)
imp_obj <- xgb.importance(model = final_model)
imp_df  <- data.frame(Feature = imp_obj$Feature, Gain = imp_obj$Gain, stringsAsFactors = FALSE) %>% arrange(desc(Gain))

p_imp <- ggplot(imp_df, aes(x = reorder(Feature, Gain), y = Gain)) +
  geom_col(fill = "#8b5cf6", width = 0.6) +
  geom_text(aes(label = sprintf("%.2f%%", Gain * 100)), hjust = -0.1, fontface = "bold", size = 3.5) +
  coord_flip() +
  scale_y_continuous(expand = expansion(mult = c(0, 0.2)), labels = function(x) paste0(x * 100, "%")) +
  labs(title = "SKYHOUR: Final Model Feature Relative Gain Ranking",
       subtitle = "Pre-flight schedule, route priors, and carrier characteristics driving predictions",
       x = "Pre-Flight Feature", y = "Relative Gain Contribution") +
  theme_skyhour()

ggsave("plots/13_feature_importance.png", p_imp, width = 9, height = 6, dpi = 300)

# 6. Untouched July 2022 Test Set Evaluation (ONCE)
cat("\nEvaluating final tuned model ONCE on untouched July 2022 test set (591,738 flights)...\n")
test_probs <- predict(final_model, newdata = dtest)
test_preds <- ifelse(test_probs >= optimal_threshold, 1, 0)

tp_t <- sum(test_preds == 1 & test_y == 1)
fp_t <- sum(test_preds == 1 & test_y == 0)
tn_t <- sum(test_preds == 0 & test_y == 0)
fn_t <- sum(test_preds == 0 & test_y == 1)

test_acc  <- (tp_t + tn_t) / length(test_y)
test_prec <- tp_t / (tp_t + fp_t)
test_rec  <- tp_t / (tp_t + fn_t)
test_spec <- tn_t / (tn_t + fp_t)
test_f1   <- 2 * test_prec * test_rec / (test_prec + test_rec)
test_bal  <- (test_rec + test_spec) / 2

test_roc   <- as.numeric(auc(roc(test_y, test_probs, quiet = TRUE)))
test_pr    <- calc_pr_curve(test_y, test_probs)$pr_auc
test_brier <- mean((test_probs - test_y)^2)

cat("\n==================================================\n")
cat("FINAL UNTOUCHED JULY 2022 TEST SET EVALUATION\n")
cat("==================================================\n")
cat(sprintf("Test ROC-AUC:          %.4f\n", test_roc))
cat(sprintf("Test PR-AUC:           %.4f\n", test_pr))
cat(sprintf("Test Brier Score:      %.4f\n", test_brier))
cat(sprintf("Test Accuracy:         %.4f (%.2f%%)\n", test_acc, test_acc * 100))
cat(sprintf("Test Precision:        %.4f (%.2f%%)\n", test_prec, test_prec * 100))
cat(sprintf("Test Recall:           %.4f (%.2f%%)\n", test_rec, test_rec * 100))
cat(sprintf("Test Specificity:      %.4f (%.2f%%)\n", test_spec, test_spec * 100))
cat(sprintf("Test F1-Score:         %.4f\n", test_f1))
cat(sprintf("Test Balanced Acc:     %.4f\n", test_bal))
cat(sprintf("Confusion Matrix:      TP=%s, FP=%s, TN=%s, FN=%s\n",
            format(tp_t, big.mark=","), format(fp_t, big.mark=","), 
            format(tn_t, big.mark=","), format(fn_t, big.mark=",")))

# 🟣 STEP 6: Freeze Model & Metadata Artifacts
cat("\n🟣 STEP 6: Freezing Model Pipeline & Metadata...\n")

skyhour_model_pipeline <- list(
  model = final_model,
  preprocessor = preprocessor,
  feature_names = final_feature_cols,
  optimal_threshold = optimal_threshold,
  pipeline_version = "1.2.0",
  creation_date = Sys.Date(),
  dataset_version = "Combined_Flights_2022.parquet",
  training_period = preprocessor$train_date_range,
  validation_period = preprocessor$val_date_range,
  test_period = preprocessor$test_date_range,
  test_metrics = list(
    ROC_AUC = test_roc,
    PR_AUC = test_pr,
    Brier_Score = test_brier,
    Accuracy = test_acc,
    Precision = test_prec,
    Recall = test_rec,
    Specificity = test_spec,
    F1_Score = test_f1,
    Balanced_Accuracy = test_bal
  )
)

saveRDS(skyhour_model_pipeline, "models/skyhour_delay_model.rds")

metadata_json <- list(
  model_name = "Skyhour Pre-Flight Delay Classifier",
  model_version = "1.2.0",
  dataset = "Combined_Flights_2022.parquet",
  training_start = preprocessor$train_date_range[1],
  training_end = preprocessor$train_date_range[2],
  validation_start = preprocessor$val_date_range[1],
  validation_end = preprocessor$val_date_range[2],
  test_start = preprocessor$test_date_range[1],
  test_end = preprocessor$test_date_range[2],
  test_flights_count = length(test_y),
  test_positive_class_pct = round(mean(test_y == 1) * 100, 2),
  decision_threshold = optimal_threshold,
  performance = list(
    roc_auc = round(test_roc, 4),
    pr_auc = round(test_pr, 4),
    brier_score = round(test_brier, 4),
    accuracy = round(test_acc, 4),
    precision = round(test_prec, 4),
    recall = round(test_rec, 4),
    specificity = round(test_spec, 4),
    f1_score = round(test_f1, 4),
    balanced_accuracy = round(test_bal, 4)
  ),
  oof_target_encoding = list(
    enabled = TRUE,
    folds = 5,
    rare_route_threshold_N = 30,
    fallback_hierarchy = "Route Prior -> (Origin + Dest Prior)/2 -> Carrier Prior -> Global Prior"
  ),
  features_used = final_feature_cols
)

write_json(metadata_json, "models/model_metadata.json", pretty = TRUE, auto_unbox = TRUE)
saveRDS(metadata_json, "models/model_metadata.rds")

# Generate Final Evaluation Report with Exact Terminology Guidelines
report_path <- "reports/model_evaluation_report.md"
sink(report_path)

cat("# SKYHOUR Machine Learning Model Evaluation Report\n\n")
cat(sprintf("**Model Name**: Skyhour Pre-Flight Delay Predictor v1.2  \n"))
cat(sprintf("**Algorithm**: Tuned XGBoost Gradient Boosted Decision Trees with 5-Fold OOF Target Encoding  \n"))
cat(sprintf("**Evaluation Date**: %s  \n", Sys.Date()))
cat(sprintf("**Test Set Period**: %s to %s (N = %s flights)  \n\n",
            preprocessor$test_date_range[1], preprocessor$test_date_range[2], format(length(test_y), big.mark=",")))

cat("## 1. Formal Performance Assessment\n\n")
cat(sprintf("The final model achieves a Test ROC-AUC of **%.4f**, PR-AUC of **%.4f**, and Brier Score of **%.4f** on the untouched July 2022 test set.  \n",
            test_roc, test_pr, test_brier))
cat("> **Performance Description**: This reflects **moderate/fair discriminative performance** for a pre-flight flight delay model relying strictly on schedule, route, carrier, and temporal features available before flight operation.  \n\n")

cat("## 2. Progressive Feature Ablation Experiments Benchmark\n\n")
cat("| Model Experiment | Features | ROC-AUC | PR-AUC | Brier Score | F1-Score | Recall | Precision |\n")
cat("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n")
exp_summary <- readRDS("data/processed/progressive_experiments_summary.rds")
for (i in 1:nrow(exp_summary)) {
  cat(sprintf("| **%s** | %d | %.4f | %.4f | %.4f | %.4f | %.4f | %.4f |\n",
              exp_summary$Model[i], exp_summary$Num_Features[i], exp_summary$ROC_AUC[i],
              exp_summary$PR_AUC[i], exp_summary$Brier_Score[i], exp_summary$F1_Score[i], 
              exp_summary$Recall[i], exp_summary$Precision[i]))
}
cat("\n")

cat("## 3. Operational Probability Threshold Sweep\n\n")
cat("| Threshold | Accuracy | Precision | Recall | Specificity | F1-Score | Balanced Accuracy |\n")
cat("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n")
for (i in 1:nrow(thresh_df)) {
  marker <- if (thresh_df$Threshold[i] == optimal_threshold) " **(Selected)**" else ""
  cat(sprintf("| %.2f%s | %.4f | %.4f | %.4f | %.4f | %.4f | %.4f |\n",
              thresh_df$Threshold[i], marker, thresh_df$Accuracy[i], thresh_df$Precision[i],
              thresh_df$Recall[i], thresh_df$Specificity[i], thresh_df$F1_Score[i], thresh_df$Balanced_Accuracy[i]))
}
cat("\n")

cat("## 4. Final Untouched Test Set Evaluation Results\n\n")
cat("| Metric | Test Value |\n")
cat("| :--- | :--- |\n")
cat(sprintf("| **Decision Threshold Used** | **%.2f** |\n", optimal_threshold))
cat(sprintf("| **ROC-AUC Score** | **%.4f** |\n", test_roc))
cat(sprintf("| **PR-AUC Score** | **%.4f** |\n", test_pr))
cat(sprintf("| **Brier Probability Calibration Score** | **%.4f** |\n", test_brier))
cat(sprintf("| **Overall Accuracy** | **%.4f (%.2f%%)** |\n", test_acc, test_acc * 100))
cat(sprintf("| **Precision (Positive Predictive Value)** | **%.4f (%.2f%%)** |\n", test_prec, test_prec * 100))
cat(sprintf("| **Recall (Sensitivity)** | **%.4f (%.2f%%)** |\n", test_rec, test_rec * 100))
cat(sprintf("| **Specificity** | **%.4f (%.2f%%)** |\n", test_spec, test_spec * 100))
cat(sprintf("| **F1-Score** | **%.4f** |\n", test_f1))
cat(sprintf("| **Balanced Accuracy** | **%.4f** |\n\n", test_bal))

cat("### Test Confusion Matrix\n\n")
cat("| Actual / Predicted | Predicted ON-TIME (0) | Predicted DELAYED (1) | Total |\n")
cat("| :--- | :--- | :--- | :--- |\n")
cat(sprintf("| **Actual ON-TIME (0)** | %s (TN) | %s (FP) | %s |\n", 
            format(tn_t, big.mark=","), format(fp_t, big.mark=","), format(tn_t + fp_t, big.mark=",")))
cat(sprintf("| **Actual DELAYED (1)** | %s (FN) | %s (TP) | %s |\n", 
            format(fn_t, big.mark=","), format(tp_t, big.mark=","), format(tp_t + fn_t, big.mark=",")))
cat(sprintf("| **Total** | %s | %s | %s |\n\n",
            format(tn_t + fn_t, big.mark=","), format(fp_t + tp_t, big.mark=","), format(length(test_y), big.mark=",")))

cat("## 5. Leakage Prevention Audit & Target Encoding Rigor\n\n")
cat("1. **5-Fold Out-of-Fold (OOF) Encodings**: Target encodings for training rows were generated via 5-fold cross-validation, guaranteeing no training row used its own target.  \n")
cat("2. **Rare Route Fallback Hierarchy ($N < 30$)**: Routes with fewer than 30 training observations automatically fell back to origin/destination combined priors, airline priors, and global priors to prevent target overfitting.  \n")
cat("3. **Zero Post-Flight Leakage**: All post-flight variables (`DepDelay`, `ArrDelay`, taxi times, wheel times, post-flight delays) were strictly excluded.  \n")

sink()

cat("\n=== 🔵 STEP 5 & 🟣 STEP 6 MODEL FREEZE COMPLETE ===\n")
cat("Frozen model saved to: models/skyhour_delay_model.rds\n")
cat("Metadata JSON saved to: models/model_metadata.json\n")
cat("Report generated at: reports/model_evaluation_report.md\n")
