import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";
import { VerifiedBadge } from "@/components/badges";
import { ORG_TYPES, supportLabel } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const company = await db.company.findUnique({ where: { slug: params.slug }, select: { name: true } });
  return { title: company?.name ?? "Provider" };
}

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const company = await db.company.findUnique({
    where: { slug: params.slug },
    include: {
      listings: {
        where: { status: "ACTIVE" },
        include: {
          company: { select: { id: true, name: true, slug: true, verification: true } },
          property: { select: { city: true, area: true, postcode: true, showExactAddress: true, addressLine1: true, latitude: true, longitude: true, verification: true } },
          media: { where: { type: "IMAGE" }, orderBy: [{ isPrimary: "desc" }, { position: "asc" }], take: 1 },
          rooms: { select: { status: true } },
        },
      },
    },
  });

  if (!company || company.status !== "ACTIVE") notFound();

  return (
    <div className="shell py-10">
      <header className="card p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-tight">{company.name}</h1>
            <p className="mt-1.5 text-[15px] text-ink-soft">
              {ORG_TYPES[company.orgType]}
              {company.city ? ` · ${company.city}` : ""}
            </p>
          </div>
          {company.verification === "APPROVED" && <VerifiedBadge />}
        </div>

        {company.about && <p className="mt-5 max-w-[70ch] text-[16px] leading-relaxed text-ink-soft">{company.about}</p>}

        {company.supportTypes.length > 0 && (
          <div className="mt-5">
            <h2 className="text-[15px] font-medium">Support categories</h2>
            <p className="mt-2 flex flex-wrap gap-1.5">
              {company.supportTypes.map((slug) => (
                <span key={slug} className="chip">{supportLabel(slug)}</span>
              ))}
            </p>
          </div>
        )}

        {company.operatingAreas.length > 0 && (
          <p className="mt-4 text-[14px] text-ink-soft">
            Operating in {company.operatingAreas.join(", ")}
          </p>
        )}

        <p className="mt-6 text-[13px] text-ink-faint">
          Contact this provider through an advert below — messages stay inside the platform.
        </p>
      </header>

      <h2 className="mt-10 text-[24px]">
        {company.listings.length} live advert{company.listings.length === 1 ? "" : "s"}
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {company.listings.map((listing) => (
          <ListingCard key={listing.id} listing={{ ...listing, distanceMiles: null }} />
        ))}
      </div>
    </div>
  );
}
