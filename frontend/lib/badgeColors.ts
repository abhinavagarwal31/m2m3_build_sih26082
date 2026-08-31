import type { TrappingCategory } from "./contract";

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
