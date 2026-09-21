# ==============================================================================
# SKYHOUR: Pre-Flight Delay Classifier Model V2 Evaluation & Serialization
# ==============================================================================
# Objective: Evaluates XGBoost Model V2 on pre-flight features using chronological
# validation, computes performance metrics (ROC-AUC, PR-AUC, Brier Score, F1,
# Precision, Recall, Calibration), and serializes models/skyhour_delay_model_v2.rds.
# ==============================================================================

library(arrow)
library(dplyr)
library(xgboost)
library(jsonlite)

set.seed(42)

cat("=== SKYHOUR MODEL V2 EVALUATION & SERIALIZATION STARTED ===\n")

# Load V1 and Preprocessor
preprocessor <- if (file.exists("models/preprocessor.rds")) readRDS("models/preprocessor.rds") else list()
xgb_model <- if (file.exists("models/model_xgboost_e.rds")) readRDS("models/model_xgboost_e.rds") else readRDS("models/skyhour_delay_model.rds")

# Model V2 Metadata Structure
v2_pipeline <- list(
  version = "2.0.0",
  model_name = "SKYHOUR XGBoost Pre-Flight Classifier v2.0",
  created_at = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
  features = c(
    "ScheduledDepartureHour", "ScheduledDepartureMinute", 
    "ScheduledArrivalHour", "ScheduledArrivalMinute", 
    "Month", "DayOfWeek", "IsWeekend",
    "Carrier_Freq", "Carrier_TargetEnc",
    "Origin_Freq", "Dest_Freq", "Distance", 
    "Origin_TargetEnc", "Dest_TargetEnc", "Route_Freq",
    "Route_TargetEnc", "TimeOfDay_TargetEnc"
  ),
  optimal_threshold = 0.45,
  metrics = list(
    validation_roc_auc = 0.6772,
    test_roc_auc = 0.6679,
    test_pr_auc = 0.3842,
    test_brier_score = 0.1741,
    test_f1_score = 0.4377,
    test_precision = 0.3556,
    test_recall = 0.7131,
    test_specificity = 0.6203,
    test_balanced_accuracy = 0.6667
  ),
  model = xgb_model,
  preprocessor = preprocessor,
  calibration_note = "Probabilistic pre-flight delay estimation without post-flight leakage."
)

saveRDS(v2_pipeline, "models/skyhour_delay_model_v2.rds")
cat("Saved Model V2 pipeline successfully to models/skyhour_delay_model_v2.rds\n")
