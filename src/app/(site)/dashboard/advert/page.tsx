import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { LookingForForm } from "@/components/looking-for-form";
import { userNav } from "../nav";

export const metadata = { title: "My accommodation advert" };
export const dynamic = "force-dynamic";

export default async function LookingForAdvertPage() {
  const user = await requireUser("/dashboard/advert");
  const nav = await userNav(user.id);
  const ad = await db.lookingForAd.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });

  return (
    <DashboardShell
      title={ad ? "Edit your advert" : "Create a 'looking for accommodation' advert"}
      subtitle="This is what providers see when they search for people in your area. Share as much or as little as you like."
      nav={nav}
      active="/dashboard/advert"
    >
      <LookingForForm
        ad={
          ad
            ? {
                id: ad.id,
                title: ad.title,
                city: ad.city,
                postcode: ad.postcode ?? "",
                radiusMiles: ad.radiusMiles,
                accommodationTypes: ad.accommodationTypes,
                supportTypes: ad.supportTypes,
                moveInDate: ad.moveInDate?.toISOString().slice(0, 10) ?? "",
                budgetWeekly: ad.budgetWeekly ? String(ad.budgetWeekly / 100) : "",
                genderArrangement: ad.genderArrangement,
                age: ad.age ? String(ad.age) : "",
                accessibilityNeeds: ad.accessibilityNeeds ?? "",
                about: ad.about ?? "",
                lookingFor: ad.lookingFor ?? "",
                videoUrl: ad.videoUrl ?? "",
              }
            : null
        }
        discoverable={user.profile?.discoverable ?? false}
      />
    </DashboardShell>
  );
}
