/**
 * StoreOS demo domain types.
 *
 * This is the single source of truth for the demo. Every screen reads from the
 * in-memory store in `store.tsx`, so these interfaces can later be backed by
 * real repositories/services without touching the UI.
 */

export type LocationType = "store" | "restaurant";
export type ActiveStatus = "active" | "inactive";

export interface Business {
  id: string;
  name: string;
  legalName: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  currency: string;
  financialYearStart: string;
  timezone: string;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  address: string;
  city: string;
  phone: string;
  manager: string;
  status: ActiveStatus;
  openTime: string;
  closeTime: string;
}

export interface SupplyLink {
  id: string;
  storeId: string;
  restaurantId: string;
  leadTimeDays: number;
  schedule: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  city: string;
  paymentTerms: string;
  status: ActiveStatus;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  reorderPoint: number;
  status: ActiveStatus;
}

export interface StockLevel {
  id: string;
  itemId: string;
  locationId: string;
  onHand: number;
}

export interface DocLine {
  itemId: string;
  qty: number;
  rate: number;
}

export type PoStatus = "draft" | "pending" | "approved" | "received" | "cancelled";

export interface PurchaseOrder {
  id: string;
  ref: string;
  supplierId: string;
  locationId: string;
  orderDate: string;
  expectedDate: string;
  status: PoStatus;
  lines: DocLine[];
  total: number;
  createdBy: string;
}

export interface PurchaseReceipt {
  id: string;
  ref: string;
  poRef: string;
  supplierId: string;
  locationId: string;
  receivedDate: string;
  invoiceNo: string;
  amount: number;
  status: "partial" | "complete";
  receivedBy: string;
}

export type MovementType =
  | "purchase"
  | "transfer-out"
  | "transfer-in"
  | "sale"
  | "adjustment"
  | "wastage";

export interface StockMovement {
  id: string;
  date: string;
  itemId: string;
  locationId: string;
  type: MovementType;
  qty: number;
  ref: string;
  user: string;
}

export type TransferStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "dispatched"
  | "received"
  | "rejected"
  | "cancelled";

export interface StockTransfer {
  id: string;
  ref: string;
  fromLocationId: string;
  toLocationId: string;
  createdDate: string;
  expectedDate: string;
  status: TransferStatus;
  lines: DocLine[];
  value: number;
  createdBy: string;
  notes: string;
}

export type CountStatus = "draft" | "in_progress" | "submitted" | "approved";

export interface CountLine {
  itemId: string;
  systemQty: number;
  countedQty: number | null;
}

export interface PhysicalCount {
  id: string;
  ref: string;
  locationId: string;
  countDate: string;
  scope: string;
  status: CountStatus;
  lines: CountLine[];
  countedBy: string;
}

export type AdjustmentStatus = "pending" | "approved" | "rejected";

export interface StockAdjustment {
  id: string;
  ref: string;
  locationId: string;
  countRef: string | null;
  itemId: string;
  adjustmentDate: string;
  qty: number;
  reason: string;
  status: AdjustmentStatus;
  raisedBy: string;
  approvedBy: string | null;
}

export interface Sale {
  id: string;
  ref: string;
  locationId: string;
  saleDate: string;
  channel: "Dine-in" | "Takeaway" | "Delivery";
  covers: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMode: "Cash" | "UPI" | "Card";
  status: "completed" | "refunded" | "void";
}

export interface Expense {
  id: string;
  ref: string;
  locationId: string;
  category: string;
  expenseDate: string;
  paidTo: string;
  amount: number;
  paymentMode: "Cash" | "UPI" | "Bank Transfer";
  status: AdjustmentStatus;
  notes: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  scope: "Business" | "Store" | "Restaurant";
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  locationId: string;
  status: ActiveStatus;
  lastActive: string;
}

export interface Notification {
  id: string;
  kind: "low_stock" | "transfer" | "purchase" | "variance" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  locationId: string | null;
}

export interface AuditLog {
  id: string;
  at: string;
  user: string;
  action: string;
  entity: string;
  entityRef: string;
  ip: string;
}

export interface DemoState {
  business: Business;
  locations: Location[];
  supplyLinks: SupplyLink[];
  categories: Category[];
  suppliers: Supplier[];
  items: Item[];
  stockLevels: StockLevel[];
  purchaseOrders: PurchaseOrder[];
  purchaseReceipts: PurchaseReceipt[];
  movements: StockMovement[];
  transfers: StockTransfer[];
  counts: PhysicalCount[];
  adjustments: StockAdjustment[];
  sales: Sale[];
  expenses: Expense[];
  roles: Role[];
  users: User[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}
