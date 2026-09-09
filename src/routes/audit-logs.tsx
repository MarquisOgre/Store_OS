import { createFileRoute } from "@tanstack/react-router";
import { AuditLogsPage } from "@/components/storeos/AdminPages";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — StoreOS" }, { name: "description", content: "StoreOS audit trail and activity history." }] }),
  component: AuditLogsPage,
});
