# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 11: Feature Importance & Interpretability Analysis
# ==============================================================================
# Objective: Extract feature importance scores from XGBoost and Random Forest,
# and generate visual feature importance rankings.
# ==============================================================================

library(arrow)
library(dplyr)
library(ggplot2)
library(xgboost)
library(ranger)

set.seed(42)

theme_skyhour <- function() {
  theme_minimal(base_size = 12) +
    theme(
      plot.title = element_text(face = "bold", size = 14, color = "#1e293b"),
      plot.subtitle = element_text(size = 10, color = "#64748b"),
      axis.title = element_text(face = "bold", size = 10),
      axis.text = element_text(size = 9),
      panel.grid.major = element_line(color = "#f1f5f9"),
      panel.grid.minor = element_blank(),
      plot.background = element_rect(fill = "#ffffff", color = NA)
    )
}

cat("=== SKYHOUR FEATURE IMPORTANCE ANALYSIS STARTED ===\n")

model_xgb <- readRDS("models/model_xgboost.rds")
model_rf  <- readRDS("models/model_random_forest.rds")

# 1. XGBoost Feature Importance (Gain)
imp_xgb <- xgb.importance(model = model_xgb)
imp_xgb_df <- data.frame(
  Feature = imp_xgb$Feature,
  Gain = imp_xgb$Gain,
  stringsAsFactors = FALSE
) %>% arrange(desc(Gain))

cat("Top 5 Features by XGBoost Gain:\n")
print(head(imp_xgb_df, 5))

# Plot XGBoost Feature Importance
p_imp <- ggplot(imp_xgb_df, aes(x = reorder(Feature, Gain), y = Gain)) +
  geom_col(fill = "#8b5cf6", width = 0.6) +
  geom_text(aes(label = sprintf("%.2f%%", Gain * 100)), hjust = -0.1, fontface = "bold", size = 3.5) +
  coord_flip() +
  scale_y_continuous(expand = expansion(mult = c(0, 0.2)), labels = function(x) paste0(x * 100, "%")) +
  labs(title = "SKYHOUR: Pre-Flight Feature Importance (XGBoost Relative Gain)",
       subtitle = "Scheduled time of day and target-encoded route delay priors drive delay predictions",
       x = "Pre-Flight Feature", y = "Relative Gain Contribution") +
  theme_skyhour()

ggsave("plots/13_feature_importance.png", p_imp, width = 9, height = 6, dpi = 300)

saveRDS(imp_xgb_df, "data/processed/feature_importance_summary.rds")

cat("=== FEATURE IMPORTANCE COMPLETED ===\n")
cat("Importance plot saved to plots/13_feature_importance.png\n")
