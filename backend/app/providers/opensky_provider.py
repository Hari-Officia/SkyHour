import time
import httpx
from typing import Optional, Dict, Any, List
from backend.app.config.settings import settings
from backend.app.config.logging import logger

class OpenSkyProvider:
    def __init__(self):
        self.auth_url = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
        self.api_url = "https://opensky-network.org/api/states/all"
        self.token: Optional[str] = None
        self.expires_at: float = 0.0

    async def get_token(self) -> Optional[str]:
        if not settings.opensky_client_id or not settings.opensky_client_secret:
            return None
        
        now = time.time()
        if self.token and now < (self.expires_at - 60):
            return self.token
            
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    self.auth_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": settings.opensky_client_id,
                        "client_secret": settings.opensky_client_secret
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    self.token = data.get("access_token")
                    expires_in = data.get("expires_in", 1800)
                    self.expires_at = now + expires_in
                    logger.info("OpenSky OAuth2 token acquired successfully.")
                    return self.token
        except Exception as e:
            logger.warning(f"OpenSky OAuth token error: {str(e)}")
        return None

    async def fetch_states(self) -> Dict[str, Any]:
        token = await self.get_token()
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(self.api_url, headers=headers)
                if resp.status_code == 200:
                    raw = resp.json()
                    raw_states = raw.get("states") or []
                    parsed_states = []
                    for s in raw_states[:50]:
                        if len(s) >= 11 and s[5] is not None and s[6] is not None:
                            parsed_states.append({
                                "icao24": str(s[0]).strip(),
                                "callsign": str(s[1]).strip() if s[1] else "N/A",
                                "country": str(s[2]).strip() if s[2] else "",
                                "longitude": float(s[5]),
                                "latitude": float(s[6]),
                                "baro_altitude_m": float(s[7]) if s[7] is not None else 0.0,
                                "velocity_ms": float(s[9]) if s[9] is not None else 0.0,
                                "true_track_deg": float(s[10]) if s[10] is not None else 0.0,
                                "status": "AIRBORNE" if not s[8] else "GROUND",
                                "is_demo": False
                            })
                    return {"status": "SUCCESS", "is_demo": False, "states": parsed_states}
        except Exception as e:
            logger.warning(f"OpenSky fetch states exception: {str(e)}")
            
        return {"status": "UNAVAILABLE", "is_demo": True, "states": []}

opensky_provider = OpenSkyProvider()
