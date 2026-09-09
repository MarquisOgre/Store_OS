import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/storeos/AdminPages";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — StoreOS" }, { name: "description", content: "StoreOS business and workspace settings." }] }),
  component: SettingsPage,
});
