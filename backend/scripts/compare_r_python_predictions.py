import httpx
import json
import asyncio

async def compare_predictions():
    r_base = "http://127.0.0.1:8000"
    py_base = "http://127.0.0.1:8100"
    
    test_cases = [
        ("AI302", "MAA", "DEL", "AI", 6),
        ("AI302", "MAA", "DEL", "AI", 12),
        ("AI302", "MAA", "DEL", "AI", 18),
        ("6E1234", "BOM", "DEL", "6E", 8),
        ("6E502", "BLR", "MAA", "6E", 14),
        ("SG812", "MAA", "CJB", "SG", 10),
        ("QP110", "BOM", "AMD", "QP", 16),
        ("AI101", "DEL", "BLR", "AI", 20)
    ]
    
    print("============================================================")
    print("   SKYHOUR: R VS PYTHON ML PREDICTION EQUIVALENCE SUITE    ")
    print("============================================================")
    
    passed = 0
    total = len(test_cases)
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for flight_id, origin, dest, carrier, dep_hour in test_cases:
            path = f"/prediction/flight/{flight_id}?origin={origin}&destination={dest}&carrier={carrier}&departure_hour={dep_hour}"
            try:
                r_resp = await client.get(f"{r_base}{path}")
                py_resp = await client.get(f"{py_base}{path}")
                
                if r_resp.status_code == 200 and py_resp.status_code == 200:
                    r_data = r_resp.json()
                    py_data = py_resp.json()
                    
                    r_prob_val = r_data.get("delay_probability", 0.0)
                    py_prob_val = py_data.get("delay_probability", 0.0)
                    
                    r_prob = float(r_prob_val[0] if isinstance(r_prob_val, list) else r_prob_val)
                    py_prob = float(py_prob_val[0] if isinstance(py_prob_val, list) else py_prob_val)
                    
                    diff = abs(r_prob - py_prob)
                    match = diff < 0.05  # Within 5% probability margin of equivalence
                    
                    status = "PASSED" if match else "FAILED"
                    print(f"[{flight_id} @ {dep_hour:02d}:00] R Prob: {r_prob:.4f} | Py Prob: {py_prob:.4f} | Diff: {diff:.6f} ... {status}")
                    if match:
                        passed += 1
                else:
                    print(f"[{flight_id}] Status Code Error: R={r_resp.status_code}, Py={py_resp.status_code}")
            except Exception as e:
                print(f"[{flight_id}] Exception: {str(e)}")
                
    print("============================================================")
    print(f"SUMMARY: Total: {total} | Passed: {passed} | Failed: {total - passed}")
    print("============================================================")
    if passed == total:
        print("PREDICTION EQUIVALENCE VERIFIED 100%!")

if __name__ == "__main__":
    asyncio.run(compare_predictions())
