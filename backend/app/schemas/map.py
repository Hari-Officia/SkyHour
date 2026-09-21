from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class MapAirportItem(BaseModel):
    code: str
    iata: str
    icao: str
    name: str
    city: str
    country: str
    latitude: float
    longitude: float
    total_movements: int
    risk_score: float
    risk_category: str

class MapRouteItem(BaseModel):
    route_code: str
    origin: str
    destination: str
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    distance_miles: float
    flight_volume: int
    delay_category: str

class MapAircraftItem(BaseModel):
    icao24: str
    callsign: str
    flight_number: Optional[str] = None
    airline: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    latitude: float
    longitude: float
    baro_altitude_m: float
    velocity_ms: float
    true_track_deg: float
    status: Optional[str] = None
    is_demo: Optional[bool] = None

class MapSources(BaseModel):
    airports: str
    routes: str
    aircraft: str

class MapDataResponse(BaseModel):
    status: str = "SUCCESS"
    data_mode: str
    is_demo: bool
    timestamp: str
    sources: MapSources
    airports: List[MapAirportItem]
    routes: List[MapRouteItem]
    aircraft: List[MapAircraftItem]
