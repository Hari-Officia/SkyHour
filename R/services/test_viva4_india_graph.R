# ==============================================================================
# SKYHOUR R Plotting Script: India Aviation Traffic Graph
# ==============================================================================

library(arrow)
library(ggplot2)

# 1. Load India Aviation Master Dataset
india_data <- read_parquet("data/india/master/india_aviation.parquet")

# 2. Aggregate Total Monthly Passengers by Airport
airport_traffic <- aggregate(monthly_passengers ~ airport_name + city, data = india_data, FUN = sum)
airport_traffic <- airport_traffic[order(-airport_traffic$monthly_passengers), ][1:6, ]
airport_traffic$passengers_mil <- round(airport_traffic$monthly_passengers / 1e6, 2)

# 3. Render and Save Graph to PNG File
output_dir <- "outputs/plots"
if (!dir.exists(output_dir)) dir.create(output_dir, recursive = TRUE)

png(file.path(output_dir, "india_airport_traffic_plot.png"), width = 800, height = 500)
barplot(
  airport_traffic$passengers_mil,
  names.arg = airport_traffic$city,
  col = "#f97316",
  main = "Top 6 Indian Airports by Monthly Passenger Traffic (Millions)",
  ylab = "Passengers (Millions)",
  xlab = "City Hub"
)
dev.off()

cat("Graph successfully generated and saved to: outputs/plots/india_airport_traffic_plot.png\n")

# Execution Commands:
# Rscript R\services\test_viva4_india_graph.R
# & "C:\Program Files\R\R-4.5.0\bin\Rscript.exe" R\services\test_viva4_india_graph.R
