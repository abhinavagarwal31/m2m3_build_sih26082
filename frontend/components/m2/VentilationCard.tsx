import type { VentilationReading } from "@/lib/contract";
import { VENTILATION_CATEGORY_COLORS } from "@/lib/badgeColors";
import ProvenanceTag from "@/components/ProvenanceTag";

export default function VentilationCard({ ventilation }: { ventilation: VentilationReading }) {
  const canCompute = ventilation.ventilationIndex.value !== null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-neutral-500">Ventilation Index</div>

      {!canCompute ? (
        <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3">
          <div className="text-base font-semibold text-neutral-500">Cannot compute</div>
          <div className="mt-1 text-xs text-neutral-400">
            Wind speed or boundary layer height data unavailable.
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900">{ventilation.ventilationIndex.value}</span>
            <span className="text-sm text-neutral-500">{ventilation.ventilationIndex.unit}</span>
            {ventilation.category && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${VENTILATION_CATEGORY_COLORS[ventilation.category]}`}
              >
                {ventilation.category}
              </span>
            )}
            <ProvenanceTag source={ventilation.ventilationIndex.source} />
          </div>
          <p className="mt-2 text-sm text-neutral-700">Higher values indicate better ventilation.</p>
          {ventilation.interpretation && (
            <p className="mt-1 text-sm text-neutral-700">{ventilation.interpretation}</p>
          )}
        </>
      )}

      <div className="mt-4 space-y-2 border-t border-neutral-100 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-neutral-500">Wind speed</span>
          <span className="flex items-center gap-2 font-medium text-neutral-900">
            {ventilation.windSpeedMs.value !== null
              ? `${ventilation.windSpeedMs.value} ${ventilation.windSpeedMs.unit}`
              : "No data"}
            <ProvenanceTag source={ventilation.windSpeedMs.source} />
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-neutral-500">Boundary layer height</span>
          <span className="flex items-center gap-2 font-medium text-neutral-900">
            {ventilation.boundaryLayerHeightM.value !== null
              ? `${ventilation.boundaryLayerHeightM.value} ${ventilation.boundaryLayerHeightM.unit}`
              : "No data"}
            <ProvenanceTag source={ventilation.boundaryLayerHeightM.source} />
          </span>
        </div>
      </div>

      {ventilation.typicalBoundaryLayerHeightM.value !== null && (
        <div className="mt-3 text-xs text-neutral-400">
          Typically ~{ventilation.typicalBoundaryLayerHeightM.value} {ventilation.typicalBoundaryLayerHeightM.unit}
        </div>
      )}
    </div>
  );
}
