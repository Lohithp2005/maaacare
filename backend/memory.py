# memory.py
import json
import os

FILE = "patient_data.json"

def load_data():
    if os.path.exists(FILE):
        with open(FILE, "r") as f:
            return json.load(f)
    return {}

def save_data(data):
    with open(FILE, "w") as f:
        json.dump(data, f)

PATIENT_DATA = load_data()
print(PATIENT_DATA)