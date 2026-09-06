import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/storeos/PageHeader";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { ConfirmDialog } from "@/components/storeos/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemo } from "@/lib/demo/store";
import { byId, itemName, shortLocation, variance } from "@/lib/demo/selectors";
import { inr, num, prettyDate, titleCase, downloadCsv } from "@/lib/format";

export const Route = createFileRoute("/inventory/counts/$countId")({
  head: () => ({
    meta: [
      { title: "Count sheet — StoreOS" },
      { name: "description", content: "Enter counted quantities, review variance against system stock and submit for approval." },
      { property: "og:title", content: "Count sheet — StoreOS" },
      { property: "og:description", content: "Counted vs system quantities with variance value and approval actions." },
    ],
  }),
  component: CountDetail,
});

function CountDetail() {
  const { countId } = useParams({ from: "/inventory/counts/$countId" });
  const { state, update, add, nextRef, currentUser } = useDemo();
  const navigate = useNavigate();
  const count = byId(state.counts, countId);
  const [confirm, setConfirm] = useState<"submit" | "approve" | "adjust" | null>(null);

  const lines = count?.lines ?? [];
  const totals = useMemo(() => {
    const counted = lines.filter((l) => l.countedQty !== null).length;
    const varLines = lines.filter((l) => l.countedQty !== null && variance(l) !== 0);
    const value = varLines.reduce((s, l) => s + variance(l) * (byId(state.items, l.itemId)?.costPrice ?? 0), 0);
    return { counted, varCount: varLines.length, value, varLines };
  }, [lines, state.items]);

  if (!count) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="font-display text-lg">Count sheet not found</p>
        <Button asChild className="mt-4">
          <Link to="/inventory/counts">Back to counts</Link>
        </Button>
      </div>
    );
  }

  const locked = count.status === "approved";

  const setCounted = (itemId: string, raw: string) => {
    const next = count.lines.map((l) =>
      l.itemId === itemId ? { ...l, countedQty: raw === "" ? null : Number(raw) } : l,
    );
    update("counts", count.id, { lines: next, status: count.status === "draft" ? "in_progress" : count.status }, count.ref);
  };

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2 gap-1.5 px-2">
        <Link to="/inventory/counts">
          <ArrowLeft className="size-3.5" /> Back to counts
        </Link>
      </Button>
      <PageHeader
        title={count.ref}
        subtitle={`${shortLocation(state, count.locationId)} · ${count.scope} · counted ${prettyDate(count.countDate)} by ${count.countedBy}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={titleCase(count.status.replace("_", " "))}
              tone={count.status === "approved" ? "lagoon" : count.status === "submitted" ? "amber" : "muted"}
            />
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  `${count.ref}-sheet`,
                  count.lines.map((l) => ({
                    item: itemName(state, l.itemId),
                    system: l.systemQty,
                    counted: l.countedQty ?? "",
                    variance: l.countedQty === null ? "" : variance(l),
                  })),
                )
              }
            >
              Export sheet
            </Button>
            {count.status === "in_progress" && (
              <Button onClick={() => setConfirm("submit")} disabled={totals.counted === 0}>
                Submit for approval
              </Button>
            )}
            {count.status === "submitted" && <Button onClick={() => setConfirm("approve")}>Approve count</Button>}
            {count.status === "approved" && totals.varCount > 0 && (
              <Button onClick={() => setConfirm("adjust")}>Raise stock adjustments</Button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Lines on sheet", value: num(lines.length) },
          { label: "Counted", value: `${num(totals.counted)} / ${num(lines.length)}` },
          { label: "Variance lines", value: num(totals.varCount) },
          { label: "Variance value", value: inr(totals.value) },
        ].map((k) => (
          <div key={k.label} className="surface-card p-4">
            <p className="text-muted-foreground text-[12px]">{k.label}</p>
            <p className="font-display mt-1 text-[24px]">{k.value}</p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Count sheet"
        meta={locked ? "Approved counts are read-only." : "Enter the physical quantity for each item. Blank means not counted yet."}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">System qty</TableHead>
                <TableHead className="text-right">Counted qty</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Variance value</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => {
                const item = byId(state.items, l.itemId);
                const v = l.countedQty === null ? null : variance(l);
                return (
                  <TableRow key={l.itemId}>
                    <TableCell className="font-medium">{item?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item?.unit}</TableCell>
                    <TableCell className="text-right">{num(l.systemQty)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={l.countedQty ?? ""}
                        disabled={locked}
                        onChange={(e) => setCounted(l.itemId, e.target.value)}
                        className="ml-auto h-8 w-24 text-right"
                        placeholder="—"
                      />
                    </TableCell>
                    <TableCell className={`text-right font-medium ${v && v !== 0 ? "text-coral" : ""}`}>
                      {v === null ? "—" : v > 0 ? `+${num(v)}` : num(v)}
                    </TableCell>
                    <TableCell className="text-right">
                      {v === null ? "—" : inr(v * (item?.costPrice ?? 0))}
                    </TableCell>
                    <TableCell>
                      {v === null ? (
                        <StatusBadge status="Not counted" tone="muted" />
                      ) : v === 0 ? (
                        <StatusBadge status="Match" tone="lagoon" />
                      ) : (
                        <StatusBadge status="Variance" tone="coral" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={confirm === "submit"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Submit count for approval?"
        description={`${count.ref} will be locked for review with ${totals.varCount} variance line(s).`}
        confirmLabel="Submit count"
        onConfirm={() => {
          update("counts", count.id, { status: "submitted" }, count.ref);
          toast.success(`${count.ref} submitted for approval`);
          setConfirm(null);
        }}
      />

      <ConfirmDialog
        open={confirm === "approve"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Approve this count?"
        description="Approving records the count as final. Stock is not changed — raise stock adjustments to correct the variance."
        confirmLabel="Approve count"
        onConfirm={() => {
          update("counts", count.id, { status: "approved" }, count.ref);
          toast.success(`${count.ref} approved`);
          setConfirm(null);
        }}
      />

      <ConfirmDialog
        open={confirm === "adjust"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Raise stock adjustments?"
        description={`${totals.varCount} adjustment(s) will be created as pending approval, referencing ${count.ref}.`}
        confirmLabel="Raise adjustments"
        onConfirm={() => {
          const refs = state.adjustments.map((a) => a.ref);
          totals.varLines.forEach((l, idx) => {
            add("adjustments", {
              id: `adj-${Date.now()}-${idx}`,
              ref: nextRef("ADJ", [...refs, ...Array.from({ length: idx }, (_, i) => `ADJ-${9000 + i}`)]),
              locationId: count.locationId,
              countRef: count.ref,
              itemId: l.itemId,
              adjustmentDate: new Date().toISOString().slice(0, 10),
              qty: variance(l),
              reason: `Variance from physical count ${count.ref}`,
              status: "pending",
              raisedBy: currentUser.name,
              approvedBy: null,
            });
          });
          toast.success(`${totals.varCount} stock adjustment(s) raised`);
          setConfirm(null);
          navigate({ to: "/inventory/adjustments" });
        }}
      />
    </div>
  );
}
