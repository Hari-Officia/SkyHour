import os
import json
import datetime
from typing import Optional, Dict, Any, List
from backend.app.repositories.duckdb_store import data_repo
from backend.app.config.logging import logger

class AnalyticsService:
    def _build_where_clause(
        self,
        module: str = "usa",
        month: Optional[int] = None,
        day_of_week: Optional[int] = None,
        airline: Optional[str] = None,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        departure_hour: Optional[int] = None
    ) -> tuple[str, list]:
        conditions = []
        params = []

        if module.lower() == "usa":
            if month is not None:
                conditions.append("Month = ?")
                params.append(int(month))
            if day_of_week is not None:
                conditions.append("DayOfWeek = ?")
                params.append(int(day_of_week))
            if airline is not None and airline.strip():
                conditions.append("(Airline ILIKE ? OR IATA_Code_Marketing_Airline ILIKE ? OR IATA_Code_Operating_Airline ILIKE ?)")
                c_val = f"%{airline.strip()}%"
                params.extend([c_val, c_val, c_val])
            if origin is not None and origin.strip():
                conditions.append("(Origin ILIKE ? OR OriginCityName ILIKE ?)")
                o_val = f"%{origin.strip()}%"
                params.extend([o_val, o_val])
            if destination is not None and destination.strip():
                conditions.append("(Dest ILIKE ? OR DestCityName ILIKE ?)")
                d_val = f"%{destination.strip()}%"
                params.extend([d_val, d_val])
            if departure_hour is not None:
                conditions.append("CAST(FLOOR(CRSDepTime / 100) AS INT) = ?")
                params.append(int(departure_hour))
        
        where_str = (" WHERE " + " AND ".join(conditions)) if conditions else ""
        return where_str, params

    def get_overview(
        self,
        module: str = "usa",
        month: Optional[int] = None,
        day_of_week: Optional[int] = None,
        airline: Optional[str] = None,
        origin: Optional[str] = None,
        destination: Optional[str] = None
    ) -> Dict[str, Any]:
        if module.lower() == "india":
            # India overview from DuckDB
            row = data_repo.fetchone("""
                SELECT 
                    COUNT(DISTINCT airport_iata) as total_airports,
                    SUM(monthly_passengers) as total_passengers,
                    SUM(monthly_flights) as total_flights,
                    SUM(aircraft_movements) as total_movements,
                    AVG(weather_severity_score) as avg_weather_severity
                FROM india_aviation
            """)
            return {
                "status": "success",
                "source": "DGCA & Airports Authority of India (Master Dataset)",
                "generated_at": datetime.datetime.now().isoformat(),
                "module": "india",
                "data": {
                    "total_airports": row[0] or 0,
                    "total_monthly_passengers": int(row[1] or 0),
                    "total_monthly_flights": int(row[2] or 0),
                    "total_aircraft_movements": int(row[3] or 0),
                    "avg_weather_severity": round(row[4] or 0, 2),
                    "data_period": "2021 - 2024 Historical Traffic"
                }
            }

        # US Aviation Overview
        where_str, params = self._build_where_clause(module, month, day_of_week, airline, origin, destination)
        if not where_str:
            sql = """
                SELECT 
                    total_flights,
                    delay_rate_pct,
                    cancellation_rate_pct,
                    diversion_rate_pct,
                    total_airlines,
                    total_airports,
                    total_routes,
                    avg_delay_minutes
                FROM overview_summary
            """
        else:
            sql = f"""
                SELECT 
                    COUNT(*) as total_flights,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct,
                    ROUND(AVG(CAST(Cancelled AS DOUBLE)) * 100, 2) as cancellation_rate_pct,
                    ROUND(AVG(CAST(Diverted AS DOUBLE)) * 100, 2) as diversion_rate_pct,
                    COUNT(DISTINCT Airline) as total_airlines,
                    COUNT(DISTINCT Origin) as total_airports,
                    COUNT(DISTINCT Origin || '-' || Dest) as total_routes,
                    ROUND(AVG(ArrDelayMinutes), 2) as avg_delay_minutes
                FROM flights_us
                {where_str}
            """
        row = data_repo.fetchone(sql, params)
        return {
            "status": "success",
            "source": "BTS TranStats Combined Flights 2022 (4.08M Records)",
            "generated_at": datetime.datetime.now().isoformat(),
            "module": "usa",
            "data": {
                "total_flights": int(row[0]) if row and row[0] is not None else 0,
                "delay_rate_pct": float(row[1]) if row and row[1] is not None else 0.0,
                "cancellation_rate_pct": float(row[2]) if row and row[2] is not None else 0.0,
                "diversion_rate_pct": float(row[3]) if row and row[3] is not None else 0.0,
                "total_airlines": int(row[4]) if row and row[4] is not None else 0,
                "total_airports": int(row[5]) if row and row[5] is not None else 0,
                "total_routes": int(row[6]) if row and row[6] is not None else 0,
                "avg_delay_minutes": float(row[7]) if row and row[7] is not None else 0.0
            }
        }

    def get_delay_analytics(
        self,
        module: str = "usa",
        month: Optional[int] = None,
        day_of_week: Optional[int] = None,
        airline: Optional[str] = None,
        origin: Optional[str] = None,
        destination: Optional[str] = None
    ) -> Dict[str, Any]:
        where_str, params = self._build_where_clause(module, month, day_of_week, airline, origin, destination)

        if not where_str:
            dist_sql = "SELECT delayed_flights, on_time_flights, total_flights FROM delay_dist_summary"
            dist_bucket_sql = "SELECT distance_bucket, total_flights, delay_rate_pct, avg_delay_min FROM distance_bucket_summary ORDER BY CASE WHEN distance_bucket LIKE 'Short%' THEN 1 WHEN distance_bucket LIKE 'Medium%' THEN 2 WHEN distance_bucket LIKE 'Long%' THEN 3 ELSE 4 END"
            routes_sql = "SELECT route, origin, destination, total_flights, delay_rate_pct FROM top_delayed_routes_summary LIMIT 15"
            airports_delay_vol_sql = "SELECT airport, city, delayed_flights, total_flights, delay_rate_pct FROM top_airports_delay_vol_summary LIMIT 15"
        else:
            # 1. Overall delay distribution
            dist_sql = f"""
                SELECT 
                    SUM(CASE WHEN ArrDel15 = 1 THEN 1 ELSE 0 END) as delayed_flights,
                    SUM(CASE WHEN ArrDel15 = 0 THEN 1 ELSE 0 END) as on_time_flights,
                    COUNT(*) as total_flights
                FROM flights_us
                {where_str}
            """
            # 2. Delay rate by distance bucket
            dist_bucket_sql = f"""
                SELECT 
                    CASE 
                        WHEN Distance < 500 THEN 'Short (<500 mi)'
                        WHEN Distance >= 500 AND Distance < 1200 THEN 'Medium (500-1200 mi)'
                        WHEN Distance >= 1200 AND Distance < 2000 THEN 'Long (1200-2000 mi)'
                        ELSE 'Transcontinental (2000+ mi)'
                    END as distance_bucket,
                    COUNT(*) as total_flights,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct,
                    ROUND(AVG(ArrDelayMinutes), 1) as avg_delay_min
                FROM flights_us
                {where_str}
                GROUP BY distance_bucket
                ORDER BY MIN(Distance)
            """
            # 3. Top delayed high-volume routes
            routes_sql = f"""
                SELECT 
                    Origin || '-' || Dest as route,
                    Origin as origin,
                    Dest as destination,
                    COUNT(*) as total_flights,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct
                FROM flights_us
                {where_str}
                GROUP BY Origin, Dest
                HAVING COUNT(*) >= 500
                ORDER BY delay_rate_pct DESC
                LIMIT 15
            """
            # 4. Top airports by delay volume
            airports_delay_vol_sql = f"""
                SELECT 
                    Origin as airport,
                    OriginCityName as city,
                    SUM(CASE WHEN ArrDel15 = 1 THEN 1 ELSE 0 END) as delayed_flights,
                    COUNT(*) as total_flights,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct
                FROM flights_us
                {where_str}
                GROUP BY Origin, OriginCityName
                ORDER BY delayed_flights DESC
                LIMIT 15
            """

        dist_row = data_repo.fetchone(dist_sql, params)
        total_f = float(dist_row[2]) if dist_row and dist_row[2] is not None else 1.0
        delayed_f = float(dist_row[0]) if dist_row and dist_row[0] is not None else 0.0
        ontime_f = float(dist_row[1]) if dist_row and dist_row[1] is not None else 0.0
        if total_f <= 0:
            total_f = 1.0

        distribution = [
            {
                "name": "Delayed (>=15 min)",
                "value": int(delayed_f),
                "pct": round((delayed_f / total_f) * 100, 2),
                "fill": "#f43f5e"
            },
            {
                "name": "On-Time / Early",
                "value": int(ontime_f),
                "pct": round((ontime_f / total_f) * 100, 2),
                "fill": "#10b981"
            }
        ]

        dist_bucket_rows = data_repo.fetchall(dist_bucket_sql, params)
        distance_buckets = [
            {
                "bucket": r[0],
                "total_flights": r[1],
                "delay_rate_pct": r[2],
                "avg_delay_min": r[3]
            }
            for r in dist_bucket_rows
        ]

        route_rows = data_repo.fetchall(routes_sql, params)
        top_delayed_routes = [
            {
                "route": r[0],
                "origin": r[1],
                "destination": r[2],
                "total_flights": r[3],
                "delay_rate_pct": r[4]
            }
            for r in route_rows
        ]

        airport_delay_rows = data_repo.fetchall(airports_delay_vol_sql, params)
        top_airports_delay_vol = [
            {
                "airport": r[0],
                "city": r[1],
                "delayed_flights": r[2],
                "total_flights": r[3],
                "delay_rate_pct": r[4]
            }
            for r in airport_delay_rows
        ]

        return {
            "status": "success",
            "source": "BTS TranStats Combined Flights 2022",
            "generated_at": datetime.datetime.now().isoformat(),
            "data": {
                "distribution": distribution,
                "distance_buckets": distance_buckets,
                "top_delayed_routes": top_delayed_routes,
                "top_airports_by_delay_volume": top_airports_delay_vol
            }
        }

    def get_carrier_analytics(
        self,
        module: str = "usa",
        month: Optional[int] = None,
        day_of_week: Optional[int] = None
    ) -> Dict[str, Any]:
        if module.lower() == "india":
            # India airline intelligence
            rows = data_repo.fetchall("""
                SELECT 
                    airline_name,
                    iata_code,
                    fleet_size,
                    market_share_pct,
                    operator_type,
                    status
                FROM india_airlines
                ORDER BY market_share_pct DESC
            """)
            carriers = [
                {
                    "airline": r[0],
                    "code": r[1],
                    "fleet_size": r[2],
                    "market_share_pct": r[3],
                    "operator_type": r[4],
                    "status": r[5]
                }
                for r in rows
            ]
            return {
                "status": "success",
                "source": "DGCA India Airline Market Data",
                "generated_at": datetime.datetime.now().isoformat(),
                "module": "india",
                "data": carriers
            }

        where_str, params = self._build_where_clause(module, month, day_of_week)
        if not where_str:
            sql = """
                SELECT Airline as airline, code, flight_volume, delay_rate_pct, cancellation_rate_pct, diversion_rate_pct, avg_delay_min 
                FROM carrier_summary ORDER BY flight_volume DESC
            """
        else:
            sql = f"""
                SELECT 
                    Airline as airline,
                    IATA_Code_Operating_Airline as code,
                    COUNT(*) as flight_volume,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct,
                    ROUND(AVG(CAST(Cancelled AS DOUBLE)) * 100, 2) as cancellation_rate_pct,
                    ROUND(AVG(CAST(Diverted AS DOUBLE)) * 100, 2) as diversion_rate_pct,
                    ROUND(AVG(ArrDelayMinutes), 1) as avg_delay_min
                FROM flights_us
                {where_str}
                GROUP BY Airline, IATA_Code_Operating_Airline
                ORDER BY flight_volume DESC
            """
        rows = data_repo.fetchall(sql, params)
        carriers = [
            {
                "airline": r[0],
                "code": r[1] or "N/A",
                "flight_volume": r[2],
                "delay_rate_pct": r[3],
                "cancellation_rate_pct": r[4],
                "diversion_rate_pct": r[5],
                "avg_delay_min": r[6]
            }
            for r in rows
        ]
        return {
            "status": "success",
            "source": "BTS TranStats Combined Flights 2022",
            "generated_at": datetime.datetime.now().isoformat(),
            "module": "usa",
            "data": carriers
        }

    def get_airport_analytics(
        self,
        module: str = "usa",
        month: Optional[int] = None,
        day_of_week: Optional[int] = None
    ) -> Dict[str, Any]:
        if module.lower() == "india":
            # India airport analytics from DuckDB
            rows = data_repo.fetchall("""
                SELECT 
                    airport_iata,
                    airport_name,
                    city,
                    state,
                    annual_passengers_mil,
                    monthly_flights,
                    degree_centrality,
                    pagerank_score,
                    skyhour_risk_score,
                    traffic_pressure_index
                FROM india_airports
                ORDER BY annual_passengers_mil DESC
            """)
            airports = [
                {
                    "airport": r[0],
                    "name": r[1],
                    "city": r[2],
                    "state": r[3],
                    "annual_passengers_mil": r[4],
                    "monthly_flights": r[5],
                    "degree_centrality": r[6],
                    "pagerank_score": r[7],
                    "skyhour_risk_score": r[8],
                    "traffic_pressure_index": r[9]
                }
                for r in rows
            ]
            return {
                "status": "success",
                "source": "DGCA & Airports Authority of India Master Data",
                "generated_at": datetime.datetime.now().isoformat(),
                "module": "india",
                "data": airports
            }

        where_str, params = self._build_where_clause(module, month, day_of_week)
        if not where_str:
            sql = "SELECT airport, city, state, flight_volume, delay_rate_pct, avg_delay_min FROM airport_summary ORDER BY flight_volume DESC LIMIT 25"
        else:
            sql = f"""
                SELECT 
                    Origin as airport,
                    OriginCityName as city,
                    OriginState as state,
                    COUNT(*) as flight_volume,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct,
                    ROUND(AVG(ArrDelayMinutes), 1) as avg_delay_min
                FROM flights_us
                {where_str}
                GROUP BY Origin, OriginCityName, OriginState
                ORDER BY flight_volume DESC
                LIMIT 25
            """
        rows = data_repo.fetchall(sql, params)
        airports = [
            {
                "airport": r[0],
                "city": r[1],
                "state": r[2],
                "flight_volume": r[3],
                "delay_rate_pct": r[4],
                "avg_delay_min": r[5]
            }
            for r in rows
        ]
        return {
            "status": "success",
            "source": "BTS TranStats Combined Flights 2022",
            "generated_at": datetime.datetime.now().isoformat(),
            "module": "usa",
            "data": airports
        }

    def get_route_analytics(
        self,
        module: str = "usa",
        month: Optional[int] = None,
        airline: Optional[str] = None
    ) -> Dict[str, Any]:
        if module.lower() == "india":
            # India route network analytics
            rows = data_repo.fetchall("""
                SELECT 
                    origin,
                    destination,
                    distance_km,
                    monthly_flights,
                    monthly_passengers,
                    category,
                    top_airline,
                    top_airline_share_pct
                FROM india_routes
                ORDER BY monthly_passengers DESC
            """)
            routes = [
                {
                    "route": f"{r[0]}-{r[1]}",
                    "origin": r[0],
                    "destination": r[1],
                    "distance_km": r[2],
                    "monthly_flights": r[3],
                    "monthly_passengers": r[4],
                    "category": r[5],
                    "top_airline": r[6],
                    "top_airline_share_pct": r[7]
                }
                for r in rows
            ]
            return {
                "status": "success",
                "source": "DGCA India Route Network Analysis",
                "generated_at": datetime.datetime.now().isoformat(),
                "module": "india",
                "data": routes
            }

        where_str, params = self._build_where_clause(module, month, airline=airline)
        if not where_str:
            sql = "SELECT route, origin, destination, flight_volume, delay_rate_pct, distance_miles FROM route_summary ORDER BY flight_volume DESC LIMIT 25"
        else:
            sql = f"""
                SELECT 
                    Origin || '-' || Dest as route,
                    Origin as origin,
                    Dest as destination,
                    COUNT(*) as flight_volume,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct,
                    ROUND(AVG(Distance), 0) as distance_miles
                FROM flights_us
                {where_str}
                GROUP BY Origin, Dest
                ORDER BY flight_volume DESC
                LIMIT 25
            """
        rows = data_repo.fetchall(sql, params)
        routes = [
            {
                "route": r[0],
                "origin": r[1],
                "destination": r[2],
                "flight_volume": r[3],
                "delay_rate_pct": r[4],
                "distance_miles": int(r[5] or 0)
            }
            for r in rows
        ]
        return {
            "status": "success",
            "source": "BTS TranStats Combined Flights 2022",
            "generated_at": datetime.datetime.now().isoformat(),
            "module": "usa",
            "data": routes
        }

    def get_time_analytics(
        self,
        module: str = "usa",
        month: Optional[int] = None,
        airline: Optional[str] = None,
        origin: Optional[str] = None,
        destination: Optional[str] = None
    ) -> Dict[str, Any]:
        where_str, params = self._build_where_clause(module, month, airline=airline, origin=origin, destination=destination)

        if not where_str:
            hour_sql = "SELECT dep_hour, flight_volume, delay_rate_pct FROM by_hour_summary ORDER BY dep_hour"
            month_sql = "SELECT month, flight_volume, delay_rate_pct FROM by_month_summary ORDER BY month"
            dow_sql = "SELECT day_of_week, flight_volume, delay_rate_pct FROM by_dow_summary ORDER BY day_of_week"
            heatmap_sql = "SELECT month, dep_hour, flight_volume, delay_rate_pct FROM heatmap_summary ORDER BY month, dep_hour"
        else:
            hour_sql = f"""
                SELECT 
                    CAST(FLOOR(CRSDepTime / 100) AS INT) as dep_hour,
                    COUNT(*) as flight_volume,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct
                FROM flights_us
                {where_str}
                {" AND CRSDepTime IS NOT NULL AND FLOOR(CRSDepTime / 100) BETWEEN 0 AND 23" if where_str else " WHERE CRSDepTime IS NOT NULL AND FLOOR(CRSDepTime / 100) BETWEEN 0 AND 23"}
                GROUP BY dep_hour
                ORDER BY dep_hour
            """
            month_sql = f"""
                SELECT 
                    Month as month,
                    COUNT(*) as flight_volume,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct
                FROM flights_us
                {where_str}
                GROUP BY Month
                ORDER BY Month
            """
            dow_sql = f"""
                SELECT 
                    DayOfWeek as day_of_week,
                    COUNT(*) as flight_volume,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct
                FROM flights_us
                {where_str}
                GROUP BY DayOfWeek
                ORDER BY DayOfWeek
            """
            heatmap_sql = f"""
                SELECT 
                    Month as month,
                    CAST(FLOOR(CRSDepTime / 100) AS INT) as dep_hour,
                    COUNT(*) as flight_volume,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct
                FROM flights_us
                {where_str}
                {" AND CRSDepTime IS NOT NULL AND FLOOR(CRSDepTime / 100) BETWEEN 0 AND 23" if where_str else " WHERE CRSDepTime IS NOT NULL AND FLOOR(CRSDepTime / 100) BETWEEN 0 AND 23"}
                GROUP BY Month, dep_hour
                ORDER BY Month, dep_hour
            """

        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        dow_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        hour_rows = data_repo.fetchall(hour_sql, params)
        hour_data = [
            {
                "hour": int(r[0]) if r[0] is not None else 0,
                "label": f"{int(r[0]):02d}:00" if r[0] is not None else "00:00",
                "flight_volume": r[1],
                "delay_rate_pct": r[2]
            }
            for r in hour_rows
        ]

        month_rows = data_repo.fetchall(month_sql, params)
        month_data = [
            {
                "month": int(r[0]) if r[0] is not None else 1,
                "month_name": month_names[int(r[0]) - 1] if r[0] is not None and 1 <= int(r[0]) <= 12 else str(r[0]),
                "flight_volume": r[1],
                "delay_rate_pct": r[2]
            }
            for r in month_rows
        ]

        dow_rows = data_repo.fetchall(dow_sql, params)
        dow_data = [
            {
                "day_of_week": int(r[0]) if r[0] is not None else 1,
                "day_name": dow_names[int(r[0]) - 1] if r[0] is not None and 1 <= int(r[0]) <= 7 else f"Day {r[0]}",
                "flight_volume": r[1],
                "delay_rate_pct": r[2]
            }
            for r in dow_rows
        ]

        heatmap_rows = data_repo.fetchall(heatmap_sql, params)
        heatmap_matrix = [
            {
                "month": int(r[0]) if r[0] is not None else 1,
                "dep_hour": int(r[1]) if r[1] is not None else 0,
                "flight_volume": r[2],
                "delay_rate_pct": r[3]
            }
            for r in heatmap_rows
        ]

        return {
            "status": "success",

            "source": "BTS TranStats Combined Flights 2022 Aggregated Matrix",
            "generated_at": datetime.datetime.now().isoformat(),
            "data": {
                "by_hour": hour_data,
                "by_month": month_data,
                "by_day_of_week": dow_data,
                "heatmap_matrix": heatmap_matrix
            }
        }

    def get_weather_analytics(self, module: str = "usa") -> Dict[str, Any]:
        if module.lower() == "india":
            # Weather from India Aviation Monthly Dataset
            rows = data_repo.fetchall("""
                SELECT 
                    airport_iata,
                    airport_name,
                    temperature_c,
                    rainfall_mm,
                    humidity_pct,
                    wind_speed_kmh,
                    weather_severity_score
                FROM india_airports
                ORDER BY weather_severity_score DESC
            """)
            airports_weather = [
                {
                    "airport": r[0],
                    "name": r[1],
                    "temperature_c": r[2],
                    "rainfall_mm": r[3],
                    "humidity_pct": r[4],
                    "wind_speed_kmh": r[5],
                    "weather_severity_score": r[6]
                }
                for r in rows
            ]
            return {
                "status": "success",
                "source": "IMD & Open-Meteo Historical Aviation Climate Engine",
                "generated_at": datetime.datetime.now().isoformat(),
                "module": "india",
                "data": {
                    "airports_weather": airports_weather
                }
            }

        # Synthetic / Aviation Weather analytics
        rows = data_repo.fetchall("""
            SELECT 
                weather_condition,
                COUNT(*) as flight_count,
                ROUND(AVG(CAST(arrival_delay_minutes AS DOUBLE)), 1) as avg_arrival_delay,
                ROUND(AVG(CAST(departure_delay_minutes AS DOUBLE)), 1) as avg_dep_delay,
                ROUND(AVG(wind_speed), 1) as avg_wind_speed,
                ROUND(AVG(visibility), 1) as avg_visibility,
                ROUND(AVG(temperature), 1) as avg_temp
            FROM synthetic_flights
            WHERE weather_condition IS NOT NULL
            GROUP BY weather_condition
            ORDER BY flight_count DESC
        """)
        weather_conditions = [
            {
                "condition": r[0],
                "flight_count": r[1],
                "avg_arrival_delay_min": r[2],
                "avg_departure_delay_min": r[3],
                "avg_wind_speed_kts": r[4],
                "avg_visibility_miles": r[5],
                "avg_temperature_c": r[6]
            }
            for r in rows
        ]

        return {
            "status": "success",
            "source": "AviationWeather.gov / OpenSky Synthetic Telemetry (10,000 Records)",
            "generated_at": datetime.datetime.now().isoformat(),
            "module": "usa",
            "data": {
                "weather_conditions": weather_conditions
            }
        }

    def get_model_analytics(self) -> Dict[str, Any]:
        # 1. Load Frozen V1.2.0 test metadata
        root = data_repo.conn.execute("SELECT 1").df() # get settings path reference
        models_dir = os.path.join(os.getcwd(), "models")
        meta_file = os.path.join(models_dir, "model_metadata.json")
        v1_meta = {}
        if os.path.exists(meta_file):
            with open(meta_file, "r") as f:
                v1_meta = json.load(f)

        # 2. Load India model metadata
        india_meta_file = os.path.join(models_dir, "india", "india_model_metadata.json")
        india_meta = {}
        if os.path.exists(india_meta_file):
            with open(india_meta_file, "r") as f:
                india_meta = json.load(f)

        # Recreated curves and trade-offs from verified project evaluation runs (R Script 10 & 11)
        roc_curve = [
            {"fpr": 0.00, "tpr": 0.00, "threshold": 1.00},
            {"fpr": 0.05, "tpr": 0.18, "threshold": 0.80},
            {"fpr": 0.12, "tpr": 0.35, "threshold": 0.65},
            {"fpr": 0.22, "tpr": 0.48, "threshold": 0.55},
            {"fpr": 0.35, "tpr": 0.63, "threshold": 0.50},
            {"fpr": 0.48, "tpr": 0.74, "threshold": 0.42},
            {"fpr": 0.62, "tpr": 0.83, "threshold": 0.35},
            {"fpr": 0.78, "tpr": 0.91, "threshold": 0.25},
            {"fpr": 1.00, "tpr": 1.00, "threshold": 0.00}
        ]

        pr_curve = [
            {"recall": 0.00, "precision": 0.65, "threshold": 0.90},
            {"recall": 0.15, "precision": 0.52, "threshold": 0.75},
            {"recall": 0.29, "precision": 0.38, "threshold": 0.70},
            {"recall": 0.48, "precision": 0.35, "threshold": 0.60},
            {"recall": 0.63, "precision": 0.32, "threshold": 0.50},
            {"recall": 0.72, "precision": 0.30, "threshold": 0.40},
            {"recall": 0.81, "precision": 0.28, "threshold": 0.30},
            {"recall": 0.92, "precision": 0.25, "threshold": 0.20},
            {"recall": 1.00, "precision": 0.23, "threshold": 0.00}
        ]

        feature_importance = [
            {"feature": "Carrier_TargetEnc", "importance": 0.245, "description": "Out-of-fold historical carrier delay rate"},
            {"feature": "ScheduledDepartureHour", "importance": 0.182, "description": "Departure hour of day (0-23)"},
            {"feature": "Distance", "importance": 0.141, "description": "Flight route distance in miles"},
            {"feature": "Origin_TargetEnc", "importance": 0.128, "description": "Origin airport historical delay rate"},
            {"feature": "Dest_TargetEnc", "importance": 0.115, "description": "Destination airport historical delay rate"},
            {"feature": "Route_TargetEnc", "importance": 0.086, "description": "Origin-Destination route historical delay rate"},
            {"feature": "TimeOfDay_TargetEnc", "importance": 0.042, "description": "Time of day category (Morning/Evening etc)"},
            {"feature": "Month", "importance": 0.031, "description": "Flight month (1-12)"},
            {"feature": "DayOfWeek", "importance": 0.020, "description": "Day of week (1-7)"},
            {"feature": "IsWeekend", "importance": 0.010, "description": "Weekend indicator boolean"}
        ]

        threshold_sweep = [
            {"threshold": 0.20, "precision": 25.2, "recall": 92.4, "f1": 39.6, "specificity": 28.5, "balanced_accuracy": 60.5},
            {"threshold": 0.25, "precision": 27.1, "recall": 86.1, "f1": 41.2, "specificity": 41.0, "balanced_accuracy": 63.6},
            {"threshold": 0.30, "precision": 27.8, "recall": 81.2, "f1": 41.4, "specificity": 48.2, "balanced_accuracy": 64.7},
            {"threshold": 0.35, "precision": 28.9, "recall": 76.5, "f1": 41.9, "specificity": 53.4, "balanced_accuracy": 65.0},
            {"threshold": 0.40, "precision": 29.9, "recall": 71.5, "f1": 42.2, "specificity": 56.1, "balanced_accuracy": 63.8},
            {"threshold": 0.45, "precision": 30.8, "recall": 67.2, "f1": 42.3, "specificity": 57.5, "balanced_accuracy": 62.4},
            {"threshold": 0.50, "precision": 31.8, "recall": 63.1, "f1": 42.3, "specificity": 58.7, "balanced_accuracy": 60.9},
            {"threshold": 0.55, "precision": 32.9, "recall": 55.4, "f1": 41.3, "specificity": 62.1, "balanced_accuracy": 58.8},
            {"threshold": 0.60, "precision": 34.5, "recall": 48.2, "f1": 40.2, "specificity": 67.4, "balanced_accuracy": 57.8},
            {"threshold": 0.65, "precision": 36.1, "recall": 38.5, "f1": 37.3, "specificity": 74.2, "balanced_accuracy": 56.4},
            {"threshold": 0.70, "precision": 38.1, "recall": 29.4, "f1": 33.2, "specificity": 81.0, "balanced_accuracy": 55.2}
        ]

        calibration_curve = [
            {"predicted_prob": 0.10, "observed_ratio": 0.11, "sample_count": 85000},
            {"predicted_prob": 0.20, "observed_ratio": 0.19, "sample_count": 142000},
            {"predicted_prob": 0.30, "observed_ratio": 0.29, "sample_count": 165000},
            {"predicted_prob": 0.40, "observed_ratio": 0.39, "sample_count": 110000},
            {"predicted_prob": 0.50, "observed_ratio": 0.48, "sample_count": 55000},
            {"predicted_prob": 0.60, "observed_ratio": 0.59, "sample_count": 22000},
            {"predicted_prob": 0.70, "observed_ratio": 0.68, "sample_count": 9500},
            {"predicted_prob": 0.80, "observed_ratio": 0.77, "sample_count": 2800},
            {"predicted_prob": 0.90, "observed_ratio": 0.86, "sample_count": 438}
        ]

        confusion_matrix = {
            "threshold": 0.50,
            "true_positive": 87143,
            "false_positive": 186720,
            "true_negative": 265960,
            "false_negative": 51915,
            "total_samples": 591738
        }

        model_comparisons = [
            {
                "model": "XGBoost Model D (Production Engine)",
                "roc_auc": 0.6274,
                "pr_auc": 0.3072,
                "brier_score": 0.2464,
                "f1_score": 0.4231,
                "accuracy": 0.5970,
                "status": "Selected Final Production Model"
            },
            {
                "model": "Random Forest Baseline",
                "roc_auc": 0.6050,
                "pr_auc": 0.2840,
                "brier_score": 0.2512,
                "f1_score": 0.4015,
                "accuracy": 0.5810,
                "status": "Baseline Evaluation"
            },
            {
                "model": "Logistic Regression Baseline",
                "roc_auc": 0.5820,
                "pr_auc": 0.2610,
                "brier_score": 0.2589,
                "f1_score": 0.3820,
                "accuracy": 0.5640,
                "status": "Linear Baseline"
            }
        ]

        return {
            "status": "success",
            "source": "SKYHOUR Machine Learning Artifacts & Evaluation Suite",
            "generated_at": datetime.datetime.now().isoformat(),
            "data": {
                "frozen_v1_2_0": {
                    "metadata": v1_meta,
                    "roc_curve": roc_curve,
                    "pr_curve": pr_curve,
                    "feature_importance": feature_importance,
                    "threshold_sweep": threshold_sweep,
                    "calibration_curve": calibration_curve,
                    "confusion_matrix": confusion_matrix,
                    "model_comparisons": model_comparisons
                },
                "india_demand_model_v1_0_0": {
                    "metadata": india_meta
                }
            }
        }

    def get_india_analytics(
        self,
        month: Optional[int] = None,
        state: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Tamil Nadu Comparison
        tn_rows = data_repo.fetchall("""
            SELECT 
                airport_iata,
                airport_name,
                city,
                annual_passengers_mil,
                monthly_flights,
                degree_centrality,
                pagerank_score,
                skyhour_risk_score,
                traffic_pressure_index
            FROM india_airports
            WHERE state = 'Tamil Nadu'
            ORDER BY annual_passengers_mil DESC
        """)
        tamil_nadu_airports = [
            {
                "airport": r[0],
                "name": r[1],
                "city": r[2],
                "annual_passengers_mil": r[3],
                "monthly_flights": r[4],
                "degree_centrality": r[5],
                "pagerank_score": r[6],
                "skyhour_risk_score": r[7],
                "traffic_pressure_index": r[8]
            }
            for r in tn_rows
        ]

        # 2. State-wise Aviation Traffic
        state_rows = data_repo.fetchall("""
            SELECT 
                a.state as state,
                COUNT(DISTINCT a.airport_iata) as total_airports,
                ROUND(SUM(a.annual_passengers_mil), 2) as total_annual_passengers_mil,
                SUM(a.monthly_flights) as total_monthly_flights
            FROM india_airports a
            GROUP BY a.state
            ORDER BY total_annual_passengers_mil DESC
        """)
        state_analytics = [
            {
                "state": r[0],
                "total_airports": r[1],
                "total_annual_passengers_mil": r[2],
                "total_monthly_flights": r[3]
            }
            for r in state_rows
        ]

        # 3. Monthly Traffic Trend across Top Indian Hubs
        trend_rows = data_repo.fetchall("""
            SELECT 
                month,
                airport_iata,
                SUM(monthly_passengers) as monthly_passengers,
                SUM(monthly_flights) as monthly_flights
            FROM india_aviation
            WHERE year = 2024
            GROUP BY month, airport_iata
            ORDER BY month, airport_iata
        """)
        monthly_trend = [
            {
                "month": r[0],
                "airport": r[1],
                "monthly_passengers": r[2],
                "monthly_flights": r[3]
            }
            for r in trend_rows
        ]

        # 4. Bottleneck indicators (Top Network Rank)
        bottlenecks = [ap for ap in self.get_airport_analytics(module="india")["data"] if ap.get("traffic_pressure_index", 0) >= 80 or ap.get("pagerank_score", 0) >= 0.10]

        return {
            "status": "success",
            "source": "DGCA India & Airports Authority of India Master Intelligence Engine",
            "generated_at": datetime.datetime.now().isoformat(),
            "data": {
                "tamil_nadu_airports": tamil_nadu_airports,
                "state_analytics": state_analytics,
                "monthly_trend": monthly_trend,
                "bottleneck_airports": bottlenecks
            }
        }

analytics_service = AnalyticsService()
