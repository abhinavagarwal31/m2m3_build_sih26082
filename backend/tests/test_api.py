from fastapi.testclient import TestClient

from app import mock_inputs
from app.main import app
from app.schemas import M2Diagnostics, M3Forecast

client = TestClient(app)


def _hours():
    return mock_inputs.get_hours_iso()


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_bootstrap():
    response = client.get("/api/v1/bootstrap")
    assert response.status_code == 200
    body = response.json()
    assert body["serverNowIso"] == mock_inputs.get_server_now_iso()
    assert body["defaultLocation"] == mock_inputs.get_locations()[0]


def test_locations():
    response = client.get("/api/v1/locations")
    assert response.status_code == 200
    assert response.json() == ["Anand Vihar", "RK Puram", "Rohini"]


def test_diagnostics_valid_location_and_hour_validates_against_schema():
    hour = _hours()[0]
    response = client.get("/api/v1/diagnostics", params={"location": "Anand Vihar", "hour": hour})
    assert response.status_code == 200
    M2Diagnostics.model_validate(response.json())


def test_diagnostics_unknown_location_returns_404():
    response = client.get(
        "/api/v1/diagnostics", params={"location": "Nowhere", "hour": _hours()[0]}
    )
    assert response.status_code == 404
    assert "Unknown location" in response.json()["detail"]


def test_diagnostics_unknown_hour_returns_404():
    response = client.get(
        "/api/v1/diagnostics",
        params={"location": "Anand Vihar", "hour": "1999-01-01T00:00:00+00:00"},
    )
    assert response.status_code == 404
    assert "Unknown hour" in response.json()["detail"]


def test_diagnostics_null_ventilation_input_case():
    hour = _hours()[10]
    response = client.get("/api/v1/diagnostics", params={"location": "Rohini", "hour": hour})
    assert response.status_code == 200
    body = response.json()
    assert body["ventilation"]["ventilationIndex"]["value"] is None
    assert body["ventilation"]["category"] is None
    assert body["ventilation"]["interpretation"] is None


def test_diagnostics_recovery_case():
    hour = _hours()[0]
    response = client.get(
        "/api/v1/diagnostics", params={"location": "Anand Vihar", "hour": hour}
    )
    assert response.status_code == 200
    assert response.json()["recovery"]["withinWindow"] is True


def test_diagnostics_no_recovery_case():
    hour = _hours()[0]
    response = client.get("/api/v1/diagnostics", params={"location": "RK Puram", "hour": hour})
    assert response.status_code == 200
    body = response.json()
    assert body["recovery"]["withinWindow"] is False
    assert body["recovery"]["estimatedDay"] is None


def test_forecast_valid_location_and_hour_validates_against_schema():
    hour = _hours()[0]
    response = client.get("/api/v1/forecast", params={"location": "RK Puram", "hour": hour})
    assert response.status_code == 200
    M3Forecast.model_validate(response.json())


def test_forecast_unknown_location_returns_404():
    response = client.get("/api/v1/forecast", params={"location": "Nowhere", "hour": _hours()[0]})
    assert response.status_code == 404
    assert "Unknown location" in response.json()["detail"]


def test_forecast_unknown_hour_returns_404():
    response = client.get(
        "/api/v1/forecast",
        params={"location": "RK Puram", "hour": "1999-01-01T00:00:00+00:00"},
    )
    assert response.status_code == 404


def test_forecast_pm25_null_while_ozone_exists():
    hour = _hours()[5]
    response = client.get("/api/v1/forecast", params={"location": "RK Puram", "hour": hour})
    assert response.status_code == 200
    body = response.json()
    assert body["pm25"]["reading"]["value"] is None
    assert body["pm25"]["category"] is None
    assert body["ozone"]["reading"]["value"] is not None
    assert body["ozone"]["category"] is not None


def test_forecast_peaks_match_actual_series_max():
    hour = _hours()[0]
    response = client.get(
        "/api/v1/forecast", params={"location": "Anand Vihar", "hour": hour}
    )
    body = response.json()
    pm25_values = [p["pm25"] for p in body["series72h"] if p["pm25"] is not None]
    ozone_values = [p["ozone"] for p in body["series72h"] if p["ozone"] is not None]
    assert body["pm25Peak"]["value"] == max(pm25_values)
    assert body["ozonePeak"]["value"] == max(ozone_values)
