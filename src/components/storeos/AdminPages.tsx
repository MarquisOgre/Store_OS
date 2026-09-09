import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/storeos/PageHeader";
import { DataTable } from "@/components/storeos/DataTable";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { useDemo } from "@/lib/demo/store";
import { locationName, roleName, shortLocation } from "@/lib/demo/selectors";
import { inr, num, prettyDate, titleCase } from "@/lib/format";
import type { Expense, Sale } from "@/lib/demo/types";

export function SalesPage() {
  const { state, activeLocationId } = useDemo();
  const [status, setStatus] = useState("all");
  const rows = state.sales.filter((s) => (activeLocationId === "all" || s.locationId === activeLocationId) && (status === "all" || s.status === status));
  const completed = rows.filter((s) => s.status === "completed");
  const total = completed.reduce((sum, s) => sum + s.total, 0);
  return <div>
    <PageHeader title="Sales" subtitle="Restaurant sales, channels, payments and daily revenue across the selected scope." />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Net sales" value={inr(total, { compact: true })} />
      <Kpi label="Transactions" value={num(rows.length)} />
      <Kpi label="Covers" value={num(completed.reduce((s, r) => s + r.covers, 0))} />
      <Kpi label="Average ticket" value={inr(completed.length ? total / completed.length : 0)} />
    </div>
    <DataTable rows={rows} exportName="storeos-sales" searchText={(s) => `${s.ref} ${locationName(state, s.locationId)} ${s.channel} ${s.paymentMode}`} filters={[{ key: "status", label: "Status", value: status, onChange: setStatus, options: [{ label: "All statuses", value: "all" }, { label: "Completed", value: "completed" }, { label: "Refunded", value: "refunded" }, { label: "Void", value: "void" }] }]} columns={[
      { key: "ref", header: "Reference", sortable: true, value: (s) => s.ref },
      { key: "date", header: "Date", sortable: true, value: (s) => s.saleDate, render: (s) => prettyDate(s.saleDate) },
      { key: "location", header: "Outlet", sortable: true, value: (s) => shortLocation(state, s.locationId) },
      { key: "channel", header: "Channel", value: (s) => s.channel },
      { key: "covers", header: "Covers", align: "right", sortable: true, value: (s) => s.covers },
      { key: "payment", header: "Payment", value: (s) => s.paymentMode },
      { key: "total", header: "Total", align: "right", sortable: true, value: (s) => s.total, render: (s) => inr(s.total) },
      { key: "status", header: "Status", value: (s) => s.status, render: (s) => <StatusBadge status={s.status} /> },
    ]} />
  </div>;
}

export function ExpensesPage() {
  const { state, activeLocationId } = useDemo();
  const [status, setStatus] = useState("all");
  const rows = state.expenses.filter((e) => (activeLocationId === "all" || e.locationId === activeLocationId) && (status === "all" || e.status === status));
  const approved = rows.filter((e) => e.status === "approved");
  return <div>
    <PageHeader title="Expenses" subtitle="Outlet operating expenses with approval status, payment method and audit-ready references." />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Approved spend" value={inr(approved.reduce((s, e) => s + e.amount, 0), { compact: true })} />
      <Kpi label="Pending approval" value={num(rows.filter((e) => e.status === "pending").length)} />
      <Kpi label="Categories" value={num(new Set(rows.map((e) => e.category)).size)} />
      <Kpi label="Expense records" value={num(rows.length)} />
    </div>
    <DataTable rows={rows} exportName="storeos-expenses" searchText={(e) => `${e.ref} ${e.category} ${e.paidTo} ${e.notes}`} filters={[{ key: "status", label: "Status", value: status, onChange: setStatus, options: [{ label: "All statuses", value: "all" }, { label: "Pending", value: "pending" }, { label: "Approved", value: "approved" }, { label: "Rejected", value: "rejected" }] }]} columns={[
      { key: "ref", header: "Reference", sortable: true, value: (e) => e.ref },
      { key: "date", header: "Date", sortable: true, value: (e) => e.expenseDate, render: (e) => prettyDate(e.expenseDate) },
      { key: "location", header: "Outlet", value: (e) => shortLocation(state, e.locationId) },
      { key: "category", header: "Category", sortable: true, value: (e) => e.category },
      { key: "paidTo", header: "Paid to", value: (e) => e.paidTo },
      { key: "payment", header: "Payment", value: (e) => e.paymentMode },
      { key: "amount", header: "Amount", align: "right", sortable: true, value: (e) => e.amount, render: (e) => inr(e.amount) },
      { key: "status", header: "Status", value: (e) => e.status, render: (e) => <StatusBadge status={e.status} /> },
    ]} />
  </div>;
}

export function ReportsPage() {
  const { state } = useDemo();
  const sales = state.sales.filter((s) => s.status === "completed").reduce((n, s) => n + s.total, 0);
  const expenses = state.expenses.filter((e) => e.status === "approved").reduce((n, e) => n + e.amount, 0);
  const purchases = state.purchaseOrders.filter((p) => p.status !== "cancelled").reduce((n, p) => n + p.total, 0);
  const byOutlet = state.locations.filter((l) => l.type === "restaurant").map((l) => ({ id: l.id, outlet: shortLocation(state, l.id), sales: state.sales.filter((s) => s.locationId === l.id && s.status === "completed").reduce((n, s) => n + s.total, 0), expenses: state.expenses.filter((e) => e.locationId === l.id && e.status === "approved").reduce((n, e) => n + e.amount, 0) }));
  return <div>
    <PageHeader title="Reports" subtitle="Management reporting across sales, expenses, purchasing and inventory. Export any table for finance review." />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Kpi label="Sales" value={inr(sales, { compact: true })} /><Kpi label="Approved expenses" value={inr(expenses, { compact: true })} /><Kpi label="Gross contribution" value={inr(sales - expenses, { compact: true })} /><Kpi label="Purchasing" value={inr(purchases, { compact: true })} /></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Outlet P&L snapshot" meta="Completed sales less approved operating expenses"><DataTable rows={byOutlet} exportName="storeos-outlet-report" searchText={(r) => r.outlet} columns={[{ key: "outlet", header: "Outlet", sortable: true, value: (r) => r.outlet }, { key: "sales", header: "Sales", align: "right", sortable: true, value: (r) => r.sales, render: (r) => inr(r.sales) }, { key: "expenses", header: "Expenses", align: "right", sortable: true, value: (r) => r.expenses, render: (r) => inr(r.expenses) }, { key: "margin", header: "Contribution", align: "right", sortable: true, value: (r) => r.sales - r.expenses, render: (r) => inr(r.sales - r.expenses) }]} /></SectionCard>
      <SectionCard title="Operational reports" meta="Ready-to-review report packs"><div className="grid gap-3 sm:grid-cols-2">{[
        ["Sales by outlet", "Revenue, covers, channels and payment mix"], ["Expense register", "Approved and pending outlet expenses"], ["Inventory valuation", "Cost value on hand by location and category"], ["Purchasing analysis", "PO value, supplier spend and receipts"], ["Stock movement", "Inbound, outbound and adjustment activity"], ["Variance report", "Physical count variance and adjustments"],
      ].map(([name, body]) => <div key={name} className="rounded-xl border border-border bg-sun/40 p-4"><p className="font-medium text-[13px]">{name}</p><p className="text-muted-foreground mt-1 text-[11px]">{body}</p><Button variant="outline" size="sm" className="mt-3 bg-card" onClick={() => toast.success(`${name} report is ready to export`)}>Open report</Button></div>)}</div></SectionCard>
    </div>
  </div>;
}

export function UsersPage() {
  const { state } = useDemo();
  return <div><PageHeader title="Users" subtitle="People who operate StoreOS, their roles, scope and recent activity." actions={<Button onClick={() => toast.success("User creation is enabled in the demo workflow")}>New user</Button>} /><DataTable rows={state.users} exportName="storeos-users" searchText={(u) => `${u.name} ${u.email} ${u.phone}`} columns={[{ key: "name", header: "User", sortable: true, value: (u) => u.name }, { key: "email", header: "Email", value: (u) => u.email }, { key: "role", header: "Role", sortable: true, value: (u) => roleName(state, u.roleId), render: (u) => <StatusBadge status={roleName(state, u.roleId)} tone="deep" /> }, { key: "location", header: "Location", value: (u) => shortLocation(state, u.locationId) }, { key: "last", header: "Last active", sortable: true, value: (u) => u.lastActive }, { key: "status", header: "Status", value: (u) => u.status, render: (u) => <StatusBadge status={u.status} /> }]} /></div>;
}

export function RolesPage() {
  const { state } = useDemo();
  return <div><PageHeader title="Roles & permissions" subtitle="Business-wide and location-scoped access profiles for StoreOS operators." actions={<Button onClick={() => toast.success("Role creation is enabled in the demo workflow")}>New role</Button>} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{state.roles.map((r) => <SectionCard key={r.id} title={r.name} meta={`${r.scope} scope`}><p className="text-muted-foreground min-h-10 text-[12px]">{r.description}</p><div className="mt-4 flex items-center justify-between"><StatusBadge status={`${r.permissions.length} permissions`} tone="brand" /><span className="text-muted-foreground text-[11px]">{state.users.filter((u) => u.roleId === r.id).length} users</span></div><div className="mt-3 flex flex-wrap gap-1">{r.permissions.slice(0, 8).map((p) => <span key={p} className="rounded-full bg-muted px-2 py-1 text-[10px]">{titleCase(p)}</span>)}</div></SectionCard>)}</div></div>;
}

export function NotificationsPage() {
  const { state, update } = useDemo();
  const unread = state.notifications.filter((n) => !n.read).length;
  return <div><PageHeader title="Notifications" subtitle={`${unread} unread alerts across stock, transfers, purchasing and system activity.`} actions={<Button variant="outline" className="bg-card" onClick={() => { state.notifications.filter((n) => !n.read).forEach((n) => update("notifications", n.id, { read: true })); toast.success("All notifications marked as read"); }}>Mark all read</Button>} /><div className="space-y-3">{state.notifications.map((n) => <div key={n.id} className={`surface-card flex flex-col gap-3 p-4 md:flex-row md:items-center ${n.read ? "opacity-70" : ""}`}><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={titleCase(n.kind)} tone={n.read ? "muted" : "brand"} /><span className="text-muted-foreground text-[11px]">{n.createdAt}</span></div><p className="mt-1 text-[13px] font-semibold">{n.title}</p><p className="text-muted-foreground mt-0.5 text-[12px]">{n.body}</p></div>{!n.read && <Button variant="outline" size="sm" className="bg-card" onClick={() => update("notifications", n.id, { read: true })}>Mark read</Button>}</div>)}</div></div>;
}

export function AuditLogsPage() {
  const { state } = useDemo();
  return <div><PageHeader title="Audit logs" subtitle="Immutable-style demo trail of important create, update, delete and workflow actions." /><DataTable rows={state.auditLogs} exportName="storeos-audit-logs" searchText={(a) => `${a.user} ${a.action} ${a.entity} ${a.entityRef} ${a.ip}`} columns={[{ key: "at", header: "Timestamp", sortable: true, value: (a) => a.at }, { key: "user", header: "User", sortable: true, value: (a) => a.user }, { key: "action", header: "Action", value: (a) => a.action, render: (a) => <StatusBadge status={a.action} /> }, { key: "entity", header: "Entity", sortable: true, value: (a) => a.entity }, { key: "ref", header: "Reference", value: (a) => a.entityRef }, { key: "ip", header: "IP address", value: (a) => a.ip }]} /></div>;
}

export function SettingsPage() {
  const { state, updateBusiness, reset } = useDemo();
  const [editing, setEditing] = useState(false);
  return <div><PageHeader title="Settings" subtitle="Business configuration, operational preferences and demo environment controls." /><div className="grid gap-6 lg:grid-cols-2"><SectionCard title="Business settings" meta="These values are shared across the StoreOS workspace" actions={<Button variant="outline" className="bg-card" onClick={() => setEditing(!editing)}>{editing ? "Close" : "Edit"}</Button>}><dl className="grid gap-4 sm:grid-cols-2">{[["Business", state.business.name], ["Legal name", state.business.legalName], ["GSTIN", state.business.gstin], ["Currency", state.business.currency], ["Financial year", state.business.financialYearStart], ["Timezone", state.business.timezone]].map(([k, v]) => <div key={k}><dt className="text-muted-foreground text-[11px] uppercase">{k}</dt><dd className="mt-1 text-[13px] font-medium">{v}</dd></div>)}</dl>{editing && <div className="mt-5 rounded-xl border border-border bg-sun/40 p-4"><p className="text-[12px] font-medium">Demo setting</p><p className="text-muted-foreground mt-1 text-[11px]">Changes made here are kept in the in-memory demo state.</p><Button size="sm" className="mt-3" onClick={() => { updateBusiness({ name: state.business.name }); toast.success("Settings saved"); }}>Save settings</Button></div>}</SectionCard><SectionCard title="Workspace controls" meta="Administrative utilities"><div className="space-y-3"><SettingRow label="Location scope" value={`${state.locations.length} locations`} /><SettingRow label="Users" value={`${state.users.length} users`} /><SettingRow label="Roles" value={`${state.roles.length} roles`} /><SettingRow label="Audit events" value={`${state.auditLogs.length} events`} /><div className="pt-2"><Button variant="outline" className="bg-card" onClick={() => { reset(); toast.success("Demo data reset"); }}>Reset demo data</Button></div></div></SectionCard></div></div>;
}

export function ProfilePage() {
  const { currentUser, state } = useDemo();
  const role = state.roles.find((r) => r.id === currentUser.roleId);
  const location = state.locations.find((l) => l.id === currentUser.locationId);
  return <div><PageHeader title="Profile" subtitle="Your StoreOS account, access profile and assigned operating scope." actions={<Button variant="outline" className="bg-card" onClick={() => toast.success("Profile editing is available in the demo workflow")}>Edit profile</Button>} /><div className="grid gap-6 lg:grid-cols-3"><SectionCard title="Account" className="lg:col-span-2"><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{[["Name", currentUser.name], ["Email", currentUser.email], ["Phone", currentUser.phone], ["Role", role?.name ?? "—"], ["Scope", role?.scope ?? "—"], ["Primary location", location?.name ?? "All locations"]].map(([k, v]) => <div key={k}><dt className="text-muted-foreground text-[11px] uppercase">{k}</dt><dd className="mt-1 text-[13px] font-medium">{v}</dd></div>)}</dl></SectionCard><SectionCard title="Access summary"><div className="space-y-3"><div className="rounded-xl bg-sun/50 p-4"><p className="text-muted-foreground text-[11px]">Permissions</p><p className="font-display mt-1 text-2xl">{role?.permissions.length ?? 0}</p></div><div className="rounded-xl bg-sun/50 p-4"><p className="text-muted-foreground text-[11px]">Status</p><div className="mt-1"><StatusBadge status={currentUser.status} /></div></div></div></SectionCard></div></div>;
}

function Kpi({ label, value }: { label: string; value: string }) { return <div className="surface-card p-4"><p className="text-muted-foreground text-[12px]">{label}</p><p className="font-display mt-1 text-[24px]">{value}</p></div>; }
function SettingRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3"><span className="text-[12px]">{label}</span><span className="text-muted-foreground text-[12px]">{value}</span></div>; }
