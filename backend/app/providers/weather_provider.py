import httpx
from typing import Dict, Any
from datetime import datetime, timezone
from backend.app.config.logging import logger

ICAO_MAP = {
    "MAA": "VOMM", "DEL": "VIDP", "BOM": "VABB", "BLR": "VOBL",
    "HYD": "VOHS", "CCU": "VECC", "COK": "VOCI", "AMD": "VAAH",
    "PNQ": "VAPO", "TRZ": "VOTR", "IXM": "VOMD", "CJB": "VOCB"
}

class WeatherProvider:
    async def get_metar(self, airport_code: str) -> Dict[str, Any]:
        clean_code = airport_code.upper().strip()
        icao = ICAO_MAP.get(clean_code, f"VO{clean_code}" if len(clean_code) == 2 else clean_code)
        
        url = f"https://aviationweather.gov/api/data/metar?ids={icao}&format=json"
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and len(data) > 0:
                        obs = data[0]
                        return {
                            "status": "SUCCESS",
                            "source": "AviationWeather.gov METAR",
                            "station": icao,
                            "observed_at": obs.get("receiptTime", int(datetime.now(timezone.utc).timestamp())),
                            "raw_metar": obs.get("rawOb", f"METAR {icao} NOSIG"),
                            "temperature_c": float(obs.get("temp", 31)),
                            "dewpoint_c": float(obs.get("dewp", 24)),
                            "wind_speed_kt": float(obs.get("wspd", 8)),
                            "wind_dir_deg": float(obs.get("wdir", 180)),
                            "visibility_miles": float(obs.get("visib", 5.0)),
                            "flight_category": obs.get("cover", "VFR"),
                            "weather_condition": obs.get("wx", "NSW"),
                            "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                        }
        except Exception as e:
            logger.warning(f"METAR weather fetch failed for {icao}: {str(e)}")
            
        return {
            "status": "FALLBACK",
            "source": "Skyhour Synthetic Weather Engine",
            "station": icao,
            "raw_metar": f"METAR {icao} 201100Z 18008KT 5000 HZ FEW030 31/24 Q1008 NOSIG",
            "temperature_c": 31.0,
            "dewpoint_c": 24.0,
            "wind_speed_kt": 8.0,
            "wind_dir_deg": 180.0,
            "visibility_miles": 5.0,
            "flight_category": "VFR",
            "weather_condition": "HZ",
            "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        }

weather_provider = WeatherProvider()
