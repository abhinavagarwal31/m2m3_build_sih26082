import type { InversionClass, PollutantCategory, TrappingCategory } from "./contract";

/**
 * Fixed per-category colors — never derived from the data range itself,
 * so the same category always looks the same regardless of what else
 * is on screen.
 */
export const TRAPPING_CATEGORY_COLORS: Record<TrappingCategory, string> = {
  Low: "bg-green-100 text-green-800 border-green-300",
  Moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-orange-100 text-orange-800 border-orange-300",
  Severe: "bg-red-100 text-red-800 border-red-300",
};

/**
 * Deliberately a different color family from TRAPPING_CATEGORY_COLORS
 * (slate/indigo/purple/fuchsia vs. green/yellow/orange/red) so trapping
 * and inversion badges are never visually interchangeable at a glance.
 */
export const INVERSION_CLASSIFICATION_COLORS: Record<InversionClass, string> = {
  None: "bg-slate-100 text-slate-700 border-slate-300",
  Weak: "bg-indigo-100 text-indigo-800 border-indigo-300",
  Moderate: "bg-purple-100 text-purple-800 border-purple-300",
  Strong: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400",
};

/**
 * Standard AQI-style severity colors, used identically by
 * CurrentReadingCard and PollutantSeriesChart's band shading — the two
 * must match exactly per F3.2's acceptance criteria.
 */
export const POLLUTANT_CATEGORY_COLORS: Record<PollutantCategory, string> = {
  Good: "bg-green-100 text-green-800 border-green-300",
  Satisfactory: "bg-lime-100 text-lime-800 border-lime-300",
  Moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Poor: "bg-orange-100 text-orange-800 border-orange-300",
  "Very Poor": "bg-red-100 text-red-800 border-red-300",
  Severe: "bg-rose-200 text-rose-900 border-rose-400",
};

/** Hex equivalents of the above, for Recharts fills that can't take Tailwind classes. */
export const POLLUTANT_CATEGORY_HEX: Record<PollutantCategory, string> = {
  Good: "#bbf7d0",
  Satisfactory: "#d9f99d",
  Moderate: "#fef08a",
  Poor: "#fed7aa",
  "Very Poor": "#fecaca",
  Severe: "#fecdd3",
};
