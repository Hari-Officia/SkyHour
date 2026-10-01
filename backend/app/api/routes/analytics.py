from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics & Plotting System"])

@router.get("/overview")
def get_analytics_overview(
    module: str = Query("usa", description="usa or india"),
    month: Optional[int] = Query(None, ge=1, le=12),
    day_of_week: Optional[int] = Query(None, ge=1, le=7),
    airline: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None)
):
    return analytics_service.get_overview(
        module=module,
        month=month,
        day_of_week=day_of_week,
        airline=airline,
        origin=origin,
        destination=destination
    )

@router.get("/delays")
def get_analytics_delays(
    module: str = Query("usa"),
    month: Optional[int] = Query(None, ge=1, le=12),
    day_of_week: Optional[int] = Query(None, ge=1, le=7),
    airline: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None)
):
    return analytics_service.get_delay_analytics(
        module=module,
        month=month,
        day_of_week=day_of_week,
        airline=airline,
        origin=origin,
        destination=destination
    )

@router.get("/carriers")
def get_analytics_carriers(
    module: str = Query("usa"),
    month: Optional[int] = Query(None, ge=1, le=12),
    day_of_week: Optional[int] = Query(None, ge=1, le=7)
):
    return analytics_service.get_carrier_analytics(
        module=module,
        month=month,
        day_of_week=day_of_week
    )

@router.get("/airports")
def get_analytics_airports(
    module: str = Query("usa"),
    month: Optional[int] = Query(None, ge=1, le=12),
    day_of_week: Optional[int] = Query(None, ge=1, le=7)
):
    return analytics_service.get_airport_analytics(
        module=module,
        month=month,
        day_of_week=day_of_week
    )

@router.get("/routes")
def get_analytics_routes(
    module: str = Query("usa"),
    month: Optional[int] = Query(None, ge=1, le=12),
    airline: Optional[str] = Query(None)
):
    return analytics_service.get_route_analytics(
        module=module,
        month=month,
        airline=airline
    )

@router.get("/time")
def get_analytics_time(
    module: str = Query("usa"),
    month: Optional[int] = Query(None, ge=1, le=12),
    airline: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None)
):
    return analytics_service.get_time_analytics(
        module=module,
        month=month,
        airline=airline,
        origin=origin,
        destination=destination
    )

@router.get("/weather")
def get_analytics_weather(
    module: str = Query("usa")
):
    return analytics_service.get_weather_analytics(module=module)

@router.get("/prediction")
def get_analytics_prediction():
    return analytics_service.get_model_analytics()

@router.get("/model")
def get_analytics_model():
    return analytics_service.get_model_analytics()

@router.get("/india")
def get_analytics_india(
    month: Optional[int] = Query(None, ge=1, le=12),
    state: Optional[str] = Query(None)
):
    return analytics_service.get_india_analytics(month=month, state=state)

@router.get("/flight/{flight_id}")
def get_analytics_flight(flight_id: str):
    clean_id = flight_id.upper().strip()
    return {
        "status": "success",
        "source": "SKYHOUR Real Flight Analytics Engine",
        "data": {
            "flight_id": clean_id,
            "message": f"Historical analytics for flight {clean_id}"
        }
    }
