from typing import List, Dict, Any, Optional
from backend.app.repositories.duckdb_store import data_repo

class DemoFlightProvider:
    def get_flight_by_number(self, flight_number: str) -> Optional[Dict[str, Any]]:
        clean_num = flight_number.upper().replace(" ", "").replace("-", "")
        df = data_repo.query(
            "SELECT * FROM synthetic_flights WHERE UPPER(REPLACE(REPLACE(flight_number, ' ', ''), '-', '')) = ? LIMIT 1",
            [clean_num]
        )
        if len(df) > 0:
            return df.iloc[0].to_dict()
        return None

    def get_airborne_flights(self, limit: int = 25) -> List[Dict[str, Any]]:
        df = data_repo.query(
            "SELECT * FROM synthetic_flights WHERE status IN ('AIRBORNE', 'DEPARTED', 'BOARDING') LIMIT ?",
            [limit]
        )
        results = []
        for _, row in df.iterrows():
            results.append({
                "icao24": str(row["icao24"]),
                "callsign": str(row["callsign"]),
                "flight_number": str(row["flight_number"]),
                "airline": str(row["airline"]),
                "origin": str(row["origin"]),
                "destination": str(row["destination"]),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "baro_altitude_m": float(row["altitude"]) * 0.3048,
                "velocity_ms": float(row["ground_speed"]) * 0.514444,
                "true_track_deg": float(row["heading"]),
                "status": str(row["status"]),
                "is_demo": True
            })
        return results

demo_provider = DemoFlightProvider()
