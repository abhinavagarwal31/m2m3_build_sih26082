"""
The ONLY fake thing in this backend: a deterministic generator of
synthetic atmospheric inputs standing in for WRF-Chem/GFS/CAMS/CPCB.
This file knows nothing about trapping index, category, or recovery —
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
HOURS_AHEAD = 72
TYPICAL_MIXING_DEPTH_M = 850.0
IST = ZoneInfo("Asia/Kolkata")

_rng = random.Random(SEED)

_SERVER_NOW = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
_HOURS_ISO = [(_SERVER_NOW + timedelta(hours=h)).isoformat() for h in range(HOURS_AHEAD)]


def _is_daytime_ist(hour_dt_utc: datetime) -> bool:
    hour_ist = hour_dt_utc.astimezone(IST).hour
    return 6 <= hour_ist < 18


def _diurnal_base_temp_c(hour_dt_utc: datetime) -> float:
    hour_ist = hour_dt_utc.astimezone(IST).hour
    return 25.0 + 3.0 * math.cos(2 * math.pi * (hour_ist - 14) / 24)


def _vertical_temp_profile(hour_dt_utc: datetime, base_temp_c: float) -> list[tuple[float, float]]:
    """
    Daytime: temperature decreases with height (normal lapse, no
    inversion). Nighttime: a shallow warm layer aloft (a real
    inversion signature) — this day/night split is what gives
    inversion.detect_inversion a genuine mix of True/False across the
    72h window.
    """
    heights_m = [0.0, 100.0, 250.0, 500.0]
    if _is_daytime_ist(hour_dt_utc):
        deltas = [0.0, -1.0, -2.5, -5.0]
    else:
        deltas = [-2.0, -0.5, 1.0, -3.0]
    return [
        (height, round(base_temp_c + delta + _rng.uniform(-0.3, 0.3), 2))
        for height, delta in zip(heights_m, deltas)
    ]


def _anand_vihar_trend(h: int) -> tuple[float, float]:
    """Starts sealed, steadily ventilates — crosses TRAPPING_SEALED_THRESHOLD partway through. Real recovery case."""
    mixing_depth_m = 200.0 + 8.0 * h
    wind_speed_ms = 1.0 + 0.04 * h
    return round(mixing_depth_m, 1), round(wind_speed_ms, 2)


def _rk_puram_trend(h: int) -> tuple[float, float]:
    """Stays sealed for the entire 72h window. Real no-recovery case."""
    mixing_depth_m = 150.0 + 1.0 * h
    wind_speed_ms = 1.0 + 0.01 * h
    return round(mixing_depth_m, 1), round(wind_speed_ms, 2)


def _rohini_trend() -> tuple[float, float]:
    mixing_depth_m = _rng.uniform(300.0, 700.0)
    wind_speed_ms = _rng.uniform(1.5, 4.0)
    return round(mixing_depth_m, 1), round(wind_speed_ms, 2)


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
                mixing_depth_m, wind_speed_ms = _anand_vihar_trend(h)
            elif location == "RK Puram":
                mixing_depth_m, wind_speed_ms = _rk_puram_trend(h)
            else:  # Rohini
                mixing_depth_m, wind_speed_ms = _rohini_trend()

            vertical_temp_profile = _vertical_temp_profile(hour_dt, base_temp_c)
            pm25 = _pm25_reading()
            ozone = _ozone_reading()

            # Rohini, hour+10: exercise trapping.py's null cascade end-to-end
            if location == "Rohini" and h == 10:
                mixing_depth_m = None
                wind_speed_ms = None

            # RK Puram, hour+5: independent-nullability test — pm25 missing, ozone present
            if location == "RK Puram" and h == 5:
                pm25 = None

            data[location][hour_iso] = {
                "mixing_depth_m": mixing_depth_m,
                "wind_speed_ms": wind_speed_ms,
                "vertical_temp_profile": vertical_temp_profile,
                "pm25": pm25,
                "ozone": ozone,
            }

    return data


_DATA = _build_all_data()
_TYPICAL_MIXING_DEPTH_M = {location: TYPICAL_MIXING_DEPTH_M for location in LOCATIONS}


def get_locations() -> list[str]:
    return list(LOCATIONS)


def get_server_now_iso() -> str:
    return _SERVER_NOW.isoformat()


def get_hours_iso() -> list[str]:
    return list(_HOURS_ISO)


def get_typical_mixing_depth_m(location: str) -> float:
    return _TYPICAL_MIXING_DEPTH_M[location]


def get_hourly_inputs(location: str, hour_iso: str) -> dict | None:
    return _DATA.get(location, {}).get(hour_iso)
