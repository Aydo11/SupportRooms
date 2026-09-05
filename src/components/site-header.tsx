import Link from "next/link";
import { brand } from "@/brand.config";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { logoutAction } from "@/server/actions/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user
    ? await db.notification.count({ where: { userId: user.id, readAt: null } })
    : 0;

  const home =
    user?.role === "ADMIN" ? "/admin" : user?.role === "PROVIDER" ? "/provider" : user?.role === "REFERRER" ? "/referrals" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-line/90 bg-paper/90 backdrop-blur-lg">
      <div className="shell flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-[21px] text-ink">
          <Logo />
          <span className="hidden min-[360px]:inline">{brand.name}</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-[15px] text-ink-soft lg:flex">
          <Link href="/search" className="transition-colors hover:text-ink">Search accommodation</Link>
          <Link href="/how-it-works" className="transition-colors hover:text-ink">How it works</Link>
          <Link href="/people" className="transition-colors hover:text-ink">People looking</Link>
          <Link href="/pricing" className="transition-colors hover:text-ink">Advertise</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/messages" className="btn-ghost hidden sm:inline-flex">Messages</Link>
              <Link href={`${home}`} className="btn-secondary hidden sm:inline-flex">
                Dashboard
                {unread > 0 && (
                  <span className="ml-1 rounded-pill bg-pine px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </Link>
              <form action={logoutAction}>
                <button className="btn-ghost hidden sm:inline-flex">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
              <Link href="/register" className="btn-primary hidden sm:inline-flex">Create account</Link>
            </>
          )}

          <details className="group relative lg:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-[10px] border border-line bg-white text-xl text-ink marker:hidden" aria-label="Open navigation menu">
              <span aria-hidden="true">☰</span>
            </summary>
            <div className="absolute right-0 top-12 z-50 w-[min(19rem,calc(100vw-2rem))] rounded-card border border-line bg-white p-2 shadow-float">
              <MobileLink href="/search">Search accommodation</MobileLink>
              <MobileLink href="/how-it-works">How it works</MobileLink>
              <MobileLink href="/people">People looking</MobileLink>
              <MobileLink href="/pricing">Advertise</MobileLink>
              <div className="my-2 border-t border-line" />
              {user ? (
                <>
                  <MobileLink href={home}>Dashboard{unread > 0 ? ` (${unread})` : ""}</MobileLink>
                  <MobileLink href="/messages">Messages</MobileLink>
                  <form action={logoutAction}>
                    <button className="w-full rounded-[9px] px-3 py-3 text-left text-[15px] text-ink-soft hover:bg-paper-sunk">Sign out</button>
                  </form>
                </>
              ) : (
                <>
                  <MobileLink href="/login">Sign in</MobileLink>
                  <MobileLink href="/register">Create account</MobileLink>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="block rounded-[9px] px-3 py-3 text-[15px] text-ink-soft hover:bg-paper-sunk hover:text-ink">{children}</Link>;
}

export function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
      <rect width="28" height="28" rx="7" className="fill-ink" />
      <path d="M6 17.5 14 8l8 9.5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10.5" y="14" width="7" height="6" rx="1.2" className="fill-pine" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5 font-display text-[19px]">
            <Logo />
            {brand.name}
          </Link>
          <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-ink-soft">{brand.description}</p>
        </div>
        <FooterColumn
          title="Looking for a home"
          links={[
            ["Search accommodation", "/search"],
            ["Post what you're looking for", "/dashboard/advert"],
            ["How it works", "/how-it-works"],
            ["Staying safe", "/safety"],
          ]}
        />
        <FooterColumn
          title="Providers"
          links={[
            ["Advertise accommodation", "/register?type=PROVIDER"],
            ["Membership and pricing", "/pricing"],
            ["Find people looking", "/people"],
            ["Get verified", "/verification"],
          ]}
        />
        <FooterColumn
          title="Professionals"
          links={[
            ["Make a referral", "/referrals/new"],
            ["Referrer accounts", "/register?type=REFERRER"],
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
          ]}
        />
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-[13px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.name}. Demonstration data — not a live service.</p>
          <p className="max-w-xl">{brand.trustNote}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-[15px] font-medium text-ink">{title}</h4>
      <ul className="mt-3 space-y-2 text-[14px] text-ink-soft">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-pine-dark">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
