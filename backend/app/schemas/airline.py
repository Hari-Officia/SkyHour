from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AirlineIdentity(BaseModel):
    name: str
    iata: str
    icao: str
    country: str

class AirlineMetrics(BaseModel):
    total_flights: int
    airports_served_count: int
    routes_count: int
    avg_delay_minutes: float
    median_delay_minutes: float
    delayed_percentage: float
    cancellation_percentage: float

class TopAirportServed(BaseModel):
    origin: str
    origin_city: str
    departures_count: int

class TopRouteServedByAirline(BaseModel):
    route: str
    origin: str
    destination: str
    flights_count: int
    delay_rate: float

class AirlineRiskAssessment(BaseModel):
    risk_score: float
    risk_category: str

class AirlineIntelligenceResponse(BaseModel):
    status: str = "SUCCESS"
    airline: AirlineIdentity
    metrics: AirlineMetrics
    top_airports: List[TopAirportServed]
    top_routes: List[TopRouteServedByAirline]
    risk_assessment: AirlineRiskAssessment
