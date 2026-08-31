import type { Provenance, TrappingReading } from "@/lib/contract";
import { TRAPPING_CATEGORY_COLORS } from "@/lib/badgeColors";

function ProvenanceTag({ source }: { source: Provenance }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        source === "computed" ? "bg-sky-100 text-sky-700" : "bg-neutral-100 text-neutral-600"
      }`}
    >
      {source === "computed" ? "Computed by this product" : "External forecast"}
    </span>
  );
}

export default function TrappingCard({ trapping }: { trapping: TrappingReading }) {
  const canCompute = trapping.index.value !== null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-neutral-500">Trapping Index</div>

      {!canCompute ? (
        <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3">
          <div className="text-base font-semibold text-neutral-500">Cannot compute</div>
          <div className="mt-1 text-xs text-neutral-400">Mixing depth or wind data unavailable.</div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900">{trapping.index.value}</span>
            <span className="text-sm text-neutral-500">{trapping.index.unit}</span>
            {trapping.category && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${TRAPPING_CATEGORY_COLORS[trapping.category]}`}
              >
                {trapping.category}
              </span>
            )}
            <ProvenanceTag source={trapping.index.source} />
          </div>
          {trapping.interpretation && (
            <p className="mt-2 text-sm text-neutral-700">{trapping.interpretation}</p>
          )}
        </>
      )}

      <div className="mt-4 space-y-2 border-t border-neutral-100 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-neutral-500">Mixing depth</span>
          <span className="flex items-center gap-2 font-medium text-neutral-900">
            {trapping.mixingDepthM.value !== null
              ? `${trapping.mixingDepthM.value} ${trapping.mixingDepthM.unit}`
              : "No data"}
            <ProvenanceTag source={trapping.mixingDepthM.source} />
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-neutral-500">Wind speed</span>
          <span className="flex items-center gap-2 font-medium text-neutral-900">
            {trapping.windSpeedMs.value !== null
              ? `${trapping.windSpeedMs.value} ${trapping.windSpeedMs.unit}`
              : "No data"}
            <ProvenanceTag source={trapping.windSpeedMs.source} />
          </span>
        </div>
      </div>

      {trapping.typicalMixingDepthM.value !== null && (
        <div className="mt-3 text-xs text-neutral-400">
          Typically ~{trapping.typicalMixingDepthM.value} {trapping.typicalMixingDepthM.unit}
        </div>
      )}
    </div>
  );
}
