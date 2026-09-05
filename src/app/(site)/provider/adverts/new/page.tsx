import Link from "next/link";
import { requireCompany } from "@/lib/rbac";
import { planLimits } from "@/lib/billing";
import { AdvertForm } from "@/components/advert-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { providerNav } from "../../nav";

export const metadata = { title: "Post an advert" };
export const dynamic = "force-dynamic";

export default async function NewAdvertPage() {
  const { companyId } = await requireCompany();
  const [nav, limits] = await Promise.all([providerNav(companyId), planLimits(companyId)]);

  return (
    <DashboardShell
      title="Post an advert"
      subtitle="Complete the four short steps, then save. Nothing goes live until you submit it and our team approves it."
      nav={nav}
      active="/provider/adverts"
    >
      {limits.canAddListing ? (
        <AdvertForm />
      ) : (
        <div className="card p-6">
          <h2 className="text-[20px]">You&apos;ve used all your adverts</h2>
          <p className="mt-2 text-[15px] text-ink-soft">
            The {limits.membership.name} plan covers {limits.membership.maxListings} live adverts.
            Archive one you no longer need, or move up a plan.
          </p>
          <Link href="/provider/membership" className="btn-primary mt-4">See plans</Link>
        </div>
      )}
    </DashboardShell>
  );
}
