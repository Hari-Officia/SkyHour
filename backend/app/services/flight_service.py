from datetime import datetime, timezone
from typing import Dict, Any
from backend.app.providers.demo_provider import demo_provider
from backend.app.providers.opensky_provider import opensky_provider
from backend.app.providers.weather_provider import weather_provider
from backend.app.ml.prediction_pipeline import predict_flight_delay
from backend.app.services.search_service import AIRPORT_MASTERS

async def get_flight_details_service(flight_id: str) -> Dict[str, Any]:
    clean_id = flight_id.upper().strip()
    base_fn = clean_id.split("-")[0] if "-" in clean_id else clean_id
    
    # 1. Lookup in demo synthetic dataset using base_fn or clean_id
    sim_flight = demo_provider.get_flight_by_number(clean_id) or demo_provider.get_flight_by_number(base_fn)
    if sim_flight:
        f_num = str(sim_flight.get("flight_number") or base_fn)
        airline = str(sim_flight.get("airline") or "IndiGo")
        orig = str(sim_flight.get("origin") or "MAA")
        dest = str(sim_flight.get("destination") or "DEL")
        status = str(sim_flight.get("status") or "AIRBORNE")
        lat = float(sim_flight.get("latitude") if sim_flight.get("latitude") is not None else 12.9941)
        lon = float(sim_flight.get("longitude") if sim_flight.get("longitude") is not None else 80.1709)
        alt = float(sim_flight.get("altitude") if sim_flight.get("altitude") is not None else 32000.0)
        spd = float(sim_flight.get("ground_speed") if sim_flight.get("ground_speed") is not None else 440.0)
        hdg = float(sim_flight.get("heading") if sim_flight.get("heading") is not None else 45.0)
        aircraft = str(sim_flight.get("aircraft_type") or sim_flight.get("aircraft") or "Airbus A320neo")
        carrier_code = str(sim_flight.get("airline_iata") or ("AI" if "AIR INDIA" in airline.upper() else "6E"))
        sched_dep_val = str(sim_flight.get("scheduled_departure") or "18:30")
        sched_arr_val = str(sim_flight.get("scheduled_arrival") or "21:15")
    else:
        f_num = clean_id
        if clean_id.startswith("AI"):
            airline = "Air India"
            carrier_code = "AI"
        elif clean_id.startswith("UK"):
            airline = "Vistara"
            carrier_code = "UK"
        elif clean_id.startswith("SG"):
            airline = "SpiceJet"
            carrier_code = "SG"
        elif clean_id.startswith("QP"):
            airline = "Akasa Air"
            carrier_code = "QP"
        elif clean_id.startswith("IX"):
            airline = "Air India Express"
            carrier_code = "IX"
        else:
            airline = "IndiGo"
            carrier_code = "6E"
            
        orig = "MAA"
        dest = "DEL"
        status = "SCHEDULED"
        o_m = AIRPORT_MASTERS.get("MAA", {"lat": 12.9941, "lon": 80.1709})
        lat, lon = o_m["lat"], o_m["lon"]
        alt, spd, hdg = 32000.0, 440.0, 45.0
        aircraft = "Airbus A320neo"
        sched_dep_val = "18:30"
        sched_arr_val = "21:15"
        
    o_info = AIRPORT_MASTERS.get(orig, {"city": orig, "name": f"{orig} Airport"})
    d_info = AIRPORT_MASTERS.get(dest, {"city": dest, "name": f"{dest} Airport"})
    
    # 2. OpenSky Live Check
    opensky_res = await opensky_provider.fetch_states()
    live_states = opensky_res.get("states", [])
    matched_live = next((s for s in live_states if base_fn in s["callsign"].upper()), None)
    is_live = matched_live is not None
    
    if is_live and matched_live:
        lat = float(matched_live.get("latitude", lat))
        lon = float(matched_live.get("longitude", lon))
        alt = float(matched_live.get("baro_altitude_m", 10000.0)) * 3.28084
        spd = float(matched_live.get("velocity_ms", 220.0)) * 1.94384
        hdg = float(matched_live.get("true_track_deg", hdg))
        status = "AIRBORNE"
        
    # 3. Weather METAR Check
    weather_obj = await weather_provider.get_metar(orig)
    
    # 4. XGBoost Pre-Flight Prediction
    dep_hour_int = 18
    dep_min_int = 30
    if ":" in sched_dep_val:
        try:
            parts = sched_dep_val.split(":")
            dep_hour_int = int(parts[0])
            dep_min_int = int(parts[1][:2])
        except Exception:
            pass

    pred_obj = predict_flight_delay(
        flight_id=f_num,
        origin=orig,
        destination=dest,
        carrier=carrier_code,
        departure_hour=dep_hour_int,
        departure_min=dep_min_int
    )
    
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    
    return {
        "status": "SUCCESS",
        "data_mode": "REAL DATA (OpenSky)" if is_live else "SCHEDULED+MODELLED (DEMO)",
        "is_demo": not is_live,
        "flight_summary": {
            "flight_id": clean_id,
            "flight_number": base_fn,
            "callsign": f_num,
            "airline": airline,
            "airline_iata": carrier_code,
            "origin": orig,
            "destination": dest,
            "origin_city": o_info.get("city", orig),
            "destination_city": d_info.get("city", dest),
            "scheduled_departure": f"{sched_dep_val} IST" if "IST" not in sched_dep_val else sched_dep_val,
            "scheduled_arrival": f"{sched_arr_val} IST" if "IST" not in sched_arr_val else sched_arr_val,
            "status": status,
            "aircraft_type": aircraft,
            "departure_timezone": "Asia/Kolkata",
            "arrival_timezone": "Asia/Kolkata"
        },
        "time_intelligence": {
            "prediction_timestamp": now_utc,
            "scheduled_departure_utc": f"2026-09-20 {dep_hour_int:02d}:{dep_min_int:02d}:00 UTC",
            "hours_to_departure": 4.5,
            "prediction_horizon": "Pre-flight intelligence analysis",
            "prediction_mode": "PRE-FLIGHT"
        },
        "prediction": pred_obj,
        "live_telemetry": {
            "is_available": is_live,
            "source": "OpenSky Network (Live)" if is_live else "Position unavailable — Scheduled/Simulated active",
            "telemetry_data": {
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "altitude_ft": round(alt, 1),
                "ground_speed_knots": round(spd, 1),
                "heading_deg": round(hdg, 1),
                "status": status
            }
        },
        "origin_weather": weather_obj
    }
