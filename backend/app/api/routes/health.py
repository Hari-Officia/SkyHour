from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "Skyhour Airline Flight Intelligence & Delay Prediction API (FastAPI)",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    }
