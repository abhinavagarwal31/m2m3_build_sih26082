/**
 * Shared time helpers for the 72h forecast window. Kept in one place
 * so ForecastHourSelector and every Recharts x-axis (trapping,
 * inversion, pollutant series) share identical hour math, boundary
 * logic, and IST formatting.
 */

// Must match backend/app/mock_inputs.py's HOURS_AHEAD.
export const FORECAST_HOURS = 72;

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface IstParts {
  year: number;
  month: number; // 0-11
  date: number;
  weekday: number; // 0 = Sunday
  hours: number; // 0-23
  minutes: number;
}

function toIstParts(iso: string): IstParts {
  const shifted = new Date(new Date(iso).getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

/**
 * Adds whole hours to a backend hourIso and re-serializes in the same
 * shape the backend produces (Python's isoformat() on a UTC-aware,
 * minute/second/microsecond-truncated datetime: "+00:00" suffix, no
 * fractional seconds). Date.toISOString() would produce "...Z" with
 * milliseconds instead — a different string that would fail the
 * backend's exact hour-string lookup. Every hour used to key an API
 * call must go through this function, never toISOString().
 */
export function addHoursToIso(baseIso: string, hoursToAdd: number): string {
  const date = new Date(new Date(baseIso).getTime() + hoursToAdd * 60 * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+00:00`
  );
}

/** A string key that's stable within one IST calendar day, for day-boundary/banding logic. */
export function formatIstDayKey(iso: string): string {
  const p = toIstParts(iso);
  return `${p.year}-${p.month}-${p.date}`;
}

/** e.g. "Thu 6:00 PM" in IST, regardless of the viewer's local timezone. */
export function formatIstHourLabel(iso: string): string {
  const p = toIstParts(iso);
  const hour12 = p.hours % 12 === 0 ? 12 : p.hours % 12;
  const ampm = p.hours < 12 ? "AM" : "PM";
  const minutes = p.minutes.toString().padStart(2, "0");
  return `${DAY_NAMES[p.weekday]} ${hour12}:${minutes} ${ampm}`;
}

/** Per F2.2/M3 chart day/night banding: 6am-6pm IST is day, else night. */
export function isIstDaytime(iso: string): boolean {
  const { hours } = toIstParts(iso);
  return hours >= 6 && hours < 18;
}

export interface NightBand {
  x1: string;
  x2: string;
}

/** Groups contiguous nighttime hours into [start, end] segments for ReferenceArea shading. */
export function getNightBands(hourIsoList: readonly string[]): NightBand[] {
  const bands: NightBand[] = [];
  let start: string | null = null;

  hourIsoList.forEach((hourIso, index) => {
    const isNight = !isIstDaytime(hourIso);
    if (isNight && start === null) start = hourIso;

    const isLast = index === hourIsoList.length - 1;
    const nextIsDay = !isLast && isIstDaytime(hourIsoList[index + 1]);
    if (isNight && start !== null && (isLast || nextIsDay)) {
      bands.push({ x1: start, x2: hourIso });
      start = null;
    }
  });

  return bands;
}

export interface ChartXAxisConfig {
  domain: [string, string];
  ticks: string[];
  tickFormatter: (hourIso: string) => string;
}

/**
 * Shared x-axis config (domain, tick positions, day-boundary-aware tick
 * formatter) — every 72h series chart (trapping, inversion, pollutant)
 * must import this rather than compute its own, so their x-axes stay
 * pixel-identical per F3.2's alignment requirement.
 */
export function getChartXAxisConfig(hourIsoList: readonly string[]): ChartXAxisConfig {
  return {
    domain: [hourIsoList[0], hourIsoList[hourIsoList.length - 1]],
    ticks: hourIsoList.filter((_, index) => index % 6 === 0),
    tickFormatter: formatIstHourLabel,
  };
}
