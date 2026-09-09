import { createFileRoute } from "@tanstack/react-router";
import { ExpensesPage } from "@/components/storeos/AdminPages";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Expenses — StoreOS" }, { name: "description", content: "Outlet expense tracking and approvals." }] }),
  component: ExpensesPage,
});
