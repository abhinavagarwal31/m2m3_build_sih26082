"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { fetchBootstrap, fetchDiagnostics, fetchForecast } from "./api";
import { useAppStore } from "./store";

/**
 * Establishes serverNowIso/selectedHourIso/selectedLocation from the
 * backend's authoritative "now" on app startup — resolves the
 * chicken-and-egg problem where useDiagnostics can't fire until
 * hourIso is set, but hourIso was only ever meant to be set from a
 * successful diagnostics fetch.
 */
export function useBootstrap() {
  const serverNowIso = useAppStore((state) => state.serverNowIso);
  const selectedHourIso = useAppStore((state) => state.selectedHourIso);
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const setServerNow = useAppStore((state) => state.setServerNow);
  const setHour = useAppStore((state) => state.setHour);
  const setLocation = useAppStore((state) => state.setLocation);

  const query = useQuery({
    queryKey: ["bootstrap"],
    queryFn: fetchBootstrap,
  });

  useEffect(() => {
    if (!query.data) return;
    if (serverNowIso === "") setServerNow(query.data.serverNowIso);
    if (selectedHourIso === "") setHour(query.data.serverNowIso);
    if (selectedLocation === "") setLocation(query.data.defaultLocation);
  }, [query.data, serverNowIso, selectedHourIso, selectedLocation, setServerNow, setHour, setLocation]);

  return query;
}

export function useDiagnostics(location: string, hourIso: string) {
  const serverNowIso = useAppStore((state) => state.serverNowIso);
  const selectedHourIso = useAppStore((state) => state.selectedHourIso);
  const setServerNow = useAppStore((state) => state.setServerNow);
  const setHour = useAppStore((state) => state.setHour);

  const query = useQuery({
    queryKey: ["diagnostics", location, hourIso],
    queryFn: () => fetchDiagnostics(location, hourIso),
    enabled: location !== "" && hourIso !== "",
  });

  useEffect(() => {
    if (!query.data) return;
    if (serverNowIso === "") {
      setServerNow(query.data.serverNowIso);
      if (selectedHourIso === "") setHour(query.data.serverNowIso);
    }
  }, [query.data, serverNowIso, selectedHourIso, setServerNow, setHour]);

  return query;
}

export function useForecast(location: string, hourIso: string) {
  return useQuery({
    queryKey: ["forecast", location, hourIso],
    queryFn: () => fetchForecast(location, hourIso),
    enabled: location !== "" && hourIso !== "",
  });
}
