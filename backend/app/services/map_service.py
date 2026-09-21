from datetime import datetime, timezone
from typing import Dict, Any
from backend.app.services.search_service import AIRPORT_MASTERS
from backend.app.services.risk_service import calculate_entity_risk
from backend.app.providers.opensky_provider import opensky_provider
from backend.app.providers.demo_provider import demo_provider
from backend.app.repositories.duckdb_store import data_repo

async def get_map_data_service() -> Dict[str, Any]:
    # 1. Query all airports dynamically from DuckDB india_airports
    df_airports = data_repo.query("""
        SELECT airport_iata, airport_icao, airport_name, city, state, latitude, longitude, skyhour_risk_score, traffic_pressure_index 
        FROM india_airports 
        ORDER BY traffic_pressure_index DESC
    """)
    
    airports_map = []
    if len(df_airports) > 0:
        for _, row in df_airports.iterrows():
            code = str(row["airport_iata"]).upper()
            risk_score = float(row.get("skyhour_risk_score", 50.0))
            if risk_score < 40:
                risk_cat = "LOW"
            elif risk_score <= 65:
                risk_cat = "MODERATE"
            else:
                risk_cat = "HIGH"

            airports_map.append({
                "code": code,
                "iata": code,
                "icao": str(row.get("airport_icao", "VOMM")),
                "name": str(row.get("airport_name", f"{code} Airport")),
                "city": str(row.get("city", code)),
                "country": "India",
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "total_movements": int(float(row.get("traffic_pressure_index", 50.0)) * 2.5),
                "risk_score": round(risk_score, 1),
                "risk_category": risk_cat
            })
    else:
        # Fallback to AIRPORT_MASTERS if table query empty
        for code, m in AIRPORT_MASTERS.items():
            risk_obj = calculate_entity_risk(code, "AIRPORT", 120)
            airports_map.append({
                "code": code,
                "iata": code,
                "icao": m["icao"],
                "name": m["name"],
                "city": m["city"],
                "country": m["country"],
                "latitude": m["lat"],
                "longitude": m["lon"],
                "total_movements": 120,
                "risk_score": risk_obj["risk_score"],
                "risk_category": risk_obj["risk_category"]
            })

    # 2. Query all routes dynamically from DuckDB india_routes
    df_routes = data_repo.query("SELECT origin, destination, distance_km, top_airline FROM india_routes")
    routes_map = []
    
    # Quick lat/lon lookup dict for airports
    ap_coords = {ap["code"]: (ap["latitude"], ap["longitude"]) for ap in airports_map}

    if len(df_routes) > 0:
        for _, row in df_routes.iterrows():
            orig = str(row["origin"]).upper()
            dest = str(row["destination"]).upper()
            o_pos = ap_coords.get(orig, (12.9941, 80.1709))
            d_pos = ap_coords.get(dest, (28.5562, 77.1000))
            dist_km = float(row.get("distance_km", 1000.0))
            
            routes_map.append({
                "route_code": f"{orig}-{dest}",
                "origin": orig,
                "destination": dest,
                "origin_lat": o_pos[0],
                "origin_lon": o_pos[1],
                "dest_lat": d_pos[0],
                "dest_lon": d_pos[1],
                "distance_miles": round(dist_km * 0.621371, 1),
                "flight_volume": 45,
                "delay_category": "MODERATE"
            })
    else:
        # Fallback routes
        routes = [("MAA", "DEL"), ("DEL", "MAA"), ("MAA", "BOM"), ("BOM", "MAA"), ("DEL", "BOM"), ("BLR", "DEL"), ("JFK", "LAX"), ("SFO", "JFK")]
        for orig, dest in routes:
            o_m = AIRPORT_MASTERS.get(orig, {"lat": 12.9941, "lon": 80.1709})
            d_m = AIRPORT_MASTERS.get(dest, {"lat": 28.5562, "lon": 77.1000})
            routes_map.append({
                "route_code": f"{orig}-{dest}",
                "origin": orig,
                "destination": dest,
                "origin_lat": o_m["lat"],
                "origin_lon": o_m["lon"],
                "dest_lat": d_m["lat"],
                "dest_lon": d_m["lon"],
                "distance_miles": 1100.0 if "DEL" in (orig, dest) else 640.0,
                "flight_volume": 25,
                "delay_category": "MODERATE"
            })

    # 3. Aircraft positions (Live or Demo fallback)
    opensky_res = await opensky_provider.fetch_states()
    live_aircraft = opensky_res.get("states", [])
    is_live = len(live_aircraft) > 0

    if is_live:
        aircraft_states = live_aircraft
    else:
        aircraft_states = demo_provider.get_airborne_flights(35)

    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    return {
        "status": "SUCCESS",
        "data_mode": "REAL DATA (OpenSky)" if is_live else "SCHEDULED+MODELLED (DEMO)",
        "is_demo": not is_live,
        "timestamp": now_utc,
        "sources": {
            "airports": "DGCA / BTS Master",
            "routes": "DGCA / BTS Route Network",
            "aircraft": "OpenSky Network (Live)" if is_live else "Skyhour Synthetic Flight Dataset (Demo)"
        },
        "airports": airports_map,
        "routes": routes_map,
        "aircraft": aircraft_states
    }
