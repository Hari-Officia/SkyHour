import os
import duckdb
import pandas as pd
from backend.app.config.settings import settings
from backend.app.config.logging import logger

class DataRepository:
    def __init__(self):
        self.conn = duckdb.connect(database=":memory:")
        self._load_datasets()

    def _load_datasets(self):
        root = settings.project_root
        
        # 1. India Airports Master
        airports_path = os.path.join(root, "data", "india", "master", "india_airport_master.parquet")
        if os.path.exists(airports_path):
            p = airports_path.replace("\\", "/")
            self.conn.execute(f"CREATE TABLE india_airports AS SELECT * FROM read_parquet('{p}')")
            logger.info("Loaded india_airports into DuckDB")

        # 2. India Routes Master
        routes_path = os.path.join(root, "data", "india", "processed", "routes", "routes_india.csv")
        if os.path.exists(routes_path):
            p = routes_path.replace("\\", "/")
            self.conn.execute(f"CREATE TABLE india_routes AS SELECT * FROM read_csv_auto('{p}')")
            logger.info("Loaded india_routes into DuckDB")

        # 3. India Airlines Master
        airlines_path = os.path.join(root, "data", "india", "reference", "airlines_india.csv")
        if os.path.exists(airlines_path):
            p = airlines_path.replace("\\", "/")
            self.conn.execute(f"CREATE TABLE india_airlines AS SELECT * FROM read_csv_auto('{p}')")
            logger.info("Loaded india_airlines into DuckDB")

        # 4. India States Master
        states_path = os.path.join(root, "data", "india", "reference", "states_india.csv")
        if not os.path.exists(states_path):
            states_path = os.path.join(root, "data", "india", "processed", "traffic", "states_india.csv")
        if os.path.exists(states_path):
            p = states_path.replace("\\", "/")
            self.conn.execute(f"CREATE TABLE india_states AS SELECT * FROM read_csv_auto('{p}')")
            logger.info("Loaded india_states into DuckDB")

        # 5. Synthetic Flights Dataset
        synthetic_path = os.path.join(root, "data", "processed", "synthetic_flights.parquet")
        if os.path.exists(synthetic_path):
            p = synthetic_path.replace("\\", "/")
            self.conn.execute(f"CREATE TABLE synthetic_flights AS SELECT * FROM read_parquet('{p}')")
            logger.info("Loaded synthetic_flights into DuckDB")

        # 6. US Combined Flights 2022 View / Table
        combined_path = os.path.join(root, "data", "Combined_Flights_2022.parquet")
        cleaned_path = os.path.join(root, "data", "processed", "cleaned_flights.parquet")
        if os.path.exists(combined_path):
            p = combined_path.replace("\\", "/")
            self.conn.execute(f"CREATE VIEW flights_us AS SELECT * FROM read_parquet('{p}')")
            logger.info("Created flights_us view from Combined_Flights_2022.parquet in DuckDB")
        elif os.path.exists(cleaned_path):
            p = cleaned_path.replace("\\", "/")
            self.conn.execute(f"CREATE VIEW flights_us AS SELECT * FROM read_parquet('{p}')")
            logger.info("Created flights_us view from cleaned_flights.parquet in DuckDB")

        # 7. India Aviation Monthly Master View
        india_av_path = os.path.join(root, "data", "india", "master", "india_aviation.parquet")
        if os.path.exists(india_av_path):
            p = india_av_path.replace("\\", "/")
            self.conn.execute(f"CREATE VIEW india_aviation AS SELECT * FROM read_parquet('{p}')")
            logger.info("Created india_aviation view from india_aviation.parquet in DuckDB")

        # 8. Pre-aggregate summary tables for sub-millisecond query performance
        try:
            self.conn.execute("""
                CREATE TABLE overview_summary AS 
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
            """)

            self.conn.execute("""
                CREATE TABLE delay_dist_summary AS 
                SELECT 
                    SUM(CASE WHEN ArrDel15 = 1 THEN 1 ELSE 0 END) as delayed_flights,
                    SUM(CASE WHEN ArrDel15 = 0 THEN 1 ELSE 0 END) as on_time_flights,
                    COUNT(*) as total_flights
                FROM flights_us
            """)

            self.conn.execute("""
                CREATE TABLE distance_bucket_summary AS 
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
                GROUP BY distance_bucket
            """)

            self.conn.execute("""
                CREATE TABLE top_delayed_routes_summary AS 
                SELECT 
                    Origin || '-' || Dest as route,
                    Origin as origin,
                    Dest as destination,
                    COUNT(*) as total_flights,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct
                FROM flights_us
                GROUP BY Origin, Dest
                HAVING COUNT(*) >= 500
                ORDER BY delay_rate_pct DESC
                LIMIT 50
            """)

            self.conn.execute("""
                CREATE TABLE top_airports_delay_vol_summary AS 
                SELECT 
                    Origin as airport,
                    OriginCityName as city,
                    SUM(CASE WHEN ArrDel15 = 1 THEN 1 ELSE 0 END) as delayed_flights,
                    COUNT(*) as total_flights,
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct
                FROM flights_us
                GROUP BY Origin, OriginCityName
                ORDER BY delayed_flights DESC
                LIMIT 50
            """)

            self.conn.execute("""
                CREATE TABLE carrier_summary AS 
                SELECT 
                    Airline, 
                    IATA_Code_Operating_Airline as code, 
                    COUNT(*) as flight_volume, 
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct, 
                    ROUND(AVG(CAST(Cancelled AS DOUBLE)) * 100, 2) as cancellation_rate_pct, 
                    ROUND(AVG(CAST(Diverted AS DOUBLE)) * 100, 2) as diversion_rate_pct, 
                    ROUND(AVG(ArrDelayMinutes), 1) as avg_delay_min 
                FROM flights_us 
                GROUP BY Airline, IATA_Code_Operating_Airline
            """)

            self.conn.execute("""
                CREATE TABLE airport_summary AS 
                SELECT 
                    Origin as airport, 
                    OriginCityName as city, 
                    OriginState as state, 
                    COUNT(*) as flight_volume, 
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct, 
                    ROUND(AVG(ArrDelayMinutes), 1) as avg_delay_min 
                FROM flights_us 
                GROUP BY Origin, OriginCityName, OriginState
            """)

            self.conn.execute("""
                CREATE TABLE route_summary AS 
                SELECT 
                    Origin || '-' || Dest as route, 
                    Origin as origin, 
                    Dest as destination, 
                    COUNT(*) as flight_volume, 
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct, 
                    ROUND(AVG(Distance), 0) as distance_miles 
                FROM flights_us 
                GROUP BY Origin, Dest
            """)

            self.conn.execute("""
                CREATE TABLE by_hour_summary AS 
                SELECT 
                    CAST(FLOOR(CRSDepTime / 100) AS INT) as dep_hour, 
                    COUNT(*) as flight_volume, 
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct 
                FROM flights_us 
                WHERE CRSDepTime IS NOT NULL AND FLOOR(CRSDepTime / 100) BETWEEN 0 AND 23
                GROUP BY dep_hour
            """)

            self.conn.execute("""
                CREATE TABLE by_month_summary AS 
                SELECT 
                    Month as month, 
                    COUNT(*) as flight_volume, 
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct 
                FROM flights_us 
                GROUP BY Month
            """)

            self.conn.execute("""
                CREATE TABLE by_dow_summary AS 
                SELECT 
                    DayOfWeek as day_of_week, 
                    COUNT(*) as flight_volume, 
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct 
                FROM flights_us 
                GROUP BY DayOfWeek
            """)

            self.conn.execute("""
                CREATE TABLE heatmap_summary AS 
                SELECT 
                    Month as month, 
                    CAST(FLOOR(CRSDepTime / 100) AS INT) as dep_hour, 
                    COUNT(*) as flight_volume, 
                    ROUND(AVG(CAST(ArrDel15 AS DOUBLE)) * 100, 2) as delay_rate_pct 
                FROM flights_us 
                WHERE CRSDepTime IS NOT NULL AND FLOOR(CRSDepTime / 100) BETWEEN 0 AND 23
                GROUP BY Month, dep_hour
            """)

            logger.info("Pre-aggregated analytics summary tables in DuckDB successfully!")
        except Exception as e:
            logger.warning(f"Failed to pre-aggregate summary tables: {e}")

    def query(self, sql: str, params: list = None) -> pd.DataFrame:
        if params:
            return self.conn.execute(sql, params).df()
        return self.conn.execute(sql).df()

    def fetchall(self, sql: str, params: list = None) -> list:
        if params:
            return self.conn.execute(sql, params).fetchall()
        return self.conn.execute(sql).fetchall()

    def fetchone(self, sql: str, params: list = None):
        if params:
            return self.conn.execute(sql, params).fetchone()
        return self.conn.execute(sql).fetchone()

data_repo = DataRepository()


