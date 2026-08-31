from app.diagnostics.ventilation import (
    build_ventilation_reading,
    calculate_ventilation_index,
    map_vi_to_trapping_category,
)


# --- Formula (monotonicity per the team-supplied VI = wind x BLH) ---


def test_formula_wind2_blh500():
    assert calculate_ventilation_index(2.0, 500.0) == 1000.0


def test_formula_wind4_blh500():
    assert calculate_ventilation_index(4.0, 500.0) == 2000.0


def test_formula_wind2_blh1000():
    assert calculate_ventilation_index(2.0, 1000.0) == 2000.0


# --- Missing data ---


def test_wind_none_returns_none():
    assert calculate_ventilation_index(None, 500.0) is None


def test_blh_none_returns_none():
    assert calculate_ventilation_index(2.0, None) is None


def test_both_none_returns_none():
    assert calculate_ventilation_index(None, None) is None


# --- Invalid input: never substitute 0, never interpolate ---


def test_wind_zero_returns_none():
    assert calculate_ventilation_index(0.0, 500.0) is None


def test_wind_negative_returns_none():
    assert calculate_ventilation_index(-2.0, 500.0) is None


def test_blh_zero_returns_none():
    assert calculate_ventilation_index(2.0, 0.0) is None


def test_blh_negative_returns_none():
    assert calculate_ventilation_index(2.0, -500.0) is None


# --- Semantic direction: higher wind or higher BLH -> higher VI ---


def test_higher_wind_same_blh_gives_higher_vi():
    lower = calculate_ventilation_index(2.0, 500.0)
    higher = calculate_ventilation_index(4.0, 500.0)
    assert higher > lower


def test_higher_blh_same_wind_gives_higher_vi():
    lower = calculate_ventilation_index(2.0, 500.0)
    higher = calculate_ventilation_index(2.0, 1000.0)
    assert higher > lower


# --- Category mapping: explicitly pending, must not invent thresholds ---


def test_map_vi_to_trapping_category_always_none_pending_team_mapping():
    assert map_vi_to_trapping_category(1283.8) is None
    assert map_vi_to_trapping_category(0.0) is None
    assert map_vi_to_trapping_category(None) is None


# --- build_ventilation_reading: null cascade, provenance, worked example ---


def test_build_ventilation_reading_null_cascade_on_missing_wind():
    reading = build_ventilation_reading(None, 500.0, 850.0)
    assert reading.ventilationIndex.value is None
    assert reading.category is None
    assert reading.interpretation is None
    assert reading.windSpeedMs.value is None
    assert reading.boundaryLayerHeightM.value == 500.0


def test_build_ventilation_reading_null_cascade_on_missing_blh():
    reading = build_ventilation_reading(2.0, None, 850.0)
    assert reading.ventilationIndex.value is None
    assert reading.category is None
    assert reading.interpretation is None


def test_build_ventilation_reading_provenance_labels():
    reading = build_ventilation_reading(2.0, 500.0, 850.0)
    assert reading.ventilationIndex.source == "computed"
    assert reading.windSpeedMs.source == "external"
    assert reading.boundaryLayerHeightM.source == "external"
    assert reading.typicalBoundaryLayerHeightM.source == "external"


def test_build_ventilation_reading_unit_is_m2_per_s_not_0_to_10():
    reading = build_ventilation_reading(2.0, 500.0, 850.0)
    assert reading.ventilationIndex.unit == "m²/s"


def test_build_ventilation_reading_matches_team_worked_example():
    # wind=3.27 m/s, BLH=392.6 m -> VI ~= 1283.8 m^2/s (team lead's own example)
    reading = build_ventilation_reading(3.27, 392.6, 850.0)
    assert reading.ventilationIndex.value == round(3.27 * 392.6, 2)
    assert abs(reading.ventilationIndex.value - 1283.8) < 1.0
