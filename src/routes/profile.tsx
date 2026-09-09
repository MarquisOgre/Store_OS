import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/storeos/AdminPages";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — StoreOS" }, { name: "description", content: "StoreOS user profile and access summary." }] }),
  component: ProfilePage,
});
