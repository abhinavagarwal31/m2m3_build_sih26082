import type { M2Diagnostics, M3Forecast } from "./contract";

async function fetchJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${path}?${query}`);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.detail ?? `Request to ${path} failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchDiagnostics(location: string, hourIso: string): Promise<M2Diagnostics> {
  return fetchJson<M2Diagnostics>("/api/v1/diagnostics", { location, hour: hourIso });
}

export function fetchForecast(location: string, hourIso: string): Promise<M3Forecast> {
  return fetchJson<M3Forecast>("/api/v1/forecast", { location, hour: hourIso });
}
