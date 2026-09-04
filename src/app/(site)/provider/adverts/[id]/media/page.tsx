import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { MediaManager } from "@/components/media-manager";
import { providerNav } from "../../../nav";

export const metadata = { title: "Photos and video" };
export const dynamic = "force-dynamic";

export default async function MediaPage({ params }: { params: { id: string } }) {
  const { companyId } = await requireCompany();
  const listing = await db.listing.findFirst({
    where: { id: params.id, companyId },
    include: { media: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] } },
  });
  if (!listing) notFound();

  const nav = await providerNav(companyId);

  return (
    <DashboardShell
      title="Photos and video"
      subtitle="Drag to reorder. The first photo is what people see in search results."
      nav={nav}
      active="/provider/adverts"
    >
      <MediaManager
        listingId={listing.id}
        status={listing.status}
        media={listing.media.map((item) => ({
          id: item.id,
          url: item.url,
          type: item.type,
          caption: item.caption,
          isPrimary: item.isPrimary,
        }))}
      />
    </DashboardShell>
  );
}
