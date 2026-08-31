"use client";

import { useMemo } from "react";

import { useAppStore } from "@/lib/store";
import { FORECAST_HOURS, addHoursToIso, formatIstDayKey, formatIstHourLabel } from "@/lib/time";

export default function ForecastHourSelector() {
  const serverNowIso = useAppStore((state) => state.serverNowIso);
  const selectedHourIso = useAppStore((state) => state.selectedHourIso);
  const setHour = useAppStore((state) => state.setHour);

  const hours = useMemo(() => {
    if (!serverNowIso) return [];
    return Array.from({ length: FORECAST_HOURS }, (_, i) => addHoursToIso(serverNowIso, i));
  }, [serverNowIso]);

  const dayBoundaryPercents = useMemo(() => {
    if (hours.length === 0) return [];
    const percents: number[] = [];
    let lastDayKey = formatIstDayKey(hours[0]);
    hours.forEach((hourIso, index) => {
      const dayKey = formatIstDayKey(hourIso);
      if (dayKey !== lastDayKey) {
        percents.push((index / (FORECAST_HOURS - 1)) * 100);
        lastDayKey = dayKey;
      }
    });
    return percents;
  }, [hours]);

  if (!serverNowIso || hours.length === 0) {
    return (
      <div className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
        Loading forecast window…
      </div>
    );
  }

  const selectedIndex = Math.max(0, hours.indexOf(selectedHourIso));
  // Slider's own range starts exactly at "now" (serverNowIso is hours[0]), so the
  // past/present portion of the track is 0-width here by construction — but the
  // split is still computed explicitly (not hardcoded away) so past-hour display
  // stays intentional if this range is ever extended to include past hours.
  const nowPercent = 0;

  return (
    <div className="w-full rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Selected hour
          </div>
          <div className="text-lg font-semibold text-neutral-900">
            {formatIstHourLabel(selectedHourIso || hours[0])}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setHour(serverNowIso)}
          className="min-h-11 min-w-11 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Demo Now
        </button>
      </div>

      <div className="relative flex h-6 items-center">
        <input
          type="range"
          min={0}
          max={FORECAST_HOURS - 1}
          step={1}
          value={selectedIndex}
          onChange={(event) => setHour(hours[Number(event.target.value)])}
          className="forecast-hour-range w-full"
          style={{
            background: `linear-gradient(to right, #d4d4d4 0%, #d4d4d4 ${nowPercent}%, #bae6fd ${nowPercent}%, #bae6fd 100%)`,
          }}
          aria-label="Forecast hour, 72 hourly points from the demo start time"
        />
        {dayBoundaryPercents.map((percent) => (
          <div
            key={percent}
            className="pointer-events-none absolute top-1/2 h-4 w-px -translate-y-1/2 bg-neutral-500"
            style={{ left: `${percent}%` }}
            aria-hidden
          />
        ))}
      </div>

      <div className="mt-1 flex justify-between text-xs text-neutral-400">
        <span>{formatIstHourLabel(hours[0])} · Demo start</span>
        <span>{formatIstHourLabel(hours[hours.length - 1])}</span>
      </div>
    </div>
  );
}
