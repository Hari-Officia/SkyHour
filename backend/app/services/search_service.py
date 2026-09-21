import re
from typing import List, Dict, Any
from backend.app.repositories.duckdb_store import data_repo

AIRPORT_MASTERS = {
    "MAA": {"iata": "MAA", "icao": "VOMM", "name": "Chennai International Airport", "city": "Chennai", "country": "India", "lat": 12.9941, "lon": 80.1709},
    "DEL": {"iata": "DEL", "icao": "VIDP", "name": "Indira Gandhi International Airport", "city": "Delhi", "country": "India", "lat": 28.5562, "lon": 77.1000},
    "BOM": {"iata": "BOM", "icao": "VABB", "name": "Chhatrapati Shivaji Maharaj International Airport", "city": "Mumbai", "country": "India", "lat": 19.0896, "lon": 72.8656},
    "BLR": {"iata": "BLR", "icao": "VOBL", "name": "Kempegowda International Airport", "city": "Bengaluru", "country": "India", "lat": 13.1986, "lon": 77.7066},
    "HYD": {"iata": "HYD", "icao": "VOHS", "name": "Rajiv Gandhi International Airport", "city": "Hyderabad", "country": "India", "lat": 17.2403, "lon": 78.4294},
    "CCU": {"iata": "CCU", "icao": "VECC", "name": "Netaji Subhash Chandra Bose International Airport", "city": "Kolkata", "country": "India", "lat": 22.6547, "lon": 88.4467},
    "COK": {"iata": "COK", "icao": "VOCI", "name": "Cochin International Airport", "city": "Kochi", "country": "India", "lat": 10.1520, "lon": 76.4019},
    "AMD": {"iata": "AMD", "icao": "VAAH", "name": "Sardar Vallabhbhai Patel International Airport", "city": "Ahmedabad", "country": "India", "lat": 23.0772, "lon": 72.6347},
    "PNQ": {"iata": "PNQ", "icao": "VAPO", "name": "Pune Airport", "city": "Pune", "country": "India", "lat": 18.5821, "lon": 73.9197},
    "CJB": {"iata": "CJB", "icao": "VOCB", "name": "Coimbatore International Airport", "city": "Coimbatore", "country": "India", "lat": 11.0300, "lon": 77.0434},
    "TRZ": {"iata": "TRZ", "icao": "VOTR", "name": "Tiruchirappalli International Airport", "city": "Tiruchirappalli", "country": "India", "lat": 10.7654, "lon": 78.7097},
    "IXM": {"iata": "IXM", "icao": "VOMD", "name": "Madurai Airport", "city": "Madurai", "country": "India", "lat": 9.8345, "lon": 78.0934},
    "JFK": {"iata": "JFK", "icao": "KJFK", "name": "John F. Kennedy International Airport", "city": "New York", "country": "United States", "lat": 40.6413, "lon": -73.7781},
    "LAX": {"iata": "LAX", "icao": "KLAX", "name": "Los Angeles International Airport", "city": "Los Angeles", "country": "United States", "lat": 33.9416, "lon": -118.4085},
    "ORD": {"iata": "ORD", "icao": "KORD", "name": "O'Hare International Airport", "city": "Chicago", "country": "United States", "lat": 41.9742, "lon": -87.9073},
    "ATL": {"iata": "ATL", "icao": "KATL", "name": "Hartsfield-Jackson Atlanta International Airport", "city": "Atlanta", "country": "United States", "lat": 33.6407, "lon": -84.4277},
    "SFO": {"iata": "SFO", "icao": "KSFO", "name": "San Francisco International Airport", "city": "San Francisco", "country": "United States", "lat": 37.6213, "lon": -122.3790}
}

AIRLINE_MASTERS = {
    "6E": {"iata": "6E", "icao": "IGO", "name": "IndiGo", "country": "India"},
    "AI": {"iata": "AI", "icao": "AIC", "name": "Air India", "country": "India"},
    "SG": {"iata": "SG", "icao": "SEJ", "name": "SpiceJet", "country": "India"},
    "QP": {"iata": "QP", "icao": "AKJ", "name": "Akasa Air", "country": "India"},
    "9I": {"iata": "9I", "icao": "LLR", "name": "Alliance Air", "country": "India"},
    "AA": {"iata": "AA", "icao": "AAL", "name": "American Airlines", "country": "United States"},
    "DL": {"iata": "DL", "icao": "DAL", "name": "Delta Air Lines", "country": "United States"},
    "UA": {"iata": "UA", "icao": "UAL", "name": "United Airlines", "country": "United States"}
}

def search_universal_service(query: str = "") -> Dict[str, Any]:
    raw_q = query.strip()
    if not raw_q:
        return {"status": "SUCCESS", "query": "", "normalized_query": "", "total_results": 0, "results": []}

    clean_q = raw_q.upper()
    clean_alphanumeric = re.sub(r"[^A-Z0-9]", "", clean_q)
    results = []

    # 1. Route check (e.g. "MAA DEL", "MAA-DEL")
    parts = re.split(r"[\s\-_]+", clean_q)
    if len(parts) == 2:
        o_candidate, d_candidate = parts[0], parts[1]
        o_m = AIRPORT_MASTERS.get(o_candidate) or next((v for v in AIRPORT_MASTERS.values() if v["city"].upper() == o_candidate), None)
        d_m = AIRPORT_MASTERS.get(d_candidate) or next((v for v in AIRPORT_MASTERS.values() if v["city"].upper() == d_candidate), None)
        if o_m and d_m:
            results.append({
                "type": "ROUTE",
                "id": f"{o_m['iata']}-{d_m['iata']}",
                "title": f"{o_m['city']} ({o_m['iata']}) → {d_m['city']} ({d_m['iata']})",
                "subtitle": "Direct Flight Route",
                "origin": o_m["iata"],
                "destination": d_m["iata"],
                "url": f"/route/{o_m['iata']}/{d_m['iata']}"
            })

    # 2. Airport check
    for code, m in AIRPORT_MASTERS.items():
        if clean_q == code or clean_q == m["icao"] or clean_q == m["city"].upper() or clean_q in m["name"].upper():
            results.append({
                "type": "AIRPORT",
                "id": m["iata"],
                "title": f"{m['name']} ({m['iata']})",
                "subtitle": f"{m['city']}, {m['country']}",
                "code": m["iata"],
                "latitude": m["lat"],
                "longitude": m["lon"],
                "url": f"/airport/{m['iata']}"
            })

    # 3. Airline check
    for code, m in AIRLINE_MASTERS.items():
        if clean_q == code or clean_q == m["icao"] or clean_q in m["name"].upper():
            results.append({
                "type": "AIRLINE",
                "id": m["iata"],
                "title": f"{m['name']} ({m['iata']})",
                "subtitle": f"{m['country']} Carrier",
                "code": m["iata"],
                "url": f"/airline/{m['iata']}"
            })

    # 4. Flight check (Must contain digits to avoid matching plain airline names like "INDIGO")
    if re.match(r"^[A-Z0-9]{3,7}$", clean_alphanumeric) and re.search(r"[0-9]", clean_alphanumeric):
        df = data_repo.query(
            "SELECT * FROM synthetic_flights WHERE UPPER(REPLACE(REPLACE(flight_number, ' ', ''), '-', '')) = ? LIMIT 1",
            [clean_alphanumeric]
        )
        if len(df) > 0:
            row = df.iloc[0]
            f_num = str(row["flight_number"])
            airline_name = str(row["airline"])
            orig = str(row["origin"])
            dest = str(row["destination"])
        else:
            f_num = clean_alphanumeric
            airline_name = "Scheduled Flight"
            orig = "MAA"
            dest = "DEL"

        results.append({
            "type": "FLIGHT",
            "id": f_num,
            "title": f"Flight {f_num} ({airline_name})",
            "subtitle": f"{orig} → {dest}",
            "flight_number": f_num,
            "origin": orig,
            "destination": dest,
            "url": f"/flight/{f_num}"
        })

    return {
        "status": "SUCCESS",
        "query": raw_q,
        "normalized_query": clean_alphanumeric,
        "total_results": len(results),
        "results": results
    }
