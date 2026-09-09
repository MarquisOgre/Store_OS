import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen } from "@/components/storeos/ProfileScreen";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — StoreOS" },
      { name: "description", content: "StoreOS user profile and access summary." },
    ],
  }),
  component: ProfileScreen,
});
