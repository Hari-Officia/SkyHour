from fastapi import APIRouter, Query
from backend.app.ml.prediction_pipeline import predict_flight_delay

router = APIRouter()

@router.get("/prediction/flight/{flight_id}")
@router.post("/predict")
def prediction_endpoint(
    flight_id: str = "AI302",
    origin: str = Query("MAA"),
    destination: str = Query("DEL"),
    carrier: str = Query("AI"),
    departure_hour: int = Query(18),
    departure_min: int = Query(30)
):
    return predict_flight_delay(
        flight_id=flight_id,
        origin=origin,
        destination=destination,
        carrier=carrier,
        departure_hour=departure_hour,
        departure_min=departure_min
    )
