from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SearchQuery(BaseModel):
    origin: str
    destination: str
    date: str
    time_window: str = "ANY"
    airline: Optional[str] = None
    nonstop: bool = False
    risk_max: Optional[float] = None

class RiskBreakdown(BaseModel):
    airline_delay_rate: float
    route_delay_rate: float
    origin_airport_delay: float
    destination_airport_delay: float
    time_window_effect: float
    weather_impact: str
    ml_prediction_probability: float

class FlightOptionItem(BaseModel):
    flight_id: str
    flight_number: str
    airline: str
    airline_iata: str
    airline_icao: str
    origin: str
    origin_city: str
    destination: str
    destination_city: str
    scheduled_departure: str
    scheduled_arrival: str
    duration_formatted: str
    stops: int
    aircraft_type: str
    historical_delay_rate: float
    predicted_delay_probability: float
    risk_level: str
    expected_delay_range: str
    weather_condition: str
    data_mode: str
    risk_breakdown: Optional[RiskBreakdown] = None

class DateSearchMeta(BaseModel):
    data_mode: str
    timestamp: str
    source: str
    total_results: int

class DateSearchResultData(BaseModel):
    query: SearchQuery
    flights: List[FlightOptionItem]

class DateSearchResponse(BaseModel):
    success: bool = True
    data: DateSearchResultData
    meta: DateSearchMeta

class CalendarDayRisk(BaseModel):
    date: str
    day_name: str
    total_flights: int
    avg_predicted_risk: float
    historical_delay_rate: float
    weather_status: str
    risk_category: str

class CalendarRiskResponse(BaseModel):
    success: bool = True
    origin: str
    destination: str
    days: List[CalendarDayRisk]
    meta: Dict[str, Any]

class TimeRiskCell(BaseModel):
    time_window: str
    label: str
    dates_risk: Dict[str, float]

class TimeRiskMatrixResponse(BaseModel):
    success: bool = True
    origin: str
    destination: str
    dates: List[str]
    time_windows: List[TimeRiskCell]

class FlightComparisonResponse(BaseModel):
    success: bool = True
    flights: List[FlightOptionItem]
    meta: Dict[str, Any]
