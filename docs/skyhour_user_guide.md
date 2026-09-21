# Skyhour User Guide (v2.0)

Welcome to **Skyhour**, an Airline Flight Intelligence and Delay Prediction Platform.

---

## 1. Quick Start Guide

### Starting the Backend Server (R Plumber)
Run the following command in PowerShell:
```powershell
& "C:\Program Files\R\R-4.5.0\bin\Rscript.exe" "R/run_plumber.R"
```
The backend API server will initialize on `http://127.0.0.1:8000`.

### Starting the Frontend Development Server (React + Vite)
In a separate terminal window:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 2. Using Universal Search

Skyhour features a Google Flights-inspired single search input:

- **Search Flight**: Enter `AI302` or `AA100` to inspect live flight status, OpenSky telemetry, METAR weather, and pre-flight delay predictions.
- **Search Airport**: Enter `MAA`, `DEL`, `JFK`, `Chennai` or `New York` to open Airport Intelligence.
- **Search Sector Route**: Enter `MAA DEL`, `MAA-DEL`, or `JFK LAX` to open Route Intelligence.
- **Search Airline**: Enter `IndiGo`, `Air India`, `6E`, `AI`, `AA` to open Airline Intelligence.

---

## 3. Platform Modules Overview

1. **Flight Intelligence (`/flight/:id`)**: Displays flight header, aircraft telemetry from OpenSky, Leaflet route map, METAR weather observations, and XGBoost pre-flight delay probability with factor SHAP explanations.
2. **Airport Intelligence (`/airport/:code`)**: Displays airport metadata, monthly passenger and flight volumes, operating airlines, top routes, METAR/TAF weather, and GIS location map.
3. **Route Intelligence (`/route?origin=X&destination=Y`)**: Displays sector distance, operating airline comparative performance table, and day-of-week & time-of-day delay trends.
4. **Airline Intelligence (`/airline/:code`)**: Displays carrier scale, fleet size, primary operating hubs, key sector routes, and historical on-time performance.
5. **Interactive Aviation Map (`/map`)**: Fullscreen Leaflet map rendering active airport nodes, sector route lines, and live OpenSky aircraft state vector markers.
