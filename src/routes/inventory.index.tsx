import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/storeos/PageHeader";
import { DataTable } from "@/components/storeos/DataTable";
import { RecordFormDialog } from "@/components/storeos/RecordFormDialog";
import { ConfirmDialog } from "@/components/storeos/ConfirmDialog";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/store";
import { inr, num, prettyDate, titleCase } from "@/lib/format";
import {
  byId,
  categoryName,
  inventoryValue,
  itemName,
  lowStockRows,
  onHand,
  shortLocation,
} from "@/lib/demo/selectors";
import type { Category, Item } from "@/lib/demo/types";

export const Route = createFileRoute("/inventory/")({
  head: () => ({
    meta: [
      { title: "Inventory — Items & Stock — StoreOS" },
      {
        name: "description",
        content: "Item master, stock on hand by location, categories and every stock movement in one place.",
      },
      { property: "og:title", content: "Inventory — Items & Stock — StoreOS" },
      { property: "og:description", content: "Item master, per-location stock, categories and movement history." },
    ],
  }),
  component: InventoryPage,
});

const UNITS = ["kg", "g", "litre", "ml", "pcs", "packet", "bottle", "box", "dozen"];

function InventoryPage() {
  const { state, activeLocationId, add, update, remove } = useDemo();
  const scope = activeLocationId;

  const [itemForm, setItemForm] = useState<{ open: boolean; row?: Item }>({ open: false });
  const [catForm, setCatForm] = useState<{ open: boolean; row?: Category }>({ open: false });
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [category, setCategory] = useState("all");
  const [stockState, setStockState] = useState("all");
  const [moveType, setMoveType] = useState("all");

  const itemFields = [
    { name: "sku", label: "SKU", required: true, placeholder: "SKU-1042" },
    { name: "name", label: "Item name", required: true },
    {
      name: "categoryId",
      label: "Category",
      type: "select" as const,
      required: true,
      options: state.categories.map((c) => ({ label: c.name, value: c.id })),
    },
    {
      name: "unit",
      label: "Unit",
      type: "select" as const,
      required: true,
      options: UNITS.map((u) => ({ label: u, value: u })),
    },
    { name: "costPrice", label: "Cost price (₹)", type: "number" as const, required: true },
    { name: "sellPrice", label: "Sell price (₹)", type: "number" as const, required: true },
    { name: "reorderPoint", label: "Reorder point", type: "number" as const, required: true },
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
  ];

  const items = state.items.filter((i) => category === "all" || i.categoryId === category);

  const stockRows = state.items
    .map((i) => {
      const qty = onHand(state, i.id, scope);
      return {
        id: `${i.id}-stock`,
        item: i,
        qty,
        state: qty === 0 ? "out of stock" : qty <= i.reorderPoint ? "low" : "in stock",
      };
    })
    .filter((r) => stockState === "all" || r.state === stockState);

  const movements = state.movements
    .filter((m) => scope === "all" || m.locationId === scope)
    .filter((m) => moveType === "all" || m.type === moveType);

  const kpis = [
    { label: "Items tracked", value: num(state.items.length) },
    { label: "Stock value", value: inr(inventoryValue(state, scope), { compact: true }) },
    { label: "Low / out of stock", value: num(lowStockRows(state, scope).length) },
    { label: "Categories", value: num(state.categories.length) },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock exists independently at every location. Movements are recorded, never overwritten."
        actions={
          <Button onClick={() => setItemForm({ open: true })} className="gap-1.5">
            <Plus className="size-4" /> New item
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="surface-card p-4">
            <p className="text-muted-foreground text-[12px]">{k.label}</p>
            <p className="font-display mt-1 text-[24px]">{k.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="items">
        <TabsList className="mb-4">
          <TabsTrigger value="items">Item master</TabsTrigger>
          <TabsTrigger value="stock">Stock on hand</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <DataTable
            rows={items}
            exportName="storeos-items"
            searchText={(i) => `${i.sku} ${i.name} ${categoryName(state, i.categoryId)}`}
            searchPlaceholder="Search items by name or SKU…"
            filters={[
              {
                key: "cat",
                label: "Category",
                value: category,
                onChange: setCategory,
                options: [{ label: "All categories", value: "all" }, ...state.categories.map((c) => ({ label: c.name, value: c.id }))],
              },
            ]}
            columns={[
              { key: "sku", header: "SKU", sortable: true, value: (i) => i.sku },
              { key: "name", header: "Item", sortable: true, value: (i) => i.name },
              { key: "cat", header: "Category", sortable: true, value: (i) => categoryName(state, i.categoryId) },
              { key: "unit", header: "Unit", value: (i) => i.unit },
              { key: "cost", header: "Cost", align: "right", sortable: true, value: (i) => i.costPrice, render: (i) => inr(i.costPrice) },
              { key: "sell", header: "Sell", align: "right", sortable: true, value: (i) => i.sellPrice, render: (i) => inr(i.sellPrice) },
              { key: "reorder", header: "Reorder pt", align: "right", value: (i) => i.reorderPoint },
              {
                key: "onhand",
                header: "On hand",
                align: "right",
                sortable: true,
                value: (i) => onHand(state, i.id, scope),
                render: (i) => num(onHand(state, i.id, scope)),
              },
              { key: "status", header: "Status", value: (i) => i.status, render: (i) => <StatusBadge status={i.status} /> },
            ]}
            actions={(i) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" className="size-7 p-0" title="Edit" onClick={() => setItemForm({ open: true, row: i })}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-coral size-7 p-0" title="Delete" onClick={() => setDeleteItem(i)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="stock">
          <DataTable
            rows={stockRows}
            exportName="storeos-stock-on-hand"
            searchText={(r) => `${r.item.sku} ${r.item.name}`}
            filters={[
              {
                key: "state",
                label: "Stock state",
                value: stockState,
                onChange: setStockState,
                options: [
                  { label: "All stock", value: "all" },
                  { label: "In stock", value: "in stock" },
                  { label: "Low", value: "low" },
                  { label: "Out of stock", value: "out of stock" },
                ],
              },
            ]}
            columns={[
              { key: "sku", header: "SKU", sortable: true, value: (r) => r.item.sku },
              { key: "name", header: "Item", sortable: true, value: (r) => r.item.name },
              { key: "cat", header: "Category", value: (r) => categoryName(state, r.item.categoryId) },
              { key: "qty", header: "On hand", align: "right", sortable: true, value: (r) => r.qty, render: (r) => `${num(r.qty)} ${r.item.unit}` },
              { key: "reorder", header: "Reorder pt", align: "right", value: (r) => r.item.reorderPoint },
              {
                key: "value",
                header: "Value",
                align: "right",
                sortable: true,
                value: (r) => r.qty * r.item.costPrice,
                render: (r) => inr(r.qty * r.item.costPrice),
              },
              { key: "state", header: "Status", value: (r) => r.state, render: (r) => <StatusBadge status={r.state} /> },
            ]}
          />
        </TabsContent>

        <TabsContent value="categories">
          <DataTable
            rows={state.categories}
            exportName="storeos-categories"
            searchText={(c) => `${c.name} ${c.description}`}
            toolbar={
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCatForm({ open: true })}>
                <Plus className="size-3.5" /> New category
              </Button>
            }
            columns={[
              { key: "name", header: "Category", sortable: true, value: (c) => c.name },
              { key: "desc", header: "Description", value: (c) => c.description },
              {
                key: "items",
                header: "Items",
                align: "right",
                sortable: true,
                value: (c) => state.items.filter((i) => i.categoryId === c.id).length,
              },
            ]}
            actions={(c) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" className="size-7 p-0" title="Edit" onClick={() => setCatForm({ open: true, row: c })}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-coral size-7 p-0" title="Delete" onClick={() => setDeleteCat(c)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="movements">
          <DataTable
            rows={movements}
            exportName="storeos-movements"
            searchText={(m) => `${m.ref} ${itemName(state, m.itemId)} ${m.user}`}
            filters={[
              {
                key: "type",
                label: "Movement type",
                value: moveType,
                onChange: setMoveType,
                options: [
                  { label: "All types", value: "all" },
                  { label: "Purchase", value: "purchase" },
                  { label: "Transfer out", value: "transfer-out" },
                  { label: "Transfer in", value: "transfer-in" },
                  { label: "Sale", value: "sale" },
                  { label: "Adjustment", value: "adjustment" },
                  { label: "Wastage", value: "wastage" },
                ],
              },
            ]}
            columns={[
              { key: "date", header: "Date", sortable: true, value: (m) => m.date, render: (m) => prettyDate(m.date) },
              { key: "ref", header: "Reference", sortable: true, value: (m) => m.ref },
              { key: "item", header: "Item", value: (m) => itemName(state, m.itemId) },
              { key: "loc", header: "Location", value: (m) => shortLocation(state, m.locationId) },
              { key: "type", header: "Type", value: (m) => m.type, render: (m) => <StatusBadge status={titleCase(m.type.replace("-", " "))} tone={m.qty < 0 ? "coral" : "lagoon"} /> },
              {
                key: "qty",
                header: "Qty",
                align: "right",
                sortable: true,
                value: (m) => m.qty,
                render: (m) => <span className={m.qty < 0 ? "text-coral font-medium" : "font-medium"}>{m.qty > 0 ? `+${num(m.qty)}` : num(m.qty)}</span>,
              },
              { key: "user", header: "By", value: (m) => m.user },
            ]}
          />
        </TabsContent>
      </Tabs>

      <RecordFormDialog
        open={itemForm.open}
        onOpenChange={(open) => setItemForm({ open, row: open ? itemForm.row : undefined })}
        title={itemForm.row ? "Edit item" : "New item"}
        description={itemForm.row ? undefined : "Items are shared across the business; stock is tracked per location."}
        fields={itemFields}
        allowSaveAndAdd={!itemForm.row}
        initial={
          itemForm.row
            ? {
                sku: itemForm.row.sku,
                name: itemForm.row.name,
                categoryId: itemForm.row.categoryId,
                unit: itemForm.row.unit,
                costPrice: String(itemForm.row.costPrice),
                sellPrice: String(itemForm.row.sellPrice),
                reorderPoint: String(itemForm.row.reorderPoint),
                status: itemForm.row.status,
              }
            : { status: "active", unit: "kg" }
        }
        onSubmit={(v) => {
          const payload = {
            sku: v.sku,
            name: v.name,
            categoryId: v.categoryId,
            unit: v.unit,
            costPrice: Number(v.costPrice),
            sellPrice: Number(v.sellPrice),
            reorderPoint: Number(v.reorderPoint),
            status: v.status as Item["status"],
          };
          if (itemForm.row) {
            update("items", itemForm.row.id, payload);
            toast.success(`${v.name} updated`);
          } else {
            add("items", { id: `item-${Date.now()}`, ...payload });
            toast.success(`${v.name} added to the item master`);
          }
        }}
      />

      <RecordFormDialog
        open={catForm.open}
        onOpenChange={(open) => setCatForm({ open, row: open ? catForm.row : undefined })}
        title={catForm.row ? "Edit category" : "New category"}
        fields={[
          { name: "name", label: "Category name", required: true },
          { name: "description", label: "Description", type: "textarea", colSpan: 2 },
        ]}
        allowSaveAndAdd={!catForm.row}
        initial={catForm.row ? { name: catForm.row.name, description: catForm.row.description } : {}}
        onSubmit={(v) => {
          if (catForm.row) {
            update("categories", catForm.row.id, { name: v.name, description: v.description });
            toast.success("Category updated");
          } else {
            add("categories", { id: `cat-${Date.now()}`, name: v.name, description: v.description ?? "" });
            toast.success(`${v.name} created`);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
        title="Delete item?"
        body={deleteItem ? `“${deleteItem.name}” will be removed from the item master.` : ""}
        confirmLabel="Delete item"
        destructive
        onConfirm={() => {
          if (!deleteItem) return;
          remove("items", deleteItem.id, deleteItem.name);
          toast.success(`${deleteItem.name} deleted`);
          setDeleteItem(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteCat}
        onOpenChange={(o) => !o && setDeleteCat(null)}
        title="Delete category?"
        body={
          deleteCat
            ? `“${deleteCat.name}” will be removed. ${state.items.filter((i) => i.categoryId === deleteCat.id).length} items reference it.`
            : ""
        }
        confirmLabel="Delete category"
        destructive
        onConfirm={() => {
          if (!deleteCat) return;
          remove("categories", deleteCat.id, deleteCat.name);
          toast.success("Category deleted");
          setDeleteCat(null);
        }}
      />
      <span className="hidden">{byId(state.items, "x")?.name}</span>
    </div>
  );
}
