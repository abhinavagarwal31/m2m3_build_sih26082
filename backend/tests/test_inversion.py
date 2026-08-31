from app.diagnostics.inversion import (
    build_inversion_reading,
    calculate_strength,
    classify_strength,
    detect_inversion,
)
from app.thresholds import INVERSION_CLASSIFICATION_BANDS

DECREASING_PROFILE = [(0.0, 25.0), (100.0, 24.0), (250.0, 22.5), (500.0, 20.0)]
INCREASING_PROFILE = [(0.0, 15.0), (100.0, 16.5), (250.0, 18.0), (500.0, 17.0)]


def test_none_profile_present_is_none():
    assert detect_inversion(None) is None


def test_empty_profile_cannot_determine():
    assert detect_inversion([]) is None


def test_single_point_profile_cannot_determine():
    assert detect_inversion([(0.0, 20.0)]) is None


def test_decreasing_temperature_present_is_false():
    assert detect_inversion(DECREASING_PROFILE) is False


def test_increasing_temperature_present_is_true():
    assert detect_inversion(INCREASING_PROFILE) is True


def test_calculated_strength_positive_when_inversion_exists():
    strength = calculate_strength(INCREASING_PROFILE)
    assert strength is not None
    assert strength > 0.0


def test_calculated_strength_zero_not_none_when_no_inversion():
    # A real "no inversion" result is a genuine 0.0, distinguishable from a
    # missing profile (which is None) — this is what lets it classify to
    # "None" instead of falling into "cannot determine".
    strength = calculate_strength(DECREASING_PROFILE)
    assert strength == 0.0


def test_calculated_strength_none_when_profile_missing():
    assert calculate_strength(None) is None


def test_classify_strength_uses_centralized_thresholds():
    for label, low, _high in INVERSION_CLASSIFICATION_BANDS:
        if low == float("inf"):
            continue
        assert classify_strength(low) == label


def test_classify_strength_none_only_when_strength_is_none():
    assert classify_strength(None) is None
    # a genuinely absent inversion (strength 0.0) must NOT return None
    assert classify_strength(0.0) == "None"


def test_build_inversion_reading_missing_profile_cannot_determine():
    reading = build_inversion_reading(None, "explainer")
    assert reading.present is None
    assert reading.strength.value is None
    assert reading.classification is None


def test_build_inversion_reading_false_is_distinct_from_none():
    reading = build_inversion_reading(DECREASING_PROFILE, "explainer")
    assert reading.present is False
    assert reading.classification == "None"  # a real classification string, not Python None
    assert isinstance(reading.classification, str)


def test_build_inversion_reading_true_case():
    reading = build_inversion_reading(INCREASING_PROFILE, "explainer")
    assert reading.present is True
    assert reading.strength.value is not None
    assert reading.strength.value > 0.0
    assert reading.classification in [label for label, _low, _high in INVERSION_CLASSIFICATION_BANDS]


def test_build_inversion_reading_provenance_and_static_fields():
    reading = build_inversion_reading(INCREASING_PROFILE, "explainer text here")
    assert reading.strength.source == "computed"
    assert reading.explainerText == "explainer text here"
    assert reading.forwardSeries72h == []
