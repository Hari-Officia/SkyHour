import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["version"] == "2.0.0"

def test_search():
    response = client.get("/search?q=maa")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert len(data["results"]) >= 1
    assert data["results"][0]["type"] == "AIRPORT"
    assert data["results"][0]["code"] == "MAA"

def test_flight_intelligence():
    response = client.get("/flight/AI302")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["flight_summary"]["flight_number"] == "AI302"
    assert "prediction" in data

def test_airport_intelligence():
    response = client.get("/airport/MAA")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["airport"]["iata"] == "MAA"
    assert data["risk_assessment"]["risk_score"] > 0

def test_route_intelligence():
    response = client.get("/route/MAA/DEL")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["route"]["origin"] == "MAA"
    assert data["route"]["destination"] == "DEL"

def test_airline_intelligence():
    response = client.get("/airline/6E")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["airline"]["iata"] == "6E"

def test_prediction():
    response = client.get("/prediction/flight/AI302?departure_hour=18")
    assert response.status_code == 200
    data = response.json()
    assert data["delay_probability"] > 0
    assert "model_metadata" in data

def test_map_data():
    response = client.get("/map/data")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert len(data["airports"]) >= 5
    assert len(data["routes"]) >= 2

def test_india_overview():
    response = client.get("/india/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_airports"] >= 60

def test_india_what_if():
    response = client.post("/india/what-if", json={"airport_iata": "MAA", "traffic_delta_pct": 20.0, "weather_delta_pct": 10.0})
    assert response.status_code == 200
    data = response.json()
    assert data["airport_iata"] == "MAA"
    assert "risk_delta" in data
