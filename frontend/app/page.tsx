"use client";

import ForecastHourSelector from "@/components/ForecastHourSelector";
import QuerySection from "@/components/QuerySection";
import InversionCard from "@/components/m2/InversionCard";
import InversionSeriesChart from "@/components/m2/InversionSeriesChart";
import RecoveryCard from "@/components/m2/RecoveryCard";
import TrappingCard from "@/components/m2/TrappingCard";
import TrappingSeriesChart from "@/components/m2/TrappingSeriesChart";
import CurrentReadingCard from "@/components/m3/CurrentReadingCard";
import PollutantSeriesChart from "@/components/m3/PollutantSeriesChart";
import { useDiagnostics, useForecast, useLocations } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const selectedHourIso = useAppStore((state) => state.selectedHourIso);
  const setLocation = useAppStore((state) => state.setLocation);

  const locationsQuery = useLocations();
  const diagnosticsQuery = useDiagnostics(selectedLocation, selectedHourIso);
  const forecastQuery = useForecast(selectedLocation, selectedHourIso);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 bg-zinc-50 p-6">
      <div className="flex items-center gap-2">
        <label htmlFor="location" className="text-sm font-medium text-neutral-600">
          Location
        </label>
        <select
          id="location"
          value={selectedLocation}
          onChange={(event) => setLocation(event.target.value)}
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
        >
          {(locationsQuery.data ?? [selectedLocation]).filter(Boolean).map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      <ForecastHourSelector />

      <QuerySection label="Trapping index" query={diagnosticsQuery}>
        {(diagnostics) => <TrappingCard trapping={diagnostics.trapping} />}
      </QuerySection>

      <QuerySection label="Trapping forecast" query={diagnosticsQuery}>
        {(diagnostics) => (
          <TrappingSeriesChart
            trappingSeries72h={diagnostics.trappingSeries72h}
            trappingThresholdIndex={diagnostics.trappingThresholdIndex}
            selectedHourIso={selectedHourIso}
            recovery={diagnostics.recovery}
          />
        )}
      </QuerySection>

      <QuerySection label="Inversion" query={diagnosticsQuery}>
        {(diagnostics) => <InversionCard inversion={diagnostics.inversion} />}
      </QuerySection>

      <QuerySection label="Inversion forecast" query={diagnosticsQuery}>
        {(diagnostics) => (
          <InversionSeriesChart
            forwardSeries72h={diagnostics.inversion.forwardSeries72h}
            selectedHourIso={selectedHourIso}
          />
        )}
      </QuerySection>

      <QuerySection label="Recovery estimate" query={diagnosticsQuery}>
        {(diagnostics) => <RecoveryCard recovery={diagnostics.recovery} />}
      </QuerySection>

      <QuerySection label="Current air quality" query={forecastQuery}>
        {(forecast) => <CurrentReadingCard pm25={forecast.pm25} ozone={forecast.ozone} />}
      </QuerySection>

      <QuerySection label="Pollutant forecast" query={forecastQuery}>
        {(forecast) => (
          <PollutantSeriesChart
            series72h={forecast.series72h}
            pm25Peak={forecast.pm25Peak}
            ozonePeak={forecast.ozonePeak}
            pm25Bands={forecast.pm25Bands}
            ozoneBands={forecast.ozoneBands}
            selectedHourIso={selectedHourIso}
          />
        )}
      </QuerySection>
    </div>
  );
}
