import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { PageHeader, SectionCard } from "@/components/storeos/PageHeader";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { DataTable } from "@/components/storeos/DataTable";
import { Button } from "@/components/ui/button";
import { inr, prettyDate } from "@/lib/format";
import { byId, inventoryValue, lowStockRows, shortLocation } from "@/lib/demo/selectors";

export const Route = createFileRoute("/stores/$storeId")({
  head: () => ({
    meta: [
      { title: "Store detail — StoreOS" },
      { name: "description", content: "Store profile, on-hand stock, supply routes and recent transfer activity." },
      { property: "og:title", content: "Store detail — StoreOS" },
      { property: "og:description", content: "Store profile with stock levels, supply routes and transfer history." },
    ],
  }),
  component: StoreDetail,
});

function StoreDetail() {
  const { storeId } = useParams({ from: "/stores/$storeId" });
  const { state } = useDemo();
  const loc = byId(state.locations, storeId);

  if (!loc) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="font-display text-lg">Location not found</p>
        <Button asChild className="mt-4">
          <Link to="/stores">Back to stores</Link>
        </Button>
      </div>
    );
  }

  const links = state.supplyLinks.filter((s) => s.storeId === loc.id);
  const transfers = state.transfers.filter((t) => t.fromLocationId === loc.id || t.toLocationId === loc.id);
  const levels = state.stockLevels
    .filter((s) => s.locationId === loc.id)
    .map((s) => ({ ...s, item: byId(state.items, s.itemId)! }))
    .filter((s) => s.item);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2 gap-1.5 px-2">
        <Link to={loc.type === "store" ? "/stores" : "/restaurants"}>
          <ArrowLeft className="size-3.5" /> Back
        </Link>
      </Button>
      <PageHeader
        title={loc.name}
        subtitle={`${loc.code} · ${loc.type === "store" ? "Supply store" : "Restaurant"} · ${loc.city}`}
        actions={<StatusBadge status={loc.status} />}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-[12px]">Stock value</p>
          <p className="font-display mt-1 text-[24px]">{inr(inventoryValue(state, loc.id), { compact: true })}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-[12px]">Low stock items</p>
          <p className="font-display mt-1 text-[24px]">{lowStockRows(state, loc.id).length}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-[12px]">Transfers</p>
          <p className="font-display mt-1 text-[24px]">{transfers.length}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-[12px]">Manager</p>
          <p className="mt-1 text-[15px] font-semibold">{loc.manager}</p>
          <p className="text-muted-foreground text-[11px]">{loc.phone}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <SectionCard title="Location details" className="lg:col-span-2">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {(
              [
                ["Address", loc.address],
                ["City", loc.city],
                ["Phone", loc.phone],
                ["Operating hours", `${loc.openTime} – ${loc.closeTime}`],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">{k}</dt>
                <dd className="text-[13px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
        <SectionCard title="Supply routes" meta={`${links.length} outlets served`}>
          <ul className="space-y-2 text-[12px]">
            {links.map((l) => (
              <li key={l.id} className="bg-sun/60 flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>{shortLocation(state, l.restaurantId)}</span>
                <span className="text-muted-foreground">{l.schedule}</span>
              </li>
            ))}
            {links.length === 0 && <li className="text-muted-foreground">No supply routes configured.</li>}
          </ul>
        </SectionCard>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="font-display mb-3 text-[17px]">Stock on hand</h2>
          <DataTable
            rows={levels}
            searchText={(r) => `${r.item.name} ${r.item.sku}`}
            exportName={`stock-${loc.code}`}
            columns={[
              { key: "sku", header: "SKU", sortable: true, value: (r) => r.item.sku },
              { key: "name", header: "Item", sortable: true, value: (r) => r.item.name },
              { key: "unit", header: "Unit", value: (r) => r.item.unit },
              { key: "onHand", header: "On hand", align: "right", sortable: true, value: (r) => r.onHand },
              { key: "reorder", header: "Reorder point", align: "right", value: (r) => r.item.reorderPoint },
              {
                key: "value",
                header: "Value",
                align: "right",
                sortable: true,
                value: (r) => r.onHand * r.item.costPrice,
                render: (r) => inr(r.onHand * r.item.costPrice),
              },
              {
                key: "status",
                header: "Status",
                value: (r) => (r.onHand === 0 ? "out of stock" : r.onHand <= r.item.reorderPoint ? "low" : "in stock"),
                render: (r) => (
                  <StatusBadge status={r.onHand === 0 ? "out of stock" : r.onHand <= r.item.reorderPoint ? "low" : "in stock"} />
                ),
              },
            ]}
          />
        </div>

        <div>
          <h2 className="font-display mb-3 text-[17px]">Transfer activity</h2>
          <DataTable
            rows={transfers}
            searchText={(t) => t.ref}
            columns={[
              { key: "ref", header: "Reference", sortable: true, value: (t) => t.ref },
              {
                key: "route",
                header: "Route",
                value: (t) => `${shortLocation(state, t.fromLocationId)} → ${shortLocation(state, t.toLocationId)}`,
              },
              { key: "date", header: "Created", sortable: true, value: (t) => t.createdDate, render: (t) => prettyDate(t.createdDate) },
              { key: "value", header: "Value", align: "right", sortable: true, value: (t) => t.value, render: (t) => inr(t.value) },
              { key: "status", header: "Status", value: (t) => t.status, render: (t) => <StatusBadge status={t.status} /> },
            ]}
            actions={(t) => (
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
                <Link to="/transfers/$transferId" params={{ transferId: t.id }}>
                  View
                </Link>
              </Button>
            )}
          />
        </div>
      </div>
    </div>
  );
}
