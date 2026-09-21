from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from backend.app.services.flight_service import get_flight_details_service
from backend.app.services.flight_search_service import flight_search_service
from backend.app.providers.opensky_provider import opensky_provider

router = APIRouter()

@router.get("/flights/search")
async def search_flights_endpoint(
    origin: str = Query("MAA", description="Origin airport IATA or city"),
    destination: str = Query("DEL", description="Destination airport IATA or city"),
    date: Optional[str] = Query(None, description="Flight date in YYYY-MM-DD format"),
    time_window: str = Query("ANY", description="MORNING, AFTERNOON, EVENING, NIGHT, MIDNIGHT, or ANY"),
    airline: Optional[str] = Query(None, description="Airline IATA code or name filter"),
    nonstop: bool = Query(False, description="Filter non-stop flights only"),
    risk_max: Optional[float] = Query(None, description="Maximum delay risk percentage threshold"),
    limit: int = Query(50, ge=1, le=200)
):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    result = flight_search_service.search_flights(
        origin=origin,
        destination=destination,
        date_str=target_date,
        time_window=time_window,
        airline=airline,
        nonstop=nonstop,
        risk_max=risk_max,
        limit=limit
    )
    return {
        "success": True,
        "data": result,
        "meta": result["meta"]
    }

@router.get("/flights/calendar")
async def flights_calendar_endpoint(
    origin: str = Query("MAA"),
    destination: str = Query("DEL"),
    date: Optional[str] = Query(None)
):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    return flight_search_service.get_calendar_risk(origin, destination, target_date)

@router.get("/flights/time-risk")
async def flights_time_risk_endpoint(
    origin: str = Query("MAA"),
    destination: str = Query("DEL"),
    date: Optional[str] = Query(None)
):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    return flight_search_service.get_time_risk_matrix(origin, destination, target_date)

@router.get("/flights/compare")
async def flights_compare_endpoint(
    flight_ids: str = Query(..., description="Comma-separated flight IDs or numbers, e.g. AI302,6E204"),
    date: Optional[str] = Query(None)
):
    ids_list = [f.strip() for f in flight_ids.split(",") if f.strip()]
    if not ids_list:
        raise HTTPException(status_code=400, detail="At least one flight ID must be provided.")
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    flights = flight_search_service.compare_flights(ids_list, target_date)
    return {
        "success": True,
        "flights": flights,
        "meta": {
            "date": target_date,
            "compared_count": len(flights)
        }
    }

@router.get("/flight/{flight_id}")
async def flight_details_endpoint(flight_id: str):
    if not flight_id.strip():
        raise HTTPException(status_code=400, detail="Flight ID is required.")
    return await get_flight_details_service(flight_id)

@router.get("/flight/{flight_id}/status")
async def flight_status_endpoint(flight_id: str):
    clean_id = flight_id.upper().strip()
    opensky_res = await opensky_provider.fetch_states()
    states = opensky_res.get("states", [])
    matched = next((s for s in states if clean_id in s["callsign"].upper()), None)
    
    if matched:
        return {
            "status": "SUCCESS",
            "source": "OpenSky Network (Live)",
            "flight_id": clean_id,
            "telemetry": matched
        }
    return {
        "status": "POSITION_UNAVAILABLE",
        "source": "OpenSky Network",
        "message": "Aircraft telemetry currently unavailable from OpenSky Network",
        "flight_id": clean_id
    }

@router.get("/flight/{flight_id}/position")
async def flight_position_endpoint(flight_id: str):
    return await flight_status_endpoint(flight_id)
