import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/components/storeos/AdminPages";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Users — StoreOS" }, { name: "description", content: "StoreOS user administration." }] }),
  component: UsersPage,
});
