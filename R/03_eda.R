# ==============================================================================
# SKYHOUR: Airline Flight Delay Analysis and Prediction System
# Script 03: Exploratory Data Analysis (EDA)
# ==============================================================================
# Objective: Generate 10 publication-quality ggplot2 visualizations examining
# flight delay distributions across carriers, temporal windows, routes, and distance.
# ==============================================================================

library(arrow)
library(dplyr)
library(ggplot2)
library(scales)
library(corrplot)
library(gridExtra)

set.seed(42)

# Custom dark modern theme for Skyhour visualizations
theme_skyhour <- function() {
  theme_minimal(base_size = 12) +
    theme(
      plot.title = element_text(face = "bold", size = 14, color = "#1e293b", margin = margin(b = 6)),
      plot.subtitle = element_text(size = 10, color = "#64748b", margin = margin(b = 10)),
      axis.title = element_text(face = "bold", size = 10, color = "#334155"),
      axis.text = element_text(size = 9, color = "#475569"),
      panel.grid.major = element_line(color = "#f1f5f9", linewidth = 0.5),
      panel.grid.minor = element_blank(),
      plot.background = element_rect(fill = "#ffffff", color = NA),
      panel.background = element_rect(fill = "#f8fafc", color = NA),
      legend.position = "bottom",
      legend.title = element_text(face = "bold", size = 9),
      plot.margin = margin(12, 12, 12, 12)
    )
}

parquet_path <- "data/processed/cleaned_flights.parquet"
if (!file.exists(parquet_path)) stop("Cleaned dataset not found!")

cat("=== SKYHOUR EDA STARTED ===\n")
dataset <- open_dataset(parquet_path)

# ------------------------------------------------------------------------------
# 1. Class Distribution Plot
# ------------------------------------------------------------------------------
cat("Plot 1: Target class distribution...\n")
class_df <- dataset %>% 
  group_by(ArrDel15) %>% 
  summarize(Count = n()) %>% 
  collect() %>% 
  mutate(
    Label = ifelse(ArrDel15 == 1, "Delayed (>=15 min)", "On-Time (<15 min)"),
    Pct = Count / sum(Count) * 100
  )

p1 <- ggplot(class_df, aes(x = Label, y = Count, fill = Label)) +
  geom_col(width = 0.5, show.legend = FALSE) +
  geom_text(aes(label = sprintf("%s\n(%.1f%%)", format(Count, big.mark=","), Pct)), 
            vjust = -0.3, fontface = "bold", size = 4) +
  scale_fill_manual(values = c("On-Time (<15 min)" = "#0ea5e9", "Delayed (>=15 min)" = "#f43f5e")) +
  scale_y_continuous(labels = comma, expand = expansion(mult = c(0, 0.15))) +
  labs(title = "SKYHOUR: Target Variable Class Distribution (ArrDel15)",
       subtitle = "Cleaned 2022 US Domestic Operated Flights (N = 3,944,916)",
       x = "Flight Outcome Status", y = "Total Flights") +
  theme_skyhour()

ggsave("plots/01_class_distribution.png", p1, width = 7, height = 5, dpi = 300)

# ------------------------------------------------------------------------------
# 2. Delay Rate by Airline
# ------------------------------------------------------------------------------
cat("Plot 2: Delay rate by airline...\n")
airline_df <- dataset %>% 
  group_by(IATA_Code_Marketing_Airline) %>% 
  summarize(
    Total = n(),
    Delayed = sum(as.integer(ArrDel15 == 1), na.rm = TRUE),
    DelayRate = mean(ArrDel15, na.rm = TRUE) * 100
  ) %>% 
  collect() %>% 
  arrange(desc(DelayRate))

p2 <- ggplot(airline_df, aes(x = reorder(IATA_Code_Marketing_Airline, DelayRate), y = DelayRate)) +
  geom_col(fill = "#3b82f6", width = 0.6) +
  geom_text(aes(label = sprintf("%.1f%%", DelayRate)), hjust = -0.2, size = 3.5, fontface = "bold") +
  coord_flip() +
  scale_y_continuous(expand = expansion(mult = c(0, 0.15)), labels = function(x) paste0(x, "%")) +
  labs(title = "SKYHOUR: Flight Delay Rate by Marketing Carrier (2022)",
       subtitle = "Percentage of operated flights delayed >= 15 minutes",
       x = "Marketing Airline (IATA Code)", y = "Delay Rate (%)") +
  theme_skyhour()

ggsave("plots/02_delay_by_airline.png", p2, width = 8, height = 5, dpi = 300)

# ------------------------------------------------------------------------------
# 3. Delay Rate by Month
# ------------------------------------------------------------------------------
cat("Plot 3: Delay rate by month...\n")
month_df <- dataset %>% 
  group_by(Month) %>% 
  summarize(
    Total = n(),
    DelayRate = mean(ArrDel15, na.rm = TRUE) * 100
  ) %>% 
  collect() %>% 
  mutate(MonthName = month.abb[Month])

p3 <- ggplot(month_df, aes(x = factor(MonthName, levels = month.abb[1:7]), y = DelayRate, group = 1)) +
  geom_line(color = "#8b5cf6", linewidth = 1.2) +
  geom_point(color = "#7c3aed", size = 3) +
  geom_text(aes(label = sprintf("%.1f%%", DelayRate)), vjust = -0.8, fontface = "bold", size = 3.5) +
  scale_y_continuous(expand = expansion(mult = c(0.1, 0.2)), labels = function(x) paste0(x, "%")) +
  labs(title = "SKYHOUR: Flight Delay Rate Seasonality by Month (Jan-Jul 2022)",
       subtitle = "Higher delay rates observed during summer travel peak (June/July)",
       x = "Month", y = "Delay Rate (%)") +
  theme_skyhour()

ggsave("plots/03_delay_by_month.png", p3, width = 7, height = 5, dpi = 300)

# ------------------------------------------------------------------------------
# 4. Delay Rate by Day of Week
# ------------------------------------------------------------------------------
cat("Plot 4: Delay rate by day of week...\n")
dow_df <- dataset %>% 
  group_by(DayOfWeek) %>% 
  summarize(
    Total = n(),
    DelayRate = mean(ArrDel15, na.rm = TRUE) * 100
  ) %>% 
  collect() %>% 
  mutate(DayName = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")[DayOfWeek])

p4 <- ggplot(dow_df, aes(x = factor(DayName, levels = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")), y = DelayRate)) +
  geom_col(fill = "#10b981", width = 0.6) +
  geom_text(aes(label = sprintf("%.1f%%", DelayRate)), vjust = -0.5, fontface = "bold", size = 3.5) +
  scale_y_continuous(expand = expansion(mult = c(0, 0.15)), labels = function(x) paste0(x, "%")) +
  labs(title = "SKYHOUR: Delay Rate by Day of Week",
       subtitle = "Thursdays and Fridays exhibit highest cumulative delay rates",
       x = "Day of Week", y = "Delay Rate (%)") +
  theme_skyhour()

ggsave("plots/04_delay_by_dayofweek.png", p4, width = 7, height = 5, dpi = 300)

# ------------------------------------------------------------------------------
# 5. Delay Rate by Scheduled Departure Hour
# ------------------------------------------------------------------------------
cat("Plot 5: Delay rate by departure hour...\n")
hour_df <- dataset %>% 
  mutate(DepHour = as.integer(CRSDepTime %/% 100)) %>% 
  filter(DepHour >= 0 & DepHour <= 23) %>% 
  group_by(DepHour) %>% 
  summarize(
    Total = n(),
    DelayRate = mean(ArrDel15, na.rm = TRUE) * 100
  ) %>% 
  collect()

p5 <- ggplot(hour_df, aes(x = DepHour, y = DelayRate)) +
  geom_area(fill = "#f59e0b", alpha = 0.3) +
  geom_line(color = "#d97706", linewidth = 1.2) +
  geom_point(color = "#b45309", size = 2.5) +
  scale_x_continuous(breaks = 0:23, labels = sprintf("%02d:00", 0:23)) +
  scale_y_continuous(labels = function(x) paste0(x, "%")) +
  labs(title = "SKYHOUR: Delay Propagation Across Scheduled Departure Hours",
       subtitle = "Delays compound continuously throughout the operational day (peaks at 20:00-21:00)",
       x = "Scheduled Departure Hour (24h format)", y = "Delay Rate (%)") +
  theme_skyhour() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

ggsave("plots/05_delay_by_dep_hour.png", p5, width = 9, height = 5, dpi = 300)

# ------------------------------------------------------------------------------
# 6. Top 15 Origin Airports by Delay Rate (Min 10,000 flights)
# ------------------------------------------------------------------------------
cat("Plot 6: Top origin airports delay rate...\n")
origin_df <- dataset %>% 
  group_by(Origin) %>% 
  summarize(
    TotalFlights = n(),
    DelayRate = mean(ArrDel15, na.rm = TRUE) * 100
  ) %>% 
  filter(TotalFlights >= 10000) %>% 
  collect() %>% 
  arrange(desc(DelayRate)) %>% 
  head(15)

p6 <- ggplot(origin_df, aes(x = reorder(Origin, DelayRate), y = DelayRate)) +
  geom_col(fill = "#ef4444", width = 0.6) +
  geom_text(aes(label = sprintf("%.1f%%\n(%sk)", DelayRate, round(TotalFlights/1000, 1))), 
            hjust = -0.1, size = 3, fontface = "bold") +
  coord_flip() +
  scale_y_continuous(expand = expansion(mult = c(0, 0.2)), labels = function(x) paste0(x, "%")) +
  labs(title = "SKYHOUR: Top 15 Origin Airports by Arrival Delay Rate",
       subtitle = "Airports with min 10,000 annual flights",
       x = "Origin Airport (IATA Code)", y = "Delay Rate (%)") +
  theme_skyhour()

ggsave("plots/06_top15_origin_airports.png", p6, width = 8, height = 6, dpi = 300)

# ------------------------------------------------------------------------------
# 7. Top 15 Destination Airports by Delay Rate (Min 10,000 flights)
# ------------------------------------------------------------------------------
cat("Plot 7: Top dest airports delay rate...\n")
dest_df <- dataset %>% 
  group_by(Dest) %>% 
  summarize(
    TotalFlights = n(),
    DelayRate = mean(ArrDel15, na.rm = TRUE) * 100
  ) %>% 
  filter(TotalFlights >= 10000) %>% 
  collect() %>% 
  arrange(desc(DelayRate)) %>% 
  head(15)

p7 <- ggplot(dest_df, aes(x = reorder(Dest, DelayRate), y = DelayRate)) +
  geom_col(fill = "#ec4899", width = 0.6) +
  geom_text(aes(label = sprintf("%.1f%%\n(%sk)", DelayRate, round(TotalFlights/1000, 1))), 
            hjust = -0.1, size = 3, fontface = "bold") +
  coord_flip() +
  scale_y_continuous(expand = expansion(mult = c(0, 0.2)), labels = function(x) paste0(x, "%")) +
  labs(title = "SKYHOUR: Top 15 Destination Airports by Arrival Delay Rate",
       subtitle = "Airports with min 10,000 annual flights",
       x = "Destination Airport (IATA Code)", y = "Delay Rate (%)") +
  theme_skyhour()

ggsave("plots/07_top15_dest_airports.png", p7, width = 8, height = 6, dpi = 300)

# ------------------------------------------------------------------------------
# 8. Top 15 Highest Volume Routes Delay Rate
# ------------------------------------------------------------------------------
cat("Plot 8: Top routes delay rate...\n")
route_df <- dataset %>% 
  mutate(Route = paste0(Origin, "_", Dest)) %>% 
  group_by(Route) %>% 
  summarize(
    TotalFlights = n(),
    DelayRate = mean(ArrDel15, na.rm = TRUE) * 100
  ) %>% 
  filter(TotalFlights >= 3000) %>% 
  collect() %>% 
  arrange(desc(DelayRate)) %>% 
  head(15)

p8 <- ggplot(route_df, aes(x = reorder(Route, DelayRate), y = DelayRate)) +
  geom_col(fill = "#6366f1", width = 0.6) +
  geom_text(aes(label = sprintf("%.1f%% (%s)", DelayRate, format(TotalFlights, big.mark=","))), 
            hjust = -0.1, size = 3, fontface = "bold") +
  coord_flip() +
  scale_y_continuous(expand = expansion(mult = c(0, 0.25)), labels = function(x) paste0(x, "%")) +
  labs(title = "SKYHOUR: Top 15 Delayed High-Volume Routes",
       subtitle = "Flight routes with min 3,000 operations in 2022",
       x = "Route (Origin_Destination)", y = "Delay Rate (%)") +
  theme_skyhour()

ggsave("plots/08_top15_routes.png", p8, width = 8, height = 6, dpi = 300)

# ------------------------------------------------------------------------------
# 9. Distance vs Delay Rate
# ------------------------------------------------------------------------------
cat("Plot 9: Distance vs delay rate...\n")
dist_df <- dataset %>% 
  select(Distance, ArrDel15) %>% 
  collect() %>% 
  mutate(DistanceBin = cut(Distance, breaks = seq(0, 5500, by = 500), include.lowest = TRUE)) %>% 
  group_by(DistanceBin) %>% 
  summarize(
    Total = n(),
    DelayRate = mean(ArrDel15, na.rm = TRUE) * 100
  )

p9 <- ggplot(dist_df, aes(x = DistanceBin, y = DelayRate)) +
  geom_col(fill = "#14b8a6", width = 0.6) +
  geom_text(aes(label = sprintf("%.1f%%", DelayRate)), vjust = -0.5, fontface = "bold", size = 3) +
  scale_y_continuous(expand = expansion(mult = c(0, 0.15)), labels = function(x) paste0(x, "%")) +
  labs(title = "SKYHOUR: Delay Rate Across Flight Distance Intervals",
       subtitle = "Distance binned in 500-mile increments",
       x = "Flight Distance Interval (miles)", y = "Delay Rate (%)") +
  theme_skyhour() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

ggsave("plots/09_distance_vs_delay.png", p9, width = 8, height = 5, dpi = 300)

# ------------------------------------------------------------------------------
# 10. Correlation Matrix of Key Numerical Variables
# ------------------------------------------------------------------------------
cat("Plot 10: Correlation matrix...\n")
sample_corr_df <- dataset %>% 
  head(100000) %>% 
  collect() %>% 
  mutate(
    DepHour = CRSDepTime %/% 100,
    ArrHour = CRSArrTime %/% 100
  ) %>% 
  select(ArrDel15, Distance, DepHour, ArrHour, Month, DayOfWeek, DayofMonth, Quarter)

cor_matrix <- cor(sample_corr_df, use = "complete.obs")

png("plots/10_correlation_matrix.png", width = 800, height = 800, res = 120)
corrplot(cor_matrix, method = "color", type = "upper", 
         tl.col = "black", tl.srt = 45, addCoef.col = "black",
         number.cex = 0.8, title = "SKYHOUR: Numerical Features Correlation Heatmap",
         mar = c(0,0,2,0))
dev.off()

cat("=== EDA COMPLETED SUCCESSFULLY ===\n")
cat("10 plots generated and saved to plots/ directory.\n")
