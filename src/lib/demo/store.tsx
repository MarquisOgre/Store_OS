import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSeedState, currentUser } from "./seed";
import type { AuditLog, DemoState } from "./types";

type CollectionKey = Exclude<keyof DemoState, "business">;

type WithId = { id: string };

interface DemoContextValue {
  state: DemoState;
  currentUser: typeof currentUser;
  activeLocationId: string | "all";
  setActiveLocationId: (id: string | "all") => void;
  add: <K extends CollectionKey>(key: K, item: DemoState[K][number], label?: string) => void;
  update: <K extends CollectionKey>(
    key: K,
    id: string,
    patch: Partial<DemoState[K][number]>,
    label?: string,
  ) => void;
  remove: <K extends CollectionKey>(key: K, id: string, label?: string) => void;
  updateBusiness: (patch: Partial<DemoState["business"]>) => void;
  logAction: (action: string, entity: string, entityRef: string) => void;
  reset: () => void;
  nextRef: (prefix: string, existing: string[]) => string;
}

const DemoContext = createContext<DemoContextValue | null>(null);

const ENTITY_LABELS: Record<string, string> = {
  locations: "Location",
  supplyLinks: "Supply Route",
  categories: "Category",
  suppliers: "Supplier",
  items: "Item",
  stockLevels: "Stock Level",
  purchaseOrders: "Purchase Order",
  purchaseReceipts: "Purchase Receipt",
  movements: "Stock Movement",
  transfers: "Stock Transfer",
  counts: "Physical Count",
  adjustments: "Stock Adjustment",
  sales: "Sale",
  expenses: "Expense",
  roles: "Role",
  users: "User",
  notifications: "Notification",
  auditLogs: "Audit Log",
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createSeedState());
  const [activeLocationId, setActiveLocationId] = useState<string | "all">("all");

  const pushAudit = useCallback((action: string, entity: string, entityRef: string) => {
    const now = new Date();
    const entry: AuditLog = {
      id: `aud-${now.getTime()}-${Math.round(Math.random() * 1000)}`,
      at: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
      user: currentUser.name,
      action,
      entity,
      entityRef,
      ip: "49.36.14.201",
    };
    setState((prev) => ({ ...prev, auditLogs: [entry, ...prev.auditLogs] }));
  }, []);

  const add = useCallback(
    <K extends CollectionKey>(key: K, item: DemoState[K][number], label?: string) => {
      setState((prev) => ({ ...prev, [key]: [item as never, ...(prev[key] as never[])] }) as DemoState);
      const rec = item as unknown as { ref?: string; name?: string; id: string };
      pushAudit("Created", ENTITY_LABELS[key] ?? key, label ?? rec.ref ?? rec.name ?? rec.id);
    },
    [pushAudit],
  );

  const update = useCallback(
    <K extends CollectionKey>(key: K, id: string, patch: Partial<DemoState[K][number]>, label?: string) => {
      let matched: WithId | undefined;
      setState((prev) => {
        const list = prev[key] as unknown as WithId[];
        const next = list.map((row) => {
          if (row.id !== id) return row;
          matched = { ...row, ...(patch as object) } as WithId;
          return matched;
        });
        return { ...prev, [key]: next } as DemoState;
      });
      const rec = matched as unknown as { ref?: string; name?: string } | undefined;
      pushAudit("Updated", ENTITY_LABELS[key] ?? key, label ?? rec?.ref ?? rec?.name ?? id);
    },
    [pushAudit],
  );

  const remove = useCallback(
    <K extends CollectionKey>(key: K, id: string, label?: string) => {
      setState((prev) => {
        const list = prev[key] as unknown as WithId[];
        return { ...prev, [key]: list.filter((row) => row.id !== id) } as DemoState;
      });
      pushAudit("Deleted", ENTITY_LABELS[key] ?? key, label ?? id);
    },
    [pushAudit],
  );

  const updateBusiness = useCallback(
    (patch: Partial<DemoState["business"]>) => {
      setState((prev) => ({ ...prev, business: { ...prev.business, ...patch } }));
      pushAudit("Updated", "Business", "biz-1");
    },
    [pushAudit],
  );

  const reset = useCallback(() => setState(createSeedState()), []);

  const nextRef = useCallback((prefix: string, existing: string[]) => {
    const nums = existing
      .map((r) => Number(r.replace(`${prefix}-`, "")))
      .filter((n) => !Number.isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 1000) + 1;
    return `${prefix}-${next}`;
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      currentUser,
      activeLocationId,
      setActiveLocationId,
      add,
      update,
      remove,
      updateBusiness,
      logAction: pushAudit,
      reset,
      nextRef,
    }),
    [state, activeLocationId, add, update, remove, updateBusiness, pushAudit, reset, nextRef],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
