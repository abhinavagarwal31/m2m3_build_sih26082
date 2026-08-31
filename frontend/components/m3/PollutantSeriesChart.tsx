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

import type { CategoryBand, PollutantPeak, PollutantSeriesPoint } from "@/lib/contract";
import { POLLUTANT_CATEGORY_FILL } from "@/lib/badgeColors";
import { useAppStore } from "@/lib/store";
import { CHART_Y_AXIS_WIDTH, formatIstHourLabel, getChartXAxisConfig, type ChartXAxisConfig } from "@/lib/time";

interface PollutantSeriesChartProps {
  series72h: PollutantSeriesPoint[];
  pm25Peak: PollutantPeak;
  ozonePeak: PollutantPeak;
  pm25Bands: CategoryBand[];
  ozoneBands: CategoryBand[];
  selectedHourIso: string;
}

interface SinglePollutantChartProps {
  title: string;
  dataKey: "pm25" | "ozone";
  series72h: PollutantSeriesPoint[];
  peak: PollutantPeak;
  bands: CategoryBand[];
  selectedHourIso: string;
  lineColor: string;
  onSelectHour: (hourIso: string) => void;
  axis: ChartXAxisConfig;
}

/**
 * One pollutant, one Y-axis, one set of category bands. PM2.5 and O3 are
 * never mixed on a shared Y-axis — their concentration ranges and band
 * boundaries differ enough that a shared scale would make the background
 * shading mean two different things depending on which line you're
 * reading, which is actively misleading rather than merely cluttered.
 */
function SinglePollutantChart({
  title,
  dataKey,
  series72h,
  peak,
  bands,
  selectedHourIso,
  lineColor,
  onSelectHour,
  axis,
}: SinglePollutantChartProps) {
  const yMax = bands.length > 0 ? Math.max(...bands.map((band) => band.max)) : undefined;

  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">{title}</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={series72h}
          onClick={(nextState) => {
            if (typeof nextState.activeLabel === "string") onSelectHour(nextState.activeLabel);
          }}
        >
          {bands.map((band) => (
            <ReferenceArea
              key={band.label}
              y1={band.min}
              y2={band.max}
              fill={POLLUTANT_CATEGORY_FILL[band.label]}
              fillOpacity={0.5}
            />
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
          <YAxis domain={yMax !== undefined ? [0, yMax] : undefined} tick={{ fontSize: 11 }} width={CHART_Y_AXIS_WIDTH} />
          {/*
            No per-point category shown here: PollutantSeriesPoint carries only
            raw pm25/ozone numbers, and the backend is the sole authority on
            category — the frontend must not independently recompute it (see
            CurrentReadingCard, which shows the backend-computed category for
            the *current* hour). The background band shading still lets a
            hovered point be read against its category visually.
          */}
          <Tooltip
            labelFormatter={(label) => (typeof label === "string" ? formatIstHourLabel(label) : label)}
            formatter={(value: unknown) => [value === null ? "No data" : `${value}`, title]}
          />

          <ReferenceLine
            x={selectedHourIso}
            stroke="#0284c7"
            strokeDasharray="3 3"
            label={{ value: "Selected", position: "top", fill: "#0284c7", fontSize: 11 }}
          />

          <ReferenceDot
            x={peak.hourIso}
            y={peak.value}
            r={5}
            fill={lineColor}
            stroke="white"
            strokeWidth={1.5}
            label={{ value: `Peak: ${peak.value}`, position: "top", fontSize: 10 }}
          />

          <Line
            type="monotone"
            dataKey={dataKey}
            name={dataKey}
            stroke={lineColor}
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

export default function PollutantSeriesChart({
  series72h,
  pm25Peak,
  ozonePeak,
  pm25Bands,
  ozoneBands,
  selectedHourIso,
}: PollutantSeriesChartProps) {
  const setHour = useAppStore((state) => state.setHour);

  const hours = series72h.map((point) => point.hourIso);
  // Computed once and passed to BOTH sub-charts as the same object — not just
  // equal values but the same reference — so PM2.5's and O3's x-axes cannot
  // drift apart from each other, and both stay identical to the trapping and
  // inversion charts too (same shared helper, same underlying hour array).
  const axis = getChartXAxisConfig(hours);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-medium text-neutral-500">Pollutant forecast — 72 hourly points</div>
      <div className="flex flex-col gap-5">
        <SinglePollutantChart
          title="PM2.5"
          dataKey="pm25"
          series72h={series72h}
          peak={pm25Peak}
          bands={pm25Bands}
          selectedHourIso={selectedHourIso}
          lineColor="#0f172a"
          onSelectHour={setHour}
          axis={axis}
        />
        <SinglePollutantChart
          title="O3"
          dataKey="ozone"
          series72h={series72h}
          peak={ozonePeak}
          bands={ozoneBands}
          selectedHourIso={selectedHourIso}
          lineColor="#0369a1"
          onSelectHour={setHour}
          axis={axis}
        />
      </div>
    </div>
  );
}
