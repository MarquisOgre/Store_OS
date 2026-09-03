import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";

type Tone = "brand" | "lagoon" | "amber" | "coral" | "muted" | "deep";

const TONES: Record<Tone, string> = {
  brand: "bg-brand/10 text-brand",
  lagoon: "bg-lagoon/20 text-brand-deep",
  amber: "bg-amber/30 text-brand-deep",
  coral: "bg-coral/15 text-coral",
  muted: "bg-muted text-muted-foreground",
  deep: "bg-brand-deep/10 text-brand-deep",
};

const MAP: Record<string, Tone> = {
  active: "lagoon",
  inactive: "muted",
  completed: "lagoon",
  complete: "lagoon",
  approved: "lagoon",
  received: "lagoon",
  in_stock: "lagoon",
  draft: "muted",
  pending: "amber",
  pending_approval: "amber",
  in_progress: "amber",
  submitted: "amber",
  dispatched: "brand",
  partial: "amber",
  low: "amber",
  rejected: "coral",
  cancelled: "muted",
  refunded: "coral",
  void: "muted",
  out_of_stock: "coral",
  variance: "coral",
};

export function StatusBadge({ status, tone, className }: { status: string; tone?: Tone; className?: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const resolved = tone ?? MAP[key] ?? "brand";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        TONES[resolved],
        className,
      )}
    >
      {titleCase(status)}
    </span>
  );
}
