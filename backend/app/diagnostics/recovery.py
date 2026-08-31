"""
REAL diagnostic logic. Operates only on an ALREADY-ASSEMBLED trapping
series — never recomputes trapping itself — so a recovery estimate can
never disagree with the series that produced it.
"""
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from app.schemas import RecoveryEstimate, VentilationSeriesPoint
from app.thresholds import RECOVERY_DRIVER_TEMPLATE, RECOVERY_UNCERTAINTY_NOTE

IST = ZoneInfo("Asia/Kolkata")


def find_ventilation_recovery_crossing(
    ventilation_series: list[VentilationSeriesPoint], threshold: float
) -> Optional[str]:
    """
    Scans an already-built series for the first hour where
    ventilationIndex rises ABOVE threshold after having been at or
    below it. Returns that hour's hourIso, or None if no such crossing
    exists — including when the series never starts at/below
    threshold, or when gaps make a crossing undeterminable. A None
    ventilationIndex is treated as neither above nor below and can
    never itself mark a crossing.

    This is an UPWARD crossing — the opposite direction from the old
    trapping-index version of this function (which looked for a
    downward crossing, since a HIGH trapping index meant trapped and
    LOW meant clear). VI is the reverse: LOW VI means weak
    ventilation/trapped, and recovery means VI rising back up.
    """
    seen_at_or_below_threshold = False
    for point in ventilation_series:
        if point.ventilationIndex is None:
            continue
        if seen_at_or_below_threshold and point.ventilationIndex > threshold:
            return point.hourIso
        if point.ventilationIndex <= threshold:
            seen_at_or_below_threshold = True
    return None


def _part_of_day(hour: int) -> str:
    if 5 <= hour < 12:
        return "Morning"
    if 12 <= hour < 17:
        return "Afternoon"
    if 17 <= hour < 21:
        return "Evening"
    return "Night"


def build_recovery_estimate(crossing_hour_iso: Optional[str]) -> RecoveryEstimate:
    """
    Never independently invents a recovery time — it only ever derives
    one from find_ventilation_recovery_crossing's result.
    """
    if crossing_hour_iso is None:
        return RecoveryEstimate(withinWindow=False)

    crossing_dt = datetime.fromisoformat(crossing_hour_iso)
    if crossing_dt.tzinfo is None:
        crossing_dt = crossing_dt.replace(tzinfo=timezone.utc)
    crossing_dt_ist = crossing_dt.astimezone(IST)

    return RecoveryEstimate(
        withinWindow=True,
        estimatedDay=crossing_dt_ist.strftime("%A"),
        estimatedPartOfDay=_part_of_day(crossing_dt_ist.hour),
        driver=RECOVERY_DRIVER_TEMPLATE,
        uncertaintyNote=RECOVERY_UNCERTAINTY_NOTE,
    )
