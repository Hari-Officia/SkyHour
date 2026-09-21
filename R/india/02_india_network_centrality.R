# ==============================================================================
# SKYHOUR INDIA: India Aviation Traffic, Weather & Network Intelligence Platform
# Script 02: Network Graph Centrality Engine
# ==============================================================================
# Objective: Build the Indian Aviation Network Graph (Airports = Nodes, Routes = Edges,
# Flight/Passenger Volume = Edge Weights) and compute Degree Centrality,
# Betweenness Centrality, Weighted Degree, and PageRank.
# ==============================================================================

library(igraph)
library(dplyr)
library(arrow)

cat("==============================================================================\n")
cat("SKYHOUR INDIA: Network Graph Centrality Analysis\n")
cat("==============================================================================\n\n")

dir.create("data/india/processed/network", recursive = TRUE, showWarnings = FALSE)

# Load Reference Datasets
airports <- read.csv("data/india/reference/airports_india.csv", stringsAsFactors = FALSE)
routes   <- read.csv("data/india/processed/routes/routes_india.csv", stringsAsFactors = FALSE)

# Prepare Edges & Nodes for Graph Construction
edges <- routes %>% select(origin, destination, monthly_flights, monthly_passengers)

# Unique nodes present in routes
route_airports <- unique(c(routes$origin, routes$destination))
nodes <- airports %>% filter(airport_iata %in% route_airports) %>% select(airport_iata, airport_name, city, state)

# Build Graph Object
g <- graph_from_data_frame(d = edges, vertices = nodes, directed = FALSE)

# Calculate Centrality Metrics
degree_val    <- degree(g, mode = "all")
between_val   <- betweenness(g, directed = FALSE, normalized = TRUE)
weighted_deg  <- strength(g, weights = E(g)$monthly_passengers)
pagerank_val  <- page_rank(g, weights = E(g)$monthly_passengers)$vector

# Assemble Centrality DataFrame
centrality_df <- data.frame(
  airport_iata = V(g)$name,
  airport_name = V(g)$airport_name,
  city = V(g)$city,
  state = V(g)$state,
  degree_centrality = as.numeric(degree_val),
  betweenness_centrality = round(as.numeric(between_val), 4),
  weighted_passenger_degree = as.numeric(weighted_deg),
  pagerank_score = round(as.numeric(pagerank_val), 4),
  stringsAsFactors = FALSE
)

# Rank airports by Network Centrality Score
centrality_df <- centrality_df %>%
  mutate(network_rank = min_rank(desc(weighted_passenger_degree))) %>%
  arrange(network_rank)

print(head(centrality_df, 10))

# Save Centrality Output
write.csv(centrality_df, "data/india/processed/network/airport_centrality.csv", row.names = FALSE)

# Construct Master Airport Dataset (india_airport_master.csv & parquet)
traffic_latest <- read.csv("data/india/processed/traffic/india_traffic_monthly.csv", stringsAsFactors = FALSE) %>%
  filter(year == 2025 & month == 12) # Latest period snapshot

master_airports <- airports %>%
  left_join(centrality_df %>% select(airport_iata, degree_centrality, betweenness_centrality, weighted_passenger_degree, pagerank_score, network_rank), by = "airport_iata") %>%
  left_join(traffic_latest %>% select(airport_iata, monthly_passengers, monthly_flights, aircraft_movements, temperature_c, rainfall_mm, humidity_pct, wind_speed_kmh, weather_severity_score), by = "airport_iata")

# Fill NAs for unrouted regional airports
master_airports$degree_centrality[is.na(master_airports$degree_centrality)] <- 1
master_airports$betweenness_centrality[is.na(master_airports$betweenness_centrality)] <- 0.0001
master_airports$weighted_passenger_degree[is.na(master_airports$weighted_passenger_degree)] <- 5000
master_airports$pagerank_score[is.na(master_airports$pagerank_score)] <- 0.005
master_airports$network_rank[is.na(master_airports$network_rank)] <- 99

# Compute Traffic Pressure Index (Normalized against 1M pax baseline)
master_airports <- master_airports %>%
  mutate(
    traffic_pressure_index = round(pmin(100, (monthly_passengers / 500000) * 50), 1),
    skyhour_risk_score = round(pmin(100, 0.45 * traffic_pressure_index + 0.35 * weather_severity_score + 0.20 * (pagerank_score * 500)), 1)
  )

write.csv(master_airports, "data/india/processed/airports/india_airport_master.csv", row.names = FALSE)
write_parquet(master_airports, "data/india/master/india_airport_master.parquet")

cat(sprintf("Master Airport Dataset created at data/india/master/india_airport_master.parquet (%d airports).\n", nrow(master_airports)))
cat("==============================================================================\n")
