import Link from "next/link";
import { requireReferrer } from "@/lib/rbac";
import { referrerPlanLimits } from "@/lib/billing";
import { DashboardShell } from "@/components/dashboard-shell";
import { ClientForm } from "@/components/client-form";
import { referrerNav } from "../../nav";

export const metadata = { title: "Add a client" };
export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  const user = await requireReferrer();
  const [nav, limits] = await Promise.all([referrerNav(user.id), referrerPlanLimits(user.id)]);

  return (
    <DashboardShell
      title="Add a client"
      subtitle="Nothing here is visible to anyone else until you choose to share it."
      nav={nav}
      active="/referrals/clients"
    >
      {limits.canAddClient ? (
        <ClientForm />
      ) : (
        <div className="card p-6">
          <h2 className="text-[20px]">You&apos;ve reached your plan&apos;s client limit</h2>
          <p className="mt-2 text-[15px] text-ink-soft">
            The {limits.membership.name} plan covers {limits.membership.maxClients} active clients.
            Archive one you&apos;re no longer supporting, or move up a plan.
          </p>
          <Link href="/referrals/membership" className="btn-primary mt-4">See plans</Link>
        </div>
      )}
    </DashboardShell>
  );
}
