"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function MobileMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => { if (ref.current) ref.current.open = false; }, [pathname]);
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return <details ref={ref} className="group relative xl:hidden" onClick={(event) => {
    if ((event.target as HTMLElement).closest("a, form button") && ref.current) ref.current.open = false;
  }}>
    <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-[10px] border border-line bg-white text-xl text-ink marker:hidden" aria-label="Navigation menu">
      <span aria-hidden="true" className="group-open:hidden">☰</span>
      <span aria-hidden="true" className="hidden group-open:inline">×</span>
    </summary>
    <div className="menu-panel absolute right-0 top-12 z-50 max-h-[calc(100dvh-6rem)] w-[min(19rem,calc(100vw-2rem))] overflow-y-auto rounded-card border border-line bg-white p-2 shadow-float">{children}</div>
  </details>;
}
