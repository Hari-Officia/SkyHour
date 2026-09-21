# SKYHOUR Data Audit and Quality Report

**Dataset File**: `data/Combined_Flights_2022.parquet`  
**Audit Date**: 2026-09-10  
**R Version**: R version 4.5.0 (2025-04-11 ucrt)  

## 1. Executive Dataset Summary

| Metric | Value |
| :--- | :--- |
| **Total Records** | 4,078,318 |
| **Total Columns** | 62 |
| **Flight Date Range** | 2022-01-01 05:30:00 to 2022-07-31 05:30:00 |
| **Unique Marketing Carriers (IATA)** | 10 |
| **Unique Operating Carriers (IATA)** | 21 |
| **Unique Carrier Names** | 21 |
| **Unique Origin Airports** | 375 |
| **Unique Destination Airports** | 375 |
| **Cancelled Flights** | 123,192 (3.02%) |
| **Diverted Flights** | 10,210 (0.25%) |
| **Sample Duplicate Check** | 0 duplicates in first 100,000 rows |

## 2. Target Variable Class Distribution (`ArrDel15`)

| Category | Target Value (`ArrDel15`) | Count | Percentage |
| :--- | :--- | :--- | :--- |
| On-Time / Delay < 15m (0) | 0 | 3,090,954 | 75.79% |
| Delayed >= 15m (1) | 1 | 853,962 | 20.94% |
| Missing / Invalid (Cancelled/Diverted) | NA | 133,402 | 3.27% |

## 3. Key Numerical Features Summary Statistics

| Variable | Min | Q1 | Median | Mean | Q3 | Max | SD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Distance (miles)** | 31 | 368 | 643 | 797.87 | 1035 | 5095 | 591.47 |
| **CRSDepTime (HHMM)** | 1 | 914 | 1320 | 1329.59 | 1735 | 2359 | 490.48 |
| **CRSArrTime (HHMM)** | 1 | 1103 | 1513 | 1486.06 | 1920 | 2359 | 518.51 |

## 4. Column Inventory & Missing Value Breakdown

| # | Column Name | Data Type | Missing Count | Missing Pct |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `FlightDate` | `timestamp[us]` | 0 | 0.00% |
| 2 | `Airline` | `string` | 0 | 0.00% |
| 3 | `Origin` | `string` | 0 | 0.00% |
| 4 | `Dest` | `string` | 0 | 0.00% |
| 5 | `Cancelled` | `bool` | 0 | 0.00% |
| 6 | `Diverted` | `bool` | 0 | 0.00% |
| 7 | `CRSDepTime` | `int64` | 0 | 0.00% |
| 8 | `DepTime` | `double` | 120,433 | 2.95% |
| 9 | `DepDelayMinutes` | `double` | 120,495 | 2.95% |
| 10 | `DepDelay` | `double` | 120,495 | 2.95% |
| 11 | `ArrTime` | `double` | 124,239 | 3.05% |
| 12 | `ArrDelayMinutes` | `double` | 133,402 | 3.27% |
| 13 | `AirTime` | `double` | 133,402 | 3.27% |
| 14 | `CRSElapsedTime` | `double` | 0 | 0.00% |
| 15 | `ActualElapsedTime` | `double` | 133,402 | 3.27% |
| 16 | `Distance` | `double` | 0 | 0.00% |
| 17 | `Year` | `int64` | 0 | 0.00% |
| 18 | `Quarter` | `int64` | 0 | 0.00% |
| 19 | `Month` | `int64` | 0 | 0.00% |
| 20 | `DayofMonth` | `int64` | 0 | 0.00% |
| 21 | `DayOfWeek` | `int64` | 0 | 0.00% |
| 22 | `Marketing_Airline_Network` | `string` | 0 | 0.00% |
| 23 | `Operated_or_Branded_Code_Share_Partners` | `string` | 0 | 0.00% |
| 24 | `DOT_ID_Marketing_Airline` | `int64` | 0 | 0.00% |
| 25 | `IATA_Code_Marketing_Airline` | `string` | 0 | 0.00% |
| 26 | `Flight_Number_Marketing_Airline` | `int64` | 0 | 0.00% |
| 27 | `Operating_Airline` | `string` | 0 | 0.00% |
| 28 | `DOT_ID_Operating_Airline` | `int64` | 0 | 0.00% |
| 29 | `IATA_Code_Operating_Airline` | `string` | 0 | 0.00% |
| 30 | `Tail_Number` | `string` | 26,795 | 0.66% |
| 31 | `Flight_Number_Operating_Airline` | `int64` | 0 | 0.00% |
| 32 | `OriginAirportID` | `int64` | 0 | 0.00% |
| 33 | `OriginAirportSeqID` | `int64` | 0 | 0.00% |
| 34 | `OriginCityMarketID` | `int64` | 0 | 0.00% |
| 35 | `OriginCityName` | `string` | 0 | 0.00% |
| 36 | `OriginState` | `string` | 0 | 0.00% |
| 37 | `OriginStateFips` | `int64` | 0 | 0.00% |
| 38 | `OriginStateName` | `string` | 0 | 0.00% |
| 39 | `OriginWac` | `int64` | 0 | 0.00% |
| 40 | `DestAirportID` | `int64` | 0 | 0.00% |
| 41 | `DestAirportSeqID` | `int64` | 0 | 0.00% |
| 42 | `DestCityMarketID` | `int64` | 0 | 0.00% |
| 43 | `DestCityName` | `string` | 0 | 0.00% |
| 44 | `DestState` | `string` | 0 | 0.00% |
| 45 | `DestStateFips` | `int64` | 0 | 0.00% |
| 46 | `DestStateName` | `string` | 0 | 0.00% |
| 47 | `DestWac` | `int64` | 0 | 0.00% |
| 48 | `DepDel15` | `double` | 120,495 | 2.95% |
| 49 | `DepartureDelayGroups` | `double` | 120,495 | 2.95% |
| 50 | `DepTimeBlk` | `string` | 0 | 0.00% |
| 51 | `TaxiOut` | `double` | 122,666 | 3.01% |
| 52 | `WheelsOff` | `double` | 122,666 | 3.01% |
| 53 | `WheelsOn` | `double` | 124,242 | 3.05% |
| 54 | `TaxiIn` | `double` | 124,242 | 3.05% |
| 55 | `CRSArrTime` | `int64` | 0 | 0.00% |
| 56 | `ArrDelay` | `double` | 133,402 | 3.27% |
| 57 | `ArrDel15` | `double` | 133,402 | 3.27% |
| 58 | `ArrivalDelayGroups` | `double` | 133,402 | 3.27% |
| 59 | `ArrTimeBlk` | `string` | 0 | 0.00% |
| 60 | `DistanceGroup` | `int64` | 0 | 0.00% |
| 61 | `DivAirportLandings` | `int64` | 0 | 0.00% |
| 62 | `__index_level_0__` | `int64` | 0 | 0.00% |
