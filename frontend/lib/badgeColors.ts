import type { InversionClass, TrappingCategory } from "./contract";

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
