from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class SearchResultItem(BaseModel):
    type: str  # FLIGHT, AIRPORT, ROUTE, AIRLINE
    id: str
    title: str
    subtitle: str
    url: str
    code: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    flight_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UniversalSearchResponse(BaseModel):
    status: str = "SUCCESS"
    query: str
    normalized_query: str
    total_results: int
    results: List[SearchResultItem]
