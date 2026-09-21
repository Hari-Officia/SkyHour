# SKYHOUR Statistical Hypothesis Testing Report

**Analysis Date**: 2026-09-10  
**Sample Size Analyzed**: 200,000 flights  

## 1. Categorical Feature Independence Tests (Chi-Square Test of Independence)

| Hypothesis Test | Test Statistic (X-squared) | Degrees of Freedom (df) | p-value | Decision (alpha = 0.05) |
| :--- | :--- | :--- | :--- | :--- |
| **Carrier vs Delay (`IATA_Code_Marketing_Airline` x `ArrDel15`)** | 3209.77 | 3 | < 2.2e-16 | Reject H0 (Statistically Significant) |
| **Month Seasonality vs Delay (`Month` x `ArrDel15`)** | 57781.25 | 1 | < 2.2e-16 | Reject H0 (Statistically Significant) |
| **Day of Week vs Delay (`DayOfWeek` x `ArrDel15`)** | 213.05 | 6 | < 2.2e-16 | Reject H0 (Statistically Significant) |

### Academic Interpretation of Chi-Square Tests
1. **Marketing Carrier ($X^2 = 3209.77, df = 3, p < 0.001$)**:  
   Null Hypothesis ($H_0$): Flight arrival delay status is independent of the marketing airline carrier.  
   **Conclusion**: We reject $H_0$ with extremely strong evidence. Delay incidence varies significantly by carrier due to fleet utilization, network structure, and ground handling efficiency.  

2. **Seasonal Month ($X^2 = 57781.25, df = 1, p < 0.001$)**:  
   Null Hypothesis ($H_0$): Flight delay rates are uniform across months.  
   **Conclusion**: We reject $H_0$. Seasonal weather pattern changes and passenger volume surges create strong month-to-month delay rate variance.  

3. **Day of Week ($X^2 = 213.05, df = 6, p < 0.001$)**:  
   Null Hypothesis ($H_0$): Delay status is independent of the day of the week.  
   **Conclusion**: We reject $H_0$. Intra-week flight schedule density variations (e.g. Thursday/Friday peaks) significantly drive delay probability.  

## 2. Numerical Feature Comparison (Wilcoxon Rank-Sum Test)

**Test**: Mann-Whitney U / Wilcoxon Rank-Sum Test  
**Variable**: Flight Distance (miles) grouped by `ArrDel15`  
**W Statistic**: 3,359,081,277  
**p-value**: < 2.2e-16  

### Distance Summary Statistics by Delay Outcome

| Delay Outcome | Mean Distance (mi) | Median Distance (mi) | SD (mi) | IQR (mi) |
| :--- | :--- | :--- | :--- | :--- |
| **On-Time (ArrDel15 = 0)** | 709.37 | 588 | 510.85 | 577 |
| **Delayed (ArrDel15 = 1)** | 735.56 | 628 | 483.66 | 598 |

### Academic Interpretation of Wilcoxon Test
Null Hypothesis ($H_0$): The distribution of flight distance is identical for on-time and delayed flights.  
**Conclusion**: We reject $H_0$ ($p < 0.001$). Delayed flights exhibit statistically significant differences in distance distribution compared to on-time flights, confirming flight distance as a informative pre-flight predictor.  
