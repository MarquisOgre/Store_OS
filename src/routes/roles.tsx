import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/components/storeos/AdminPages";

export const Route = createFileRoute("/roles")({
  head: () => ({ meta: [{ title: "Roles & Permissions — StoreOS" }, { name: "description", content: "Roles and permission profiles." }] }),
  component: RolesPage,
});
