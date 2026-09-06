import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/storeos/PageHeader";
import { DataTable } from "@/components/storeos/DataTable";
import { RecordFormDialog } from "@/components/storeos/RecordFormDialog";
import { ConfirmDialog } from "@/components/storeos/ConfirmDialog";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/lib/demo/store";
import { onHand, shortLocation, variance } from "@/lib/demo/selectors";
import { num, prettyDate, titleCase } from "@/lib/format";
import type { PhysicalCount } from "@/lib/demo/types";

export const Route = createFileRoute("/inventory/counts/")({
  head: () => ({
    meta: [
      { title: "Physical Inventory Counts — StoreOS" },
      {
        name: "description",
        content: "Count physical stock against system stock at any store or outlet and review the variances found.",
      },
      { property: "og:title", content: "Physical Inventory Counts — StoreOS" },
      { property: "og:description", content: "Count sheets comparing physical stock with system stock, per location." },
    ],
  }),
  component: CountsPage,
});

function CountsPage() {
  const { state, add, remove, update, nextRef, currentUser } = useDemo();
  const navigate = useNavigate();
  const [status, setStatus] = useState("all");
  const [location, setLocation] = useState("all");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PhysicalCount | null>(null);

  const rows = state.counts
    .filter((c) => status === "all" || c.status === status)
    .filter((c) => location === "all" || c.locationId === location);

  const variancesOf = (c: PhysicalCount) => c.lines.filter((l) => l.countedQty !== null && variance(l) !== 0).length;

  return (
    <div>
      <PageHeader
        title="Physical inventory counts"
        subtitle="A count only records what is physically on the shelf against what the system expects. It never moves or corrects stock — approved variances flow to a stock adjustment."
        actions={
          <Button className="gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New count
          </Button>
        }
      />

      <DataTable
        rows={rows}
        exportName="storeos-physical-counts"
        searchText={(c) => `${c.ref} ${c.scope} ${c.countedBy} ${shortLocation(state, c.locationId)}`}
        searchPlaceholder="Search counts by reference or scope…"
        filters={[
          {
            key: "status",
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Draft", value: "draft" },
              { label: "In progress", value: "in_progress" },
              { label: "Submitted", value: "submitted" },
              { label: "Approved", value: "approved" },
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
          { key: "ref", header: "Reference", sortable: true, value: (c) => c.ref },
          { key: "loc", header: "Location", sortable: true, value: (c) => shortLocation(state, c.locationId) },
          { key: "scope", header: "Scope", value: (c) => c.scope },
          { key: "date", header: "Count date", sortable: true, value: (c) => c.countDate, render: (c) => prettyDate(c.countDate) },
          { key: "lines", header: "Lines", align: "right", value: (c) => c.lines.length },
          {
            key: "counted",
            header: "Counted",
            align: "right",
            value: (c) => c.lines.filter((l) => l.countedQty !== null).length,
            render: (c) => `${num(c.lines.filter((l) => l.countedQty !== null).length)} / ${num(c.lines.length)}`,
          },
          {
            key: "var",
            header: "Variances",
            align: "right",
            sortable: true,
            value: (c) => variancesOf(c),
            render: (c) =>
              variancesOf(c) > 0 ? <span className="text-coral font-semibold">{num(variancesOf(c))}</span> : <span>0</span>,
          },
          { key: "by", header: "Counted by", value: (c) => c.countedBy },
          {
            key: "status",
            header: "Status",
            value: (c) => c.status,
            render: (c) => <StatusBadge status={titleCase(c.status.replace("_", " "))} tone={c.status === "approved" ? "lagoon" : c.status === "submitted" ? "amber" : "muted"} />,
          },
        ]}
        onRowClick={(c) => navigate({ to: "/inventory/counts/$countId", params: { countId: c.id } })}
        actions={(c) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0"
              title="Open count sheet"
              onClick={() => navigate({ to: "/inventory/counts/$countId", params: { countId: c.id } })}
            >
              <Eye className="size-3.5" />
            </Button>
            {c.status !== "approved" && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]" onClick={() => setDeleting(c)}>
                Delete
              </Button>
            )}
          </div>
        )}
      />

      <RecordFormDialog
        open={creating}
        onOpenChange={setCreating}
        title="New physical count"
        description="Pick a location and scope. System quantities are captured as a snapshot when the sheet is created."
        fields={[
          {
            name: "locationId",
            label: "Location",
            type: "select",
            required: true,
            options: state.locations.map((l) => ({ label: l.name, value: l.id })),
          },
          { name: "countDate", label: "Count date", type: "date", required: true },
          { name: "scope", label: "Scope", required: true, placeholder: "Full count / Dry store / Cold room" },
          { name: "countedBy", label: "Counted by", required: true },
        ]}
        initial={{ countDate: new Date().toISOString().slice(0, 10), countedBy: currentUser.name, scope: "Full count" }}
        onSubmit={(v) => {
          const lines = state.items.slice(0, 12).map((i) => ({
            itemId: i.id,
            systemQty: onHand(state, i.id, v.locationId),
            countedQty: null,
          }));
          const id = `count-${Date.now()}`;
          add("counts", {
            id,
            ref: nextRef("PC", state.counts.map((c) => c.ref)),
            locationId: v.locationId,
            countDate: v.countDate,
            scope: v.scope,
            status: "in_progress",
            lines,
            countedBy: v.countedBy,
          });
          toast.success("Count sheet created — start entering counted quantities");
          navigate({ to: "/inventory/counts/$countId", params: { countId: id } });
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete count sheet?"
        description={deleting ? `${deleting.ref} and its counted quantities will be discarded.` : ""}
        confirmLabel="Delete count"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          remove("counts", deleting.id, deleting.ref);
          toast.success(`${deleting.ref} deleted`);
          setDeleting(null);
        }}
      />
      <span className="sr-only">{update ? "" : ""}</span>
    </div>
  );
}
