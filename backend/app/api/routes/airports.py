from fastapi import APIRouter
from backend.app.services.airport_service import get_airport_intelligence_service
from backend.app.providers.weather_provider import weather_provider

router = APIRouter()

@router.get("/airport/{airport_code}")
def airport_intelligence_endpoint(airport_code: str):
    return get_airport_intelligence_service(airport_code)

@router.get("/airport/{airport_code}/weather")
async def airport_weather_endpoint(airport_code: str):
    return await weather_provider.get_metar(airport_code)

@router.get("/airport/{airport_code}/traffic")
def airport_traffic_endpoint(airport_code: str):
    intel = get_airport_intelligence_service(airport_code)
    return {
        "status": "SUCCESS",
        "airport_code": airport_code,
        "traffic": intel["metrics"],
        "traffic_by_hour": intel["traffic_by_hour"]
    }
