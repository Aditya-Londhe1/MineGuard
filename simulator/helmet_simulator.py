import random
import time
import requests

from datetime import datetime, timezone


API_URL = "http://127.0.0.1:8000/api/sensor-data"
WORKER_IDS = ["W001", "W002", "W003", "W004", "W005"]


def generate_sensor_data(worker_id=None):
    if worker_id is None:
        worker_id = random.choice(WORKER_IDS)

    zone_options = ["Zone A", "Zone B", "Zone C", "Zone D"]

    return {
        "worker_id": worker_id,
        "heart_rate": random.randint(65, 120),
        "spo2": round(random.uniform(88, 100), 1),
        "temperature": round(random.uniform(25, 41), 1),
        "humidity": round(random.uniform(35, 80), 1),
        "methane": round(random.uniform(80, 220), 1),
        "co": round(random.uniform(5, 60), 1),
        "h2s": round(random.uniform(1, 20), 1),
        "fall_detected": random.choice([False, False, False, True]),
        "sos": random.choice([False, False, True]),
        "zone": random.choice(zone_options),
        "battery": round(random.uniform(50, 100), 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def send_sensor_update(worker_id):
    data = generate_sensor_data(worker_id)

    try:
        response = requests.post(
            API_URL,
            json=data,
            timeout=5,
        )

        print(f"\nHelmet {data['worker_id']}")
        print("Heart Rate:", data["heart_rate"])
        print("SpO2:", data["spo2"])
        print("Temperature:", data["temperature"])
        print("Methane:", data["methane"])
        print("CO:", data["co"])
        print("H2S:", data["h2s"])
        print("Zone:", data["zone"])
        print("Battery:", data["battery"])
        print("API:", response.status_code)

        if not response.ok:
            print("ERROR:", response.text)
            return

        result = response.json()
        print("STATUS:", result.get("status"))
        print("RISK:", result.get("risk_score"))
        print("ALERTS:", result.get("alerts"))

    except requests.exceptions.RequestException as error:
        print(f"Connection error for {worker_id}: {error}")


if __name__ == "__main__":
    worker_index = 0

    # Each worker reports every ~5s (5 workers x 1s cycle) so the
    # dashboard's 10s no-data threshold is never crossed while live.
    while True:
        worker_id = WORKER_IDS[worker_index % len(WORKER_IDS)]
        send_sensor_update(worker_id)
        worker_index += 1
        time.sleep(1)