from fastapi import APIRouter, Query
from backend.app.services.route_service import get_route_intelligence_service

router = APIRouter()

@router.get("/route")
@router.get("/route/intelligence")
def route_query_endpoint(origin: str = Query("MAA"), destination: str = Query("DEL")):
    return get_route_intelligence_service(origin, destination)

@router.get("/route/{origin}/{destination}")
def route_path_endpoint(origin: str, destination: str):
    return get_route_intelligence_service(origin, destination)
