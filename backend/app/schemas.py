from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel

Provenance = Literal["computed", "external"]


class Bootstrap(BaseModel):
    """
    Establishes the application's initial state on frontend startup —
    the authoritative server "now" and a default location — so the
    first render never has to guess at a starting hour from the
    browser clock, and diagnostics/forecast queries have a real hour
    to key on immediately.
    """
    serverNowIso: str
    defaultLocation: str


class ValueWithMeta(BaseModel):
    value: Optional[float] = None
    unit: Optional[str] = None
    source: Provenance


TrappingCategory = Literal["Low", "Moderate", "High", "Severe"]


class VentilationReading(BaseModel):
    """
    ventilationIndex = wind_speed_10m x boundary_layer_height (m^2/s).
    Higher = better ventilation, lower = weaker ventilation / stronger
    trapping — the OPPOSITE direction from the old placeholder trapping
    index. category/interpretation are typed and present but always
    None until the team supplies a real VI-to-category mapping (see
    ventilation.py::map_vi_to_trapping_category).
    """
    ventilationIndex: ValueWithMeta
    category: Optional[TrappingCategory] = None
    interpretation: Optional[str] = None
    windSpeedMs: ValueWithMeta
    boundaryLayerHeightM: ValueWithMeta
    typicalBoundaryLayerHeightM: ValueWithMeta


InversionClass = Literal["None", "Weak", "Moderate", "Strong"]


class InversionSeriesPoint(BaseModel):
    hourIso: str
    strengthCPerKm: Optional[float] = None
    classification: Optional[InversionClass] = None


class InversionReading(BaseModel):
    present: Optional[bool] = None
    strength: ValueWithMeta
    classification: Optional[InversionClass] = None
    verticalSpanM: tuple[float, float]
    explainerText: str
    forwardSeries72h: list[InversionSeriesPoint]


class VentilationSeriesPoint(BaseModel):
    hourIso: str
    ventilationIndex: Optional[float] = None
    category: Optional[str] = None


class RecoveryEstimate(BaseModel):
    withinWindow: bool
    estimatedDay: Optional[str] = None
    estimatedPartOfDay: Optional[Literal["Morning", "Afternoon", "Evening", "Night"]] = None
    driver: Optional[str] = None
    uncertaintyNote: Optional[str] = None


class M2Diagnostics(BaseModel):
    location: str
    hourIso: str
    serverNowIso: str
    ventilation: VentilationReading
    ventilationRecoveryThreshold: float
    ventilationSeries72h: list[VentilationSeriesPoint]
    inversion: InversionReading
    recovery: RecoveryEstimate


PollutantCategory = Literal["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]


class CategoryBand(BaseModel):
    label: PollutantCategory
    min: float
    max: float


class PollutantReading(BaseModel):
    reading: ValueWithMeta
    category: Optional[PollutantCategory] = None
    timestampIso: str


class PollutantSeriesPoint(BaseModel):
    hourIso: str
    pm25: Optional[float] = None
    ozone: Optional[float] = None


class PollutantPeak(BaseModel):
    hourIso: str
    value: float


class M3Forecast(BaseModel):
    location: str
    hourIso: str
    pm25: PollutantReading
    ozone: PollutantReading
    series72h: list[PollutantSeriesPoint]
    pm25Peak: PollutantPeak
    ozonePeak: PollutantPeak
    pm25Bands: list[CategoryBand]
    ozoneBands: list[CategoryBand]
