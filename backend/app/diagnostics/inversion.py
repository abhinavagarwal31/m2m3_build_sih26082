"""
REAL diagnostic logic. Takes atmospheric inputs from wherever they
come from — mock_inputs.py today, a real pipeline later — and returns
an InversionReading. This module knows nothing about where its inputs
originated.
"""
from typing import Optional
from app.schemas import ValueWithMeta, InversionReading
from app.thresholds import INVERSION_CLASSIFICATION_BANDS, INVERSION_VERTICAL_SPAN_M

VerticalTempProfile = Optional[list[tuple[float, float]]]


def _gradients_c_per_km(vertical_temp_profile: VerticalTempProfile) -> Optional[list[float]]:
    """
    Shared helper for detect_inversion/calculate_strength: sorts the
    profile by height and returns the per-segment temperature gradient
    in °C/km. Returns None if the profile is missing or has fewer than
    two points (a gradient cannot be computed from a single point).
    """
    if not vertical_temp_profile or len(vertical_temp_profile) < 2:
        return None
    sorted_profile = sorted(vertical_temp_profile, key=lambda point: point[0])
    gradients = []
    for (height_lo, temp_lo), (height_hi, temp_hi) in zip(sorted_profile, sorted_profile[1:]):
        height_diff_m = height_hi - height_lo
        if height_diff_m <= 0:
            continue
        gradients.append((temp_hi - temp_lo) / height_diff_m * 1000.0)
    return gradients


def detect_inversion(vertical_temp_profile: VerticalTempProfile) -> Optional[bool]:
    """
    Returns None if the profile is missing/empty — cannot determine.
    Otherwise True if temperature increases with height anywhere in
    the profile (a real inversion signature), False otherwise. False
    is a genuine, real result, distinct from None.
    """
    gradients = _gradients_c_per_km(vertical_temp_profile)
    if gradients is None:
        return None
    return any(gradient > 0 for gradient in gradients)


def calculate_strength(vertical_temp_profile: VerticalTempProfile) -> Optional[float]:
    """
    Returns the max positive temperature gradient (°C/km) found in the
    profile, or None if the profile is missing. A profile with no
    positive gradient (no inversion) is a real, present result of 0.0
    — not None — so it classifies to "None" rather than "cannot determine".
    """
    gradients = _gradients_c_per_km(vertical_temp_profile)
    if gradients is None:
        return None
    positive_gradients = [gradient for gradient in gradients if gradient > 0]
    if not positive_gradients:
        return 0.0
    return round(max(positive_gradients), 2)


def classify_strength(strength: Optional[float]) -> Optional[str]:
    if strength is None:
        return None
    for label, low, high in INVERSION_CLASSIFICATION_BANDS:
        if low <= strength < high:
            return label
    return INVERSION_CLASSIFICATION_BANDS[-1][0]


def build_inversion_reading(
    vertical_temp_profile: VerticalTempProfile,
    explainer_text: str,
) -> InversionReading:
    """
    Builds a single-hour InversionReading. forwardSeries72h is NOT
    populated here — this function only ever sees one hour's profile —
    it's assembled by the caller (main.py) across all 72 hours and set
    on the returned object afterward.
    present=None only if the profile itself is missing (cannot
    determine); present=False is a valid, real result when no
    inversion is detected — these are two different, distinguishable
    outcomes, not the same null state.
    """
    present = detect_inversion(vertical_temp_profile)
    strength = calculate_strength(vertical_temp_profile)
    classification = classify_strength(strength)
    return InversionReading(
        present=present,
        strength=ValueWithMeta(value=strength, unit="°C/km", source="computed"),
        classification=classification,
        verticalSpanM=INVERSION_VERTICAL_SPAN_M,
        explainerText=explainer_text,
        forwardSeries72h=[],
    )
