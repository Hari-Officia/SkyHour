from datetime import datetime, timezone
from typing import Dict, Any, List

def calculate_entity_risk(
    entity_id: str,
    entity_type: str = "AIRPORT",
    monthly_movements: int = 120,
    delay_rate: float = 0.28,
    cancellation_rate: float = 0.02,
    rainfall_mm: float = 45.0,
    wind_kmh: float = 12.0
) -> Dict[str, Any]:
    base = 25.0
    
    # 1. Traffic Pressure
    if monthly_movements > 300:
        traffic_pts = 22.0
    elif monthly_movements > 150:
        traffic_pts = 14.0
    else:
        traffic_pts = 8.0
        
    # 2. Historical Delay Component
    delay_pts = min(round(delay_rate * 60.0, 1), 35.0)
    
    # 3. Weather Severity Component
    weather_pts = 0.0
    if rainfall_mm > 100:
        weather_pts += 12.0
    elif rainfall_mm > 40:
        weather_pts += 6.0
        
    if wind_kmh > 30:
        weather_pts += 10.0
    elif wind_kmh > 15:
        weather_pts += 4.0
        
    # 4. Cancellation Rate Component
    cancel_pts = min(round(cancellation_rate * 200.0, 1), 15.0)
    
    score = round(min(max(base + traffic_pts + delay_pts + weather_pts + cancel_pts, 5.0), 98.0), 1)
    
    if score >= 65.0:
        cat = "HIGH RISK"
    elif score >= 40.0:
        cat = "MODERATE RISK"
    else:
        cat = "LOW RISK"
        
    contributors = [
        {"factor": "Flight Volume & Traffic Density", "impact": "HIGH" if traffic_pts > 15 else "MODERATE", "points": traffic_pts},
        {"factor": "Historical Delay Probability", "impact": "HIGH" if delay_pts > 15 else "MODERATE", "points": delay_pts},
        {"factor": "Local Weather Severity Index", "impact": "MODERATE" if weather_pts > 5 else "LOW", "points": weather_pts},
        {"factor": "Operational Cancellation Rate", "impact": "LOW", "points": cancel_pts}
    ]
    
    return {
        "risk_score": score,
        "risk_category": cat,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "source": "Skyhour Dynamic Risk Scoring Engine v2.0",
        "top_contributors": contributors
    }
