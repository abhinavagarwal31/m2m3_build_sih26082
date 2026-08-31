"use client";

import ForecastHourSelector from "@/components/ForecastHourSelector";
import TrappingCard from "@/components/m2/TrappingCard";
import TrappingSeriesChart from "@/components/m2/TrappingSeriesChart";
import InversionCard from "@/components/m2/InversionCard";
import InversionSeriesChart from "@/components/m2/InversionSeriesChart";
import RecoveryCard from "@/components/m2/RecoveryCard";
import CurrentReadingCard from "@/components/m3/CurrentReadingCard";
import { useDiagnostics, useForecast } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const selectedHourIso = useAppStore((state) => state.selectedHourIso);
  const setLocation = useAppStore((state) => state.setLocation);
  const { data: diagnostics } = useDiagnostics(selectedLocation, selectedHourIso);
  const { data: forecast } = useForecast(selectedLocation, selectedHourIso);

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
      {diagnostics && (
        <TrappingSeriesChart
          trappingSeries72h={diagnostics.trappingSeries72h}
          trappingThresholdIndex={diagnostics.trappingThresholdIndex}
          selectedHourIso={selectedHourIso}
          recovery={diagnostics.recovery}
        />
      )}
      {diagnostics && <InversionCard inversion={diagnostics.inversion} />}
      {diagnostics && (
        <InversionSeriesChart
          forwardSeries72h={diagnostics.inversion.forwardSeries72h}
          selectedHourIso={selectedHourIso}
        />
      )}
      {diagnostics && <RecoveryCard recovery={diagnostics.recovery} />}
      {forecast && <CurrentReadingCard pm25={forecast.pm25} ozone={forecast.ozone} />}
    </div>
  );
}
