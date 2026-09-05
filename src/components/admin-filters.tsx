import Link from "next/link";

export function AdminFilters({ children }: { children: React.ReactNode }) {
  return <form method="get" className="rounded-card border border-line bg-white p-3" role="search">
    <div className="grid items-end gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">{children}</div>
    <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
      <button type="submit" className="btn-primary min-h-9 px-3 py-1.5 text-[13px]">Apply filters</button>
      <Link href="?" className="btn-ghost min-h-9 px-3 py-1.5 text-[13px]">Clear filters</Link>
    </div>
  </form>;
}

export function AdminFilterField({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? "block min-w-0 xl:w-72" : "block min-w-0 xl:w-44"}>
    <span className="mb-1 block text-[12px] font-medium text-ink-soft">{label}</span>{children}
  </label>;
}
