import type { Provenance } from "@/lib/contract";

const DEFAULT_LABELS: Record<Provenance, string> = {
  computed: "Computed by this product",
  external: "External forecast",
};

export default function ProvenanceTag({ source, label }: { source: Provenance; label?: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        source === "computed" ? "bg-sky-100 text-sky-700" : "bg-neutral-100 text-neutral-600"
      }`}
    >
      {label ?? DEFAULT_LABELS[source]}
    </span>
  );
}
