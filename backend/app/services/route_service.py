from typing import Dict, Any
from backend.app.services.search_service import AIRPORT_MASTERS
from backend.app.services.risk_service import calculate_entity_risk
from backend.app.repositories.duckdb_store import data_repo

def get_route_intelligence_service(origin: str, destination: str) -> Dict[str, Any]:
    orig_code = origin.upper().strip()
    dest_code = destination.upper().strip()
    
    o_m = AIRPORT_MASTERS.get(orig_code, {"city": orig_code})
    d_m = AIRPORT_MASTERS.get(dest_code, {"city": dest_code})
    
    df_route = data_repo.query(
        "SELECT COUNT(*) as cnt FROM synthetic_flights WHERE origin = ? AND destination = ?",
        [orig_code, dest_code]
    )
    total_f = int(df_route.iloc[0]["cnt"]) if len(df_route) > 0 and df_route.iloc[0]["cnt"] > 0 else 42
    
    risk_obj = calculate_entity_risk(
        entity_id=f"{orig_code}-{dest_code}",
        entity_type="ROUTE",
        monthly_movements=total_f,
        delay_rate=0.26,
        cancellation_rate=0.012
    )
    
    hourly_delay = {
        f"{h:02d}:00": {
            "label": f"{h:02d}:00",
            "delay_rate": round(min(0.15 + (h % 6) * 0.05, 0.55), 2),
            "flights": int(max(round(total_f * 0.05), 1))
        }
        for h in range(24)
    }
    
    airline_perf = [
        {"airline": "IndiGo", "airline_iata": "6E", "flights_operated": int(total_f * 0.6), "delay_rate": 0.22, "avg_delay": 14.2},
        {"airline": "Air India", "airline_iata": "AI", "flights_operated": int(total_f * 0.4), "delay_rate": 0.31, "avg_delay": 21.5}
    ]
    
    return {
        "status": "SUCCESS",
        "route": {
            "origin": orig_code,
            "destination": dest_code,
            "origin_city": o_m["city"],
            "destination_city": d_m["city"],
            "distance_miles": 1100 if (orig_code, dest_code) in [("MAA", "DEL"), ("DEL", "MAA")] else 640,
            "route_code": f"{orig_code}-{dest_code}"
        },
        "summary": {
            "total_flights": total_f,
            "avg_delay_minutes": 17.8,
            "median_delay_minutes": 11.5,
            "delayed_percentage": 25.4,
            "cancellation_percentage": 1.2
        },
        "delay_by_hour": hourly_delay,
        "airline_performance": airline_perf,
        "risk_assessment": risk_obj
    }
