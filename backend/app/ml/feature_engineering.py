import math
import pandas as pd
from datetime import datetime
from typing import Optional, Dict, Tuple

# Pre-cached coordinates and risk profiles for major Indian & international hubs
AIRPORT_DB: Dict[str, Tuple[float, float, float]] = {
    "DEL": (28.5562, 77.1000, 0.29),  # Delhi (High traffic)
    "BOM": (19.0896, 72.8656, 0.27),  # Mumbai (Congested)
    "BLR": (13.1986, 77.7066, 0.21),  # Bengaluru
    "MAA": (12.9941, 80.1709, 0.22),  # Chennai
    "HYD": (17.2403, 78.4294, 0.19),  # Hyderabad
    "CCU": (22.6547, 88.4467, 0.23),  # Kolkata
    "PNQ": (18.5821, 73.9197, 0.20),  # Pune
    "AMD": (23.0772, 72.6347, 0.20),  # Ahmedabad
    "COK": (10.1520, 76.4019, 0.18),  # Kochi
    "GOI": (15.3808, 73.8314, 0.19),  # Goa
    "GOX": (15.7645, 73.8643, 0.18),  # Mopa Goa
    "JFK": (40.6413, -73.7781, 0.28), # New York JFK
    "LAX": (33.9416, -118.4085, 0.24),# Los Angeles
    "ORD": (41.9742, -87.9073, 0.29), # Chicago O'Hare
    "DFW": (32.8998, -97.0403, 0.26), # Dallas Fort Worth
    "SFO": (37.6213, -122.3790, 0.27),# San Francisco
    "LHR": (51.4700, -0.4543, 0.26)   # London Heathrow
}

CARRIER_TARGET_ENC: Dict[str, float] = {
    "6E": 0.18, # IndiGo (High OTP)
    "UK": 0.19, # Vistara
    "AI": 0.26, # Air India
    "SG": 0.33, # SpiceJet
    "IX": 0.25, # Air India Express
    "QP": 0.20, # Akasa Air
    "I5": 0.22, # AirAsia India / AIX Connect
    "AA": 0.24, # American Airlines
    "DL": 0.21, # Delta
    "UA": 0.27, # United Airlines
    "BA": 0.23  # British Airways
}

def haversine_distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate geodesic distance in statute miles between two lat/lon pairs."""
    r_miles = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return round(2 * r_miles * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)

def get_airport_info(code: str) -> Tuple[float, float, float]:
    """Returns (lat, lon, target_enc) for airport code, falling back to DuckDB or sensible defaults."""
    clean = code.upper().strip()
    if clean in AIRPORT_DB:
        return AIRPORT_DB[clean]
    
    # Try querying DuckDB repo dynamically if available
    try:
        from backend.app.repositories.duckdb_store import data_repo
        df = data_repo.query(
            "SELECT latitude, longitude, skyhour_risk_score FROM india_airports WHERE UPPER(airport_iata) = ?",
            [clean]
        )
        if len(df) > 0:
            lat = float(df.iloc[0]["latitude"])
            lon = float(df.iloc[0]["longitude"])
            risk = float(df.iloc[0]["skyhour_risk_score"])
            enc = round(min(0.40, max(0.12, risk / 300.0 + 0.10)), 3)
            return (lat, lon, enc)
    except Exception:
        pass

    return (20.5937, 78.9629, 0.22)

def build_xgboost_feature_vector(
    origin: str = "MAA",
    destination: str = "DEL",
    carrier: str = "AI",
    departure_hour: int = 18,
    departure_min: int = 30,
    distance_miles: Optional[float] = None,
    month: Optional[int] = None,
    day_of_week: Optional[int] = None
) -> pd.DataFrame:
    clean_orig = origin.upper().strip()
    clean_dest = destination.upper().strip()
    clean_carrier = carrier.upper().strip()
    
    orig_lat, orig_lon, orig_target = get_airport_info(clean_orig)
    dest_lat, dest_lon, dest_target = get_airport_info(clean_dest)

    if distance_miles is not None and distance_miles > 0:
        dist_val = float(distance_miles)
    else:
        dist_val = haversine_distance_miles(orig_lat, orig_lon, dest_lat, dest_lon)
        if dist_val < 50:
            dist_val = 650.0  # Fallback for identical/invalid coordinates

    # Calculate flight duration in minutes based on distance & cruising speed
    flight_duration_mins = int((dist_val / 480.0) * 60 + 35)
    
    dep_h = float(departure_hour)
    dep_m = float(departure_min)

    total_dep_mins = int(dep_h * 60 + dep_m)
    total_arr_mins = (total_dep_mins + flight_duration_mins) % (24 * 60)
    
    arr_h = float(total_arr_mins // 60)
    arr_m = float(total_arr_mins % 60)
    
    now = datetime.now()
    m_val = float(month if month is not None else now.month)
    
    # R lubridate wday() convention: Sunday = 1, Monday = 2, ..., Saturday = 7
    if day_of_week is not None:
        dow_val = float(day_of_week)
    else:
        iso_w = now.isoweekday()  # 1=Mon .. 7=Sun
        dow_val = float((iso_w % 7) + 1)  # Convert to 1=Sun .. 7=Sat
        
    is_wknd = 1.0 if dow_val in [1.0, 7.0] else 0.0

    carrier_target = CARRIER_TARGET_ENC.get(clean_carrier, 0.22)
    route_target = round((orig_target + dest_target) / 2.0 + (0.02 if dist_val > 1200 else 0.0), 3)
    
    # Time of day target encoding
    if 7 <= dep_h <= 9:
        tod_target = 0.22 # Morning rush
    elif 10 <= dep_h <= 15:
        tod_target = 0.16 # Midday lull
    elif 16 <= dep_h <= 20:
        tod_target = 0.28 # Evening peak (Cascading delays)
    elif 21 <= dep_h <= 23:
        tod_target = 0.21 # Late night
    else:
        tod_target = 0.14 # Red-eye / Early AM

    # 17 Features in exact order expected by XGBoost booster model
    data = {
        "ScheduledDepartureHour": [dep_h],
        "ScheduledDepartureMinute": [dep_m],
        "ScheduledArrivalHour": [arr_h],
        "ScheduledArrivalMinute": [arr_m],
        "Month": [m_val],
        "DayOfWeek": [dow_val],
        "IsWeekend": [is_wknd],
        "Carrier_Freq": [0.20],
        "Carrier_TargetEnc": [carrier_target],
        "Origin_Freq": [0.15],
        "Dest_Freq": [0.15],
        "Distance": [dist_val],
        "Origin_TargetEnc": [orig_target],
        "Dest_TargetEnc": [dest_target],
        "Route_Freq": [0.05],
        "Route_TargetEnc": [route_target],
        "TimeOfDay_TargetEnc": [tod_target]
    }
    
    return pd.DataFrame(data)

