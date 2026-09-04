import { SiteFooter, SiteHeader } from "@/components/site-header";
import { MobileTabs } from "@/components/mobile-tabs";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="pb-24 lg:pb-0">
        {children}
      </main>
      <SiteFooter />
      <MobileTabs />
    </>
  );
}
