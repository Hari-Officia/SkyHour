import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.search_normalization import parse_time_window, normalize_code

client = TestClient(app)

def test_time_window_parser():
    assert parse_time_window("MORNING") == (6, 11, "MORNING")
    assert parse_time_window("AFTERNOON") == (12, 16, "AFTERNOON")
    assert parse_time_window("EVENING") == (17, 20, "EVENING")
    assert parse_time_window("NIGHT") == (21, 23, "NIGHT")
    assert parse_time_window("MIDNIGHT") == (0, 5, "MIDNIGHT")
    assert parse_time_window("ANY") == (0, 23, "ANY")

def test_code_normalization():
    assert normalize_code("maa ") == "MAA"
    assert normalize_code("del") == "DEL"
    assert normalize_code(" AI-302 ") == "AI302"

def test_date_flight_search_api():
    response = client.get("/flights/search?origin=MAA&destination=DEL&date=2026-09-23&time_window=MORNING")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data
    assert "flights" in json_data["data"]
    assert len(json_data["data"]["flights"]) > 0
    flight = json_data["data"]["flights"][0]
    assert "flight_number" in flight
    assert "predicted_delay_probability" in flight
    assert flight["risk_level"] in ["LOW", "MEDIUM", "HIGH"]

def test_calendar_risk_api():
    response = client.get("/flights/calendar?origin=MAA&destination=DEL&date=2026-09-23")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert len(json_data["days"]) == 7

def test_time_risk_matrix_api():
    response = client.get("/flights/time-risk?origin=MAA&destination=DEL&date=2026-09-23")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert len(json_data["time_windows"]) == 5

def test_flight_comparison_api():
    response = client.get("/flights/compare?flight_ids=AI302,6E204&date=2026-09-23")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True

def test_map_flights_api():
    response = client.get("/map/flights?origin=MAA&destination=DEL&date=2026-09-23")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "SUCCESS"
    assert "aircraft" in json_data
