from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AirportIdentity(BaseModel):
    code: str
    iata: str
    icao: str
    city: str
    country: str
    latitude: float
    longitude: float
    timezone: str
    local_time: str
    utc_time: str

class AirportMetrics(BaseModel):
    total_movements: int
    departures_count: int
    arrivals_count: int
    avg_delay_minutes: float
    median_delay_minutes: float
    delayed_percentage: float
    cancellation_percentage: float

class TopAirlineServed(BaseModel):
    airline: str
    airline_iata: str
    flights_count: int

class TopRouteServed(BaseModel):
    destination: str
    destination_city: str
    flight_count: int
    delay_rate: float

class RiskContributor(BaseModel):
    factor: str
    impact: str
    points: float

class RiskAssessment(BaseModel):
    risk_score: float
    risk_category: str
    timestamp: str
    source: str
    top_contributors: List[RiskContributor]

class AirportIntelligenceResponse(BaseModel):
    status: str = "SUCCESS"
    data_mode: str = "REAL DATA"
    airport: AirportIdentity
    metrics: AirportMetrics
    traffic_by_hour: Dict[str, int]
    airlines_served: List[TopAirlineServed]
    top_routes: List[TopRouteServed]
    risk_assessment: RiskAssessment
    weather: Optional[Dict[str, Any]] = None
