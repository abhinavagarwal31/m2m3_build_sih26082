"""
Named constants for classification thresholds. PLACEHOLDER VALUES —
pending team confirmation (see M2_M3_Build_Plan.md section 7). Nothing
in diagnostics/ should hardcode a threshold inline; everything routes
through this file so real values can be dropped in without touching
calculation logic.
"""

# --- Trapping (F2.1/F2.2) --- 0 (fully ventilated) to 10 (fully sealed)
TRAPPING_SEALED_THRESHOLD = 7.0  # PLACEHOLDER — confirm with team

TRAPPING_CATEGORY_BANDS = [
    ("Low", 0.0, 3.0),
    ("Moderate", 3.0, 5.0),
    ("High", 5.0, 7.0),
    ("Severe", 7.0, 10.01),
]

TRAPPING_INTERPRETATIONS = {
    "Low": "Air is dispersing normally.",
    "Moderate": "Air is dispersing more slowly than usual.",
    "High": "Air is sealed near the surface.",
    "Severe": "Air is strongly sealed near the surface.",
}

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

# --- AQI bands (F3.1/F3.2) --- PLACEHOLDER — confirm against CPCB's table before demo
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
