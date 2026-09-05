import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourcePage } from "@/components/storeos/ResourcePage";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { useDemo } from "@/lib/demo/store";
import { inventoryValue, stores } from "@/lib/demo/selectors";
import { inr } from "@/lib/format";
import type { Location } from "@/lib/demo/types";

export const Route = createFileRoute("/stores/")({
  head: () => ({
    meta: [
      { title: "Stores & Warehouses — StoreOS" },
      { name: "description", content: "Manage supply stores: contacts, managers, operating hours and stock value." },
      { property: "og:title", content: "Stores & Warehouses — StoreOS" },
      { property: "og:description", content: "Supply stores with managers, hours and on-hand stock value." },
    ],
  }),
  component: StoresPage,
});

const FIELDS = [
  { name: "code", label: "Store code", required: true, placeholder: "CS-04" },
  { name: "name", label: "Store name", required: true },
  { name: "manager", label: "Manager", required: true },
  { name: "phone", label: "Phone", required: true },
  { name: "address", label: "Address", colSpan: 2 as const },
  { name: "city", label: "City", required: true },
  {
    name: "status",
    label: "Status",
    type: "select" as const,
    required: true,
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
  { name: "openTime", label: "Opens at", placeholder: "06:00" },
  { name: "closeTime", label: "Closes at", placeholder: "20:00" },
];

function StoresPage() {
  const { state, add, update, remove } = useDemo();
  const navigate = useNavigate();
  const [status, setStatus] = useState("all");

  const rows = stores(state).filter((l) => status === "all" || l.status === status);

  return (
    <ResourcePage<Location>
      title="Stores & warehouses"
      subtitle="Purchasing happens here. Stores supply the restaurants through stock transfers."
      singular="Store"
      rows={rows}
      exportName="storeos-stores"
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
          header: "Store",
          sortable: true,
          value: (l) => l.name,
          render: (l) => (
            <div>
              <p className="text-brand-deep font-semibold">{l.name}</p>
              <p className="text-muted-foreground text-[11px]">{l.address}</p>
            </div>
          ),
        },
        { key: "manager", header: "Manager", sortable: true, value: (l) => l.manager },
        { key: "phone", header: "Phone", value: (l) => l.phone },
        {
          key: "hours",
          header: "Hours",
          value: (l) => `${l.openTime}–${l.closeTime}`,
        },
        {
          key: "outlets",
          header: "Outlets served",
          align: "right",
          value: (l) => state.supplyLinks.filter((s) => s.storeId === l.id).length,
        },
        {
          key: "value",
          header: "Stock value",
          align: "right",
          sortable: true,
          value: (l) => inventoryValue(state, l.id),
          render: (l) => <span className="font-medium">{inr(inventoryValue(state, l.id), { compact: true })}</span>,
        },
        {
          key: "status",
          header: "Status",
          value: (l) => l.status,
          render: (l) => <StatusBadge status={l.status} />,
        },
      ]}
      fields={FIELDS}
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
          type: "store",
          code: v.code,
          name: v.name,
          manager: v.manager,
          phone: v.phone,
          address: v.address,
          city: v.city,
          status: (v.status as Location["status"]) || "active",
          openTime: v.openTime || "07:00",
          closeTime: v.closeTime || "20:00",
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
    />
  );
}
