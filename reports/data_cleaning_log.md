# SKYHOUR Data Cleaning & Leakage Audit Log

**Date**: 2026-09-10  
**Input Dataset**: `data/Combined_Flights_2022.parquet`  
**Output Cleaned Dataset**: `data/processed/cleaned_flights.parquet`  

## 1. Record Filtering Summary

| Metric | Value |
| :--- | :--- |
| **Raw Input Records** | 4,078,318 |
| **Removed Cancelled/Diverted Flights (NA ArrDel15)** | 133,402 (3.27%) |
| **Final Cleaned Operated Flights** | 3,944,916 (96.73%) |

## 2. Rationale for Record Exclusion

Cancelled and diverted flights do not have a valid arrival delay duration or standard target value (`ArrDel15 = NA`).  
Treating cancelled flights as arrival delayed would introduce significant label noise.  
Therefore, for the primary arrival delay prediction model, we restrict training and evaluation strictly to operated flights with verified arrival outcomes.  

## 3. Pre-Flight Feature Schema & Data Leakage Audit

| Feature Name | Type | Purpose | Pre-Flight Status |
| :--- | :--- | :--- | :--- |
| `FlightDate` | Timestamp | Temporal Split & Seasonal Feature | Allowed |
| `Year`, `Quarter`, `Month` | Integer | Seasonal indicators | Allowed |
| `DayofMonth`, `DayOfWeek` | Integer | Weekly schedule indicators | Allowed |
| `IATA_Code_Marketing_Airline` | String | Marketing Carrier Code | Allowed |
| `IATA_Code_Operating_Airline` | String | Operating Carrier Code | Allowed |
| `Airline` | String | Carrier Full Name | Allowed |
| `Origin`, `Dest` | String | Airport Codes | Allowed |
| `OriginCityName`, `DestCityName` | String | City Identifiers | Allowed |
| `CRSDepTime`, `CRSArrTime` | Integer | Scheduled Times (HHMM) | Allowed |
| `DepTimeBlk`, `ArrTimeBlk` | String | Scheduled Hourly Time Blocks | Allowed |
| `Distance` | Double | Flight Route Distance (miles) | Allowed |
| `ArrDel15` | Double | Target Variable (0 = On-Time, 1 = Delayed) | **TARGET ONLY** |

### Excluded Leakage Columns List
The following 15 post-flight operational columns were **EXCLUDED** from the model schema:
- `ArrDelay` (Post-flight actual outcome)
- `ArrDelayMinutes` (Post-flight actual outcome)
- `ArrTime` (Post-flight actual outcome)
- `DepDelay` (Post-flight actual outcome)
- `DepDelayMinutes` (Post-flight actual outcome)
- `DepDel15` (Post-flight actual outcome)
- `DepTime` (Post-flight actual outcome)
- `ActualElapsedTime` (Post-flight actual outcome)
- `AirTime` (Post-flight actual outcome)
- `TaxiOut` (Post-flight actual outcome)
- `TaxiIn` (Post-flight actual outcome)
- `WheelsOff` (Post-flight actual outcome)
- `WheelsOn` (Post-flight actual outcome)
- `DepartureDelayGroups` (Post-flight actual outcome)
- `ArrivalDelayGroups` (Post-flight actual outcome)
