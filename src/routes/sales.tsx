import { createFileRoute } from "@tanstack/react-router";
import { SalesPage } from "@/components/storeos/AdminPages";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Sales — StoreOS" }, { name: "description", content: "Restaurant sales and revenue operations." }] }),
  component: SalesPage,
});
