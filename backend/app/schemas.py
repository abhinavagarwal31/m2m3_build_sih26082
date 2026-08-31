from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel

Provenance = Literal["computed", "external"]


class ValueWithMeta(BaseModel):
    value: Optional[float] = None
    unit: Optional[str] = None
    source: Provenance


TrappingCategory = Literal["Low", "Moderate", "High", "Severe"]


class TrappingReading(BaseModel):
    index: ValueWithMeta
    category: Optional[TrappingCategory] = None
    interpretation: Optional[str] = None
    mixingDepthM: ValueWithMeta
    windSpeedMs: ValueWithMeta
    typicalMixingDepthM: ValueWithMeta


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


class TrappingSeriesPoint(BaseModel):
    hourIso: str
    trappingIndex: Optional[float] = None
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
    trapping: TrappingReading
    trappingThresholdIndex: float
    trappingSeries72h: list[TrappingSeriesPoint]
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
