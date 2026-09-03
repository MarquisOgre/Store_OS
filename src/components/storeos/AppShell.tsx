import { useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Bell,
  Building2,
  ClipboardList,
  FileBarChart,
  IndianRupee,
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  UserRound,
  Users,
  UtensilsCrossed,
  Search,
} from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { restaurants, stores } from "@/lib/demo/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { titleCase } from "@/lib/format";

const NAV: { group: string; items: { to: string; label: string; icon: typeof Store }[] }[] = [
  {
    group: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/business", label: "Business", icon: Building2 },
      { to: "/stores", label: "Stores", icon: Store },
      { to: "/restaurants", label: "Restaurants", icon: UtensilsCrossed },
    ],
  },
  {
    group: "Inventory",
    items: [
      { to: "/inventory", label: "Inventory", icon: Package },
      { to: "/inventory/counts", label: "Physical Counts", icon: ClipboardList },
      { to: "/inventory/adjustments", label: "Stock Adjustments", icon: ScrollText },
      { to: "/transfers", label: "Stock Transfers", icon: ArrowLeftRight },
    ],
  },
  {
    group: "Commerce",
    items: [
      { to: "/purchasing", label: "Purchasing", icon: ShoppingCart },
      { to: "/sales", label: "Sales", icon: IndianRupee },
      { to: "/expenses", label: "Expenses", icon: Receipt },
      { to: "/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    group: "Administration",
    items: [
      { to: "/users", label: "Users", icon: Users },
      { to: "/roles", label: "Roles & Permissions", icon: ShieldCheck },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/audit-logs", label: "Audit Logs", icon: ScrollText },
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/profile", label: "Profile", icon: UserRound },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useDemo();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const openTransfers = state.transfers.filter((t) => t.status === "pending_approval" || t.status === "dispatched").length;
  const pendingAdj = state.adjustments.filter((a) => a.status === "pending").length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div
          className="font-display grid size-8 place-items-center rounded-lg text-[15px] font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}
        >
          S
        </div>
        <div>
          <p className="font-display text-[15px] leading-none font-semibold">StoreOS</p>
          <p className="text-muted-foreground mt-0.5 text-[10px] tracking-wide">Operations Suite</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.group}>
            <div className="text-muted-foreground/70 px-2 pt-4 pb-2 text-[10px] tracking-[0.14em] uppercase first:pt-0">
              {group.group}
            </div>
            {group.items.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const badge =
                item.to === "/transfers" ? openTransfers : item.to === "/inventory/adjustments" ? pendingAdj : 0;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-brand/10 text-brand-deep font-semibold"
                      : "text-muted-foreground hover:bg-brand/5 hover:text-brand-deep",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {badge > 0 && (
                    <span className="bg-coral/15 text-coral ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="p-3">
        <div className="rounded-xl p-3 text-primary-foreground" style={{ background: "var(--gradient-deep)" }}>
          <p className="text-[11px] font-medium opacity-80">Monthly close</p>
          <p className="font-display text-lg">4 days left</p>
          <div className="mt-2 h-1.5 rounded-full bg-primary-foreground/20">
            <div className="bg-lagoon h-full w-2/3 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobalSearch() {
  const { state } = useDemo();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const term = q.toLowerCase();
    const out: { label: string; meta: string; to: string }[] = [];
    state.items
      .filter((i) => i.name.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term))
      .slice(0, 4)
      .forEach((i) => out.push({ label: i.name, meta: `Item · ${i.sku}`, to: "/inventory" }));
    state.transfers
      .filter((t) => t.ref.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((t) => out.push({ label: t.ref, meta: "Stock transfer", to: "/transfers" }));
    state.purchaseOrders
      .filter((p) => p.ref.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((p) => out.push({ label: p.ref, meta: "Purchase order", to: "/purchasing" }));
    state.locations
      .filter((l) => l.name.toLowerCase().includes(term) || l.code.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((l) => out.push({ label: l.name, meta: `Location · ${l.code}`, to: l.type === "store" ? "/stores" : "/restaurants" }));
    state.users
      .filter((u) => u.name.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((u) => out.push({ label: u.name, meta: "User", to: "/users" }));
    return out.slice(0, 8);
  }, [q, state]);

  return (
    <div className="relative hidden lg:block">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search items, POs, transfers…"
        className="w-72 bg-card pl-9 text-[13px]"
      />
      {results.length > 0 && (
        <div className="surface-card absolute top-11 left-0 z-50 w-72 overflow-hidden bg-popover p-1">
          {results.map((r, i) => (
            <button
              key={`${r.to}-${i}`}
              className="hover:bg-brand/5 flex w-full flex-col items-start rounded-lg px-3 py-2 text-left"
              onClick={() => {
                setQ("");
                navigate({ to: r.to });
              }}
            >
              <span className="text-[13px] font-medium">{r.label}</span>
              <span className="text-muted-foreground text-[11px]">{r.meta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  return (
    <p className="text-muted-foreground mb-1.5 text-[12px]">
      <Link to="/" className="hover:text-brand-deep">
        Home
      </Link>
      {parts.length === 0 && (
        <>
          <span className="text-brand/40 mx-1">/</span>
          <span className="text-brand-deep font-medium">Dashboard</span>
        </>
      )}
      {parts.map((part, i) => (
        <span key={part + i}>
          <span className="text-brand/40 mx-1">/</span>
          <span className={i === parts.length - 1 ? "text-brand-deep font-medium" : ""}>
            {titleCase(decodeURIComponent(part))}
          </span>
        </span>
      ))}
    </p>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, activeLocationId, setActiveLocationId, currentUser, update } = useDemo();
  const navigate = useNavigate();
  const unread = state.notifications.filter((n) => !n.read);
  const activeLocation = state.locations.find((l) => l.id === activeLocationId);
  const suppliedCount = activeLocation
    ? activeLocation.type === "store"
      ? state.supplyLinks.filter((s) => s.storeId === activeLocation.id).length
      : 1
    : state.supplyLinks.length;

  return (
    <div className="lagoon-bg relative min-h-screen w-full">
      <div className="relative flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar backdrop-blur-sm lg:block">
          <div className="sticky top-0 h-screen">
            <SidebarNav />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/60 px-4 backdrop-blur-md lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="bg-card lg:hidden" aria-label="Open navigation">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-card p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarNav />
              </SheetContent>
            </Sheet>

            <Select value={state.business.id} onValueChange={() => undefined}>
              <SelectTrigger className="w-auto gap-2 bg-card text-[13px] font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={state.business.id}>{state.business.name}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activeLocationId} onValueChange={(v) => setActiveLocationId(v)}>
              <SelectTrigger className="hidden w-auto gap-2 bg-card text-[13px] md:flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                <SelectGroup>
                  <SelectLabel>Stores</SelectLabel>
                  {stores(state).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Restaurants</SelectLabel>
                  {restaurants(state).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <span className="text-muted-foreground hidden text-[12px] xl:inline">
              {activeLocation
                ? activeLocation.type === "store"
                  ? `Supplying ${suppliedCount} outlets`
                  : `Supplied by ${
                      state.locations.find(
                        (l) => l.id === state.supplyLinks.find((s) => s.restaurantId === activeLocation.id)?.storeId,
                      )?.name ?? "—"
                    }`
                : `${stores(state).length} stores · ${restaurants(state).length} restaurants`}
            </span>

            <div className="ml-auto flex items-center gap-2 lg:gap-3">
              <GlobalSearch />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="relative size-9 bg-card p-0" aria-label="Notifications">
                    <Bell className="size-4" />
                    {unread.length > 0 && (
                      <span className="bg-coral absolute -top-1 -right-1 grid size-4 place-items-center rounded-full text-[9px] font-bold text-primary-foreground">
                        {unread.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Notifications
                    <button
                      className="text-brand text-[11px] font-medium"
                      onClick={() => unread.forEach((n) => update("notifications", n.id, { read: true }))}
                    >
                      Mark all read
                    </button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {state.notifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex-col items-start gap-0.5"
                      onClick={() => navigate({ to: "/notifications" })}
                    >
                      <span className="flex w-full items-center gap-2 text-[12px] font-medium">
                        {!n.read && <span className="bg-coral size-1.5 rounded-full" />}
                        {n.title}
                      </span>
                      <span className="text-muted-foreground text-[11px]">{n.createdAt}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/notifications" })}>
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-brand/5">
                    <span className="bg-aqua/50 text-brand-deep grid size-9 place-items-center rounded-full text-[12px] font-semibold">
                      {currentUser.initials}
                    </span>
                    <span className="hidden leading-tight sm:block">
                      <span className="block text-[12px] font-semibold">{currentUser.name}</span>
                      <span className="text-muted-foreground block text-[10px]">{currentUser.role}</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>{currentUser.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>My profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/audit-logs" })}>My activity</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-coral">Sign out (demo)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
