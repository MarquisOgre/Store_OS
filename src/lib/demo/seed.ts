import type {
  AuditLog,
  Category,
  DemoState,
  Expense,
  Item,
  Location,
  Notification,
  PhysicalCount,
  PurchaseOrder,
  PurchaseReceipt,
  Role,
  Sale,
  StockAdjustment,
  StockLevel,
  StockMovement,
  StockTransfer,
  SupplyLink,
  Supplier,
  User,
} from "./types";

/** Deterministic pseudo-random so the demo looks identical on every render. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}
const rand = rng(42);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const day = (offset: number) => {
  const d = new Date(2026, 7, 28);
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
};

const business: DemoState["business"] = {
  id: "biz-1",
  name: "Blue Water Group",
  legalName: "Blue Water Hospitality Pvt. Ltd.",
  gstin: "29AAGCB1234K1ZP",
  pan: "AAGCB1234K",
  email: "ops@bluewatergroup.in",
  phone: "+91 80 4123 8890",
  address: "No. 41, Lavelle Road, Ashok Nagar",
  city: "Bengaluru",
  state: "Karnataka",
  currency: "INR",
  financialYearStart: "April",
  timezone: "Asia/Kolkata",
};

const locations: Location[] = [
  {
    id: "loc-cs",
    code: "CS-01",
    name: "Central Store",
    type: "store",
    address: "Plot 14, Peenya Industrial Area",
    city: "Bengaluru",
    phone: "+91 80 4123 8891",
    manager: "Rakesh Iyer",
    status: "active",
    openTime: "06:00",
    closeTime: "20:00",
  },
  {
    id: "loc-ns",
    code: "NS-02",
    name: "North Store",
    type: "store",
    address: "Survey 88, Yelahanka New Town",
    city: "Bengaluru",
    phone: "+91 80 4123 8892",
    manager: "Sneha Kulkarni",
    status: "active",
    openTime: "06:30",
    closeTime: "19:30",
  },
  {
    id: "loc-ss",
    code: "SS-03",
    name: "South Store",
    type: "store",
    address: "24/3, Bannerghatta Main Road",
    city: "Bengaluru",
    phone: "+91 80 4123 8893",
    manager: "Imran Shaikh",
    status: "active",
    openTime: "07:00",
    closeTime: "20:00",
  },
  {
    id: "loc-r1",
    code: "R-01",
    name: "Restaurant 1 — Indiranagar",
    type: "restaurant",
    address: "100 Feet Road, Indiranagar",
    city: "Bengaluru",
    phone: "+91 80 4123 8801",
    manager: "Aarti Deshpande",
    status: "active",
    openTime: "11:00",
    closeTime: "23:30",
  },
  {
    id: "loc-r2",
    code: "R-02",
    name: "Restaurant 2 — Koramangala",
    type: "restaurant",
    address: "80 Feet Road, Koramangala 4th Block",
    city: "Bengaluru",
    phone: "+91 80 4123 8802",
    manager: "Vikram Nair",
    status: "active",
    openTime: "11:30",
    closeTime: "23:59",
  },
  {
    id: "loc-r3",
    code: "R-03",
    name: "Restaurant 3 — Hebbal",
    type: "restaurant",
    address: "Outer Ring Road, Hebbal",
    city: "Bengaluru",
    phone: "+91 80 4123 8803",
    manager: "Pooja Rane",
    status: "active",
    openTime: "12:00",
    closeTime: "23:00",
  },
  {
    id: "loc-r4",
    code: "R-04",
    name: "Restaurant 4 — Whitefield",
    type: "restaurant",
    address: "ITPL Main Road, Whitefield",
    city: "Bengaluru",
    phone: "+91 80 4123 8804",
    manager: "Sandeep Menon",
    status: "active",
    openTime: "11:00",
    closeTime: "23:00",
  },
  {
    id: "loc-r5",
    code: "R-05",
    name: "Restaurant 5 — Jayanagar",
    type: "restaurant",
    address: "11th Main, Jayanagar 4th Block",
    city: "Bengaluru",
    phone: "+91 80 4123 8805",
    manager: "Lakshmi Prasad",
    status: "active",
    openTime: "11:30",
    closeTime: "22:30",
  },
];

const supplyLinks: SupplyLink[] = [
  { id: "sl-1", storeId: "loc-cs", restaurantId: "loc-r1", leadTimeDays: 1, schedule: "Daily 07:00" },
  { id: "sl-2", storeId: "loc-cs", restaurantId: "loc-r2", leadTimeDays: 1, schedule: "Daily 07:30" },
  { id: "sl-3", storeId: "loc-ns", restaurantId: "loc-r3", leadTimeDays: 1, schedule: "Mon/Wed/Fri 08:00" },
  { id: "sl-4", storeId: "loc-ns", restaurantId: "loc-r4", leadTimeDays: 2, schedule: "Tue/Thu/Sat 08:00" },
  { id: "sl-5", storeId: "loc-ss", restaurantId: "loc-r5", leadTimeDays: 1, schedule: "Daily 08:30" },
];

const categories: Category[] = [
  { id: "cat-1", name: "Grains & Staples", description: "Rice, atta, pulses and flours" },
  { id: "cat-2", name: "Spices & Masala", description: "Whole and ground spices" },
  { id: "cat-3", name: "Oils & Ghee", description: "Cooking oils, ghee and fats" },
  { id: "cat-4", name: "Dairy", description: "Milk, paneer, curd, butter" },
  { id: "cat-5", name: "Vegetables", description: "Fresh produce" },
  { id: "cat-6", name: "Meat & Seafood", description: "Chicken, mutton, prawns" },
  { id: "cat-7", name: "Beverages", description: "Soft drinks, juices, tea, coffee" },
  { id: "cat-8", name: "Packaging & Consumables", description: "Containers, cutlery, tissues" },
];

const suppliers: Supplier[] = [
  ["Saffron Agro Traders", "Mahesh Bhatia", "Bengaluru", "29AACFS1122L1Z4", "Net 30"],
  ["Sri Balaji Provisions", "Balaji Reddy", "Bengaluru", "29AAECS9911M1ZQ", "Net 15"],
  ["Konkan Fresh Seafoods", "Nitin Sawant", "Mangaluru", "29AAFCK4455P1ZB", "Net 7"],
  ["Nandini Dairy Distributors", "Girish Rao", "Bengaluru", "29AAACN7788R1ZK", "Net 15"],
  ["Deccan Oils & Ghee Co.", "Farah Qureshi", "Hyderabad", "36AABCD3344T1ZM", "Net 30"],
  ["Green Basket Vegetables", "Suresh Gowda", "Kolar", "29AAGCG5566V1ZD", "Cash on delivery" ],
  ["Mysore Spice House", "Rekha Murthy", "Mysuru", "29AAHCM2233W1ZF", "Net 30"],
  ["Ecopack Solutions", "Anil Kumar", "Bengaluru", "29AAJCE6677Y1ZH", "Net 45"],
].map((s, i) => ({
  id: `sup-${i + 1}`,
  code: `SUP-${String(i + 1).padStart(3, "0")}`,
  name: s[0],
  contactPerson: s[1],
  city: s[2],
  gstin: s[3],
  paymentTerms: s[4],
  phone: `+91 98${int(10, 99)}0 ${int(10000, 99999)}`,
  email: `orders@${s[0].split(" ")[0].toLowerCase()}.in`,
  status: i === 7 ? "inactive" : "active",
}));

const itemSeed: [string, string, string, number][] = [
  ["Basmati Rice (Premium)", "cat-1", "kg", 128],
  ["Sona Masoori Rice", "cat-1", "kg", 62],
  ["Whole Wheat Atta", "cat-1", "kg", 48],
  ["Toor Dal", "cat-1", "kg", 142],
  ["Urad Dal", "cat-1", "kg", 128],
  ["Chana Dal", "cat-1", "kg", 96],
  ["Semolina (Rava)", "cat-1", "kg", 44],
  ["Poha (Thick)", "cat-1", "kg", 52],
  ["Kashmiri Chilli Powder", "cat-2", "kg", 480],
  ["Turmeric Powder", "cat-2", "kg", 310],
  ["Coriander Powder", "cat-2", "kg", 260],
  ["Garam Masala", "cat-2", "kg", 640],
  ["Cumin Seeds", "cat-2", "kg", 420],
  ["Green Cardamom", "cat-2", "kg", 2450],
  ["Saffron (Kashmiri)", "cat-2", "g", 320],
  ["Black Pepper", "cat-2", "kg", 780],
  ["Refined Sunflower Oil", "cat-3", "litre", 132],
  ["Coconut Oil", "cat-3", "litre", 218],
  ["Cow Ghee", "cat-3", "kg", 620],
  ["Mustard Oil", "cat-3", "litre", 164],
  ["Toned Milk", "cat-4", "litre", 54],
  ["Paneer", "cat-4", "kg", 386],
  ["Curd", "cat-4", "kg", 74],
  ["Butter (Unsalted)", "cat-4", "kg", 512],
  ["Fresh Cream", "cat-4", "litre", 268],
  ["Onion", "cat-5", "kg", 34],
  ["Tomato", "cat-5", "kg", 28],
  ["Potato", "cat-5", "kg", 31],
  ["Green Chilli", "cat-5", "kg", 68],
  ["Ginger", "cat-5", "kg", 92],
  ["Garlic (Peeled)", "cat-5", "kg", 186],
  ["Coriander Leaves", "cat-5", "kg", 58],
  ["Chicken (Boneless)", "cat-6", "kg", 296],
  ["Mutton (Curry Cut)", "cat-6", "kg", 742],
  ["Prawns (Medium)", "cat-6", "kg", 528],
  ["Seer Fish Steaks", "cat-6", "kg", 610],
  ["Cola 750ml", "cat-7", "case", 486],
  ["Packaged Water 1L", "cat-7", "case", 168],
  ["Assam Tea Leaves", "cat-7", "kg", 428],
  ["Filter Coffee Powder", "cat-7", "kg", 596],
  ["Lime Juice Concentrate", "cat-7", "litre", 212],
  ["Kraft Takeaway Box (750ml)", "cat-8", "pack", 372],
  ["Paper Bags (Large)", "cat-8", "pack", 244],
  ["Aluminium Foil Roll", "cat-8", "roll", 158],
  ["Wooden Cutlery Set", "cat-8", "pack", 196],
  ["Tissue Napkins", "cat-8", "pack", 118],
];

const items: Item[] = itemSeed.map((s, i) => ({
  id: `item-${i + 1}`,
  sku: `SKU-${1000 + i * 7}`,
  name: s[0],
  categoryId: s[1],
  unit: s[2],
  costPrice: s[3],
  sellPrice: Math.round(s[3] * 1.35),
  reorderPoint: [10, 15, 20, 25, 30, 40][i % 6],
  status: i === 45 ? "inactive" : "active",
}));

const stockLevels: StockLevel[] = [];
for (const loc of locations) {
  for (const item of items) {
    const base = loc.type === "store" ? int(0, 220) : int(0, 70);
    stockLevels.push({
      id: `stk-${loc.id}-${item.id}`,
      itemId: item.id,
      locationId: loc.id,
      onHand: base,
    });
  }
}

const stores = locations.filter((l) => l.type === "store");
const restaurants = locations.filter((l) => l.type === "restaurant");
const staffNames = [
  "Rakesh Iyer",
  "Sneha Kulkarni",
  "Imran Shaikh",
  "Aarti Deshpande",
  "Vikram Nair",
  "Pooja Rane",
  "Sandeep Menon",
  "Lakshmi Prasad",
  "Aarav Menon",
  "Divya Suresh",
  "Harish Patil",
  "Meera Joshi",
  "Zoya Sheikh",
  "Karthik Raman",
  "Nisha Verma",
  "Arjun Bhatt",
  "Sudha Rao",
  "Tarun Malhotra",
  "Fatima Ansari",
  "Girish Naik",
  "Preeti Chandra",
  "Mohan Das",
];

const roles: Role[] = [
  {
    id: "role-1",
    name: "Business Owner",
    description: "Unrestricted access across the business",
    scope: "Business",
    permissions: ["dashboard.view", "inventory.manage", "transfers.approve", "purchasing.manage", "sales.view", "expenses.approve", "reports.view", "users.manage", "settings.manage"],
  },
  {
    id: "role-2",
    name: "Operations Head",
    description: "Business-wide operations, no billing or user admin",
    scope: "Business",
    permissions: ["dashboard.view", "inventory.manage", "transfers.approve", "purchasing.manage", "reports.view", "expenses.approve"],
  },
  {
    id: "role-3",
    name: "Store Manager",
    description: "Full control of a single store, raises transfers",
    scope: "Store",
    permissions: ["inventory.manage", "transfers.create", "transfers.dispatch", "purchasing.manage", "counts.create"],
  },
  {
    id: "role-4",
    name: "Restaurant Manager",
    description: "Receives transfers, records sales and expenses",
    scope: "Restaurant",
    permissions: ["inventory.view", "transfers.receive", "sales.manage", "expenses.create", "counts.create"],
  },
  {
    id: "role-5",
    name: "Store Keeper",
    description: "Counts stock and picks transfer lines",
    scope: "Store",
    permissions: ["inventory.view", "counts.create", "transfers.dispatch"],
  },
  {
    id: "role-6",
    name: "Purchase Officer",
    description: "Manages suppliers, purchase orders and receipts",
    scope: "Business",
    permissions: ["purchasing.manage", "reports.view"],
  },
  {
    id: "role-7",
    name: "Accountant",
    description: "Read-only financials, approves expenses",
    scope: "Business",
    permissions: ["reports.view", "expenses.approve", "sales.view"],
  },
  {
    id: "role-8",
    name: "Auditor",
    description: "Read-only access to counts, variances and audit logs",
    scope: "Business",
    permissions: ["reports.view", "audit.view", "counts.view"],
  },
];

const users: User[] = staffNames.map((name, i) => {
  const roleId = i === 8 ? "role-1" : roles[i % roles.length].id;
  const role = roles.find((r) => r.id === roleId)!;
  const loc =
    role.scope === "Store" ? stores[i % stores.length] : role.scope === "Restaurant" ? restaurants[i % restaurants.length] : locations[i % locations.length];
  return {
    id: `user-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@bluewatergroup.in`,
    phone: `+91 9${int(100000000, 899999999)}`,
    roleId,
    locationId: loc.id,
    status: i === 19 || i === 20 ? "inactive" : "active",
    lastActive: `${day(i % 9)} ${String(int(8, 21)).padStart(2, "0")}:${String(int(10, 59)).padStart(2, "0")}`,
  };
});

const poStatuses: PurchaseOrder["status"][] = ["draft", "pending", "approved", "received", "received", "cancelled"];
const purchaseOrders: PurchaseOrder[] = Array.from({ length: 18 }, (_, i) => {
  const lines = Array.from({ length: int(2, 5) }, () => {
    const item = pick(items);
    return { itemId: item.id, qty: int(5, 60), rate: item.costPrice };
  });
  return {
    id: `po-${i + 1}`,
    ref: `PO-${2400 + i}`,
    supplierId: pick(suppliers).id,
    locationId: pick(stores).id,
    orderDate: day(i + 2),
    expectedDate: day(i - 2),
    status: poStatuses[i % poStatuses.length],
    lines,
    total: lines.reduce((s, l) => s + l.qty * l.rate, 0),
    createdBy: pick(staffNames),
  };
});

const purchaseReceipts: PurchaseReceipt[] = purchaseOrders
  .filter((p) => p.status === "received")
  .map((po, i) => ({
    id: `pr-${i + 1}`,
    ref: `GRN-${1200 + i}`,
    poRef: po.ref,
    supplierId: po.supplierId,
    locationId: po.locationId,
    receivedDate: po.expectedDate,
    invoiceNo: `INV/26-27/${int(1000, 9999)}`,
    amount: po.total,
    status: i % 4 === 0 ? "partial" : "complete",
    receivedBy: pick(staffNames),
  }));

const transferStatuses: StockTransfer["status"][] = [
  "draft",
  "pending_approval",
  "approved",
  "dispatched",
  "received",
  "received",
  "rejected",
];
const transfers: StockTransfer[] = Array.from({ length: 16 }, (_, i) => {
  const link = supplyLinks[i % supplyLinks.length];
  const lines = Array.from({ length: int(2, 6) }, () => {
    const item = pick(items);
    return { itemId: item.id, qty: int(2, 40), rate: item.costPrice };
  });
  return {
    id: `trf-${i + 1}`,
    ref: `TRF-${2418 - i}`,
    fromLocationId: link.storeId,
    toLocationId: link.restaurantId,
    createdDate: day(i),
    expectedDate: day(i - 1),
    status: transferStatuses[i % transferStatuses.length],
    lines,
    value: lines.reduce((s, l) => s + l.qty * l.rate, 0),
    createdBy: pick(staffNames),
    notes: i % 3 === 0 ? "Weekend indent — prioritise chilled items." : "",
  };
});

const counts: PhysicalCount[] = Array.from({ length: 9 }, (_, i) => {
  const loc = locations[i % locations.length];
  const status: PhysicalCount["status"] = (["approved", "submitted", "in_progress", "draft"] as const)[i % 4];
  const lines: PhysicalCount["lines"] = Array.from({ length: int(4, 8) }, () => {
    const item = pick(items);
    const systemQty = int(10, 120);
    const counted = status === "draft" ? null : systemQty + (rand() < 0.4 ? int(-8, -1) : int(0, 4));
    return { itemId: item.id, systemQty, countedQty: counted };
  });
  return {
    id: `cnt-${i + 1}`,
    ref: `PIC-${310 + i}`,
    locationId: loc.id,
    countDate: day(i * 2),
    scope: pick(["Full count", "Spices & Masala", "High-value items", "Dairy cycle count"]),
    status,
    lines,
    countedBy: pick(staffNames),
  };
});

const adjustments: StockAdjustment[] = Array.from({ length: 14 }, (_, i) => {
  const count = counts[i % counts.length];
  const line = count.lines[0];
  const variance = (line.countedQty ?? line.systemQty) - line.systemQty || -int(1, 6);
  return {
    id: `adj-${i + 1}`,
    ref: `ADJ-${540 + i}`,
    locationId: count.locationId,
    countRef: i % 4 === 3 ? null : count.ref,
    itemId: line.itemId,
    adjustmentDate: day(i),
    qty: variance,
    reason: pick(["Count variance", "Spoilage / wastage", "Damaged in transit", "Data-entry correction", "Kitchen over-issue"]),
    status: (["approved", "pending", "approved", "rejected"] as const)[i % 4],
    raisedBy: pick(staffNames),
    approvedBy: i % 4 === 1 ? null : pick(staffNames),
  };
});

const sales: Sale[] = [];
restaurants.forEach((r, ri) => {
  for (let d = 0; d < 14; d++) {
    const subtotal = int(48000, 165000) + ri * 4000;
    const tax = Math.round(subtotal * 0.05);
    sales.push({
      id: `sale-${r.id}-${d}`,
      ref: `SL-${9100 + ri * 20 + d}`,
      locationId: r.id,
      saleDate: day(d),
      channel: pick(["Dine-in", "Takeaway", "Delivery"]),
      covers: int(60, 240),
      subtotal,
      tax,
      total: subtotal + tax,
      paymentMode: pick(["Cash", "UPI", "Card"]),
      status: d === 6 && ri === 2 ? "refunded" : "completed",
    });
  }
});

const expenseCategories = ["Rent", "Electricity", "Salaries", "Gas & Fuel", "Repairs & Maintenance", "Marketing", "Housekeeping", "Logistics"];
const expenses: Expense[] = Array.from({ length: 26 }, (_, i) => ({
  id: `exp-${i + 1}`,
  ref: `EXP-${770 + i}`,
  locationId: locations[i % locations.length].id,
  category: expenseCategories[i % expenseCategories.length],
  expenseDate: day(i),
  paidTo: pick(["Bharat Gas Agency", "BESCOM", "Sparkle Facility Services", "Prime Logistics", "Sri Landlord Trust", "Meta Ads", "Local vendor"]),
  amount: int(2500, 185000),
  paymentMode: pick(["Cash", "UPI", "Bank Transfer"]),
  status: (["approved", "pending", "approved", "rejected"] as const)[i % 4],
  notes: i % 5 === 0 ? "Awaiting original invoice from vendor." : "",
}));

const movements: StockMovement[] = Array.from({ length: 60 }, (_, i) => {
  const type = pick(["purchase", "transfer-out", "transfer-in", "sale", "adjustment", "wastage"] as const);
  const qty = type === "purchase" || type === "transfer-in" ? int(5, 80) : -int(1, 40);
  return {
    id: `mv-${i + 1}`,
    date: day(i % 14),
    itemId: pick(items).id,
    locationId: pick(locations).id,
    type,
    qty,
    ref: pick([...transfers.map((t) => t.ref), ...purchaseOrders.map((p) => p.ref), ...adjustments.map((a) => a.ref)]),
    user: pick(staffNames),
  };
});

const notifications: Notification[] = [
  { kind: "low_stock", title: "Low stock: Basmati Rice (Premium)", body: "Central Store is down to 12 kg, below the reorder point of 40 kg.", locationId: "loc-cs" },
  { kind: "purchase", title: "PO-2412 ready to receive", body: "Saffron Agro Traders marked the consignment as shipped.", locationId: "loc-ns" },
  { kind: "transfer", title: "TRF-2415 received", body: "Restaurant 2 reconciled all 6 lines with no variance.", locationId: "loc-r2" },
  { kind: "variance", title: "Variance pending approval", body: "PIC-312 at South Store reports −25 units against system stock.", locationId: "loc-ss" },
  { kind: "low_stock", title: "Low stock: Paneer", body: "Restaurant 4 has 4 kg left for tonight's service.", locationId: "loc-r4" },
  { kind: "system", title: "Monthly close in 4 days", body: "Complete pending counts and adjustments before 31st.", locationId: null },
  { kind: "transfer", title: "TRF-2417 awaiting dispatch", body: "North Store has not picked the indent for Restaurant 4.", locationId: "loc-ns" },
  { kind: "purchase", title: "Supplier invoice mismatch", body: "GRN-1203 differs from invoice INV/26-27/4821 by ₹1,240.", locationId: "loc-cs" },
].map((n, i) => ({
  id: `ntf-${i + 1}`,
  ...n,
  createdAt: `${day(i % 4)} ${String(int(7, 20)).padStart(2, "0")}:${String(int(10, 59)).padStart(2, "0")}`,
  read: i > 4,
}));

const auditLogs: AuditLog[] = Array.from({ length: 40 }, (_, i) => {
  const action = pick(["Created", "Updated", "Approved", "Rejected", "Deleted", "Dispatched", "Received", "Exported"]);
  const entity = pick(["Stock Transfer", "Purchase Order", "Physical Count", "Stock Adjustment", "Expense", "User", "Item", "Supplier"]);
  return {
    id: `aud-${i + 1}`,
    at: `${day(i % 12)} ${String(int(7, 21)).padStart(2, "0")}:${String(int(10, 59)).padStart(2, "0")}`,
    user: pick(staffNames),
    action,
    entity,
    entityRef: pick([...transfers.map((t) => t.ref), ...purchaseOrders.map((p) => p.ref), ...counts.map((c) => c.ref), ...adjustments.map((a) => a.ref), ...expenses.map((e) => e.ref)]),
    ip: `49.36.${int(2, 250)}.${int(2, 250)}`,
  };
});

export const currentUser = {
  id: "user-9",
  name: "Aarav Menon",
  email: "aarav.menon@bluewatergroup.in",
  role: "Business Owner",
  initials: "AM",
};

export function createSeedState(): DemoState {
  return {
    business,
    locations,
    supplyLinks,
    categories,
    suppliers,
    items,
    stockLevels,
    purchaseOrders,
    purchaseReceipts,
    movements,
    transfers,
    counts,
    adjustments,
    sales,
    expenses,
    roles,
    users,
    notifications,
    auditLogs,
  };
}

export const staffDirectory = staffNames;
