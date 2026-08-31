"use client";

import {
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { InversionSeriesPoint } from "@/lib/contract";
import { useAppStore } from "@/lib/store";
import { formatIstHourLabel, getChartXAxisConfig, getNightBands } from "@/lib/time";

interface InversionSeriesChartProps {
  forwardSeries72h: InversionSeriesPoint[];
  selectedHourIso: string;
}

export default function InversionSeriesChart({
  forwardSeries72h,
  selectedHourIso,
}: InversionSeriesChartProps) {
  const setHour = useAppStore((state) => state.setHour);

  const hours = forwardSeries72h.map((point) => point.hourIso);
  const axis = getChartXAxisConfig(hours);
  const nightBands = getNightBands(hours);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-neutral-500">Inversion strength — 72h forecast</div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={forwardSeries72h}
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
          <YAxis tick={{ fontSize: 11 }} width={30} />
          <Tooltip
            labelFormatter={(label) => (typeof label === "string" ? formatIstHourLabel(label) : label)}
            formatter={(value: unknown) => [value === null ? "No data" : `${value}`, "Inversion strength (°C/km)"]}
          />

          <ReferenceLine
            x={selectedHourIso}
            stroke="#0284c7"
            strokeDasharray="3 3"
            label={{ value: "Selected", position: "top", fill: "#0284c7", fontSize: 11 }}
          />

          <Line
            type="monotone"
            dataKey="strengthCPerKm"
            stroke="#7c3aed"
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
