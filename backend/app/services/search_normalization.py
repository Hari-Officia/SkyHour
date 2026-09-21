import re
from typing import Tuple, Optional, Dict, Any

def normalize_code(term: str) -> str:
    """Normalizes airport or airline code strings (trims, upper-cases, removes spaces/punctuation)."""
    if not term:
        return ""
    clean = re.sub(r'[^A-Za-z0-9]', '', term.strip().upper())
    return clean

def parse_time_window(time_window: str) -> Tuple[int, int, str]:
    """
    Standardizes time window strings into hour ranges (start_hour, end_hour, code).
    Time Window Definitions:
    - MORNING: 06:00 – 11:59 (6 to 11)
    - AFTERNOON: 12:00 – 16:59 (12 to 16)
    - EVENING: 17:00 – 20:59 (17 to 20)
    - NIGHT: 21:00 – 23:59 (21 to 23)
    - MIDNIGHT: 00:00 – 05:59 (0 to 5)
    - ANY: 00:00 – 23:59 (0 to 23)
    """
    tw = (time_window or "ANY").strip().upper()
    if tw in ["MORNING", "MORNINGS"]:
        return (6, 11, "MORNING")
    elif tw in ["AFTERNOON", "AFTERNOONS"]:
        return (12, 16, "AFTERNOON")
    elif tw in ["EVENING", "EVENINGS"]:
        return (17, 20, "EVENING")
    elif tw in ["NIGHT", "NIGHTS"]:
        return (21, 23, "NIGHT")
    elif tw in ["MIDNIGHT", "EARLY_MORNING", "EARLY MORNING"]:
        return (0, 5, "MIDNIGHT")
    else:
        return (0, 23, "ANY")

def normalize_search_query(q: str) -> Dict[str, Any]:
    """Parses freeform queries like 'MAA DEL', 'MAA-DEL', 'AI302', 'Chennai Airport'."""
    raw = (q or "").strip()
    result = {
        "raw": raw,
        "type": "UNKNOWN",
        "flight_number": None,
        "origin": None,
        "destination": None
    }
    if not raw:
        return result

    # Check route format e.g. "MAA-DEL", "MAA DEL", "MAA TO DEL", "MAA -> DEL"
    route_match = re.split(r'\s*(?:-|–|→|to|\s)\s*', raw, flags=re.IGNORECASE)
    if len(route_match) == 2 and len(route_match[0]) <= 4 and len(route_match[1]) <= 4:
        result["type"] = "ROUTE"
        result["origin"] = normalize_code(route_match[0])
        result["destination"] = normalize_code(route_match[1])
        return result

    # Check flight number e.g. AI302, 6E204, SG101
    flight_match = re.match(r'^([A-Z0-9]{2,3})\s*(-|\s)?\s*(\d{1,4})$', raw, re.IGNORECASE)
    if flight_match:
        result["type"] = "FLIGHT"
        result["flight_number"] = f"{flight_match.group(1).upper()}{flight_match.group(3)}"
        return result

    # Default to single code/airport search
    result["type"] = "CODE"
    result["origin"] = normalize_code(raw)
    return result
