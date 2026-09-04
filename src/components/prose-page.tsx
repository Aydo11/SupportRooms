import Link from "next/link";

export function ProsePage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shell max-w-[70ch] py-14">
      <h1 className="text-[36px] leading-tight">{title}</h1>
      {intro && <p className="mt-4 text-[18px] leading-relaxed text-ink-soft">{intro}</p>}
      {updated && <p className="mt-2 text-[13px] text-ink-faint">Last updated {updated}</p>}
      <div className="prose-page mt-10 space-y-6">{children}</div>
      <p className="mt-12 border-t border-line pt-6 text-[15px] text-ink-soft">
        Something not right on this page? <Link href="/messages" className="text-pine-dark hover:underline">Tell us</Link>.
      </p>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[22px]">{heading}</h2>
      <div className="mt-2 space-y-3 text-[16px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}
