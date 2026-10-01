library(arrow)

# Load 2022 Combined Flights Parquet Data
flights <- read_parquet("data/Combined_Flights_2022.parquet")
print(head(flights))


#d:\Skyhour > & "C:\Program Files\R\R-4.5.0\bin\Rscript.exe" R\services\test_viva.R
#& "C:\Program Files\R\R-4.5.0\bin\Rscript.exe" R\services\test_viva.R
