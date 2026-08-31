"""
REAL diagnostic logic. Takes atmospheric inputs from wherever they
come from — mock_inputs.py today, a real pipeline later — and returns
a VentilationReading. This module knows nothing about where its inputs
originated.

Replaces the old formula_v0 "trapping index" (a 0-10, higher-is-more-
trapped placeholder). The team-supplied Ventilation Index is a
DIFFERENT physical quantity with the OPPOSITE direction: higher VI
means BETTER ventilation (easier pollutant dispersion), lower VI means
WEAKER ventilation (stronger atmospheric trapping). Nothing here
pretends otherwise — see calculate_ventilation_index's docstring.
"""
from typing import Optional
from app.schemas import ValueWithMeta, VentilationReading


def calculate_ventilation_index(
    wind_speed_ms: Optional[float], boundary_layer_height_m: Optional[float]
) -> Optional[float]:
    """
    Team-supplied formula (authoritative):

        VI = wind_speed_10m x boundary_layer_height

    Units: wind_speed_10m in m/s, boundary_layer_height in m, VI in
    m^2/s. This is the RAW scientific quantity — no normalization, no
    0-10 rescaling, no invented constants. Higher VI = stronger
    ventilation; lower VI = weaker ventilation / stronger trapping.

    Returns None if either input is None or non-positive — never
    compute from a partial or invalid input, never substitute 0, never
    interpolate a missing value.
    """
    if wind_speed_ms is None or boundary_layer_height_m is None:
        return None
    if wind_speed_ms <= 0 or boundary_layer_height_m <= 0:
        return None
    return round(wind_speed_ms * boundary_layer_height_m, 2)


def map_vi_to_trapping_category(ventilation_index: Optional[float]) -> Optional[str]:
    """
    PENDING — the team has supplied the VI formula but NOT the final
    VI-to-category threshold mapping. This function must not invent
    one. It always returns None until backend/app/thresholds.py
    defines real VI_CATEGORY_BANDS and this function is updated to use
    them. Do not resurrect the old 0-10 TRAPPING_CATEGORY_BANDS here —
    those bands were calibrated for a completely different quantity on
    a completely different scale and are not valid for VI (in m^2/s).
    """
    return None


def interpret_category(category: Optional[str]) -> Optional[str]:
    """Mirrors map_vi_to_trapping_category's pending state: returns None until a category exists to interpret."""
    if category is None:
        return None
    return None


def build_ventilation_reading(
    wind_speed_ms: Optional[float],
    boundary_layer_height_m: Optional[float],
    typical_boundary_layer_height_m: float,
) -> VentilationReading:
    ventilation_index = calculate_ventilation_index(wind_speed_ms, boundary_layer_height_m)
    category = map_vi_to_trapping_category(ventilation_index)
    interpretation = interpret_category(category)
    return VentilationReading(
        ventilationIndex=ValueWithMeta(value=ventilation_index, unit="m²/s", source="computed"),
        category=category,
        interpretation=interpretation,
        # wind and boundary layer height are themselves external-forecast
        # inputs, not something this product computed — provenance matters
        # per-field here too
        windSpeedMs=ValueWithMeta(value=wind_speed_ms, unit="m/s", source="external"),
        boundaryLayerHeightM=ValueWithMeta(value=boundary_layer_height_m, unit="m", source="external"),
        typicalBoundaryLayerHeightM=ValueWithMeta(
            value=typical_boundary_layer_height_m, unit="m", source="external"
        ),
    )
