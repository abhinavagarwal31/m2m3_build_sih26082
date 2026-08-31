from typing import Optional

from fastapi import FastAPI, HTTPException

from app import mock_inputs
from app.diagnostics import inversion, recovery, trapping
from app.schemas import (
    CategoryBand,
    InversionSeriesPoint,
    M2Diagnostics,
    M3Forecast,
    PollutantPeak,
    PollutantReading,
    PollutantSeriesPoint,
    TrappingSeriesPoint,
    ValueWithMeta,
)
from app.thresholds import (
    INVERSION_EXPLAINER_TEXT,
    OZONE_BANDS,
    PM25_BANDS,
    TRAPPING_SEALED_THRESHOLD,
)

app = FastAPI()


@app.get("/")
def health_check():
    return {"status": "ok"}


def _require_known_location(location: str) -> None:
    if location not in mock_inputs.get_locations():
        raise HTTPException(status_code=404, detail=f"Unknown location: {location}")


def _require_known_hour(hour: str) -> None:
    if hour not in mock_inputs.get_hours_iso():
        raise HTTPException(status_code=404, detail=f"Unknown hour: {hour}")


def _classify_pollutant(value: Optional[float], bands: list[dict]) -> Optional[str]:
    if value is None:
        return None
    for band in bands:
        if band["min"] <= value < band["max"]:
            return band["label"]
    return bands[-1]["label"]


def _category_bands(bands: list[dict]) -> list[CategoryBand]:
    return [CategoryBand(label=band["label"], min=band["min"], max=band["max"]) for band in bands]


@app.get("/api/v1/locations")
def get_locations() -> list[str]:
    return mock_inputs.get_locations()


@app.get("/api/v1/diagnostics", response_model=M2Diagnostics)
def get_diagnostics(location: str, hour: str) -> M2Diagnostics:
    _require_known_location(location)
    _require_known_hour(hour)

    hours = mock_inputs.get_hours_iso()
    typical_mixing_depth_m = mock_inputs.get_typical_mixing_depth_m(location)

    trapping_by_hour = {}
    inversion_by_hour = {}
    trapping_series: list[TrappingSeriesPoint] = []
    inversion_series: list[InversionSeriesPoint] = []

    for hour_iso in hours:
        inputs = mock_inputs.get_hourly_inputs(location, hour_iso)

        trapping_reading = trapping.build_trapping_reading(
            inputs["mixing_depth_m"], inputs["wind_speed_ms"], typical_mixing_depth_m
        )
        trapping_by_hour[hour_iso] = trapping_reading
        trapping_series.append(
            TrappingSeriesPoint(
                hourIso=hour_iso,
                trappingIndex=trapping_reading.index.value,
                category=trapping_reading.category,
            )
        )

        inversion_reading = inversion.build_inversion_reading(
            inputs["vertical_temp_profile"], INVERSION_EXPLAINER_TEXT
        )
        inversion_by_hour[hour_iso] = inversion_reading
        inversion_series.append(
            InversionSeriesPoint(
                hourIso=hour_iso,
                strengthCPerKm=inversion_reading.strength.value,
                classification=inversion_reading.classification,
            )
        )

    crossing_hour_iso = recovery.find_threshold_crossing(trapping_series, TRAPPING_SEALED_THRESHOLD)
    recovery_estimate = recovery.build_recovery_estimate(crossing_hour_iso)

    current_inversion = inversion_by_hour[hour].model_copy(
        update={"forwardSeries72h": inversion_series}
    )

    return M2Diagnostics(
        location=location,
        hourIso=hour,
        serverNowIso=mock_inputs.get_server_now_iso(),
        trapping=trapping_by_hour[hour],
        trappingThresholdIndex=TRAPPING_SEALED_THRESHOLD,
        trappingSeries72h=trapping_series,
        inversion=current_inversion,
        recovery=recovery_estimate,
    )


@app.get("/api/v1/forecast", response_model=M3Forecast)
def get_forecast(location: str, hour: str) -> M3Forecast:
    _require_known_location(location)
    _require_known_hour(hour)

    hours = mock_inputs.get_hours_iso()
    series: list[PollutantSeriesPoint] = []
    pm25_at_hour: Optional[float] = None
    ozone_at_hour: Optional[float] = None
    pm25_peak: Optional[tuple[str, float]] = None
    ozone_peak: Optional[tuple[str, float]] = None

    for hour_iso in hours:
        inputs = mock_inputs.get_hourly_inputs(location, hour_iso)
        pm25_value = inputs["pm25"]
        ozone_value = inputs["ozone"]
        series.append(PollutantSeriesPoint(hourIso=hour_iso, pm25=pm25_value, ozone=ozone_value))

        if pm25_value is not None and (pm25_peak is None or pm25_value > pm25_peak[1]):
            pm25_peak = (hour_iso, pm25_value)
        if ozone_value is not None and (ozone_peak is None or ozone_value > ozone_peak[1]):
            ozone_peak = (hour_iso, ozone_value)

        if hour_iso == hour:
            pm25_at_hour = pm25_value
            ozone_at_hour = ozone_value

    return M3Forecast(
        location=location,
        hourIso=hour,
        pm25=PollutantReading(
            reading=ValueWithMeta(value=pm25_at_hour, unit="µg/m³", source="external"),
            category=_classify_pollutant(pm25_at_hour, PM25_BANDS),
            timestampIso=hour,
        ),
        ozone=PollutantReading(
            reading=ValueWithMeta(value=ozone_at_hour, unit="µg/m³", source="external"),
            category=_classify_pollutant(ozone_at_hour, OZONE_BANDS),
            timestampIso=hour,
        ),
        series72h=series,
        pm25Peak=PollutantPeak(hourIso=pm25_peak[0], value=pm25_peak[1]),
        ozonePeak=PollutantPeak(hourIso=ozone_peak[0], value=ozone_peak[1]),
        pm25Bands=_category_bands(PM25_BANDS),
        ozoneBands=_category_bands(OZONE_BANDS),
    )
