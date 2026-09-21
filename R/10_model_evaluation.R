# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 10: PR-AUC, ROC-AUC, Precision-Recall & Threshold Trade-off Sweep
# ==============================================================================
# Objective: Compare Progressive Models A-D, calculate PR-AUC & ROC-AUC, generate
# PR curves, and perform a full threshold trade-off sweep (0.20 to 0.70).
# ==============================================================================

library(arrow)
library(dplyr)
library(ggplot2)
library(pROC)

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

# Function to compute PR curve points and PR-AUC
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

calc_metrics_at_t <- function(actual, prob, threshold) {
  pred <- ifelse(prob >= threshold, 1, 0)
  
  tp <- sum(pred == 1 & actual == 1)
  fp <- sum(pred == 1 & actual == 0)
  tn <- sum(pred == 0 & actual == 0)
  fn <- sum(pred == 0 & actual == 1)
  
  acc <- (tp + tn) / length(actual)
  prec <- ifelse(tp + fp == 0, 0, tp / (tp + fp))
  rec  <- ifelse(tp + fn == 0, 0, tp / (tp + fn))
  spec <- ifelse(tn + fp == 0, 0, tn / (tn + fp))
  f1   <- ifelse(prec + rec == 0, 0, 2 * prec * rec / (prec + rec))
  bal_acc <- (rec + spec) / 2
  
  return(c(Threshold = threshold, Accuracy = acc, Precision = prec, Recall = rec, 
           Specificity = spec, F1_Score = f1, Balanced_Accuracy = bal_acc))
}

cat("=== SKYHOUR PR-AUC & THRESHOLD EVALUATION STARTED ===\n")

val_glm <- readRDS("data/processed/val_preds_logistic.rds")
val_rf  <- readRDS("data/processed/val_preds_rf.rds")
val_mod_d <- readRDS("data/processed/val_preds_model_d.rds")
exp_summary <- readRDS("data/processed/progressive_experiments_summary.rds")

actuals <- val_mod_d$ArrDel15

# Calculate PR-AUC curves
pr_glm   <- calc_pr_curve(actuals, val_glm$Prob)
pr_rf    <- calc_pr_curve(actuals, val_rf$Prob)
pr_mod_d <- calc_pr_curve(actuals, val_mod_d$Prob)

# ------------------------------------------------------------------------------
# Plot 12: Precision-Recall Curves
# ------------------------------------------------------------------------------
cat("Generating Precision-Recall Curves comparison plot...\n")
df_pr_d   <- data.frame(Recall = pr_mod_d$recall, Precision = pr_mod_d$precision, Model = sprintf("XGBoost Model D (PR-AUC = %.4f)", pr_mod_d$pr_auc))
df_pr_rf  <- data.frame(Recall = pr_rf$recall, Precision = pr_rf$precision, Model = sprintf("Random Forest (PR-AUC = %.4f)", pr_rf$pr_auc))
df_pr_glm <- data.frame(Recall = pr_glm$recall, Precision = pr_glm$precision, Model = sprintf("Logistic Regression (PR-AUC = %.4f)", pr_glm$pr_auc))

df_pr_all <- bind_rows(df_pr_d, df_pr_rf, df_pr_glm)

baseline_prior <- mean(actuals == 1)

p_pr <- ggplot(df_pr_all, aes(x = Recall, y = Precision, color = Model)) +
  geom_line(linewidth = 1.1) +
  geom_hline(yintercept = baseline_prior, linetype = "dashed", color = "#94a3b8", linewidth = 0.8) +
  annotate("text", x = 0.85, y = baseline_prior + 0.02, label = sprintf("Baseline Prior (%.2f%%)", baseline_prior * 100), color = "#64748b", size = 3.5) +
  scale_color_manual(values = c("#8b5cf6", "#0ea5e9", "#f59e0b")) +
  scale_x_continuous(limits = c(0, 1), labels = function(x) paste0(x * 100, "%")) +
  scale_y_continuous(limits = c(0, 1), labels = function(x) paste0(x * 100, "%")) +
  labs(title = "SKYHOUR: Precision-Recall Curves Comparison",
       subtitle = "Precision-Recall performance under positive class imbalance (~24.0% delayed in validation)",
       x = "Recall (Sensitivity)", y = "Precision (Positive Predictive Value)") +
  theme_skyhour()

ggsave("plots/12_pr_curves.png", p_pr, width = 8, height = 6, dpi = 300)

# ------------------------------------------------------------------------------
# Threshold Trade-off Sweep (0.20 to 0.70)
# ------------------------------------------------------------------------------
cat("Performing full threshold sweep (0.20 to 0.70) for Model D...\n")
thresholds <- seq(0.20, 0.70, by = 0.05)
thresh_metrics_list <- lapply(thresholds, function(t) calc_metrics_at_t(actuals, val_mod_d$Prob, t))
thresh_sweep_df <- as.data.frame(do.call(rbind, thresh_metrics_list))

print(round(thresh_sweep_df, 4))

# Plot 14: Threshold Trade-off Curves
thresh_long <- thresh_sweep_df %>% 
  select(Threshold, Precision, Recall, F1_Score, Specificity, Balanced_Accuracy) %>% 
  tidyr::pivot_longer(cols = -Threshold, names_to = "Metric", values_to = "Value")

p_thresh <- ggplot(thresh_long, aes(x = Threshold, y = Value, color = Metric)) +
  geom_line(linewidth = 1.2) +
  geom_point(size = 2) +
  scale_color_manual(values = c("Precision" = "#0ea5e9", "Recall" = "#f43f5e", "F1_Score" = "#8b5cf6", 
                                "Specificity" = "#10b981", "Balanced_Accuracy" = "#f59e0b")) +
  scale_x_continuous(breaks = seq(0.20, 0.70, by = 0.05)) +
  scale_y_continuous(limits = c(0, 1), labels = function(x) paste0(x * 100, "%")) +
  labs(title = "SKYHOUR: Operational Probability Threshold Trade-Off Analysis",
       subtitle = "Evaluating operational balance between Recall (early warning) and Precision (warning accuracy)",
       x = "Classification Probability Threshold", y = "Metric Value") +
  theme_skyhour()

ggsave("plots/14_threshold_tradeoff.png", p_thresh, width = 9, height = 6, dpi = 300)

saveRDS(thresh_sweep_df, "data/processed/threshold_sweep_summary.rds")

cat("=== PR-AUC & THRESHOLD EVALUATION COMPLETE ===\n")
cat("Plots saved: plots/12_pr_curves.png, plots/14_threshold_tradeoff.png\n")
