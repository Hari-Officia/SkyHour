# SKYHOUR Machine Learning Model Evaluation Report

**Model Name**: Skyhour Pre-Flight Delay Predictor v1.2  
**Algorithm**: Tuned XGBoost Gradient Boosted Decision Trees with 5-Fold OOF Target Encoding  
**Evaluation Date**: 2026-09-10  
**Test Set Period**: 2022-07-01 05:30:00 to 2022-07-31 05:30:00 (N = 591,738 flights)  

## 1. Formal Performance Assessment

The final model achieves a Test ROC-AUC of **0.6274**, PR-AUC of **0.3072**, and Brier Score of **0.2464** on the untouched July 2022 test set.  
> **Performance Description**: This reflects **moderate/fair discriminative performance** for a pre-flight flight delay model relying strictly on schedule, route, carrier, and temporal features available before flight operation.  

## 2. Progressive Feature Ablation Experiments Benchmark

| Model Experiment | Features | ROC-AUC | PR-AUC | Brier Score | F1-Score | Recall | Precision |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model A (Schedule + Temporal Baseline)** | 7 | 0.6516 | 0.3479 | 0.2396 | 0.4371 | 0.6885 | 0.3202 |
| **Model B (+ Airline)** | 9 | 0.6368 | 0.3170 | 0.2485 | 0.4413 | 0.7152 | 0.3190 |
| **Model C (+ Route & Distance)** | 15 | 0.6160 | 0.3047 | 0.2410 | 0.3971 | 0.5523 | 0.3100 |
| **Model D (+ OOF Target Encoded Priors)** | 17 | 0.6255 | 0.3142 | 0.2432 | 0.4140 | 0.6208 | 0.3105 |
| **Model E (Flight + Weather)** | 22 | 0.6038 | 0.2974 | 0.2440 | 0.3939 | 0.5654 | 0.3023 |

## 3. Operational Probability Threshold Sweep

| Threshold | Accuracy | Precision | Recall | Specificity | F1-Score | Balanced Accuracy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 0.20 | 0.2401 | 0.2401 | 1.0000 | 0.0000 | 0.3872 | 0.5000 |
| 0.25 | 0.2401 | 0.2401 | 1.0000 | 0.0000 | 0.3872 | 0.5000 |
| 0.30 | 0.2401 | 0.2401 | 1.0000 | 0.0000 | 0.3872 | 0.5000 |
| 0.35 | 0.2401 | 0.2401 | 1.0000 | 0.0000 | 0.3872 | 0.5000 |
| 0.40 | 0.2401 | 0.2401 | 1.0000 | 0.0000 | 0.3872 | 0.5000 |
| 0.45 | 0.2401 | 0.2401 | 1.0000 | 0.0000 | 0.3872 | 0.5000 |
| 0.50 **(Selected)** | 0.5833 | 0.3104 | 0.6020 | 0.5774 | 0.4096 | 0.5897 |
| 0.55 | 0.7599 | 0.0000 | 0.0000 | 1.0000 | 0.0000 | 0.5000 |
| 0.60 | 0.7599 | 0.0000 | 0.0000 | 1.0000 | 0.0000 | 0.5000 |
| 0.65 | 0.7599 | 0.0000 | 0.0000 | 1.0000 | 0.0000 | 0.5000 |
| 0.70 | 0.7599 | 0.0000 | 0.0000 | 1.0000 | 0.0000 | 0.5000 |

## 4. Final Untouched Test Set Evaluation Results

| Metric | Test Value |
| :--- | :--- |
| **Decision Threshold Used** | **0.50** |
| **ROC-AUC Score** | **0.6274** |
| **PR-AUC Score** | **0.3072** |
| **Brier Probability Calibration Score** | **0.2464** |
| **Overall Accuracy** | **0.5970 (59.70%)** |
| **Precision (Positive Predictive Value)** | **0.3182 (31.82%)** |
| **Recall (Sensitivity)** | **0.6310 (63.10%)** |
| **Specificity** | **0.5867 (58.67%)** |
| **F1-Score** | **0.4231** |
| **Balanced Accuracy** | **0.6088** |

### Test Confusion Matrix

| Actual / Predicted | Predicted ON-TIME (0) | Predicted DELAYED (1) | Total |
| :--- | :--- | :--- | :--- |
| **Actual ON-TIME (0)** | 265,867 (TN) | 187,325 (FP) | 453,192 |
| **Actual DELAYED (1)** | 51,122 (FN) | 87,424 (TP) | 138,546 |
| **Total** | 316,989 | 274,749 | 591,738 |

## 5. Leakage Prevention Audit & Target Encoding Rigor

1. **5-Fold Out-of-Fold (OOF) Encodings**: Target encodings for training rows were generated via 5-fold cross-validation, guaranteeing no training row used its own target.  
2. **Rare Route Fallback Hierarchy ($N < 30$)**: Routes with fewer than 30 training observations automatically fell back to origin/destination combined priors, airline priors, and global priors to prevent target overfitting.  
3. **Zero Post-Flight Leakage**: All post-flight variables (`DepDelay`, `ArrDelay`, taxi times, wheel times, post-flight delays) were strictly excluded.  
