import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/storeos/PageHeader";
import { DataTable } from "@/components/storeos/DataTable";
import { RecordFormDialog } from "@/components/storeos/RecordFormDialog";
import { ConfirmDialog } from "@/components/storeos/ConfirmDialog";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/lib/demo/store";
import { byId, itemName, shortLocation } from "@/lib/demo/selectors";
import { inr, num, prettyDate } from "@/lib/format";
import type { StockAdjustment } from "@/lib/demo/types";

export const Route = createFileRoute("/inventory/adjustments")({
  head: () => ({
    meta: [
      { title: "Stock Adjustments — StoreOS" },
      {
        name: "description",
        content: "Correct approved stock variances with an auditable adjustment: raise, approve or reject and update stock.",
      },
      { property: "og:title", content: "Stock Adjustments — StoreOS" },
      { property: "og:description", content: "Approve or reject stock corrections raised from physical counts and wastage." },
    ],
  }),
  component: AdjustmentsPage,
});

const REASONS = [
  "Variance from physical count",
  "Wastage / spoilage",
  "Breakage",
  "Data entry correction",
  "Staff meal consumption",
  "Supplier short supply",
];

function AdjustmentsPage() {
  const { state, add, update, remove, nextRef, currentUser } = useDemo();
  const [status, setStatus] = useState("all");
  const [location, setLocation] = useState("all");
  const [form, setForm] = useState<{ open: boolean; row?: StockAdjustment }>({ open: false });
  const [decision, setDecision] = useState<{ row: StockAdjustment; kind: "approve" | "reject" } | null>(null);
  const [deleting, setDeleting] = useState<StockAdjustment | null>(null);

  const rows = state.adjustments
    .filter((a) => status === "all" || a.status === status)
    .filter((a) => location === "all" || a.locationId === location);

  const applyStock = (a: StockAdjustment) => {
    const level = state.stockLevels.find((s) => s.itemId === a.itemId && s.locationId === a.locationId);
    if (level) update("stockLevels", level.id, { onHand: Math.max(0, level.onHand + a.qty) }, itemName(state, a.itemId));
    else
      add("stockLevels", {
        id: `sl-${Date.now()}`,
        itemId: a.itemId,
        locationId: a.locationId,
        onHand: Math.max(0, a.qty),
      });
    add("movements", {
      id: `mv-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      itemId: a.itemId,
      locationId: a.locationId,
      type: "adjustment",
      qty: a.qty,
      ref: a.ref,
      user: currentUser.name,
    });
  };

  const value = (a: StockAdjustment) => a.qty * (byId(state.items, a.itemId)?.costPrice ?? 0);

  return (
    <div>
      <PageHeader
        title="Stock adjustments"
        subtitle="An adjustment is the only document that corrects stock. It always carries a reason and, where relevant, the count it came from."
        actions={
          <Button className="gap-1.5" onClick={() => setForm({ open: true })}>
            <Plus className="size-4" /> New adjustment
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending approval", value: num(state.adjustments.filter((a) => a.status === "pending").length) },
          { label: "Approved", value: num(state.adjustments.filter((a) => a.status === "approved").length) },
          { label: "Rejected", value: num(state.adjustments.filter((a) => a.status === "rejected").length) },
          {
            label: "Net value impact",
            value: inr(state.adjustments.filter((a) => a.status === "approved").reduce((s, a) => s + value(a), 0)),
          },
        ].map((k) => (
          <div key={k.label} className="surface-card p-4">
            <p className="text-muted-foreground text-[12px]">{k.label}</p>
            <p className="font-display mt-1 text-[24px]">{k.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        rows={rows}
        exportName="storeos-stock-adjustments"
        searchText={(a) => `${a.ref} ${itemName(state, a.itemId)} ${a.reason} ${a.raisedBy} ${a.countRef ?? ""}`}
        searchPlaceholder="Search adjustments…"
        filters={[
          {
            key: "status",
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
            ],
          },
          {
            key: "loc",
            label: "Location",
            value: location,
            onChange: setLocation,
            options: [{ label: "All locations", value: "all" }, ...state.locations.map((l) => ({ label: l.name, value: l.id }))],
          },
        ]}
        columns={[
          { key: "ref", header: "Reference", sortable: true, value: (a) => a.ref },
          { key: "date", header: "Date", sortable: true, value: (a) => a.adjustmentDate, render: (a) => prettyDate(a.adjustmentDate) },
          { key: "loc", header: "Location", sortable: true, value: (a) => shortLocation(state, a.locationId) },
          { key: "item", header: "Item", sortable: true, value: (a) => itemName(state, a.itemId) },
          {
            key: "qty",
            header: "Qty",
            align: "right",
            sortable: true,
            value: (a) => a.qty,
            render: (a) => (
              <span className={a.qty < 0 ? "text-coral font-medium" : "font-medium"}>{a.qty > 0 ? `+${num(a.qty)}` : num(a.qty)}</span>
            ),
          },
          { key: "value", header: "Value", align: "right", sortable: true, value: (a) => value(a), render: (a) => inr(value(a)) },
          { key: "reason", header: "Reason", value: (a) => a.reason },
          { key: "count", header: "From count", value: (a) => a.countRef ?? "—" },
          { key: "by", header: "Raised by", value: (a) => a.raisedBy },
          { key: "status", header: "Status", value: (a) => a.status, render: (a) => <StatusBadge status={a.status} /> },
        ]}
        actions={(a) => (
          <div className="flex justify-end gap-1">
            {a.status === "pending" ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand size-7 p-0"
                  title="Approve"
                  onClick={() => setDecision({ row: a, kind: "approve" })}
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-coral size-7 p-0"
                  title="Reject"
                  onClick={() => setDecision({ row: a, kind: "reject" })}
                >
                  <X className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]" onClick={() => setForm({ open: true, row: a })}>
                  Edit
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]" onClick={() => setDeleting(a)}>
                Delete
              </Button>
            )}
          </div>
        )}
      />

      <RecordFormDialog
        open={form.open}
        onOpenChange={(open) => setForm({ open, row: open ? form.row : undefined })}
        title={form.row ? "Edit adjustment" : "New stock adjustment"}
        description={form.row ? undefined : "Positive quantity increases stock, negative reduces it. Stock changes only once approved."}
        allowSaveAndAdd={!form.row}
        fields={[
          {
            name: "locationId",
            label: "Location",
            type: "select",
            required: true,
            options: state.locations.map((l) => ({ label: l.name, value: l.id })),
          },
          {
            name: "itemId",
            label: "Item",
            type: "select",
            required: true,
            options: state.items.map((i) => ({ label: `${i.name} (${i.unit})`, value: i.id })),
          },
          { name: "qty", label: "Adjustment qty (+/-)", type: "number", required: true },
          { name: "adjustmentDate", label: "Date", type: "date", required: true },
          { name: "reason", label: "Reason", type: "select", required: true, options: REASONS.map((r) => ({ label: r, value: r })) },
          { name: "countRef", label: "Count reference (optional)" },
        ]}
        initial={
          form.row
            ? {
                locationId: form.row.locationId,
                itemId: form.row.itemId,
                qty: String(form.row.qty),
                adjustmentDate: form.row.adjustmentDate,
                reason: form.row.reason,
                countRef: form.row.countRef ?? "",
              }
            : { adjustmentDate: new Date().toISOString().slice(0, 10), reason: REASONS[1] }
        }
        onSubmit={(v) => {
          const payload = {
            locationId: v.locationId,
            itemId: v.itemId,
            qty: Number(v.qty),
            adjustmentDate: v.adjustmentDate,
            reason: v.reason,
            countRef: v.countRef ? v.countRef : null,
          };
          if (form.row) {
            update("adjustments", form.row.id, payload, form.row.ref);
            toast.success(`${form.row.ref} updated`);
          } else {
            add("adjustments", {
              id: `adj-${Date.now()}`,
              ref: nextRef("ADJ", state.adjustments.map((a) => a.ref)),
              status: "pending",
              raisedBy: currentUser.name,
              approvedBy: null,
              ...payload,
            });
            toast.success("Adjustment raised for approval");
          }
        }}
      />

      <ConfirmDialog
        open={!!decision}
        onOpenChange={(o) => !o && setDecision(null)}
        title={decision?.kind === "approve" ? "Approve adjustment?" : "Reject adjustment?"}
        description={
          decision
            ? decision.kind === "approve"
              ? `${decision.row.ref} will correct stock of ${itemName(state, decision.row.itemId)} at ${shortLocation(state, decision.row.locationId)} by ${decision.row.qty}.`
              : `${decision.row.ref} will be rejected and stock left unchanged.`
            : ""
        }
        confirmLabel={decision?.kind === "approve" ? "Approve & correct stock" : "Reject adjustment"}
        destructive={decision?.kind === "reject"}
        onConfirm={() => {
          if (!decision) return;
          if (decision.kind === "approve") {
            update("adjustments", decision.row.id, { status: "approved", approvedBy: currentUser.name }, decision.row.ref);
            applyStock(decision.row);
            toast.success(`${decision.row.ref} approved — stock corrected`);
          } else {
            update("adjustments", decision.row.id, { status: "rejected", approvedBy: currentUser.name }, decision.row.ref);
            toast.success(`${decision.row.ref} rejected`);
          }
          setDecision(null);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete adjustment record?"
        description={deleting ? `${deleting.ref} will be removed from the demo dataset.` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          remove("adjustments", deleting.id, deleting.ref);
          toast.success(`${deleting.ref} deleted`);
          setDeleting(null);
        }}
      />
    </div>
  );
}
