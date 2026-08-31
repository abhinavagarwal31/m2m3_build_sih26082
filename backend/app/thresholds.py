"""
Named constants for classification thresholds. PLACEHOLDER VALUES —
pending team confirmation (see M2_M3_Build_Plan.md section 7). Nothing
in diagnostics/ should hardcode a threshold inline; everything routes
through this file so real values can be dropped in without touching
calculation logic.
"""

# --- Ventilation Index (F2.1/F2.2) --- m^2/s. VI = wind_speed_10m x
# boundary_layer_height (team-supplied, authoritative formula — see
# ventilation.py). Higher VI = stronger ventilation; lower VI = weaker
# ventilation / stronger trapping.
#
# VI_RECOVERY_THRESHOLD_PLACEHOLDER exists ONLY so the recovery/chart UI
# has something to compare against in this demo. It is NOT a scientific
# claim about what "recovered ventilation" means — the team has not yet
# supplied that number. Recovery is now an UPWARD crossing (VI rising
# above this threshold), the opposite direction from the old trapping
# index's downward crossing. Replace this single value once the team
# decides; nothing else needs to change.
VI_RECOVERY_THRESHOLD_PLACEHOLDER = 1000.0  # ARBITRARY POC PLACEHOLDER — NOT team-confirmed

# VI_CATEGORY_BANDS intentionally does not exist yet. The team has not
# supplied a VI-to-category (Low/Moderate/High/Severe or equivalent)
# mapping. Do not invent one — see
# ventilation.py::map_vi_to_trapping_category, which returns None until
# this is defined. The old TRAPPING_CATEGORY_BANDS/TRAPPING_INTERPRETATIONS
# (a 0-10 scale) have been removed rather than kept around unused: they
# were calibrated for a different quantity on a different scale and
# would be actively misleading if left in this file.

# --- Inversion (F2.3) --- °C/km, PLACEHOLDER — confirm with team
INVERSION_CLASSIFICATION_BANDS = [
    ("None", 0.0, 0.5),
    ("Weak", 0.5, 1.5),
    ("Moderate", 1.5, 3.0),
    ("Strong", 3.0, float("inf")),
]
INVERSION_VERTICAL_SPAN_M = (0.0, 500.0)  # surface-based determination, per POC scope
INVERSION_EXPLAINER_TEXT = (
    "A temperature inversion occurs when a layer of warm air sits above "
    "cooler air near the surface, trapping pollutants that would "
    "otherwise rise and disperse."
)

# --- Recovery text (F2.4) ---
RECOVERY_DRIVER_TEMPLATE = "Winds are forecast to strengthen and the mixing layer is expected to deepen."
RECOVERY_UNCERTAINTY_NOTE = "This is an estimate and may shift as the forecast updates."

# --- Per-pollutant sub-index category bands (F3.1/F3.2) --- PLACEHOLDER —
# confirm against CPCB's breakpoint table before demo. These classify each
# pollutant's own raw concentration independently (matching the POC scope:
# "two pollutant readings and category display") — this is NOT a composite
# national AQI calculation (which would take the max sub-index across all
# pollutants CPCB tracks, not just these two). Don't present these category
# labels as "the AQI" without that distinction being explicit.
PM25_BANDS = [
    {"label": "Good", "min": 0, "max": 30},
    {"label": "Satisfactory", "min": 30, "max": 60},
    {"label": "Moderate", "min": 60, "max": 90},
    {"label": "Poor", "min": 90, "max": 120},
    {"label": "Very Poor", "min": 120, "max": 250},
    {"label": "Severe", "min": 250, "max": 500},
]

OZONE_BANDS = [
    {"label": "Good", "min": 0, "max": 50},
    {"label": "Satisfactory", "min": 50, "max": 100},
    {"label": "Moderate", "min": 100, "max": 168},
    {"label": "Poor", "min": 168, "max": 208},
    {"label": "Very Poor", "min": 208, "max": 748},
    {"label": "Severe", "min": 748, "max": 1000},
]
