"use client";

import { useState } from "react";
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

import type { CategoryBand, PollutantPeak, PollutantSeriesPoint } from "@/lib/contract";
import { POLLUTANT_CATEGORY_FILL } from "@/lib/badgeColors";
import { useAppStore } from "@/lib/store";
import { formatIstHourLabel, getChartXAxisConfig } from "@/lib/time";

interface PollutantSeriesChartProps {
  series72h: PollutantSeriesPoint[];
  pm25Peak: PollutantPeak;
  ozonePeak: PollutantPeak;
  pm25Bands: CategoryBand[];
  ozoneBands: CategoryBand[];
  selectedHourIso: string;
}

type Visibility = "both" | "pm25" | "ozone";

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "pm25", label: "PM2.5" },
  { value: "ozone", label: "O3" },
];

/** Mirrors the backend's trivial band-matching logic — the bands themselves still always come from the API, never hardcoded here. */
function categorize(value: number, bands: CategoryBand[]): string | null {
  for (const band of bands) {
    if (value >= band.min && value < band.max) return band.label;
  }
  return bands.length > 0 ? bands[bands.length - 1].label : null;
}

export default function PollutantSeriesChart({
  series72h,
  pm25Peak,
  ozonePeak,
  pm25Bands,
  ozoneBands,
  selectedHourIso,
}: PollutantSeriesChartProps) {
  const setHour = useAppStore((state) => state.setHour);
  const [visibility, setVisibility] = useState<Visibility>("both");

  const showPm25 = visibility !== "ozone";
  const showOzone = visibility !== "pm25";

  const hours = series72h.map((point) => point.hourIso);
  // CRITICAL: reuses the exact same helper as TrappingSeriesChart/InversionSeriesChart
  // so all 72h charts share pixel-identical domain/ticks/label formatting.
  const axis = getChartXAxisConfig(hours);

  const visibleBands = [...(showPm25 ? pm25Bands : []), ...(showOzone ? ozoneBands : [])];
  const yMax = Math.max(...visibleBands.map((band) => band.max));

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-neutral-500">Pollutant forecast — 72h</div>
        <div className="flex gap-1">
          {VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setVisibility(option.value)}
              className={`rounded px-2 py-1 text-xs font-medium ${
                visibility === option.value ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={series72h}
          onClick={(nextState) => {
            if (typeof nextState.activeLabel === "string") setHour(nextState.activeLabel);
          }}
        >
          {showPm25 &&
            pm25Bands.map((band) => (
              <ReferenceArea
                key={`pm25-${band.label}`}
                y1={band.min}
                y2={band.max}
                fill={POLLUTANT_CATEGORY_FILL[band.label]}
                fillOpacity={0.35}
              />
            ))}
          {showOzone &&
            ozoneBands.map((band) => (
              <ReferenceArea
                key={`ozone-${band.label}`}
                y1={band.min}
                y2={band.max}
                fill={POLLUTANT_CATEGORY_FILL[band.label]}
                fillOpacity={0.2}
              />
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
          <YAxis domain={[0, yMax]} tick={{ fontSize: 11 }} width={35} />
          <Tooltip
            labelFormatter={(label) => (typeof label === "string" ? formatIstHourLabel(label) : label)}
            formatter={(value: unknown, name: unknown) => {
              const isPm25 = name === "pm25";
              const bands = isPm25 ? pm25Bands : ozoneBands;
              const category = typeof value === "number" ? categorize(value, bands) : null;
              const text = value === null ? "No data" : category ? `${value} (${category})` : `${value}`;
              return [text, isPm25 ? "PM2.5" : "O3"];
            }}
          />

          <ReferenceLine
            x={selectedHourIso}
            stroke="#0284c7"
            strokeDasharray="3 3"
            label={{ value: "Selected", position: "top", fill: "#0284c7", fontSize: 11 }}
          />

          {showPm25 && (
            <ReferenceDot
              x={pm25Peak.hourIso}
              y={pm25Peak.value}
              r={5}
              fill="#0f172a"
              stroke="white"
              strokeWidth={1.5}
              label={{ value: `PM2.5 peak: ${pm25Peak.value}`, position: "top", fontSize: 10 }}
            />
          )}
          {showOzone && (
            <ReferenceDot
              x={ozonePeak.hourIso}
              y={ozonePeak.value}
              r={5}
              fill="#0369a1"
              stroke="white"
              strokeWidth={1.5}
              label={{ value: `O3 peak: ${ozonePeak.value}`, position: "top", fontSize: 10 }}
            />
          )}

          {showPm25 && (
            <Line
              type="monotone"
              dataKey="pm25"
              name="pm25"
              stroke="#0f172a"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}
          {showOzone && (
            <Line
              type="monotone"
              dataKey="ozone"
              name="ozone"
              stroke="#0369a1"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
