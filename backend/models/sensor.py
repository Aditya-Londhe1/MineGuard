from pydantic import BaseModel
from datetime import datetime


class SensorData(BaseModel):

    device_id: str | None = None

    worker_id: str

    heart_rate: float | None = None
    spo2: float | None = None

    temperature: float
    humidity: float

    methane: float
    co: float | None = None
    h2s: float | None = None

    fall_detected: bool
    sos: bool

    zone: str

    battery: float | None = None

    latitude: float | None = None
    longitude: float | None = None
    gps_altitude: float | None = None
    gps_satellites: int | None = None
    gps_valid: bool = False

    timestamp: datetime