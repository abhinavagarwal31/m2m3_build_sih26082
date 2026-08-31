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

import type { RecoveryEstimate, TrappingSeriesPoint } from "@/lib/contract";
import { useAppStore } from "@/lib/store";
import { formatIstHourLabel, getChartXAxisConfig, getNightBands } from "@/lib/time";

interface TrappingSeriesChartProps {
  trappingSeries72h: TrappingSeriesPoint[];
  trappingThresholdIndex: number;
  selectedHourIso: string;
  recovery: RecoveryEstimate;
}

/**
 * recovery is already the authoritative estimate from the backend
 * (derived from this exact series — see recovery.py). This only
 * re-walks the series to find WHICH point to highlight on the chart;
 * it never second-guesses whether a recovery exists.
 */
function findRecoveryPoint(
  series: TrappingSeriesPoint[],
  threshold: number,
  recovery: RecoveryEstimate
): TrappingSeriesPoint | null {
  if (!recovery.withinWindow) return null;
  let seenAbove = false;
  for (const point of series) {
    if (point.trappingIndex === null) continue;
    if (seenAbove && point.trappingIndex < threshold) return point;
    if (point.trappingIndex >= threshold) seenAbove = true;
  }
  return null;
}

export default function TrappingSeriesChart({
  trappingSeries72h,
  trappingThresholdIndex,
  selectedHourIso,
  recovery,
}: TrappingSeriesChartProps) {
  const setHour = useAppStore((state) => state.setHour);

  const hours = trappingSeries72h.map((point) => point.hourIso);
  const axis = getChartXAxisConfig(hours);
  const nightBands = getNightBands(hours);
  const recoveryPoint = findRecoveryPoint(trappingSeries72h, trappingThresholdIndex, recovery);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-neutral-500">Trapping index — 72h forecast</div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={trappingSeries72h}
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
            tick={{ fontSize: 11 }}
            minTickGap={20}
          />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={30} />
          <Tooltip
            labelFormatter={(label) => (typeof label === "string" ? formatIstHourLabel(label) : label)}
            formatter={(value: unknown) => [value === null ? "No data" : `${value}`, "Trapping index"]}
          />

          <ReferenceLine
            y={trappingThresholdIndex}
            stroke="#dc2626"
            strokeDasharray="4 4"
            label={{ value: "Sealed threshold", position: "insideTopRight", fill: "#dc2626", fontSize: 11 }}
          />
          <ReferenceLine
            x={selectedHourIso}
            stroke="#0284c7"
            strokeDasharray="3 3"
            label={{ value: "Selected", position: "top", fill: "#0284c7", fontSize: 11 }}
          />
          {recoveryPoint && recoveryPoint.trappingIndex !== null && (
            <ReferenceDot
              x={recoveryPoint.hourIso}
              y={recoveryPoint.trappingIndex}
              r={6}
              fill="#16a34a"
              stroke="white"
              strokeWidth={2}
            />
          )}

          <Line
            type="monotone"
            dataKey="trappingIndex"
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
