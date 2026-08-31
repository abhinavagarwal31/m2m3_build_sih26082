import type { PollutantReading } from "@/lib/contract";
import { POLLUTANT_CATEGORY_COLORS } from "@/lib/badgeColors";
import ProvenanceTag from "@/components/ProvenanceTag";
import { formatIstHourLabel } from "@/lib/time";

function PollutantSlot({ label, reading }: { label: string; reading: PollutantReading }) {
  const hasValue = reading.reading.value !== null;

  return (
    <div className="flex-1 rounded-md border border-neutral-100 p-3">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>

      {hasValue ? (
        <>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900">{reading.reading.value}</span>
            <span className="text-sm text-neutral-500">{reading.reading.unit}</span>
          </div>
          {reading.category && (
            <span
              className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${POLLUTANT_CATEGORY_COLORS[reading.category]}`}
            >
              {reading.category}
            </span>
          )}
        </>
      ) : (
        <div className="text-2xl font-semibold text-neutral-400">Unavailable</div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        <span>{formatIstHourLabel(reading.timestampIso)}</span>
        <ProvenanceTag source={reading.reading.source} label="External source" />
      </div>
    </div>
  );
}

export default function CurrentReadingCard({
  pm25,
  ozone,
}: {
  pm25: PollutantReading;
  ozone: PollutantReading;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-neutral-500">Current air quality</div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <PollutantSlot label="PM2.5" reading={pm25} />
        <PollutantSlot label="O3" reading={ozone} />
      </div>
    </div>
  );
}
