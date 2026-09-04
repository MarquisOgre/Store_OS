import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo/store";
import {
  categoryValueSeries,
  inventoryValue,
  lowStockRows,
  movementSeries,
  openTransfers,
  outletSalesSeries,
  restaurants,
  salesSeries,
  salesTotal,
  shortLocation,
  stores,
} from "@/lib/demo/selectors";
import { inr, num, prettyDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/storeos/PageHeader";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { downloadCsv } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — StoreOS Operations Console" },
      {
        name: "description",
        content:
          "Live view of inventory value, open stock transfers, outlet sales and variances across 3 stores and 5 restaurants.",
      },
      { property: "og:title", content: "Dashboard — StoreOS Operations Console" },
      {
        property: "og:description",
        content: "Inventory value, transfers, sales trends and variance alerts in one enterprise dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-brand-mid)",
  "var(--color-aqua)",
  "var(--color-coral)",
];

function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "deep";
}) {
  if (tone === "deep") {
    return (
      <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-deep)" }}>
        <p className="text-[12px] font-medium opacity-80">{label}</p>
        <p className="font-display mt-1 text-[26px]">{value}</p>
        <p className="text-aqua mt-1 text-[11px] font-medium">{hint}</p>
      </div>
    );
  }
  return (
    <div className="surface-card p-4">
      <p className="text-muted-foreground text-[12px] font-medium">{label}</p>
      <p className="font-display mt-1 text-[26px]">{value}</p>
      <p className="text-brand mt-1 text-[11px] font-medium">{hint}</p>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    fontSize: 12,
  },
} as const;

function Dashboard() {
  const { state, activeLocationId, update, currentUser } = useDemo();
  const navigate = useNavigate();
  const [range, setRange] = useState<7 | 14>(14);

  const scope = activeLocationId;
  const sales = useMemo(() => salesSeries(state, scope).slice(-range), [state, scope, range]);
  const movements = useMemo(() => movementSeries(state, scope).slice(-range), [state, scope, range]);
  const catValues = useMemo(
    () => categoryValueSeries(state, scope).filter((c) => c.value > 0),
    [state, scope],
  );
  const outletMix = useMemo(() => outletSalesSeries(state), [state]);

  const value = inventoryValue(state, scope);
  const low = lowStockRows(state, scope);
  const open = openTransfers(state, scope);
  const weekSales = salesTotal(state, scope, 7);

  const activeTransfers = state.transfers
    .filter((t) => !["cancelled"].includes(t.status))
    .filter((t) => scope === "all" || t.fromLocationId === scope || t.toLocationId === scope)
    .slice(0, 5);

  const varianceCount = state.counts.find((c) => c.status === "submitted") ?? state.counts[0];
  const systemQty = varianceCount.lines.reduce((s, l) => s + l.systemQty, 0);
  const countedQty = varianceCount.lines.reduce((s, l) => s + (l.countedQty ?? l.systemQty), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="gradient-text font-display text-[30px] leading-tight">
            Good morning, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1 text-[13px]">
            Here's what's moving across your {stores(state).length} stores and {restaurants(state).length} restaurants
            today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="surface-card flex items-center gap-1 p-1">
            {([7, 14] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${
                  range === r ? "bg-brand text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            className="bg-card"
            onClick={() => {
              downloadCsv("storeos-dashboard.csv", sales);
              toast.success("Dashboard report exported");
            }}
          >
            Export report
          </Button>
          <Button className="gap-1.5" onClick={() => navigate({ to: "/transfers" })}>
            <Plus className="size-4" /> New transfer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Inventory value" value={inr(value, { compact: true })} hint="▲ 4.2% vs last week" />
        <KpiCard label="Open transfers" value={String(open.length)} hint={`${open.filter((t) => t.status === "approved").length} awaiting dispatch`} />
        <KpiCard label="Sales · last 7 days" value={inr(weekSales, { compact: true })} hint="▲ 12% across outlets" />
        <KpiCard
          label="Low stock alerts"
          value={`${low.length} items`}
          hint={`${low.filter((r) => r.stock.locationId === "loc-cs").length} critical at Central Store`}
          tone="deep"
        />
      </div>

      {/* GRAPHS */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Sales trend" meta={`Daily net sales · last ${range} days`} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={sales} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-lagoon)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-lagoon)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="var(--color-muted-foreground)"
                tickFormatter={(v: number) => inr(v, { compact: true })}
              />
              <Tooltip {...tooltipStyle} formatter={(v: number) => inr(v)} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--color-brand)"
                strokeWidth={2}
                fill="url(#salesFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Stock value by category" meta="Cost value on hand">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={catValues} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={2}>
                {catValues.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v: number) => inr(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {catValues.slice(0, 6).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-sm"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-muted-foreground truncate text-[11px]">{c.name}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Stock movements" meta="Units in vs out">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={movements} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="inbound" name="Inbound" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outbound" name="Outbound" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Outlet performance" meta="Sales vs approved expenses per restaurant">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={outletMix} margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="var(--color-muted-foreground)"
                tickFormatter={(v: number) => inr(v, { compact: true })}
              />
              <Tooltip {...tooltipStyle} formatter={(v: number) => inr(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="sales" name="Sales" stroke="var(--color-brand)" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="var(--color-coral)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface-card overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-[17px]">Active stock transfers</h2>
              <StatusBadge status={`${open.length} in progress`} tone="brand" />
            </div>
            <Button asChild variant="outline" size="sm" className="bg-card">
              <Link to="/transfers">View all</Link>
            </Button>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-muted-foreground border-b border-border text-left text-[11px] tracking-wide uppercase">
                <th className="px-5 py-2.5 font-semibold">Reference</th>
                <th className="px-3 py-2.5 font-semibold">Route</th>
                <th className="px-3 py-2.5 font-semibold">Items</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 text-right font-semibold">Value</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeTransfers.map((t) => (
                <tr key={t.id} className="hover:bg-brand/5">
                  <td className="text-brand-deep px-5 py-3 font-semibold">{t.ref}</td>
                  <td className="px-3 py-3">
                    {shortLocation(state, t.fromLocationId)} <span className="text-brand/50">→</span>{" "}
                    {shortLocation(state, t.toLocationId)}
                  </td>
                  <td className="text-muted-foreground px-3 py-3">{t.lines.length}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-3 py-3 text-right font-medium">{inr(t.value)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to="/transfers/$transferId"
                      params={{ transferId: t.id }}
                      className="text-brand-deep inline-flex items-center gap-1 text-[12px] font-medium"
                    >
                      View <ArrowRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Inventory variance"
            meta={`${varianceCount.ref} · ${shortLocation(state, varianceCount.locationId)}`}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sun/60 rounded-xl border border-border p-3">
                <p className="text-muted-foreground text-[11px]">System stock</p>
                <p className="font-display text-xl">{num(systemQty)}</p>
              </div>
              <div className="bg-sun/60 rounded-xl border border-border p-3">
                <p className="text-muted-foreground text-[11px]">Physical count</p>
                <p className="font-display text-xl">{num(countedQty)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <StatusBadge status={`Variance ${countedQty - systemQty} units`} tone="coral" />
              <Button size="sm" onClick={() => navigate({ to: "/inventory/adjustments" })}>
                Adjust stock
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="Notifications"
            actions={
              <button
                className="text-brand-deep text-[12px] font-medium"
                onClick={() => {
                  state.notifications.filter((n) => !n.read).forEach((n) => update("notifications", n.id, { read: true }));
                  toast.success("All notifications marked read");
                }}
              >
                Mark read
              </button>
            }
          >
            <ul className="space-y-3">
              {state.notifications.slice(0, 4).map((n) => (
                <li key={n.id} className="flex gap-3">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      n.kind === "low_stock" ? "bg-coral" : n.kind === "purchase" ? "bg-amber" : "bg-lagoon"
                    }`}
                  />
                  <div>
                    <p className="text-[12px] leading-snug font-medium">{n.title}</p>
                    <p className="text-muted-foreground text-[11px]">{prettyDate(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
