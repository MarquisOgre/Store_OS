import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/storeos/PageHeader";
import { DataTable } from "@/components/storeos/DataTable";
import { RecordFormDialog } from "@/components/storeos/RecordFormDialog";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/lib/demo/store";
import { byId, restaurants, shortLocation, stores } from "@/lib/demo/selectors";
import { inr, num, prettyDate, titleCase } from "@/lib/format";

export const Route = createFileRoute("/transfers/")({
  head: () => ({
    meta: [
      { title: "Stock Transfers — StoreOS" },
      {
        name: "description",
        content: "Move stock from supply stores to restaurant outlets: request, approve, dispatch and receive with full traceability.",
      },
      { property: "og:title", content: "Stock Transfers — StoreOS" },
      { property: "og:description", content: "Store-to-outlet stock movement with approval, dispatch and receipt steps." },
    ],
  }),
  component: TransfersPage,
});

function TransfersPage() {
  const { state, add, nextRef, currentUser } = useDemo();
  const navigate = useNavigate();
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("all");
  const [creating, setCreating] = useState(false);

  const rows = state.transfers
    .filter((t) => status === "all" || t.status === status)
    .filter((t) => from === "all" || t.fromLocationId === from);

  const counts = {
    pending: state.transfers.filter((t) => t.status === "pending_approval").length,
    approved: state.transfers.filter((t) => t.status === "approved").length,
    dispatched: state.transfers.filter((t) => t.status === "dispatched").length,
    received: state.transfers.filter((t) => t.status === "received").length,
  };

  return (
    <div>
      <PageHeader
        title="Stock transfers"
        subtitle="A transfer only moves stock between two locations. It never counts stock and never corrects a variance."
        actions={
          <Button className="gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New transfer
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Awaiting approval", value: num(counts.pending) },
          { label: "Approved, not dispatched", value: num(counts.approved) },
          { label: "In transit", value: num(counts.dispatched) },
          { label: "Received", value: num(counts.received) },
        ].map((k) => (
          <div key={k.label} className="surface-card p-4">
            <p className="text-muted-foreground text-[12px]">{k.label}</p>
            <p className="font-display mt-1 text-[24px]">{k.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        rows={rows}
        exportName="storeos-stock-transfers"
        searchText={(t) => `${t.ref} ${shortLocation(state, t.fromLocationId)} ${shortLocation(state, t.toLocationId)} ${t.createdBy}`}
        searchPlaceholder="Search transfers by reference or location…"
        filters={[
          {
            key: "status",
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Draft", value: "draft" },
              { label: "Pending approval", value: "pending_approval" },
              { label: "Approved", value: "approved" },
              { label: "Dispatched", value: "dispatched" },
              { label: "Received", value: "received" },
              { label: "Rejected", value: "rejected" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
          {
            key: "from",
            label: "From store",
            value: from,
            onChange: setFrom,
            options: [{ label: "All stores", value: "all" }, ...stores(state).map((s) => ({ label: s.name, value: s.id }))],
          },
        ]}
        columns={[
          { key: "ref", header: "Reference", sortable: true, value: (t) => t.ref },
          { key: "from", header: "From", sortable: true, value: (t) => shortLocation(state, t.fromLocationId) },
          { key: "to", header: "To", sortable: true, value: (t) => shortLocation(state, t.toLocationId) },
          { key: "created", header: "Created", sortable: true, value: (t) => t.createdDate, render: (t) => prettyDate(t.createdDate) },
          { key: "expected", header: "Expected", value: (t) => t.expectedDate, render: (t) => prettyDate(t.expectedDate) },
          { key: "lines", header: "Lines", align: "right", value: (t) => t.lines.length },
          { key: "value", header: "Value", align: "right", sortable: true, value: (t) => t.value, render: (t) => inr(t.value) },
          { key: "by", header: "Raised by", value: (t) => t.createdBy },
          {
            key: "status",
            header: "Status",
            value: (t) => t.status,
            render: (t) => <StatusBadge status={titleCase(t.status.replace("_", " "))} tone={
              t.status === "received" ? "lagoon" : t.status === "dispatched" ? "brand" : t.status === "rejected" || t.status === "cancelled" ? "coral" : "amber"
            } />,
          },
        ]}
        onRowClick={(t) => navigate({ to: "/transfers/$transferId", params: { transferId: t.id } })}
        actions={(t) => (
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            title="View transfer"
            onClick={() => navigate({ to: "/transfers/$transferId", params: { transferId: t.id } })}
          >
            <Eye className="size-3.5" />
          </Button>
        )}
      />

      <RecordFormDialog
        open={creating}
        onOpenChange={setCreating}
        title="New stock transfer"
        description="Raise a transfer request from a supply store to an outlet. Stock moves only when the transfer is received."
        fields={[
          {
            name: "fromLocationId",
            label: "From store",
            type: "select",
            required: true,
            options: stores(state).map((s) => ({ label: s.name, value: s.id })),
          },
          {
            name: "toLocationId",
            label: "To outlet",
            type: "select",
            required: true,
            options: restaurants(state).map((s) => ({ label: s.name, value: s.id })),
          },
          {
            name: "itemId",
            label: "Item",
            type: "select",
            required: true,
            options: state.items.map((i) => ({ label: `${i.name} (${i.unit})`, value: i.id })),
          },
          { name: "qty", label: "Quantity", type: "number", required: true },
          { name: "expectedDate", label: "Expected date", type: "date", required: true },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ]}
        initial={{ expectedDate: new Date().toISOString().slice(0, 10) }}
        allowSaveAndAdd
        onSubmit={(v) => {
          const item = byId(state.items, v.itemId);
          const qty = Number(v.qty);
          const id = `tr-${Date.now()}`;
          add("transfers", {
            id,
            ref: nextRef("TR", state.transfers.map((t) => t.ref)),
            fromLocationId: v.fromLocationId,
            toLocationId: v.toLocationId,
            createdDate: new Date().toISOString().slice(0, 10),
            expectedDate: v.expectedDate,
            status: "pending_approval",
            lines: [{ itemId: v.itemId, qty, rate: item?.costPrice ?? 0 }],
            value: qty * (item?.costPrice ?? 0),
            createdBy: currentUser.name,
            notes: v.notes ?? "",
          });
          toast.success("Transfer raised and sent for approval");
        }}
      />
    </div>
  );
}
