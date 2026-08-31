import type { ReactNode } from "react";

interface MinimalQueryState<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/**
 * Renders a per-section loading skeleton or error state around a
 * query's data — deliberately NOT one global spinner. Each mounted
 * instance reflects only its own query's status, so one section
 * failing (e.g. an unknown location) never blocks the others.
 *
 * Uses isPending/data rather than TanStack Query's placeholderData,
 * so a location/hour change clears the section to loading immediately
 * instead of briefly showing the previous selection's stale data.
 */
export default function QuerySection<T>({
  label,
  query,
  children,
}: {
  label: string;
  query: MinimalQueryState<T>;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) {
    return (
      <div className="animate-pulse rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 h-3 w-28 rounded bg-neutral-200" />
        <div className="h-8 w-40 rounded bg-neutral-200" />
      </div>
    );
  }

  if (query.isError || query.data === undefined) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <span className="font-medium">{label}</span> failed to load: {errorMessage(query.error)}
      </div>
    );
  }

  return <>{children(query.data)}</>;
}
