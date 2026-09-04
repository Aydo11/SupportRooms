import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { MessageProviderForm } from "@/components/message-provider-form";
import { ReportForm } from "@/components/report-form";
import { ACCOMMODATION_TYPES, GENDER_ARRANGEMENTS, supportLabel } from "@/lib/taxonomy";
import { initials, money, monthYear } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LookingForAdPage({ params }: { params: { id: string } }) {
  const [ad, user] = await Promise.all([
    db.lookingForAd.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            profile: { select: { showPhoto: true, photoUrl: true, showAge: true, discoverable: true, accessibilityNeeds: true } },
          },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!ad || ad.user.status !== "ACTIVE") notFound();

  const isOwner = user?.id === ad.userId;
  if (!isOwner && (ad.status !== "ACTIVE" || !ad.user.profile?.discoverable) && user?.role !== "ADMIN") notFound();

  if (!isOwner) await db.lookingForAd.update({ where: { id: ad.id }, data: { views: { increment: 1 } } });

  const canContact = user?.role === "PROVIDER" || user?.role === "REFERRER" || user?.role === "ADMIN";

  return (
    <div className="shell max-w-4xl py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-4">
            {ad.user.profile?.showPhoto && ad.user.profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.user.profile.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-full bg-paper-sunk text-[18px] text-ink-soft">
                {initials(ad.user.firstName, ad.user.lastName)}
              </span>
            )}
            <div>
              <p className="text-[15px]">
                {ad.user.firstName} {ad.user.lastName.charAt(0)}.
              </p>
              <p className="text-[13px] text-ink-faint">
                {ad.city}
                {ad.user.profile?.showAge && ad.age ? ` · ${ad.age} years old` : ""}
              </p>
            </div>
          </div>

          <h1 className="mt-6 text-[30px] leading-tight">{ad.title}</h1>

          <p className="mt-4 flex flex-wrap gap-1.5">
            {ad.supportTypes.map((slug) => (
              <span key={slug} className="chip chip-active">{supportLabel(slug)}</span>
            ))}
          </p>

          <dl className="mt-6 grid gap-x-8 gap-y-4 border-y border-line py-6 sm:grid-cols-3">
            <Detail label="Looking in" value={`${ad.city}${ad.radiusMiles ? ` + ${ad.radiusMiles} miles` : ""}`} />
            <Detail label="Needs somewhere by" value={monthYear(ad.moveInDate)} />
            <Detail label="Budget" value={ad.budgetWeekly ? `${money(ad.budgetWeekly)} per week` : "Flexible"} />
            <Detail
              label="Accommodation"
              value={ad.accommodationTypes.map((t) => ACCOMMODATION_TYPES[t]).join(", ") || "Open to options"}
            />
            <Detail label="Household" value={GENDER_ARRANGEMENTS[ad.genderArrangement]} />
            {ad.accessibilityNeeds && <Detail label="Access needs" value={ad.accessibilityNeeds} />}
          </dl>

          {ad.about && (
            <section className="mt-7">
              <h2 className="text-[20px]">About me</h2>
              <p className="prose-advert mt-2 whitespace-pre-line">{ad.about}</p>
            </section>
          )}

          {ad.lookingFor && (
            <section className="mt-7">
              <h2 className="text-[20px]">What I&apos;m looking for</h2>
              <p className="prose-advert mt-2 whitespace-pre-line">{ad.lookingFor}</p>
            </section>
          )}

          {ad.videoUrl && (
            <section className="mt-7">
              <h2 className="text-[20px]">Video introduction</h2>
              <div className="mt-3 aspect-video overflow-hidden rounded-card border border-line">
                <iframe src={ad.videoUrl} title="Video introduction" allowFullScreen className="h-full w-full" />
              </div>
            </section>
          )}

          <div className="mt-10">
            <ReportForm targetType="LOOKING_FOR_AD" targetId={ad.id} />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {isOwner ? (
            <div className="card p-5">
              <h2 className="text-[17px]">This is your advert</h2>
              <p className="mt-1.5 text-[14px] text-ink-soft">Seen {ad.views} times.</p>
              <a href="/dashboard/advert" className="btn-secondary mt-4 w-full">Edit advert</a>
            </div>
          ) : canContact ? (
            <MessageProviderForm lookingForAdId={ad.id} signedIn={Boolean(user)} />
          ) : (
            <div className="card p-5 text-[14px] leading-relaxed text-ink-soft">
              Only provider and professional accounts can message people directly. If you&apos;re
              looking for accommodation yourself, search adverts instead.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-ink-faint">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-ink">{value}</dd>
    </div>
  );
}
