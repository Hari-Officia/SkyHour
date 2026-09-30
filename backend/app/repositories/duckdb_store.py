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

    def query(self, sql: str, params: list = None) -> pd.DataFrame:
        if params:
            return self.conn.execute(sql, params).df()
        return self.conn.execute(sql).df()

data_repo = DataRepository()
