import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/storeos/PageHeader";
import { StatusBadge } from "@/components/storeos/StatusBadge";
import { useDemo } from "@/lib/demo/store";

export function ProfileScreen() {
  const { state, currentUser } = useDemo();
  const user = currentUser ?? state.users[0];
  const role = user ? state.roles.find((r) => r.id === user.roleId) : undefined;
  const location = user ? state.locations.find((l) => l.id === user.locationId) : undefined;

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Your StoreOS account, access profile and assigned operating scope."
        actions={
          <Button
            variant="outline"
            className="bg-card"
            onClick={() => toast.success("Profile editing is available in the demo workflow")}
          >
            Edit profile
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Account" className="lg:col-span-2">
          {user ? (
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[
                ["Name", user.name],
                ["Email", user.email],
                ["Phone", user.phone],
                ["Role", role?.name ?? "—"],
                ["Scope", role?.scope ?? "—"],
                ["Primary location", location?.name ?? "All locations"],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt className="text-muted-foreground text-[11px] uppercase">{key}</dt>
                  <dd className="mt-1 text-[13px] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">No profile is currently assigned.</p>
          )}
        </SectionCard>

        <SectionCard title="Access summary">
          <div className="space-y-3">
            <div className="rounded-xl bg-sun/50 p-4">
              <p className="text-muted-foreground text-[11px]">Permissions</p>
              <p className="font-display mt-1 text-2xl">{role?.permissions.length ?? 0}</p>
            </div>
            <div className="rounded-xl bg-sun/50 p-4">
              <p className="text-muted-foreground text-[11px]">Status</p>
              <div className="mt-1">
                <StatusBadge status={user?.status ?? "inactive"} />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
