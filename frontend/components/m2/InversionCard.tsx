import type { InversionReading } from "@/lib/contract";
import { INVERSION_CLASSIFICATION_COLORS } from "@/lib/badgeColors";
import ProvenanceTag from "@/components/ProvenanceTag";

export default function InversionCard({ inversion }: { inversion: InversionReading }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-neutral-500">Inversion</div>

      {inversion.present === null ? (
        <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3">
          <div className="text-base font-semibold text-neutral-500">Cannot determine</div>
          <div className="mt-1 text-xs text-neutral-400">Vertical temperature data unavailable.</div>
        </div>
      ) : inversion.present === false ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <div className="text-base font-semibold text-neutral-900">No inversion present</div>
        </div>
      ) : (
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-bold text-neutral-900">{inversion.strength.value}</span>
          <span className="text-sm text-neutral-500">{inversion.strength.unit}</span>
          {inversion.classification && (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${INVERSION_CLASSIFICATION_COLORS[inversion.classification]}`}
            >
              {inversion.classification}
            </span>
          )}
          <ProvenanceTag source={inversion.strength.source} />
          <span className="w-full text-xs text-neutral-500">
            Measured over {inversion.verticalSpanM[0]}–{inversion.verticalSpanM[1]} m
          </span>
        </div>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer select-none text-xs font-medium text-neutral-500">
          What is this?
        </summary>
        <p className="mt-2 text-sm text-neutral-600">{inversion.explainerText}</p>
      </details>
    </div>
  );
}
