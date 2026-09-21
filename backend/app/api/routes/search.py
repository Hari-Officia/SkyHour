from fastapi import APIRouter, Query
from backend.app.services.search_service import search_universal_service

router = APIRouter()

@router.get("/search")
def search_endpoint(q: str = Query("", description="Universal Search Query")):
    return search_universal_service(q)
