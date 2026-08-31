"use client";

import {
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RecoveryEstimate, VentilationSeriesPoint } from "@/lib/contract";
import { useAppStore } from "@/lib/store";
import { CHART_Y_AXIS_WIDTH, formatIstHourLabel, getChartXAxisConfig, getNightBands } from "@/lib/time";

interface VentilationSeriesChartProps {
  ventilationSeries72h: VentilationSeriesPoint[];
  ventilationRecoveryThreshold: number;
  selectedHourIso: string;
  recovery: RecoveryEstimate;
}

/**
 * recovery is already the authoritative estimate from the backend
 * (derived from this exact series — see recovery.py). This only
 * re-walks the series to find WHICH point to highlight on the chart;
 * it never second-guesses whether a recovery exists.
 *
 * This is an UPWARD crossing (VI rising above threshold) — the
 * opposite direction from the old trapping-index chart's downward
 * crossing. Getting this direction wrong here (independent of
 * recovery.py) was flagged during the VI migration as exactly the
 * kind of frontend-duplicated directional assumption to avoid.
 */
function findVentilationRecoveryPoint(
  series: VentilationSeriesPoint[],
  threshold: number,
  recovery: RecoveryEstimate
): VentilationSeriesPoint | null {
  if (!recovery.withinWindow) return null;
  let seenAtOrBelow = false;
  for (const point of series) {
    if (point.ventilationIndex === null) continue;
    if (seenAtOrBelow && point.ventilationIndex > threshold) return point;
    if (point.ventilationIndex <= threshold) seenAtOrBelow = true;
  }
  return null;
}

export default function VentilationSeriesChart({
  ventilationSeries72h,
  ventilationRecoveryThreshold,
  selectedHourIso,
  recovery,
}: VentilationSeriesChartProps) {
  const setHour = useAppStore((state) => state.setHour);

  const hours = ventilationSeries72h.map((point) => point.hourIso);
  const axis = getChartXAxisConfig(hours);
  const nightBands = getNightBands(hours);
  const recoveryPoint = findVentilationRecoveryPoint(
    ventilationSeries72h,
    ventilationRecoveryThreshold,
    recovery
  );

  // The Y-axis must include the threshold even when this location's VI never
  // approaches it (e.g. a genuine no-recovery case) — otherwise Recharts
  // simply omits the ReferenceLine when its value falls outside the
  // auto-computed domain, silently hiding "here's the threshold you're
  // comparing against" for exactly the location where seeing that
  // comparison matters most.
  const dataMax = Math.max(0, ...ventilationSeries72h.map((point) => point.ventilationIndex ?? 0));
  // Rounded up to a clean multiple of 100 (not the raw *1.1 float) so the
  // top tick renders as e.g. "3300" rather than an ugly "3244.032" that's
  // wider than CHART_Y_AXIS_WIDTH and gets clipped on the left.
  const yAxisMax = Math.ceil((Math.max(dataMax, ventilationRecoveryThreshold) * 1.1) / 100) * 100;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-neutral-500">Ventilation index — 72h forecast</div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={ventilationSeries72h}
          onClick={(nextState) => {
            if (typeof nextState.activeLabel === "string") setHour(nextState.activeLabel);
          }}
        >
          {nightBands.map((band) => (
            <ReferenceArea key={band.x1} x1={band.x1} x2={band.x2} fill="#1e293b" fillOpacity={0.06} />
          ))}

          <XAxis
            dataKey="hourIso"
            type="category"
            domain={axis.domain}
            ticks={axis.ticks}
            tickFormatter={axis.tickFormatter}
            padding={axis.padding}
            tick={{ fontSize: 11 }}
            minTickGap={20}
          />
          {/*
            No hardcoded [0, 10] domain here (VI is unbounded, unlike the
            old trapping index's fixed 0-10 placeholder scale) — but the
            domain is still explicitly computed from data+threshold, not
            left to bare auto-scale, so the threshold line stays visible
            even when a location's VI never approaches it.
          */}
          <YAxis domain={[0, yAxisMax]} tick={{ fontSize: 11 }} width={CHART_Y_AXIS_WIDTH} />
          <Tooltip
            labelFormatter={(label) => (typeof label === "string" ? formatIstHourLabel(label) : label)}
            formatter={(value: unknown, _name: unknown, item: { payload?: VentilationSeriesPoint }) => {
              const category = item.payload?.category;
              const text = value === null ? "No data" : category ? `${value} (${category})` : `${value}`;
              return [text, "Ventilation index"];
            }}
          />

          <ReferenceLine
            y={ventilationRecoveryThreshold}
            stroke="#dc2626"
            strokeDasharray="4 4"
            label={{
              value: "Recovery threshold (placeholder)",
              position: "insideTopRight",
              fill: "#dc2626",
              fontSize: 11,
            }}
          />
          <ReferenceLine
            x={selectedHourIso}
            stroke="#0284c7"
            strokeDasharray="3 3"
            label={{ value: "Selected", position: "top", fill: "#0284c7", fontSize: 11 }}
          />
          {recoveryPoint && recoveryPoint.ventilationIndex !== null && (
            <ReferenceDot
              x={recoveryPoint.hourIso}
              y={recoveryPoint.ventilationIndex}
              r={6}
              fill="#16a34a"
              stroke="white"
              strokeWidth={2}
            />
          )}

          <Line
            type="monotone"
            dataKey="ventilationIndex"
            stroke="#0f172a"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
