#!/usr/bin/env python3
import requests
import json

# Test the configuration endpoint
base_url = "http://localhost:5000"

print("Testing configuration endpoints...")

# First test GET
try:
    response = requests.get(f"{base_url}/api/config")
    print(f"GET /api/config: {response.status_code}")
    if response.status_code == 200:
        print(f"Current config: {response.json()}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"GET request failed: {e}")

# Test PUT with simple data
try:
    test_data = {
        "test_setting": "test_value",
        "timestamp": "2025-08-25T22:35:00"
    }
    
    response = requests.put(
        f"{base_url}/api/config",
        headers={"Content-Type": "application/json"},
        data=json.dumps(test_data)
    )
    
    print(f"PUT /api/config: {response.status_code}")
    if response.status_code == 200:
        print(f"Success: {response.json()}")
    else:
        print(f"Error response: {response.text}")
        print(f"Headers: {response.headers}")
        
except Exception as e:
    print(f"PUT request failed: {e}")
