from typing import Dict, Any, List, Optional
from backend.app.repositories.duckdb_store import data_repo
from backend.app.services.risk_service import calculate_entity_risk

class IndiaService:
    def get_overview(self) -> Dict[str, Any]:
        df_ap = data_repo.query("SELECT COUNT(*) as total, SUM(monthly_passengers) as pax, SUM(monthly_flights) as flights FROM india_airports")
        df_al = data_repo.query("SELECT COUNT(*) as total FROM india_airlines WHERE status = 'Active'")
        
        total_airports = int(df_ap.iloc[0]["total"]) if len(df_ap) > 0 else 64
        total_pax = float(df_ap.iloc[0]["pax"]) if len(df_ap) > 0 and df_ap.iloc[0]["pax"] is not None else 28500000.0
        total_flights = float(df_ap.iloc[0]["flights"]) if len(df_ap) > 0 and df_ap.iloc[0]["flights"] is not None else 185000.0
        active_airlines = int(df_al.iloc[0]["total"]) if len(df_al) > 0 else 8

        return {
            "total_airports": total_airports,
            "total_active_airlines": active_airlines,
            "total_monthly_passengers": total_pax,
            "total_monthly_flights": total_flights,
            "top_hub": "Indira Gandhi International Airport (DEL)",
            "top_airline": "IndiGo (6E)",
            "top_airline_market_share_pct": 61.8
        }

    def get_airports(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        if query:
            q = f"%{query.lower().strip()}%"
            df = data_repo.query(
                "SELECT * FROM india_airports WHERE LOWER(airport_iata) LIKE ? OR LOWER(airport_name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(state) LIKE ?",
                [q, q, q, q]
            )
        else:
            df = data_repo.query("SELECT * FROM india_airports")
        return df.to_dict(orient="records")

    def get_routes(self, origin: Optional[str] = None, destination: Optional[str] = None) -> List[Dict[str, Any]]:
        sql = "SELECT * FROM india_routes WHERE 1=1"
        params = []
        if origin:
            sql += " AND UPPER(origin) = ?"
            params.append(origin.upper().strip())
        if destination:
            sql += " AND UPPER(destination) = ?"
            params.append(destination.upper().strip())
        df = data_repo.query(sql, params)
        return df.to_dict(orient="records")

    def get_airlines(self) -> List[Dict[str, Any]]:
        df = data_repo.query("SELECT * FROM india_airlines")
        return df.to_dict(orient="records")

    def get_flights(self, flight_number: Optional[str] = None, airline: Optional[str] = None, origin: Optional[str] = None, destination: Optional[str] = None) -> List[Dict[str, Any]]:
        schedules = [
            {"flight_number": "6E204", "airline": "6E", "airline_name": "IndiGo", "origin": "DEL", "origin_name": "Indira Gandhi Intl", "destination": "BOM", "destination_name": "Chhatrapati Shivaji Maharaj Intl", "dep_time": "06:00:00", "arr_time": "08:10:00", "status": "SCHEDULED"},
            {"flight_number": "6E1234", "airline": "6E", "airline_name": "IndiGo", "origin": "MAA", "origin_name": "Chennai Intl", "destination": "DEL", "destination_name": "Indira Gandhi Intl", "dep_time": "08:30:00", "arr_time": "11:15:00", "status": "SCHEDULED"},
            {"flight_number": "6E502", "airline": "6E", "airline_name": "IndiGo", "origin": "BLR", "origin_name": "Kempegowda Intl", "destination": "MAA", "destination_name": "Chennai Intl", "dep_time": "07:15:00", "arr_time": "08:15:00", "status": "SCHEDULED"},
            {"flight_number": "AI101", "airline": "AI", "airline_name": "Air India", "origin": "DEL", "origin_name": "Indira Gandhi Intl", "destination": "BLR", "destination_name": "Kempegowda Intl", "dep_time": "09:30:00", "arr_time": "12:15:00", "status": "SCHEDULED"},
            {"flight_number": "SG812", "airline": "SG", "airline_name": "SpiceJet", "origin": "MAA", "origin_name": "Chennai Intl", "destination": "CJB", "destination_name": "Coimbatore Intl", "dep_time": "10:00:00", "arr_time": "11:05:00", "status": "SCHEDULED"},
            {"flight_number": "QP110", "airline": "QP", "airline_name": "Akasa Air", "origin": "BOM", "origin_name": "Chhatrapati Shivaji Maharaj Intl", "destination": "AMD", "destination_name": "Sardar Vallabhbhai Patel Intl", "dep_time": "11:45:00", "arr_time": "12:55:00", "status": "SCHEDULED"},
            {"flight_number": "9I701", "airline": "9I", "airline_name": "Alliance Air", "origin": "MAA", "origin_name": "Chennai Intl", "destination": "SXV", "destination_name": "Salem Airport (UDAN)", "dep_time": "13:20:00", "arr_time": "14:15:00", "status": "SCHEDULED"}
        ]
        res = schedules
        if flight_number:
            fn = flight_number.upper().strip()
            res = [s for s in res if fn in s["flight_number"].upper()]
        if airline:
            al = airline.upper().strip()
            res = [s for s in res if s["airline"].upper() == al]
        if origin:
            o = origin.upper().strip()
            res = [s for s in res if s["origin"].upper() == o]
        if destination:
            d = destination.upper().strip()
            res = [s for s in res if s["destination"].upper() == d]
        return res

    def get_states(self) -> List[Dict[str, Any]]:
        try:
            df = data_repo.query("SELECT * FROM india_states")
            return df.to_dict(orient="records")
        except Exception:
            df = data_repo.query("SELECT state, COUNT(*) as total_airports, SUM(monthly_passengers) as total_passengers FROM india_airports GROUP BY state ORDER BY total_passengers DESC")
            return df.to_dict(orient="records")

    def get_tamil_nadu(self) -> Dict[str, Any]:
        df_ap = data_repo.query("SELECT * FROM india_airports WHERE state = 'Tamil Nadu'")
        ap_list = df_ap.to_dict(orient="records")
        iata_codes = [a["airport_iata"] for a in ap_list]
        
        df_rt = data_repo.query("SELECT * FROM india_routes")
        rt_list = df_rt.to_dict(orient="records")
        tn_routes = [r for r in rt_list if r.get("origin") in iata_codes or r.get("destination") in iata_codes]
        
        total_pax = sum(a.get("monthly_passengers", 0) for a in ap_list)
        
        return {
            "state": "Tamil Nadu",
            "capital": "Chennai (MAA)",
            "total_airports": len(ap_list),
            "total_monthly_passengers": total_pax,
            "airports": ap_list,
            "sector_routes": tn_routes
        }

    def run_what_if(self, airport_iata: str, traffic_delta_pct: float, weather_delta_pct: float) -> Dict[str, Any]:
        code = airport_iata.upper().strip()
        df = data_repo.query("SELECT * FROM india_airports WHERE UPPER(airport_iata) = ?", [code])
        if len(df) > 0:
            row = df.iloc[0]
            name = str(row["airport_name"])
            pax = float(row.get("monthly_passengers", 1500000))
        else:
            name = f"{code} Airport"
            pax = 1500000.0
            
        base_risk = calculate_entity_risk(code, "AIRPORT", int(pax / 200), 0.22, 0.01)
        
        # Apply scenario deltas
        scen_mvt = int((pax / 200) * (1.0 + traffic_delta_pct / 100.0))
        scen_delay = max(0.22 * (1.0 + weather_delta_pct / 100.0), 0.05)
        scen_risk = calculate_entity_risk(code, "AIRPORT", scen_mvt, scen_delay, 0.01)
        
        delta = round(scen_risk["risk_score"] - base_risk["risk_score"], 1)
        
        return {
            "airport_iata": code,
            "airport_name": name,
            "scenario_inputs": {"traffic_delta_pct": traffic_delta_pct, "weather_delta_pct": weather_delta_pct},
            "baseline": base_risk,
            "scenario": scen_risk,
            "risk_delta": delta,
            "disclaimer": "Scenario simulation result for planning context — not an official government alert."
        }

india_service = IndiaService()
