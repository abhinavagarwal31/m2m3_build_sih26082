"""
The ONLY fake thing in this backend: a deterministic generator of
synthetic atmospheric inputs standing in for WRF-Chem/GFS/CAMS/CPCB.
This file knows nothing about ventilation index, category, or recovery —
it only produces raw per-(location, hour) inputs as plain Python data
structures. diagnostics/* computes everything downstream; main.py is
the only place that wires the two together.
"""
from __future__ import annotations

import math
import random
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

SEED = 42
LOCATIONS = ["Anand Vihar", "RK Puram", "Rohini"]
HOURS_AHEAD = 72  # 72 hourly points: hour 0 (=serverNowIso) through hour 71 (=serverNowIso + 71h)
TYPICAL_BOUNDARY_LAYER_HEIGHT_M = 850.0
IST = ZoneInfo("Asia/Kolkata")

# DEV FIXTURE — POC ONLY. Fixed at 2026-08-31T08:00:00+05:30 (08:00 IST) so the
# synthetic dataset is byte-for-byte identical across every run, not just
# internally consistent within one process. Must stay UTC-aware (tzinfo=
# timezone.utc, not ZoneInfo("Asia/Kolkata")): its .isoformat() suffix
# ("+00:00") is exactly what frontend/lib/time.ts's addHoursToIso()
# reproduces byte-for-byte to key API calls — switching this to IST tzinfo
# would silently break every non-bootstrap hour selection with a 404.
# When real forecast data replaces this file, this becomes datetime.now(timezone.utc)
# again (or whatever the real pipeline's "now" is) — nothing downstream changes.
MOCK_START_TIME = datetime(2026, 8, 31, 2, 30, 0, tzinfo=timezone.utc)

_rng = random.Random(SEED)

_SERVER_NOW = MOCK_START_TIME
_HOURS_ISO = [(_SERVER_NOW + timedelta(hours=h)).isoformat() for h in range(HOURS_AHEAD)]


def _ist_hour(hour_dt_utc: datetime) -> int:
    return hour_dt_utc.astimezone(IST).hour


def _is_daytime_ist(hour_dt_utc: datetime) -> bool:
    return 6 <= _ist_hour(hour_dt_utc) < 18


def _diurnal_base_temp_c(hour_dt_utc: datetime) -> float:
    return 25.0 + 3.0 * math.cos(2 * math.pi * (_ist_hour(hour_dt_utc) - 14) / 24)


_NIGHT_INVERSION_DELTAS = [-2.0, -0.5, 1.0, -3.0]  # at factor 1.0, peaks around "Strong"


def _night_intensity_factor(hour_ist: int) -> float:
    """
    Radiative inversions are realistically weak just after sunset and
    strongest just before dawn — not a fixed strength all night. Maps
    how deep into the night (18:00-06:00 IST) this hour is to a 0..1
    progress value, then to a strength factor chosen so the resulting
    gradient lands in Weak, Moderate, and Strong bands
    (INVERSION_CLASSIFICATION_BANDS) across one night, not just always
    "Strong" or always absent — otherwise Weak/Moderate would never be
    reachable through mock data at all.
    """
    if hour_ist >= 18:
        progress = (hour_ist - 18) / 12.0
    else:  # hour_ist < 6
        progress = (hour_ist + 6) / 12.0
    if progress < 1 / 3:
        return 0.06  # -> Weak (~0.9 °C/km)
    if progress < 2 / 3:
        return 0.13  # -> Moderate (~1.95 °C/km)
    return 0.5  # -> Strong (~7.5 °C/km)


def _vertical_temp_profile(hour_dt_utc: datetime, base_temp_c: float) -> list[tuple[float, float]]:
    """
    Daytime: temperature decreases with height (normal lapse, no
    inversion). Nighttime: a shallow warm layer aloft (a real
    inversion signature), scaled by _night_intensity_factor so its
    classification varies across the night — this day/night split is
    what gives inversion.detect_inversion a genuine mix of True/False,
    and the intensity scaling gives classify_strength a genuine mix of
    Weak/Moderate/Strong, across the 72h window.

    The per-hour jitter below is a single value SHARED across all
    heights (not drawn independently per height): a uniform shift to
    every point cancels out completely in the height-to-height
    differences inversion.py's gradient calculation depends on, so it
    adds cosmetic hour-to-hour variation without ever perturbing which
    band a given hour classifies into. An earlier version drew jitter
    independently per height, which was large enough relative to the
    Weak/Moderate tiers' small intended gradients to occasionally flip
    an intended "Weak" hour into "None" (or similar) by chance —
    exactly the kind of hour-to-hour inconsistency a demo audience
    would notice.
    """
    heights_m = [0.0, 100.0, 250.0, 500.0]
    if _is_daytime_ist(hour_dt_utc):
        deltas = [0.0, -1.0, -2.5, -5.0]
    else:
        factor = _night_intensity_factor(_ist_hour(hour_dt_utc))
        deltas = [d * factor for d in _NIGHT_INVERSION_DELTAS]
    jitter = _rng.uniform(-0.3, 0.3)
    return [
        (height, round(base_temp_c + delta + jitter, 2))
        for height, delta in zip(heights_m, deltas)
    ]


def _anand_vihar_trend(h: int) -> tuple[float, float]:
    """
    Starts with weak ventilation (VI=wind*BLH=200 at h=0), rises
    steadily as both wind and boundary layer height grow, crossing
    VI_RECOVERY_THRESHOLD_PLACEHOLDER (1000 m^2/s) around h=31 — a real
    recovery case under the new VI direction. Verified numerically;
    the underlying trend values are unchanged from the old
    "mixing depth" formulation, only the field name and the
    interpretation of what "recovery" means have changed.
    """
    boundary_layer_height_m = 200.0 + 8.0 * h
    wind_speed_ms = 1.0 + 0.04 * h
    return round(boundary_layer_height_m, 1), round(wind_speed_ms, 2)


def _rk_puram_trend(h: int) -> tuple[float, float]:
    """
    Stays weakly ventilated for the entire 72h window — a real
    no-recovery case. VI=wind*BLH ranges ~421 to ~548 m^2/s, always
    comfortably below VI_RECOVERY_THRESHOLD_PLACEHOLDER (1000), while
    still visibly varying hour to hour (not flat/suspicious-looking).
    """
    boundary_layer_height_m = 281.0 + 1.19 * h
    wind_speed_ms = 1.5
    return round(boundary_layer_height_m, 1), round(wind_speed_ms, 2)


def _rohini_trend() -> tuple[float, float]:
    boundary_layer_height_m = _rng.uniform(300.0, 700.0)
    wind_speed_ms = _rng.uniform(1.5, 4.0)
    return round(boundary_layer_height_m, 1), round(wind_speed_ms, 2)


def _pm25_reading() -> float:
    return round(_rng.uniform(40.0, 280.0), 1)


def _ozone_reading() -> float:
    return round(_rng.uniform(20.0, 150.0), 1)


def _build_all_data() -> dict[str, dict[str, dict]]:
    data: dict[str, dict[str, dict]] = {location: {} for location in LOCATIONS}

    for h in range(HOURS_AHEAD):
        hour_dt = _SERVER_NOW + timedelta(hours=h)
        hour_iso = _HOURS_ISO[h]
        base_temp_c = _diurnal_base_temp_c(hour_dt)

        for location in LOCATIONS:
            if location == "Anand Vihar":
                boundary_layer_height_m, wind_speed_ms = _anand_vihar_trend(h)
            elif location == "RK Puram":
                boundary_layer_height_m, wind_speed_ms = _rk_puram_trend(h)
            else:  # Rohini
                boundary_layer_height_m, wind_speed_ms = _rohini_trend()

            vertical_temp_profile = _vertical_temp_profile(hour_dt, base_temp_c)
            pm25 = _pm25_reading()
            ozone = _ozone_reading()

            # Rohini, hour+10: exercise ventilation.py's null cascade end-to-end
            if location == "Rohini" and h == 10:
                boundary_layer_height_m = None
                wind_speed_ms = None

            # RK Puram, hour+5: independent-nullability test — pm25 missing, ozone present
            if location == "RK Puram" and h == 5:
                pm25 = None

            # RK Puram, hour+15: exercise inversion.py's "cannot determine" cascade end-to-end
            if location == "RK Puram" and h == 15:
                vertical_temp_profile = None

            data[location][hour_iso] = {
                "boundary_layer_height_m": boundary_layer_height_m,
                "wind_speed_ms": wind_speed_ms,
                "vertical_temp_profile": vertical_temp_profile,
                "pm25": pm25,
                "ozone": ozone,
            }

    return data


_DATA = _build_all_data()
_TYPICAL_BOUNDARY_LAYER_HEIGHT_M = {location: TYPICAL_BOUNDARY_LAYER_HEIGHT_M for location in LOCATIONS}


def get_locations() -> list[str]:
    return list(LOCATIONS)


def get_server_now_iso() -> str:
    return _SERVER_NOW.isoformat()


def get_hours_iso() -> list[str]:
    return list(_HOURS_ISO)


def get_typical_boundary_layer_height_m(location: str) -> float:
    return _TYPICAL_BOUNDARY_LAYER_HEIGHT_M[location]


def get_hourly_inputs(location: str, hour_iso: str) -> dict | None:
    return _DATA.get(location, {}).get(hour_iso)
