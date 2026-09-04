import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { searchLookingForAds } from "@/server/search";
import { ACCOMMODATION_TYPES, supportLabel, SUPPORT_TYPES } from "@/lib/taxonomy";
import { initials, money, monthYear } from "@/lib/format";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "People looking for accommodation" };
export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { where?: string; support?: string; minAge?: string; maxAge?: string; page?: string };
}) {
  const user = await getCurrentUser();
  const results = await searchLookingForAds({
    where: searchParams.where,
    support: searchParams.support ? [searchParams.support] : [],
    minAge: searchParams.minAge,
    maxAge: searchParams.maxAge,
    page: searchParams.page,
  });

  const canContact = user?.role === "PROVIDER" || user?.role === "REFERRER" || user?.role === "ADMIN";

  return (
    <div className="shell py-10">
      <h1 className="text-[32px]">People looking for accommodation</h1>
      <p className="mt-2 max-w-[70ch] text-[16px] leading-relaxed text-ink-soft">
        Everyone here has chosen to be discoverable by providers. Nothing sensitive is shown, and
        you contact them through the platform — never by phone or email directly.
      </p>

      <form className="card mt-6 grid gap-3 p-4 sm:grid-cols-[1.2fr_1fr_0.6fr_0.6fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="where">Area</label>
          <input id="where" name="where" defaultValue={searchParams.where} className="field" placeholder="Birmingham" />
        </div>
        <div>
          <label className="label" htmlFor="support">Support need</label>
          <select id="support" name="support" defaultValue={searchParams.support} className="field">
            <option value="">Any</option>
            {SUPPORT_TYPES.map((type) => (
              <option key={type.slug} value={type.slug}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="minAge">Min age</label>
          <input id="minAge" name="minAge" type="number" min={16} defaultValue={searchParams.minAge} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="maxAge">Max age</label>
          <input id="maxAge" name="maxAge" type="number" min={16} defaultValue={searchParams.maxAge} className="field" />
        </div>
        <button className="btn-primary h-[46px]">Search people</button>
      </form>

      {results.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No one matches that search yet"
            body="Try a wider area or a different support category. People appear here only once they've made their advert discoverable."
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {results.items.map((ad) => (
            <li key={ad.id} className="card flex flex-col p-4">
              <div className="flex items-center gap-2.5">
                {ad.user.profile?.showPhoto && ad.user.profile.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.user.profile.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-paper-sunk text-[13px] text-ink-soft">
                    {initials(ad.user.firstName, ad.user.lastName)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[14px]">
                    {ad.user.firstName} {ad.user.lastName.charAt(0)}.
                  </p>
                  <p className="truncate text-[12px] text-ink-faint">
                    {ad.city}
                    {ad.user.profile?.showAge && ad.age ? ` · ${ad.age}` : ""}
                  </p>
                </div>
              </div>

              <h2 className="mt-3 line-clamp-2 text-[15px] leading-snug">
                <Link href={`/people/${ad.id}`} className="hover:text-pine-dark">{ad.title}</Link>
              </h2>

              {ad.about && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{ad.about}</p>}

              <p className="mt-2.5 flex flex-wrap gap-1">
                {ad.supportTypes.slice(0, 2).map((slug) => (
                  <span key={slug} className="chip text-[12px]">{supportLabel(slug)}</span>
                ))}
                {ad.supportTypes.length > 2 && (
                  <span className="chip text-[12px]">+{ad.supportTypes.length - 2}</span>
                )}
              </p>

              <dl className="mt-auto grid grid-cols-2 gap-y-0.5 border-t border-line pt-2.5 text-[12px]">
                <div className="flex gap-1">
                  <dt className="text-ink-faint">By</dt>
                  <dd>{monthYear(ad.moveInDate)}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-ink-faint">Budget</dt>
                  <dd>{ad.budgetWeekly ? `${money(ad.budgetWeekly)}/wk` : "Flexible"}</dd>
                </div>
                <div className="col-span-2 flex gap-1">
                  <dt className="text-ink-faint">Wants</dt>
                  <dd className="truncate">
                    {ad.accommodationTypes.map((t) => ACCOMMODATION_TYPES[t]).join(", ") || "Anything suitable"}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/people/${ad.id}`}
                className={`${canContact ? "btn-primary" : "btn-secondary"} mt-3 w-full justify-center py-2 text-[14px]`}
              >
                {canContact ? "View and message" : "View advert"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
