# ==============================================================================
# SKYHOUR R Plotting Script: Flight Delay Histogram Graph
# ==============================================================================

library(arrow)

# 1. Load Combined Flights Data
flights <- read_parquet("data/Combined_Flights_2022.parquet")

# 2. Create Plot Directory if missing
if (!dir.exists("outputs/plots")) dir.create("outputs/plots", recursive = TRUE)

# 3. Plot Delay Histogram & Save Image
png("outputs/plots/flight_delay_hist.png", width = 800, height = 500)
hist(
  flights$ArrDelayMinutes[flights$ArrDelayMinutes > 0 & flights$ArrDelayMinutes <= 180],
  breaks = 30,
  col = "#3b82f6",
  main = "US Flight Delay Duration Distribution (0-180 min)",
  xlab = "Arrival Delay (Minutes)",
  ylab = "Flight Count"
)
dev.off()

cat("Graph saved to: outputs/plots/flight_delay_hist.png\n")

# Execution Command:
# Rscript R\services\test_viva_graph.R
# & "C:\Program Files\R\R-4.5.0\bin\Rscript.exe" R\services\test_viva_graph.R
