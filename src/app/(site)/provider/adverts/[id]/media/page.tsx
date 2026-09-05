import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { MediaManager } from "@/components/media-manager";
import { providerNav } from "../../../nav";

export const metadata = { title: "Photos and video" };
export const dynamic = "force-dynamic";

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireCompany();
  const { id } = await params;
  const listing = await db.listing.findFirst({
    where: { id, companyId },
    include: {
      rooms: { orderBy: { name: "asc" }, select: { id: true, name: true } },
      media: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
    },
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
          roomId: item.roomId,
          isPrimary: item.isPrimary,
        }))}
        rooms={listing.rooms}
      />
    </DashboardShell>
  );
}
