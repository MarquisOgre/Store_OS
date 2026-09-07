import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/storeos/PageHeader";
import { DataTable } from "@/components/storeos/DataTable";
import { RecordFormDialog } from "@/components/storeos/RecordFormDialog";
import { ConfirmDialog } from "@/components/storeos/ConfirmDialog";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/store";
import { byId, shortLocation, stores, supplierName } from "@/lib/demo/selectors";
import { inr, num, prettyDate } from "@/lib/format";
import type { PurchaseOrder, Supplier } from "@/lib/demo/types";

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: "Purchasing — Orders, Receipts & Suppliers — StoreOS" },
      {
        name: "description",
        content: "Raise purchase orders at supply stores, receive goods against them and manage the supplier master.",
      },
      { property: "og:title", content: "Purchasing — StoreOS" },
      { property: "og:description", content: "Purchase orders, goods receipts and suppliers for the supply stores." },
    ],
  }),
  component: PurchasingPage,
});

function PurchasingPage() {
  const { state, add, update, remove, nextRef, currentUser } = useDemo();
  const [poStatus, setPoStatus] = useState("all");
  const [poForm, setPoForm] = useState<{ open: boolean; row?: PurchaseOrder }>({ open: false });
  const [supForm, setSupForm] = useState<{ open: boolean; row?: Supplier }>({ open: false });
  const [deletePo, setDeletePo] = useState<PurchaseOrder | null>(null);
  const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
  const [deleteSup, setDeleteSup] = useState<Supplier | null>(null);

  const pos = state.purchaseOrders.filter((p) => poStatus === "all" || p.status === poStatus);

  const receiveOrder = (po: PurchaseOrder) => {
    update("purchaseOrders", po.id, { status: "received" }, po.ref);
    add("purchaseReceipts", {
      id: `pr-${Date.now()}`,
      ref: nextRef("GRN", state.purchaseReceipts.map((r) => r.ref)),
      poRef: po.ref,
      supplierId: po.supplierId,
      locationId: po.locationId,
      receivedDate: new Date().toISOString().slice(0, 10),
      invoiceNo: `INV-${Math.floor(Math.random() * 90000 + 10000)}`,
      amount: po.total,
      status: "complete",
      receivedBy: currentUser.name,
    });
    po.lines.forEach((line, idx) => {
      const level = state.stockLevels.find((s) => s.itemId === line.itemId && s.locationId === po.locationId);
      if (level) update("stockLevels", level.id, { onHand: level.onHand + line.qty });
      else add("stockLevels", { id: `sl-${Date.now()}-${idx}`, itemId: line.itemId, locationId: po.locationId, onHand: line.qty });
      add("movements", {
        id: `mv-${Date.now()}-${idx}`,
        date: new Date().toISOString().slice(0, 10),
        itemId: line.itemId,
        locationId: po.locationId,
        type: "purchase",
        qty: line.qty,
        ref: po.ref,
        user: currentUser.name,
      });
    });
    toast.success(`${po.ref} received — stock updated at ${shortLocation(state, po.locationId)}`);
  };

  return (
    <div>
      <PageHeader
        title="Purchasing"
        subtitle="Buying happens at the supply stores. Received goods increase store stock, which is then transferred to outlets."
        actions={
          <Button className="gap-1.5" onClick={() => setPoForm({ open: true })}>
            <Plus className="size-4" /> New purchase order
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open orders", value: num(state.purchaseOrders.filter((p) => p.status === "pending" || p.status === "approved").length) },
          { label: "Received orders", value: num(state.purchaseOrders.filter((p) => p.status === "received").length) },
          { label: "Purchase value", value: inr(state.purchaseOrders.reduce((s, p) => s + p.total, 0), { compact: true }) },
          { label: "Active suppliers", value: num(state.suppliers.filter((s) => s.status === "active").length) },
        ].map((k) => (
          <div key={k.label} className="surface-card p-4">
            <p className="text-muted-foreground text-[12px]">{k.label}</p>
            <p className="font-display mt-1 text-[24px]">{k.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="mb-4">
          <TabsTrigger value="orders">Purchase orders</TabsTrigger>
          <TabsTrigger value="receipts">Goods receipts</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <DataTable
            rows={pos}
            exportName="storeos-purchase-orders"
            searchText={(p) => `${p.ref} ${supplierName(state, p.supplierId)} ${p.createdBy}`}
            filters={[
              {
                key: "status",
                label: "Status",
                value: poStatus,
                onChange: setPoStatus,
                options: [
                  { label: "All statuses", value: "all" },
                  { label: "Draft", value: "draft" },
                  { label: "Pending", value: "pending" },
                  { label: "Approved", value: "approved" },
                  { label: "Received", value: "received" },
                  { label: "Cancelled", value: "cancelled" },
                ],
              },
            ]}
            columns={[
              { key: "ref", header: "Reference", sortable: true, value: (p) => p.ref },
              { key: "sup", header: "Supplier", sortable: true, value: (p) => supplierName(state, p.supplierId) },
              { key: "loc", header: "Store", value: (p) => shortLocation(state, p.locationId) },
              { key: "date", header: "Ordered", sortable: true, value: (p) => p.orderDate, render: (p) => prettyDate(p.orderDate) },
              { key: "exp", header: "Expected", value: (p) => p.expectedDate, render: (p) => prettyDate(p.expectedDate) },
              { key: "lines", header: "Lines", align: "right", value: (p) => p.lines.length },
              { key: "total", header: "Total", align: "right", sortable: true, value: (p) => p.total, render: (p) => inr(p.total) },
              { key: "status", header: "Status", value: (p) => p.status, render: (p) => <StatusBadge status={p.status} /> },
            ]}
            actions={(p) => (
              <div className="flex justify-end gap-1">
                {(p.status === "pending" || p.status === "draft") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[12px]"
                    onClick={() => {
                      update("purchaseOrders", p.id, { status: "approved" }, p.ref);
                      toast.success(`${p.ref} approved`);
                    }}
                  >
                    Approve
                  </Button>
                )}
                {p.status === "approved" && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]" onClick={() => setReceivePo(p)}>
                    Receive
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]" onClick={() => setPoForm({ open: true, row: p })}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-coral h-7 px-2 text-[12px]" onClick={() => setDeletePo(p)}>
                  Delete
                </Button>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="receipts">
          <DataTable
            rows={state.purchaseReceipts}
            exportName="storeos-goods-receipts"
            searchText={(r) => `${r.ref} ${r.poRef} ${r.invoiceNo} ${supplierName(state, r.supplierId)}`}
            columns={[
              { key: "ref", header: "GRN", sortable: true, value: (r) => r.ref },
              { key: "po", header: "Against PO", value: (r) => r.poRef },
              { key: "sup", header: "Supplier", sortable: true, value: (r) => supplierName(state, r.supplierId) },
              { key: "loc", header: "Store", value: (r) => shortLocation(state, r.locationId) },
              { key: "date", header: "Received", sortable: true, value: (r) => r.receivedDate, render: (r) => prettyDate(r.receivedDate) },
              { key: "inv", header: "Invoice no.", value: (r) => r.invoiceNo },
              { key: "amt", header: "Amount", align: "right", sortable: true, value: (r) => r.amount, render: (r) => inr(r.amount) },
              { key: "status", header: "Status", value: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
              { key: "by", header: "Received by", value: (r) => r.receivedBy },
            ]}
          />
        </TabsContent>

        <TabsContent value="suppliers">
          <DataTable
            rows={state.suppliers}
            exportName="storeos-suppliers"
            searchText={(s) => `${s.code} ${s.name} ${s.contactPerson} ${s.city} ${s.gstin}`}
            toolbar={
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSupForm({ open: true })}>
                <Plus className="size-3.5" /> New supplier
              </Button>
            }
            columns={[
              { key: "code", header: "Code", sortable: true, value: (s) => s.code },
              { key: "name", header: "Supplier", sortable: true, value: (s) => s.name },
              { key: "contact", header: "Contact", value: (s) => `${s.contactPerson} · ${s.phone}` },
              { key: "city", header: "City", sortable: true, value: (s) => s.city },
              { key: "gstin", header: "GSTIN", value: (s) => s.gstin },
              { key: "terms", header: "Payment terms", value: (s) => s.paymentTerms },
              {
                key: "spend",
                header: "Spend",
                align: "right",
                sortable: true,
                value: (s) => state.purchaseOrders.filter((p) => p.supplierId === s.id).reduce((t, p) => t + p.total, 0),
                render: (s) => inr(state.purchaseOrders.filter((p) => p.supplierId === s.id).reduce((t, p) => t + p.total, 0), { compact: true }),
              },
              { key: "status", header: "Status", value: (s) => s.status, render: (s) => <StatusBadge status={s.status} /> },
            ]}
            actions={(s) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]" onClick={() => setSupForm({ open: true, row: s })}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-coral h-7 px-2 text-[12px]" onClick={() => setDeleteSup(s)}>
                  Delete
                </Button>
              </div>
            )}
          />
        </TabsContent>
      </Tabs>

      <RecordFormDialog
        open={poForm.open}
        onOpenChange={(open) => setPoForm({ open, row: open ? poForm.row : undefined })}
        title={poForm.row ? "Edit purchase order" : "New purchase order"}
        allowSaveAndAdd={!poForm.row}
        fields={[
          {
            name: "supplierId",
            label: "Supplier",
            type: "select",
            required: true,
            options: state.suppliers.map((s) => ({ label: s.name, value: s.id })),
          },
          {
            name: "locationId",
            label: "Deliver to store",
            type: "select",
            required: true,
            options: stores(state).map((s) => ({ label: s.name, value: s.id })),
          },
          {
            name: "itemId",
            label: "Item",
            type: "select",
            required: true,
            options: state.items.map((i) => ({ label: `${i.name} (${i.unit})`, value: i.id })),
          },
          { name: "qty", label: "Quantity", type: "number", required: true },
          { name: "rate", label: "Rate (₹)", type: "number", required: true },
          { name: "orderDate", label: "Order date", type: "date", required: true },
          { name: "expectedDate", label: "Expected date", type: "date", required: true },
        ]}
        initial={
          poForm.row
            ? {
                supplierId: poForm.row.supplierId,
                locationId: poForm.row.locationId,
                itemId: poForm.row.lines[0]?.itemId ?? "",
                qty: String(poForm.row.lines[0]?.qty ?? 0),
                rate: String(poForm.row.lines[0]?.rate ?? 0),
                orderDate: poForm.row.orderDate,
                expectedDate: poForm.row.expectedDate,
              }
            : {
                orderDate: new Date().toISOString().slice(0, 10),
                expectedDate: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
              }
        }
        onSubmit={(v) => {
          const qty = Number(v.qty);
          const rate = Number(v.rate);
          const lines = [{ itemId: v.itemId, qty, rate }];
          if (poForm.row) {
            update("purchaseOrders", poForm.row.id, {
              supplierId: v.supplierId,
              locationId: v.locationId,
              orderDate: v.orderDate,
              expectedDate: v.expectedDate,
              lines,
              total: qty * rate,
            }, poForm.row.ref);
            toast.success(`${poForm.row.ref} updated`);
          } else {
            add("purchaseOrders", {
              id: `po-${Date.now()}`,
              ref: nextRef("PO", state.purchaseOrders.map((p) => p.ref)),
              supplierId: v.supplierId,
              locationId: v.locationId,
              orderDate: v.orderDate,
              expectedDate: v.expectedDate,
              status: "pending",
              lines,
              total: qty * rate,
              createdBy: currentUser.name,
            });
            toast.success("Purchase order raised");
          }
        }}
      />

      <RecordFormDialog
        open={supForm.open}
        onOpenChange={(open) => setSupForm({ open, row: open ? supForm.row : undefined })}
        title={supForm.row ? "Edit supplier" : "New supplier"}
        allowSaveAndAdd={!supForm.row}
        fields={[
          { name: "code", label: "Supplier code", required: true },
          { name: "name", label: "Supplier name", required: true },
          { name: "contactPerson", label: "Contact person", required: true },
          { name: "phone", label: "Phone", required: true },
          { name: "email", label: "Email", type: "email" },
          { name: "gstin", label: "GSTIN" },
          { name: "city", label: "City", required: true },
          { name: "paymentTerms", label: "Payment terms", placeholder: "Net 30" },
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
        ]}
        initial={
          supForm.row
            ? { ...supForm.row }
            : { status: "active", paymentTerms: "Net 30" }
        }
        onSubmit={(v) => {
          const payload = {
            code: v.code,
            name: v.name,
            contactPerson: v.contactPerson,
            phone: v.phone,
            email: v.email ?? "",
            gstin: v.gstin ?? "",
            city: v.city,
            paymentTerms: v.paymentTerms ?? "Net 30",
            status: v.status as Supplier["status"],
          };
          if (supForm.row) {
            update("suppliers", supForm.row.id, payload, supForm.row.name);
            toast.success(`${v.name} updated`);
          } else {
            add("suppliers", { id: `sup-${Date.now()}`, ...payload });
            toast.success(`${v.name} added`);
          }
        }}
      />

      <ConfirmDialog
        open={!!receivePo}
        onOpenChange={(o) => !o && setReceivePo(null)}
        title="Receive this order?"
        description={
          receivePo
            ? `A goods receipt will be created for ${receivePo.ref} and stock will increase at ${shortLocation(state, receivePo.locationId)}.`
            : ""
        }
        confirmLabel="Receive goods"
        onConfirm={() => {
          if (!receivePo) return;
          receiveOrder(receivePo);
          setReceivePo(null);
        }}
      />

      <ConfirmDialog
        open={!!deletePo}
        onOpenChange={(o) => !o && setDeletePo(null)}
        title="Delete purchase order?"
        description={deletePo ? `${deletePo.ref} will be removed.` : ""}
        confirmLabel="Delete order"
        destructive
        onConfirm={() => {
          if (!deletePo) return;
          remove("purchaseOrders", deletePo.id, deletePo.ref);
          toast.success(`${deletePo.ref} deleted`);
          setDeletePo(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteSup}
        onOpenChange={(o) => !o && setDeleteSup(null)}
        title="Delete supplier?"
        description={deleteSup ? `“${deleteSup.name}” will be removed from the supplier master.` : ""}
        confirmLabel="Delete supplier"
        destructive
        onConfirm={() => {
          if (!deleteSup) return;
          remove("suppliers", deleteSup.id, deleteSup.name);
          toast.success("Supplier deleted");
          setDeleteSup(null);
        }}
      />
      <span className="hidden">{byId(state.items, "noop")?.id}</span>
    </div>
  );
}
