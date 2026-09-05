import { redirect } from "next/navigation";

/** Provider notifications link here; the referral view itself is shared. */
export default async function ProviderReferralRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/referrals/${id}`);
}
