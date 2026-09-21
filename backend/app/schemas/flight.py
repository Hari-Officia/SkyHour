from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class FlightSummary(BaseModel):
    flight_id: str
    flight_number: str
    callsign: str
    airline: str
    airline_iata: str
    origin: str
    destination: str
    origin_city: str
    destination_city: str
    scheduled_departure: str
    scheduled_arrival: str
    status: str
    aircraft_type: str
    departure_timezone: str
    arrival_timezone: str

class TimeIntelligence(BaseModel):
    prediction_timestamp: str
    scheduled_departure_utc: str
    hours_to_departure: float
    prediction_horizon: str
    prediction_mode: str

class FactorContribution(BaseModel):
    factor: str
    impact: str
    weight: str

class ModelMetadata(BaseModel):
    model_name: str
    validation_roc_auc: float
    test_roc_auc: float
    optimal_threshold: float
    calibration_note: str

class DelayPredictionObject(BaseModel):
    prediction: str
    delay_probability: float
    delay_percentage: float
    decision_threshold: float
    risk_level: str
    contributing_factors: List[FactorContribution]
    model_metadata: ModelMetadata
    prediction_timestamp: str

class TelemetryData(BaseModel):
    latitude: float
    longitude: float
    altitude_ft: float
    ground_speed_knots: float
    heading_deg: float
    status: str

class LiveTelemetry(BaseModel):
    is_available: bool
    source: str
    telemetry_data: TelemetryData

class FlightIntelligenceResponse(BaseModel):
    status: str = "SUCCESS"
    data_mode: str
    is_demo: bool
    flight_summary: FlightSummary
    time_intelligence: TimeIntelligence
    prediction: DelayPredictionObject
    live_telemetry: LiveTelemetry
    origin_weather: Optional[Dict[str, Any]] = None
