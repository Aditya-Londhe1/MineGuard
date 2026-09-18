from backend.safety.engine import evaluate_safety


class SensorSample:
    def __init__(self, methane=100, co=10, h2s=2,
                 heart_rate=70, spo2=97, temperature=30,
                 fall_detected=False, sos=False):
        self.methane = methane
        self.co = co
        self.h2s = h2s
        self.heart_rate = heart_rate
        self.spo2 = spo2
        self.temperature = temperature
        self.fall_detected = fall_detected
        self.sos = sos


def test_evaluate_safety_critical_case():
    result = evaluate_safety(SensorSample(
        methane=600,
        co=60,
        h2s=20,
        heart_rate=130,
        spo2=88,
        temperature=41,
        fall_detected=True,
        sos=False,
    ))

    assert result.status == "CRITICAL"
    assert result.risk_score >= 70
    assert "CRITICAL METHANE LEVEL" in result.alerts
    assert "FALL DETECTED" in result.alerts


def test_evaluate_safety_warning_case():
    result = evaluate_safety(SensorSample(
        methane=300,
        co=30,
        h2s=8,
        heart_rate=100,
        spo2=92,
        temperature=34,
        fall_detected=False,
        sos=False,
    ))

    assert result.status == "WARNING"
    assert 30 <= result.risk_score < 70
    assert "HIGH METHANE LEVEL" in result.alerts or "ELEVATED CO" in result.alerts


def test_evaluate_safety_safe_case():
    result = evaluate_safety(SensorSample(
        methane=90,
        co=12,
        h2s=2,
        heart_rate=72,
        spo2=97,
        temperature=30,
        fall_detected=False,
        sos=False,
    ))

    assert result.status == "SAFE"
    assert result.risk_score < 30
    assert result.alerts == []