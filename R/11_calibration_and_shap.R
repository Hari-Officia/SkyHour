# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 11: Probability Calibration & Feature Interpretability
# ==============================================================================
# Objective: Calculate Brier score, generate probability calibration curve,
# and extract feature importance scores.
# ==============================================================================

library(arrow)
library(dplyr)
library(ggplot2)
library(xgboost)

set.seed(42)

theme_skyhour <- function() {
  theme_minimal(base_size = 12) +
    theme(
      plot.title = element_text(face = "bold", size = 14, color = "#1e293b"),
      plot.subtitle = element_text(size = 10, color = "#64748b"),
      axis.title = element_text(face = "bold", size = 10),
      panel.grid.major = element_line(color = "#f1f5f9"),
      panel.grid.minor = element_blank(),
      plot.background = element_rect(fill = "#ffffff", color = NA)
    )
}

cat("=== SKYHOUR CALIBRATION & FEATURE IMPORTANCE STARTED ===\n")

val_mod_d <- readRDS("data/processed/val_preds_model_d.rds")
model_d   <- readRDS("models/model_xgboost_d.rds")

actuals <- val_mod_d$ArrDel15
probs   <- val_mod_d$Prob

# 1. Brier Score Calculation
brier_score <- mean((probs - actuals)^2)
cat(sprintf("Validation Probability Brier Score: %.4f\n", brier_score))

# 2. Probability Calibration Curve Data Binned into 10 Deciles
cal_df <- data.frame(actual = actuals, prob = probs) %>% 
  mutate(bin = cut(prob, breaks = seq(0, 1, by = 0.1), include.lowest = TRUE)) %>% 
  group_by(bin) %>% 
  summarize(
    mean_predicted = mean(prob),
    observed_rate  = mean(actual),
    count          = n()
  ) %>% 
  filter(!is.na(bin))

cal_df_print <- cal_df %>% 
  mutate(across(c(mean_predicted, observed_rate), ~round(.x, 4)))
print(as.data.frame(cal_df_print))

# ------------------------------------------------------------------------------
# Plot 15: Probability Calibration Curve
# ------------------------------------------------------------------------------
cat("Generating Probability Calibration Curve plot...\n")
p_cal <- ggplot(cal_df, aes(x = mean_predicted, y = observed_rate)) +
  geom_abline(intercept = 0, slope = 1, linetype = "dashed", color = "#94a3b8", linewidth = 0.8) +
  geom_line(color = "#8b5cf6", linewidth = 1.2) +
  geom_point(color = "#7c3aed", size = 3) +
  geom_text(aes(label = sprintf("%.1f%%", observed_rate * 100)), vjust = -0.8, fontface = "bold", size = 3) +
  scale_x_continuous(limits = c(0, 1), labels = function(x) paste0(x * 100, "%")) +
  scale_y_continuous(limits = c(0, 1), labels = function(x) paste0(x * 100, "%")) +
  labs(title = sprintf("SKYHOUR: Model D Probability Calibration Curve (Brier Score = %.4f)", brier_score),
       subtitle = "Comparing predicted probability deciles against actual observed delay frequencies",
       x = "Mean Predicted Delay Probability", y = "Observed Delay Frequency") +
  theme_skyhour()

ggsave("plots/15_calibration_curve.png", p_cal, width = 8, height = 6, dpi = 300)

# ------------------------------------------------------------------------------
# Feature Importance Extraction
# ------------------------------------------------------------------------------
cat("Extracting Feature Importance for Model D...\n")
imp <- xgb.importance(model = model_d)
imp_df <- data.frame(
  Feature = imp$Feature,
  Gain = imp$Gain,
  stringsAsFactors = FALSE
) %>% arrange(desc(Gain))

p_imp <- ggplot(imp_df, aes(x = reorder(Feature, Gain), y = Gain)) +
  geom_col(fill = "#8b5cf6", width = 0.6) +
  geom_text(aes(label = sprintf("%.2f%%", Gain * 100)), hjust = -0.1, fontface = "bold", size = 3.5) +
  coord_flip() +
  scale_y_continuous(expand = expansion(mult = c(0, 0.2)), labels = function(x) paste0(x * 100, "%")) +
  labs(title = "SKYHOUR: Model D Feature Importance (XGBoost Relative Gain)",
       subtitle = "Pre-flight features and out-of-fold target encodings driving delay risk estimations",
       x = "Pre-Flight Feature", y = "Relative Gain Contribution") +
  theme_skyhour()

ggsave("plots/13_feature_importance.png", p_imp, width = 9, height = 6, dpi = 300)

saveRDS(list(brier_score = brier_score, cal_df = cal_df, imp_df = imp_df), 
        "data/processed/calibration_summary.rds")

cat("=== CALIBRATION & FEATURE IMPORTANCE COMPLETED ===\n")
cat("Plots saved: plots/15_calibration_curve.png, plots/13_feature_importance.png\n")
