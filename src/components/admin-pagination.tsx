import Link from "next/link";

export const ADMIN_PAGE_SIZE = 25;
export function pageNumber(value?: string) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function AdminPagination({ page, total, query = {} }: { page: number; total: number; query?: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  if (pages <= 1) return <p className="mt-3 text-[13px] text-ink-faint">Showing all {total} records</p>;
  function href(next: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    params.set("page", String(next));
    return `?${params.toString()}`;
  }
  return <nav aria-label="Table pages" className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px]">
    <p className="text-ink-faint">{total.toLocaleString()} records · page {Math.min(page, pages)} of {pages}</p>
    <div className="flex gap-2">
      {page > 1 ? <Link className="btn-secondary min-h-9 px-3 py-1.5 text-[13px]" href={href(page - 1)}>Previous</Link> : null}
      {page < pages ? <Link className="btn-secondary min-h-9 px-3 py-1.5 text-[13px]" href={href(page + 1)}>Next</Link> : null}
    </div>
  </nav>;
}
