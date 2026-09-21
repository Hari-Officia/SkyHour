from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.app.schemas.india import WhatIfRequest, DemandForecastRequest
from backend.app.services.india_service import india_service

router = APIRouter(prefix="/india", tags=["India Aviation Intelligence"])

@router.get("/health")
def india_health_endpoint():
    return {
        "status": "UP",
        "service": "Skyhour India Aviation Intelligence API (FastAPI)",
        "version": "1.0.0",
        "total_airports": 64,
        "total_routes": 22
    }

@router.get("/overview")
def india_overview_endpoint():
    return india_service.get_overview()

@router.get("/map-data")
def india_map_data_endpoint():
    return {
        "airports": india_service.get_airports(),
        "routes": india_service.get_routes()
    }

@router.get("/airports")
def india_airports_endpoint(q: Optional[str] = Query(None)):
    return india_service.get_airports(q)

@router.get("/routes")
def india_routes_endpoint(origin: Optional[str] = Query(None), destination: Optional[str] = Query(None)):
    return india_service.get_routes(origin, destination)

@router.get("/airlines")
def india_airlines_endpoint():
    return india_service.get_airlines()

@router.get("/flights")
def india_flights_endpoint(
    flight_number: Optional[str] = Query(None),
    airline: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None)
):
    return india_service.get_flights(flight_number, airline, origin, destination)

@router.post("/predict-demand")
def india_predict_demand_endpoint(body: DemandForecastRequest):
    code = body.airport_iata.upper().strip()
    airports = india_service.get_airports(code)
    if not airports:
        raise HTTPException(status_code=404, detail=f"Airport code '{code}' not found.")
    ap = airports[0]
    pax = float(ap.get("monthly_passengers", 1500000))
    pred = round(pax * 1.085)
    return {
        "airport_iata": code,
        "airport_name": ap.get("airport_name", f"{code} Airport"),
        "current_monthly_passengers": pax,
        "forecasted_monthly_passengers": pred,
        "growth_pct": 8.5,
        "confidence_interval": {"lower": round(pred * 0.95), "upper": round(pred * 1.05)},
        "model_version": "1.0.0"
    }

@router.post("/what-if")
def india_what_if_endpoint(body: WhatIfRequest):
    return india_service.run_what_if(body.airport_iata, body.traffic_delta_pct, body.weather_delta_pct)

@router.get("/states")
def india_states_endpoint():
    return india_service.get_states()

@router.get("/tamil-nadu")
def india_tamil_nadu_endpoint():
    return india_service.get_tamil_nadu()

@router.get("/airport-intelligence")
def india_airport_intelligence_endpoint(q: Optional[str] = Query(None)):
    return india_service.get_airports(q)

@router.get("/route-intelligence")
def india_route_intelligence_endpoint(origin: Optional[str] = Query(None), destination: Optional[str] = Query(None)):
    return india_service.get_routes(origin, destination)

@router.get("/bottlenecks")
def india_bottlenecks_endpoint():
    return [ap for ap in india_service.get_airports() if ap.get("network_rank", 99) <= 5]

@router.get("/airline-intelligence")
def india_airline_intelligence_endpoint():
    return india_service.get_airlines()

@router.get("/state-intelligence")
def india_state_intelligence_endpoint():
    return india_service.get_states()

@router.get("/tamil-nadu-compare")
def india_tamil_nadu_compare_endpoint():
    return india_service.get_tamil_nadu()
