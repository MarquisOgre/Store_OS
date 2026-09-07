import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/storeos/PageHeader";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { ConfirmDialog } from "@/components/storeos/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemo } from "@/lib/demo/store";
import { byId, locationName, shortLocation } from "@/lib/demo/selectors";
import { inr, num, prettyDate, titleCase } from "@/lib/format";
import type { StockTransfer, TransferStatus } from "@/lib/demo/types";

export const Route = createFileRoute("/transfers/$transferId")({
  head: () => ({
    meta: [
      { title: "Transfer detail — StoreOS" },
      { name: "description", content: "Transfer lines, route, timeline and the approve, dispatch and receive actions." },
      { property: "og:title", content: "Transfer detail — StoreOS" },
      { property: "og:description", content: "Approve, dispatch or receive a stock transfer between locations." },
    ],
  }),
  component: TransferDetail,
});

type Action = "approve" | "reject" | "dispatch" | "receive" | "cancel";

const STEPS: TransferStatus[] = ["pending_approval", "approved", "dispatched", "received"];

function TransferDetail() {
  const { transferId } = useParams({ from: "/transfers/$transferId" });
  const { state, update, add, currentUser } = useDemo();
  const t = byId(state.transfers, transferId);
  const [action, setAction] = useState<Action | null>(null);

  if (!t) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="font-display text-lg">Transfer not found</p>
        <Button asChild className="mt-4">
          <Link to="/transfers">Back to transfers</Link>
        </Button>
      </div>
    );
  }

  const moveStock = (transfer: StockTransfer) => {
    transfer.lines.forEach((line, idx) => {
      const out = state.stockLevels.find((s) => s.itemId === line.itemId && s.locationId === transfer.fromLocationId);
      if (out) update("stockLevels", out.id, { onHand: Math.max(0, out.onHand - line.qty) });
      const into = state.stockLevels.find((s) => s.itemId === line.itemId && s.locationId === transfer.toLocationId);
      if (into) update("stockLevels", into.id, { onHand: into.onHand + line.qty });
      else
        add("stockLevels", {
          id: `sl-${Date.now()}-${idx}`,
          itemId: line.itemId,
          locationId: transfer.toLocationId,
          onHand: line.qty,
        });
      add("movements", {
        id: `mv-out-${Date.now()}-${idx}`,
        date: new Date().toISOString().slice(0, 10),
        itemId: line.itemId,
        locationId: transfer.fromLocationId,
        type: "transfer-out",
        qty: -line.qty,
        ref: transfer.ref,
        user: currentUser.name,
      });
      add("movements", {
        id: `mv-in-${Date.now()}-${idx}`,
        date: new Date().toISOString().slice(0, 10),
        itemId: line.itemId,
        locationId: transfer.toLocationId,
        type: "transfer-in",
        qty: line.qty,
        ref: transfer.ref,
        user: currentUser.name,
      });
    });
  };

  const run = () => {
    if (!action) return;
    if (action === "approve") {
      update("transfers", t.id, { status: "approved" }, t.ref);
      toast.success(`${t.ref} approved`);
    } else if (action === "reject") {
      update("transfers", t.id, { status: "rejected" }, t.ref);
      toast.success(`${t.ref} rejected`);
    } else if (action === "dispatch") {
      update("transfers", t.id, { status: "dispatched" }, t.ref);
      toast.success(`${t.ref} dispatched — in transit`);
    } else if (action === "receive") {
      update("transfers", t.id, { status: "received" }, t.ref);
      moveStock(t);
      toast.success(`${t.ref} received — stock moved to ${shortLocation(state, t.toLocationId)}`);
    } else {
      update("transfers", t.id, { status: "cancelled" }, t.ref);
      toast.success(`${t.ref} cancelled`);
    }
    setAction(null);
  };

  const stepIndex = STEPS.indexOf(t.status);

  const copy: Record<Action, { title: string; description: string; label: string; destructive?: boolean }> = {
    approve: { title: "Approve transfer?", description: `${t.ref} becomes ready for dispatch from ${locationName(state, t.fromLocationId)}.`, label: "Approve" },
    reject: { title: "Reject transfer?", description: `${t.ref} will be rejected and no stock will move.`, label: "Reject", destructive: true },
    dispatch: { title: "Mark as dispatched?", description: `Goods leave ${locationName(state, t.fromLocationId)} and are in transit.`, label: "Dispatch" },
    receive: {
      title: "Receive transfer?",
      description: `Stock moves out of ${locationName(state, t.fromLocationId)} and into ${locationName(state, t.toLocationId)}.`,
      label: "Receive & move stock",
    },
    cancel: { title: "Cancel transfer?", description: `${t.ref} will be cancelled.`, label: "Cancel transfer", destructive: true },
  };

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2 gap-1.5 px-2">
        <Link to="/transfers">
          <ArrowLeft className="size-3.5" /> Back to transfers
        </Link>
      </Button>
      <PageHeader
        title={t.ref}
        subtitle={`${locationName(state, t.fromLocationId)} → ${locationName(state, t.toLocationId)} · raised ${prettyDate(t.createdDate)} by ${t.createdBy}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={titleCase(t.status.replace("_", " "))}
              tone={t.status === "received" ? "lagoon" : t.status === "dispatched" ? "brand" : t.status === "rejected" || t.status === "cancelled" ? "coral" : "amber"}
            />
            {t.status === "pending_approval" && (
              <>
                <Button variant="outline" onClick={() => setAction("reject")}>
                  Reject
                </Button>
                <Button onClick={() => setAction("approve")}>Approve</Button>
              </>
            )}
            {t.status === "approved" && (
              <>
                <Button variant="outline" onClick={() => setAction("cancel")}>
                  Cancel
                </Button>
                <Button onClick={() => setAction("dispatch")}>Dispatch</Button>
              </>
            )}
            {t.status === "dispatched" && <Button onClick={() => setAction("receive")}>Receive at outlet</Button>}
          </div>
        }
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <SectionCard title="Transfer lines" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Line value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {t.lines.map((l) => {
                  const item = byId(state.items, l.itemId);
                  return (
                    <TableRow key={l.itemId}>
                      <TableCell className="font-medium">{item?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{item?.unit}</TableCell>
                      <TableCell className="text-right">{num(l.qty)}</TableCell>
                      <TableCell className="text-right">{inr(l.rate)}</TableCell>
                      <TableCell className="text-right font-medium">{inr(l.qty * l.rate)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">{inr(t.value)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Progress">
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={`grid size-6 place-items-center rounded-full text-[11px] font-semibold ${
                      stepIndex >= i ? "bg-brand text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-[13px] ${stepIndex >= i ? "font-medium" : "text-muted-foreground"}`}>
                    {titleCase(s.replace("_", " "))}
                  </span>
                </li>
              ))}
            </ol>
            {(t.status === "rejected" || t.status === "cancelled") && (
              <p className="text-coral mt-3 text-[12px]">This transfer was {t.status}. No stock moved.</p>
            )}
          </SectionCard>

          <SectionCard title="Details">
            <dl className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Expected</dt>
                <dd>{prettyDate(t.expectedDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lines</dt>
                <dd>{t.lines.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Value</dt>
                <dd>{inr(t.value)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="mt-1">{t.notes || "—"}</dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        title={action ? copy[action].title : ""}
        description={action ? copy[action].description : ""}
        confirmLabel={action ? copy[action].label : "Confirm"}
        destructive={action ? !!copy[action].destructive : false}
        onConfirm={run}
      />
    </div>
  );
}
