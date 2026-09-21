from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime
from backend.app.services.map_service import get_map_data_service
from backend.app.services.flight_search_service import flight_search_service

router = APIRouter()

@router.get("/map/data")
async def map_data_endpoint():
    return await get_map_data_service()

@router.get("/map/flights")
async def map_flights_endpoint(
    date: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    time_window: str = Query("ANY"),
    status: Optional[str] = Query(None),
    airline: Optional[str] = Query(None),
    risk: Optional[str] = Query(None)
):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    flights = flight_search_service.get_map_flights(
        date_str=target_date,
        origin=origin,
        destination=destination,
        time_window=time_window,
        risk_filter=risk
    )
    return {
        "status": "SUCCESS",
        "date": target_date,
        "count": len(flights),
        "data_mode": "SCHEDULED+SIMULATION" if flights else "EMPTY",
        "aircraft": flights
    }

@router.get("/map/airports")
async def map_airports_endpoint():
    res = await get_map_data_service()
    return {"status": "SUCCESS", "airports": res["airports"]}

@router.get("/map/routes")
async def map_routes_endpoint():
    res = await get_map_data_service()
    return {"status": "SUCCESS", "routes": res["routes"]}
