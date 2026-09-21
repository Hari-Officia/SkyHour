import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Skyhour Airline Flight Intelligence & Delay Prediction API"
    app_version: str = "2.0.0"
    debug: bool = False
    port: int = 8100
    host: str = "127.0.0.1"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "http://127.0.0.1:8000"]
    
    opensky_client_id: str = os.getenv("OPENSKY_CLIENT_ID", "")
    opensky_client_secret: str = os.getenv("OPENSKY_CLIENT_SECRET", "")
    weather_api_key: str = os.getenv("WEATHER_API_KEY", "")
    
    project_root: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
