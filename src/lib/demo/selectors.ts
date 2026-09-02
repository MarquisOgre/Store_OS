import type { DemoState, Item, Location } from "./types";

export const byId = <T extends { id: string }>(rows: T[], id: string): T | undefined =>
  rows.find((r) => r.id === id);

export const locationName = (state: DemoState, id: string) =>
  byId(state.locations, id)?.name ?? "—";

export const shortLocation = (state: DemoState, id: string) => {
  const l = byId(state.locations, id);
  if (!l) return "—";
  return l.name.split(" — ")[0];
};

export const itemName = (state: DemoState, id: string) => byId(state.items, id)?.name ?? "—";
export const supplierName = (state: DemoState, id: string) => byId(state.suppliers, id)?.name ?? "—";
export const categoryName = (state: DemoState, id: string) => byId(state.categories, id)?.name ?? "—";
export const roleName = (state: DemoState, id: string) => byId(state.roles, id)?.name ?? "—";

export const stores = (state: DemoState) => state.locations.filter((l) => l.type === "store");
export const restaurants = (state: DemoState) => state.locations.filter((l) => l.type === "restaurant");

export const onHand = (state: DemoState, itemId: string, locationId: string | "all") => {
  const rows = state.stockLevels.filter(
    (s) => s.itemId === itemId && (locationId === "all" || s.locationId === locationId),
  );
  return rows.reduce((sum, r) => sum + r.onHand, 0);
};

export const inventoryValue = (state: DemoState, locationId: string | "all") =>
  state.stockLevels
    .filter((s) => locationId === "all" || s.locationId === locationId)
    .reduce((sum, s) => sum + s.onHand * (byId(state.items, s.itemId)?.costPrice ?? 0), 0);

export const lowStockRows = (state: DemoState, locationId: string | "all") =>
  state.stockLevels
    .filter((s) => locationId === "all" || s.locationId === locationId)
    .map((s) => ({ stock: s, item: byId(state.items, s.itemId) as Item | undefined }))
    .filter((r) => r.item && r.stock.onHand <= r.item.reorderPoint);

export const salesTotal = (state: DemoState, locationId: string | "all", days = 7) => {
  const cutoff = [...new Set(state.sales.map((s) => s.saleDate))].sort().reverse().slice(0, days);
  return state.sales
    .filter(
      (s) =>
        s.status === "completed" &&
        cutoff.includes(s.saleDate) &&
        (locationId === "all" || s.locationId === locationId),
    )
    .reduce((sum, s) => sum + s.total, 0);
};

export const openTransfers = (state: DemoState, locationId: string | "all") =>
  state.transfers.filter(
    (t) =>
      !["received", "rejected", "cancelled"].includes(t.status) &&
      (locationId === "all" || t.fromLocationId === locationId || t.toLocationId === locationId),
  );

/** Daily sales series for the dashboard charts. */
export const salesSeries = (state: DemoState, locationId: string | "all") => {
  const dates = [...new Set(state.sales.map((s) => s.saleDate))].sort();
  return dates.map((date) => {
    const rows = state.sales.filter(
      (s) => s.saleDate === date && (locationId === "all" || s.locationId === locationId),
    );
    return {
      date: date.slice(5),
      sales: rows.reduce((s, r) => s + r.total, 0),
      covers: rows.reduce((s, r) => s + r.covers, 0),
    };
  });
};

export const movementSeries = (state: DemoState, locationId: string | "all") => {
  const dates = [...new Set(state.movements.map((m) => m.date))].sort();
  return dates.map((date) => {
    const rows = state.movements.filter(
      (m) => m.date === date && (locationId === "all" || m.locationId === locationId),
    );
    return {
      date: date.slice(5),
      inbound: rows.filter((r) => r.qty > 0).reduce((s, r) => s + r.qty, 0),
      outbound: Math.abs(rows.filter((r) => r.qty < 0).reduce((s, r) => s + r.qty, 0)),
    };
  });
};

export const categoryValueSeries = (state: DemoState, locationId: string | "all") =>
  state.categories.map((cat) => {
    const value = state.stockLevels
      .filter((s) => locationId === "all" || s.locationId === locationId)
      .reduce((sum, s) => {
        const item = byId(state.items, s.itemId);
        if (!item || item.categoryId !== cat.id) return sum;
        return sum + s.onHand * item.costPrice;
      }, 0);
    return { name: cat.name, value: Math.round(value) };
  });

export const outletSalesSeries = (state: DemoState) =>
  restaurants(state).map((r: Location) => ({
    name: r.name.split(" — ")[0].replace("Restaurant ", "R"),
    sales: state.sales
      .filter((s) => s.locationId === r.id && s.status === "completed")
      .reduce((sum, s) => sum + s.total, 0),
    expenses: state.expenses
      .filter((e) => e.locationId === r.id && e.status === "approved")
      .reduce((sum, e) => sum + e.amount, 0),
  }));

export const variance = (line: { systemQty: number; countedQty: number | null }) =>
  line.countedQty === null ? 0 : line.countedQty - line.systemQty;
