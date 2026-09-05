import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { brand } from "@/brand.config";
import { SearchPanel } from "@/components/search-panel";
import { ListingCard } from "@/components/listing-card";
import { searchListings } from "@/server/search";
import { SUPPORT_TYPES } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [roomsAvailable, providers, cities, featured] = await Promise.all([
    db.room.count({ where: { status: "AVAILABLE", listing: { status: "ACTIVE" } } }),
    db.company.count({ where: { status: "ACTIVE" } }),
    db.property.findMany({ where: { listings: { some: { status: "ACTIVE" } } }, select: { city: true }, distinct: ["city"] }),
    searchListings({ sort: "featured" }),
  ]);

  return (
    <>
      {/* Hero: the search is the product, so it leads. */}
      <section className="surface-grid relative overflow-hidden border-b border-line bg-white">
        <div aria-hidden="true" className="soft-orb absolute -left-32 top-0 h-[34rem] w-[34rem]" />
        <div aria-hidden="true" className="soft-orb absolute -right-44 bottom-[-16rem] h-[34rem] w-[34rem]" />
        <div className="shell relative grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="self-center">
            <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-pine" />More housing, in one place</span>
            <h1 className="mt-5 max-w-[14ch] text-[42px] leading-[1.04] sm:text-[58px]">
              Find the right housing across the UK
            </h1>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-ink-soft">
              Search HMOs, supported and transitional accommodation, adult social care housing,
              shared homes and self-contained properties. Look for yourself or refer someone you support.
            </p>

            <div className="mt-8">
              <Suspense fallback={<div className="h-[120px] rounded-card border border-line bg-white" />}>
                <SearchPanel />
              </Suspense>
            </div>

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
              <Stat value={roomsAvailable} label="rooms available now" />
              <Stat value={providers} label="providers advertising" />
              <Stat value={cities.length} label="towns and cities" />
            </dl>
          </div>

          {/* Availability board — the thing this market actually runs on. */}
          <AvailabilityBoard />
        </div>
      </section>

      <section className="shell grid gap-4 py-14 sm:grid-cols-2">
        <PathCard
          heading="Looking for somewhere to live"
          body="Tell providers what you need and where. They can find you, and you can search their rooms."
          href="/register?type=USER"
          cta="Create your advert"
        />
        <PathCard
          heading="Advertising accommodation"
          body="List HMOs, supported housing, transitional homes, adult social care accommodation and other housing, then manage rooms, enquiries and referrals."
          href="/register?type=PROVIDER"
          cta="Advertise accommodation"
          tone="ink"
        />
      </section>

      {featured.items.length > 0 && (
        <section className="shell py-6 sm:py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[28px]">Recently listed</h2>
              <p className="mt-1 text-[15px] text-ink-soft">Adverts our team has reviewed and published.</p>
            </div>
            <Link href="/search" className="btn-secondary shrink-0">See all</Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.items.slice(0, 6).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      <section className="shell py-14">
        <span className="text-[13px] font-semibold tracking-[0.08em] text-pine-dark">FIND A SUITABLE HOME</span>
        <h2 className="mt-2 text-[30px]">Filter by housing and support need</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {SUPPORT_TYPES.filter((t) => t.slug !== "other").map((type) => (
            <Link key={type.slug} href={`/search?support=${type.slug}`} className="chip hover:-translate-y-px hover:border-pine hover:text-pine-dark">
              {type.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="shell py-14">
          <span className="text-[13px] font-semibold tracking-[0.08em] text-pine-dark">A CLEARER WAY TO CONNECT</span>
          <h2 className="mt-2 text-[30px]">How it works</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Create an account", "As someone looking, a provider, or a professional referrer."],
              ["Search or advertise", "Filter by housing type, support, location and availability — or post your properties and rooms."],
              ["Message directly", "Conversations stay inside the platform, so contact details stay private."],
              ["Request or refer", "Send a structured request yourself, or a full referral if you work with someone."],
              ["Move in", "Track the offer through to move-in, with everyone seeing the same status."],
            ].map(([title, body], index) => (
              <li key={title} className="rounded-card border border-line bg-paper p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-pine-light text-[13px] font-semibold text-pine-dark">{index + 1}</span>
                <h3 className="mt-4 text-[18px]">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="shell py-16">
        <div className="card grid items-center gap-6 bg-[linear-gradient(120deg,#fff_0%,#fff_60%,#e4f0eb_155%)] p-8 sm:grid-cols-[1.4fr_auto]">
          <div>
            <h2 className="text-[26px]">Providers can search people, too</h2>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
              People who choose to be discoverable appear in a provider-side search by area, support
              need and age. Nobody is listed without opting in, and nothing sensitive is shown.
            </p>
          </div>
          <Link href="/people" className="btn-secondary justify-self-start sm:justify-self-end">
            Browse people looking
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-2 border-l border-line-strong pl-3 first:border-l-0 first:pl-0">
      <dt className="font-display text-[26px] text-ink">{value.toLocaleString("en-GB")}</dt>
      <dd className="text-ink-soft">{label}</dd>
    </div>
  );
}

async function AvailabilityBoard() {
  const rows = await db.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { publishedAt: "desc" },
    take: 7,
    select: {
      id: true,
      title: true,
      supportTypes: true,
      property: { select: { city: true } },
      rooms: { select: { status: true } },
    },
  });

  if (!rows.length) {
    return (
      <div className="card grid place-items-center p-10 text-center text-[15px] text-ink-soft">
        Seed the database to see live availability here.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden shadow-float">
      <div className="flex items-center justify-between border-b border-line bg-paper-card/80 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine/40" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pine" /></span>
          <h2 className="text-[16px]">Live availability</h2>
        </div>
        <span className="text-[12px] text-ink-faint">Provider updates</span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((row) => {
          const available = row.rooms.filter((r) => r.status === "AVAILABLE").length;
          return (
            <li key={row.id}>
              <Link href={`/listings/${row.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-pine-light/35">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{row.title}</span>
                  <span className="block truncate text-[13px] text-ink-faint">{row.property.city}</span>
                </span>
                <span
                  className={
                    available > 0
                      ? "rounded-pill bg-pine-light px-2.5 py-1 text-[12px] font-medium text-pine-dark"
                      : "rounded-pill bg-paper-sunk px-2.5 py-1 text-[12px] text-ink-faint"
                  }
                >
                  {available > 0 ? `${available} free` : "Full"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PathCard({
  heading,
  body,
  href,
  cta,
  tone = "paper",
}: {
  heading: string;
  body: string;
  href: string;
  cta: string;
  tone?: "paper" | "ink";
}) {
  const dark = tone === "ink";
  return (
    <div className={dark ? "interactive-card rounded-card bg-ink p-8 text-white" : "card interactive-card p-8"}>
      <span className={dark ? "text-[12px] font-semibold tracking-[0.08em] text-pine-light" : "text-[12px] font-semibold tracking-[0.08em] text-pine-dark"}>{dark ? "FOR PROVIDERS" : "FOR PEOPLE LOOKING"}</span>
      <h2 className={dark ? "mt-3 text-[24px] text-white" : "mt-3 text-[24px]"}>{heading}</h2>
      <p className={`mt-2 max-w-[46ch] text-[15px] leading-relaxed ${dark ? "text-white/75" : "text-ink-soft"}`}>{body}</p>
      <Link href={href} className={dark ? "btn mt-6 bg-white text-ink hover:bg-white/90" : "btn-primary mt-6"}>
        {cta}
      </Link>
    </div>
  );
}

export const metadata = { title: `${brand.name} — ${brand.tagline}` };
