from fastapi import APIRouter
from backend.app.services.airline_service import get_airline_intelligence_service

router = APIRouter()

@router.get("/airline/{airline_code}")
def airline_intelligence_endpoint(airline_code: str):
    return get_airline_intelligence_service(airline_code)
