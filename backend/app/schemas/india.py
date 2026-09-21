from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class IndiaOverviewResponse(BaseModel):
    total_airports: int
    total_active_airlines: int
    total_monthly_passengers: float
    total_monthly_flights: float
    top_hub: str
    top_airline: str
    top_airline_market_share_pct: float

class WhatIfRequest(BaseModel):
    airport_iata: str
    traffic_delta_pct: float = 0.0
    weather_delta_pct: float = 0.0

class WhatIfResponse(BaseModel):
    airport_iata: str
    airport_name: str
    scenario_inputs: Dict[str, float]
    baseline: Dict[str, Any]
    scenario: Dict[str, Any]
    risk_delta: float
    disclaimer: str

class DemandForecastRequest(BaseModel):
    airport_iata: str

class DemandForecastResponse(BaseModel):
    airport_iata: str
    airport_name: str
    current_monthly_passengers: float
    forecasted_monthly_passengers: float
    growth_pct: float
    confidence_interval: Dict[str, float]
    model_version: str
