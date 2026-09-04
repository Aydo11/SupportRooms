import { redirect } from "next/navigation";

/** Provider notifications link here; the referral view itself is shared. */
export default function ProviderReferralRedirect({ params }: { params: { id: string } }) {
  redirect(`/referrals/${params.id}`);
}
