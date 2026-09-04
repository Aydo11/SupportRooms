"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Windowed pagination. With thousands of adverts, rendering every page number is
 * both unusable and slow, so we show a window around the current page plus the
 * ends, and nudge people to refine rather than paging into the hundreds.
 */
export function Pagination({
  page,
  pages,
  truncated,
}: {
  page: number;
  pages: number;
  truncated?: boolean;
}) {
  const params = useSearchParams();
  if (pages <= 1) return null;

  const href = (target: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(target));
    return `/search?${next.toString()}`;
  };

  const window = new Set<number>([1, pages, page]);
  for (let offset = 1; offset <= 2; offset += 1) {
    if (page - offset > 0) window.add(page - offset);
    if (page + offset <= pages) window.add(page + offset);
  }
  const numbers = [...window].sort((a, b) => a - b);

  return (
    <>
      <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
        {page > 1 && (
          <Link href={href(page - 1)} className="rounded-[8px] border border-line bg-white px-3.5 py-2 text-[14px] text-ink-soft hover:border-line-strong">
            Previous
          </Link>
        )}

        {numbers.map((number, index) => (
          <span key={number} className="flex items-center gap-2">
            {index > 0 && numbers[index - 1] !== number - 1 && (
              <span className="px-1 text-[14px] text-ink-faint">…</span>
            )}
            <Link
              href={href(number)}
              aria-current={number === page ? "page" : undefined}
              className={
                number === page
                  ? "rounded-[8px] bg-ink px-3.5 py-2 text-[14px] text-white"
                  : "rounded-[8px] border border-line bg-white px-3.5 py-2 text-[14px] text-ink-soft hover:border-line-strong"
              }
            >
              {number}
            </Link>
          </span>
        ))}

        {page < pages && (
          <Link href={href(page + 1)} className="rounded-[8px] border border-line bg-white px-3.5 py-2 text-[14px] text-ink-soft hover:border-line-strong">
            Next
          </Link>
        )}
      </nav>

      {truncated && (
        <p className="mt-3 text-center text-[13px] text-ink-faint">
          There are more results than we page through. Narrow the area or add a filter to see them.
        </p>
      )}
    </>
  );
}
