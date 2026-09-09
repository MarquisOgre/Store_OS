import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/storeos/AdminPages";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — StoreOS" }, { name: "description", content: "Management and operational reports." }] }),
  component: ReportsPage,
});
