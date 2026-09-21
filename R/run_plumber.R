# Launch Plumber API Server
library(plumber)

api_path <- "R/14_plumber_api.R"
if (!file.exists(api_path)) api_path <- "14_plumber_api.R"

pr <- plumb(api_path)
pr$run(host = "0.0.0.0", port = 8000)
