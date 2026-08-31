from app.diagnostics.recovery import build_recovery_estimate, find_ventilation_recovery_crossing
from app.schemas import VentilationSeriesPoint
from app.thresholds import VI_RECOVERY_THRESHOLD_PLACEHOLDER

THRESHOLD = VI_RECOVERY_THRESHOLD_PLACEHOLDER


def _point(hour_iso: str, ventilation_index):
    return VentilationSeriesPoint(hourIso=hour_iso, ventilationIndex=ventilation_index, category=None)


def test_no_crossing_never_above_threshold():
    # VI stays low (weak ventilation) the whole series -> never recovers
    series = [_point(f"2026-08-31T{h:02d}:00:00+00:00", 300.0) for h in range(6)]
    assert find_ventilation_recovery_crossing(series, THRESHOLD) is None


def test_no_crossing_stays_above_threshold():
    # VI already strong (good ventilation) the whole series -> no crossing to find
    # (it never STARTS at/below threshold, so there's nothing to recover FROM)
    series = [_point(f"2026-08-31T{h:02d}:00:00+00:00", 2000.0) for h in range(6)]
    assert find_ventilation_recovery_crossing(series, THRESHOLD) is None


def test_crossing_exists_returns_correct_hour():
    series = [
        _point("2026-08-31T00:00:00+00:00", 300.0),
        _point("2026-08-31T01:00:00+00:00", 700.0),
        _point("2026-08-31T02:00:00+00:00", 1500.0),  # rises above threshold here
        _point("2026-08-31T03:00:00+00:00", 2000.0),
    ]
    assert find_ventilation_recovery_crossing(series, THRESHOLD) == "2026-08-31T02:00:00+00:00"


def test_null_points_do_not_create_fake_crossings():
    series = [
        _point("2026-08-31T00:00:00+00:00", None),
        _point("2026-08-31T01:00:00+00:00", None),
        _point("2026-08-31T02:00:00+00:00", None),
    ]
    assert find_ventilation_recovery_crossing(series, THRESHOLD) is None


def test_null_gap_does_not_reset_or_fabricate_a_crossing():
    series = [
        _point("2026-08-31T00:00:00+00:00", 300.0),
        _point("2026-08-31T01:00:00+00:00", None),  # gap: neither above nor below
        _point("2026-08-31T02:00:00+00:00", 1500.0),  # real crossing, after the gap
    ]
    assert find_ventilation_recovery_crossing(series, THRESHOLD) == "2026-08-31T02:00:00+00:00"


def test_build_recovery_estimate_no_crossing_is_explicit_false():
    estimate = build_recovery_estimate(None)
    assert estimate.withinWindow is False
    assert estimate.estimatedDay is None
    assert estimate.estimatedPartOfDay is None
    assert estimate.driver is None
    assert estimate.uncertaintyNote is None


def test_build_recovery_estimate_never_invents_a_time():
    # every field on a positive estimate must be DERIVED from the crossing
    # hour passed in — never a separately-invented value. build_recovery_estimate
    # itself is UNCHANGED by the VI direction flip: it only ever turns a given
    # crossing hour into day/part-of-day text, regardless of which diagnostic
    # produced that hour.
    crossing_hour = "2026-08-31T02:00:00+00:00"  # 07:30 IST, Monday
    estimate = build_recovery_estimate(crossing_hour)
    assert estimate.withinWindow is True
    assert estimate.estimatedDay == "Monday"
    assert estimate.estimatedPartOfDay == "Morning"


def test_build_recovery_estimate_part_of_day_buckets():
    cases = [
        ("2026-08-31T00:00:00+00:00", "Morning"),  # 05:30 IST
        ("2026-08-31T07:00:00+00:00", "Afternoon"),  # 12:30 IST
        ("2026-08-31T12:00:00+00:00", "Evening"),  # 17:30 IST
        ("2026-08-31T16:00:00+00:00", "Night"),  # 21:30 IST
    ]
    for crossing_hour, expected_part_of_day in cases:
        estimate = build_recovery_estimate(crossing_hour)
        assert estimate.estimatedPartOfDay == expected_part_of_day
