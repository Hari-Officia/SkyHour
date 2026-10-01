library(arrow)

# Load India Aviation Master Parquet Dataset
india_flights <- read_parquet("data/india/master/india_aviation.parquet")
print(head(india_flights))

# Execution Command:
# Rscript R\services\test_viva2.R
# & "C:\Program Files\R\R-4.5.0\bin\Rscript.exe" R\services\test_viva2.R
