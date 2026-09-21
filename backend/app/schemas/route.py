from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from backend.app.schemas.airport import RiskAssessment

class RouteIdentity(BaseModel):
    origin: str
    destination: str
    origin_city: str
    destination_city: str
    distance_miles: int
    route_code: str

class RouteSummary(BaseModel):
    total_flights: int
    avg_delay_minutes: float
    median_delay_minutes: float
    delayed_percentage: float
    cancellation_percentage: float

class HourlyDelayLabel(BaseModel):
    label: str
    delay_rate: float
    flights: int

class AirlineRoutePerformance(BaseModel):
    airline: str
    airline_iata: str
    flights_operated: int
    delay_rate: float
    avg_delay: float

class RouteIntelligenceResponse(BaseModel):
    status: str = "SUCCESS"
    route: RouteIdentity
    summary: RouteSummary
    delay_by_hour: Dict[str, HourlyDelayLabel]
    airline_performance: List[AirlineRoutePerformance]
    risk_assessment: RiskAssessment
