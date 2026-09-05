import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResourcePage } from "@/components/storeos/ResourcePage";
import { SectionCard } from "@/components/storeos/PageHeader";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { useDemo } from "@/lib/demo/store";
import { inventoryValue, restaurants, salesTotal, stores } from "@/lib/demo/selectors";
import { inr } from "@/lib/format";
import type { Location } from "@/lib/demo/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurants & Outlets — StoreOS" },
      { name: "description", content: "Manage restaurant outlets, their supplying store, hours and sales performance." },
      { property: "og:title", content: "Restaurants & Outlets — StoreOS" },
      { property: "og:description", content: "Outlets with supplying store, managers, hours and sales." },
    ],
  }),
  component: RestaurantsPage,
});

function SupplyMatrix() {
  const { state, update, add } = useDemo();
  return (
    <SectionCard
      title="Supply relationships"
      meta="Which store supplies each outlet — change it here and transfers follow the new route."
      className="mb-6"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants(state).map((r) => {
          const link = state.supplyLinks.find((s) => s.restaurantId === r.id);
          return (
            <div key={r.id} className="bg-sun/50 rounded-xl border border-border p-3">
              <p className="text-[13px] font-semibold">{r.name.split(" — ")[0]}</p>
              <p className="text-muted-foreground mb-2 text-[11px]">{r.name.split(" — ")[1] ?? r.city}</p>
              <Select
                value={link?.storeId ?? ""}
                onValueChange={(storeId) => {
                  if (link) update("supplyLinks", link.id, { storeId }, `${r.name} route`);
                  else
                    add("supplyLinks", {
                      id: `sl-${Date.now()}`,
                      storeId,
                      restaurantId: r.id,
                      leadTimeDays: 1,
                      schedule: "Daily 08:00",
                    });
                  toast.success(`${r.name.split(" — ")[0]} is now supplied by ${stores(state).find((s) => s.id === storeId)?.name}`);
                }}
              >
                <SelectTrigger className="h-8 w-full bg-card text-[12px]">
                  <SelectValue placeholder="Select supplying store" />
                </SelectTrigger>
                <SelectContent>
                  {stores(state).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-1.5 text-[11px]">{link?.schedule ?? "No schedule"}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function RestaurantsPage() {
  const { state, add, update, remove } = useDemo();
  const navigate = useNavigate();
  const [status, setStatus] = useState("all");
  const rows = restaurants(state).filter((l) => status === "all" || l.status === status);

  return (
    <ResourcePage<Location>
      title="Restaurants & outlets"
      subtitle="Customer-facing outlets. Stock arrives from a supplying store; sales are recorded here."
      singular="Restaurant"
      rows={rows}
      exportName="storeos-restaurants"
      searchText={(l) => `${l.code} ${l.name} ${l.manager} ${l.city}`}
      filters={[
        {
          key: "status",
          label: "Status",
          value: status,
          onChange: setStatus,
          options: [
            { label: "All statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ],
        },
      ]}
      columns={[
        { key: "code", header: "Code", sortable: true, value: (l) => l.code },
        {
          key: "name",
          header: "Outlet",
          sortable: true,
          value: (l) => l.name,
          render: (l) => (
            <div>
              <p className="text-brand-deep font-semibold">{l.name}</p>
              <p className="text-muted-foreground text-[11px]">{l.address}</p>
            </div>
          ),
        },
        {
          key: "supplier",
          header: "Supplied by",
          value: (l) => {
            const link = state.supplyLinks.find((s) => s.restaurantId === l.id);
            return stores(state).find((s) => s.id === link?.storeId)?.name ?? "—";
          },
        },
        { key: "manager", header: "Manager", sortable: true, value: (l) => l.manager },
        { key: "hours", header: "Hours", value: (l) => `${l.openTime}–${l.closeTime}` },
        {
          key: "sales",
          header: "Sales · 7d",
          align: "right",
          sortable: true,
          value: (l) => salesTotal(state, l.id, 7),
          render: (l) => <span className="font-medium">{inr(salesTotal(state, l.id, 7), { compact: true })}</span>,
        },
        {
          key: "stock",
          header: "Stock value",
          align: "right",
          sortable: true,
          value: (l) => inventoryValue(state, l.id),
          render: (l) => inr(inventoryValue(state, l.id), { compact: true }),
        },
        { key: "status", header: "Status", value: (l) => l.status, render: (l) => <StatusBadge status={l.status} /> },
      ]}
      fields={[
        { name: "code", label: "Outlet code", required: true, placeholder: "R-06" },
        { name: "name", label: "Outlet name", required: true },
        { name: "manager", label: "Manager", required: true },
        { name: "phone", label: "Phone", required: true },
        { name: "address", label: "Address", colSpan: 2 },
        { name: "city", label: "City", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ],
        },
        { name: "openTime", label: "Opens at", placeholder: "11:00" },
        { name: "closeTime", label: "Closes at", placeholder: "23:00" },
      ]}
      toValues={(l) => ({
        code: l.code,
        name: l.name,
        manager: l.manager,
        phone: l.phone,
        address: l.address,
        city: l.city,
        status: l.status,
        openTime: l.openTime,
        closeTime: l.closeTime,
      })}
      onCreate={(v) =>
        add("locations", {
          id: `loc-${Date.now()}`,
          type: "restaurant",
          code: v.code,
          name: v.name,
          manager: v.manager,
          phone: v.phone,
          address: v.address,
          city: v.city,
          status: (v.status as Location["status"]) || "active",
          openTime: v.openTime || "11:00",
          closeTime: v.closeTime || "23:00",
        })
      }
      onUpdate={(row, v) => update("locations", row.id, { ...v, status: v.status as Location["status"] })}
      onDelete={(row) => remove("locations", row.id, row.name)}
      labelOf={(row) => row.name}
      onRowClick={(row) => navigate({ to: "/stores/$storeId", params: { storeId: row.id } })}
      rowActions={(row) => (
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          title="View"
          onClick={() => navigate({ to: "/stores/$storeId", params: { storeId: row.id } })}
        >
          <Eye className="size-3.5" />
        </Button>
      )}
    >
      <SupplyMatrix />
    </ResourcePage>
  );
}
