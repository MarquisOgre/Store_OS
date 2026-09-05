import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo/store";
import { restaurants, stores } from "@/lib/demo/selectors";
import { PageHeader, SectionCard } from "@/components/storeos/PageHeader";
import { Button } from "@/components/ui/button";
import { RecordFormDialog } from "@/components/storeos/RecordFormDialog";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { inr } from "@/lib/format";
import { inventoryValue } from "@/lib/demo/selectors";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Business Profile — StoreOS" },
      { name: "description", content: "Legal entity, tax details and location footprint for the business group." },
      { property: "og:title", content: "Business Profile — StoreOS" },
      { property: "og:description", content: "Legal entity, GST details and the store/restaurant footprint." },
    ],
  }),
  component: BusinessPage,
});

function BusinessPage() {
  const { state, updateBusiness } = useDemo();
  const [editing, setEditing] = useState(false);
  const b = state.business;

  const rows: [string, string][] = [
    ["Trading name", b.name],
    ["Legal name", b.legalName],
    ["GSTIN", b.gstin],
    ["PAN", b.pan],
    ["Email", b.email],
    ["Phone", b.phone],
    ["Registered address", `${b.address}, ${b.city}, ${b.state}`],
    ["Currency", `${b.currency} (₹)`],
    ["Financial year starts", b.financialYearStart],
    ["Timezone", b.timezone],
  ];

  return (
    <div>
      <PageHeader
        title="Business profile"
        subtitle="One business group, three supply stores and five customer-facing outlets."
        actions={<Button onClick={() => setEditing(true)}>Edit business</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Entity details" className="lg:col-span-2">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</dt>
                <dd className="text-[13px] font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Footprint">
            <div className="space-y-3">
              <div className="bg-sun/60 flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-[12px]">Stores / warehouses</span>
                <span className="font-display text-xl">{stores(state).length}</span>
              </div>
              <div className="bg-sun/60 flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-[12px]">Restaurants / outlets</span>
                <span className="font-display text-xl">{restaurants(state).length}</span>
              </div>
              <div className="bg-sun/60 flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-[12px]">Supply routes</span>
                <span className="font-display text-xl">{state.supplyLinks.length}</span>
              </div>
              <div className="bg-sun/60 flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-[12px]">Stock on hand</span>
                <span className="font-display text-xl">{inr(inventoryValue(state, "all"), { compact: true })}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Compliance">
            <ul className="space-y-2 text-[12px]">
              <li className="flex items-center justify-between">
                GST filing (GSTR-3B) <StatusBadge status="Filed" tone="lagoon" />
              </li>
              <li className="flex items-center justify-between">
                FSSAI licence <StatusBadge status="Active" />
              </li>
              <li className="flex items-center justify-between">
                Shop &amp; establishment <StatusBadge status="Renewal due" tone="amber" />
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>

      <RecordFormDialog
        open={editing}
        onOpenChange={setEditing}
        title="Edit business"
        fields={[
          { name: "name", label: "Trading name", required: true },
          { name: "legalName", label: "Legal name", required: true },
          { name: "gstin", label: "GSTIN", required: true },
          { name: "pan", label: "PAN" },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Phone", required: true },
          { name: "address", label: "Address", colSpan: 2 },
          { name: "city", label: "City" },
          { name: "state", label: "State" },
          { name: "financialYearStart", label: "Financial year starts" },
          { name: "timezone", label: "Timezone" },
        ]}
        initial={{
          name: b.name,
          legalName: b.legalName,
          gstin: b.gstin,
          pan: b.pan,
          email: b.email,
          phone: b.phone,
          address: b.address,
          city: b.city,
          state: b.state,
          financialYearStart: b.financialYearStart,
          timezone: b.timezone,
        }}
        submitLabel="Save changes"
        onSubmit={(values) => {
          updateBusiness(values);
          toast.success("Business profile updated");
        }}
      />
    </div>
  );
}
