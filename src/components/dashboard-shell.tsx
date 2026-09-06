import Link from "next/link";
import { clsx } from "@/lib/clsx";

export type NavItem = { href: string; label: string; badge?: number };

export function DashboardShell({
  title,
  subtitle,
  nav,
  active,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  active: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="shell grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Dashboard" className="lg:sticky lg:top-24 lg:self-start">
        <ul className="flex gap-1 overflow-x-auto pb-2 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.href === active ? "page" : undefined}
                className={clsx(
                  "flex shrink-0 items-center justify-between gap-2 rounded-[10px] px-3.5 py-2.5 text-[15px] whitespace-nowrap",
                  item.href === active ? "bg-ink text-white" : "text-ink-soft hover:bg-paper-sunk hover:text-ink",
                )}
              >
                {item.label}
                {item.badge ? (
                  <span
                    className={clsx(
                      "rounded-pill px-1.5 py-0.5 text-[11px] font-semibold",
                      item.href === active ? "bg-white/20 text-white" : "bg-pine-light text-pine-dark",
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px]">{title}</h1>
            {subtitle && <p className="mt-1 max-w-[65ch] text-[15px] text-ink-soft">{subtitle}</p>}
          </div>
          {action}
        </header>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, compact = false }: { label: string; value: string | number; hint?: string; compact?: boolean }) {
  return (
    <div className={clsx("card", compact ? "p-3.5" : "p-5")}>
      <p className="text-[13px] text-ink-faint">{label}</p>
      <p className={clsx("mt-1 font-display leading-none", compact ? "text-[24px]" : "text-[30px]")}>{value}</p>
      {hint && <p className={clsx("text-[13px] text-ink-soft", compact ? "mt-1" : "mt-2")}>{hint}</p>}
    </div>
  );
}

export function MetricBar({ label, value, total, tone = "bg-pine" }: { label: string; value: number; total: number; tone?: string }) {
  const width = total > 0 ? Math.max(3, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4 text-[13px]">
        <span className="text-ink-soft">{label}</span><span className="font-semibold text-ink">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper-sunk" aria-hidden="true">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function DataTable({
  head,
  children,
  compact = false,
}: {
  head: string[];
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="card overflow-x-auto">
      <table className={clsx("w-full min-w-[640px] text-left", compact ? "text-[13px] [&_td]:px-3 [&_td]:py-2 [&_td_.btn]:min-h-8 [&_td_.btn]:px-2.5 [&_td_.btn]:py-1 [&_td_.btn]:text-[13px]" : "text-[14px]")}>
        <thead className="border-b border-line text-[13px] text-ink-faint">
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col" className={clsx("font-medium", compact ? "px-3 py-2" : "px-4 py-3")}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
