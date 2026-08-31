"""
REAL diagnostic logic. Takes atmospheric inputs from wherever they
come from — mock_inputs.py today, a real pipeline later — and returns
a TrappingReading. This module knows nothing about where its inputs
originated.
"""
from typing import Optional
from app.schemas import ValueWithMeta, TrappingReading
from app.thresholds import TRAPPING_CATEGORY_BANDS, TRAPPING_INTERPRETATIONS


def calculate_index(
    mixing_depth_m: Optional[float], wind_speed_ms: Optional[float]
) -> Optional[float]:
    """
    formula_v0 — TEMPORARY placeholder, not the final scientific
    formulation. Isolated here so it can be replaced without touching
    classify_index, interpret_index, or anything downstream.
    Returns None if either input is None or non-positive — never
    compute from a partial or invalid input.
    """
    if mixing_depth_m is None or wind_speed_ms is None:
        return None
    if mixing_depth_m <= 0 or wind_speed_ms <= 0:
        return None
    raw = 1.0 / (mixing_depth_m * wind_speed_ms)
    scaled = min(raw * 4000, 10.0)  # placeholder normalization to a 0-10 scale
    return round(scaled, 2)


def classify_index(index: Optional[float]) -> Optional[str]:
    if index is None:
        return None
    for label, low, high in TRAPPING_CATEGORY_BANDS:
        if low <= index < high:
            return label
    return TRAPPING_CATEGORY_BANDS[-1][0]


def interpret_index(category: Optional[str]) -> Optional[str]:
    if category is None:
        return None
    return TRAPPING_INTERPRETATIONS.get(category)


def build_trapping_reading(
    mixing_depth_m: Optional[float],
    wind_speed_ms: Optional[float],
    typical_mixing_depth_m: float,
) -> TrappingReading:
    index = calculate_index(mixing_depth_m, wind_speed_ms)
    category = classify_index(index)
    interpretation = interpret_index(category)
    return TrappingReading(
        index=ValueWithMeta(value=index, unit="index (0-10)", source="computed"),
        category=category,
        interpretation=interpretation,
        # mixing depth and wind are themselves external-forecast inputs,
        # not something this product computed — provenance matters here too
        mixingDepthM=ValueWithMeta(value=mixing_depth_m, unit="m", source="external"),
        windSpeedMs=ValueWithMeta(value=wind_speed_ms, unit="m/s", source="external"),
        typicalMixingDepthM=ValueWithMeta(
            value=typical_mixing_depth_m, unit="m", source="external"
        ),
    )
