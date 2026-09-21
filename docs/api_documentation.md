# SKYHOUR REST API Documentation & Contract Specification

> **Version**: `1.2.0`  
> **Base URL**: `http://localhost:8000`  
> **Model Backend**: Frozen XGBoost Pre-Flight Flight Delay Classifier (`models/skyhour_delay_model.rds`)

---

## 1. Frozen API Contract Specification

Before building frontend or third-party integrations, the Skyhour REST API communication contract is strictly frozen:

### Prediction Request Payload Schema (`POST /predict`)

```json
{
  "airline": "AA",
  "origin": "JFK",
  "destination": "LAX",
  "scheduled_departure": "2026-09-10 14:30:00",
  "scheduled_arrival": "2026-09-10 18:00:00",
  "distance": 2475
}
```

#### Request Fields Breakdown

| Field Name | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `airline` | String | **Yes** | 2 or 3 letter IATA marketing carrier code | `"AA"`, `"DL"`, `"UA"` |
| `origin` | String | **Yes** | 3-letter IATA origin airport code | `"JFK"`, `"ATL"`, `"ORD"` |
| `destination` | String | **Yes** | 3-letter IATA destination airport code | `"LAX"`, `"SFO"`, `"MIA"` |
| `scheduled_departure` | String | **Yes** | Scheduled departure date & time (`YYYY-MM-DD HH:MM:SS`) | `"2026-09-10 14:30:00"` |
| `scheduled_arrival` | String | **Yes** | Scheduled arrival date & time (`YYYY-MM-DD HH:MM:SS`) | `"2026-09-10 18:00:00"` |
| `distance` | Numeric | Optional | Route distance in miles (auto-computed via Haversine if omitted) | `2475` |

---

### Prediction Response Payload Schema (`200 OK`)

```json
{
  "prediction": "DELAY",
  "delay_probability": 0.631,
  "delay_percentage": 63.1,
  "threshold": 0.5,
  "model_version": "1.2.0"
}
```

#### Response Fields Breakdown

| Field Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `prediction` | String | Classification output label (`"DELAY"` or `"ON-TIME"`) based on frozen threshold `0.50` | `"DELAY"` |
| `delay_probability` | Numeric | Model probability of 15+ minute arrival delay (0.000 to 1.000) | `0.631` |
| `delay_percentage` | Numeric | Model delay risk probability expressed as percentage (0.0% to 100.0%) | `63.1` |
| `threshold` | Numeric | Frozen operational classification decision threshold | `0.5` |
| `model_version` | String | Pipeline version tag | `"1.2.0"` |

---

## 2. API Endpoints Reference

### 1. Health Check Endpoint
- **URL**: `/health`
- **Method**: `GET`
- **Response Example**:
```json
{
  "status": "UP",
  "service": "Skyhour Flight Delay Prediction API",
  "model_version": "1.2.0",
  "timestamp": "2026-09-10 16:40:00 UTC"
}
```

---

### 2. Model Information Endpoint
- **URL**: `/model-info`
- **Method**: `GET`
- **Response Example**:
```json
{
  "model_name": "Skyhour Pre-Flight Delay Classifier",
  "model_version": "1.2.0",
  "dataset": "Combined_Flights_2022.parquet",
  "decision_threshold": 0.5,
  "performance": {
    "roc_auc": 0.6274,
    "pr_auc": 0.3072,
    "brier_score": 0.2464,
    "accuracy": 0.597,
    "precision": 0.3182,
    "recall": 0.631,
    "specificity": 0.5867,
    "f1_score": 0.4231
  }
}
```

---

### 3. Prediction Endpoint
- **URL**: `/predict`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`

---

## 3. Error Response Specifications

### Validation Error (`400 Bad Request`)
Returned when required fields are missing or formats are invalid:
```json
{
  "error": "Validation Error",
  "message": "Missing required field(s): scheduled_departure"
}
```

### Internal Error (`500 Internal Server Error`)
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred during prediction inference..."
}
```

---

## 4. Testing Examples (cURL & PowerShell)

### Example 1: cURL Test Request
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{
           "airline": "AA",
           "origin": "JFK",
           "destination": "LAX",
           "scheduled_departure": "2026-09-10 14:30:00",
           "scheduled_arrival": "2026-09-10 18:00:00",
           "distance": 2475
         }'
```

### Example 2: PowerShell Test Request
```powershell
$body = @{
    airline = "AA"
    origin = "JFK"
    destination = "LAX"
    scheduled_departure = "2026-09-10 14:30:00"
    scheduled_arrival = "2026-09-10 18:00:00"
    distance = 2475
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/predict" -Method Post -Body $body -ContentType "application/json"
```
