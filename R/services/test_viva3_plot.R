# ==============================================================================
# SKYHOUR R Plotting Script: US Flight Delay Distribution Graph
# ==============================================================================

library(arrow)
library(ggplot2)

# 1. Load US Combined Flights Data
flights <- read_parquet("data/Combined_Flights_2022.parquet")

# 2. Calculate Carrier Delay Pct
carrier_stats <- aggregate(ArrDel15 ~ Airline, data = flights, FUN = function(x) round(mean(x, na.rm=TRUE)*100, 2))
colnames(carrier_stats) <- c("Airline", "DelayRatePct")
carrier_stats <- carrier_stats[order(-carrier_stats$DelayRatePct), ][1:10, ]

# 3. Save Bar Graph to PNG
output_dir <- "outputs/plots"
if (!dir.exists(output_dir)) dir.create(output_dir, recursive = TRUE)

png(file.path(output_dir, "us_carrier_delay_plot.png"), width = 800, height = 500)
barplot(
  carrier_stats$DelayRatePct,
  names.arg = carrier_stats$Airline,
  las = 2,
  col = "#3b82f6",
  main = "Top US Airline Delay Rates (%)",
  ylab = "Delay Rate (%)",
  cex.names = 0.7
)
dev.off()

cat("Graph successfully generated and saved to: outputs/plots/us_carrier_delay_plot.png\n")

# Execution Commands:
# Rscript R\services\test_viva3_plot.R
# & "C:\Program Files\R\R-4.5.0\bin\Rscript.exe" R\services\test_viva3_plot.R
