import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/storeos/AdminPages";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — StoreOS" }, { name: "description", content: "StoreOS operational notifications and alerts." }] }),
  component: NotificationsPage,
});
