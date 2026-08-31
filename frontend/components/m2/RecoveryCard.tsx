import type { RecoveryEstimate } from "@/lib/contract";

export default function RecoveryCard({ recovery }: { recovery: RecoveryEstimate }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-neutral-500">Episode recovery</div>

      {recovery.withinWindow ? (
        <>
          <div className="text-3xl font-bold text-neutral-900">
            {recovery.estimatedPartOfDay} {recovery.estimatedDay}
          </div>
          {recovery.driver && <p className="mt-2 text-sm text-neutral-700">{recovery.driver}</p>}
          {recovery.uncertaintyNote && (
            <p className="mt-2 text-xs text-neutral-400">{recovery.uncertaintyNote}</p>
          )}
        </>
      ) : (
        <div className="text-2xl font-bold text-neutral-900">
          Not forecast to clear within the next 72 hours
        </div>
      )}
    </div>
  );
}
