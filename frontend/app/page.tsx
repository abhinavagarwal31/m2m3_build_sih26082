"use client";

import ForecastHourSelector from "@/components/ForecastHourSelector";
import TrappingCard from "@/components/m2/TrappingCard";
import { useDiagnostics } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const selectedHourIso = useAppStore((state) => state.selectedHourIso);
  const setLocation = useAppStore((state) => state.setLocation);
  const { data: diagnostics } = useDiagnostics(selectedLocation, selectedHourIso);

  return (
    <div className="flex flex-1 flex-col gap-4 bg-zinc-50 p-6">
      <div className="flex gap-2">
        {["Anand Vihar", "RK Puram", "Rohini"].map((location) => (
          <button
            key={location}
            onClick={() => setLocation(location)}
            className={`rounded px-3 py-1 text-sm ${
              selectedLocation === location ? "bg-neutral-900 text-white" : "bg-white border"
            }`}
          >
            {location}
          </button>
        ))}
      </div>
      <ForecastHourSelector />
      {diagnostics && <TrappingCard trapping={diagnostics.trapping} />}
    </div>
  );
}
