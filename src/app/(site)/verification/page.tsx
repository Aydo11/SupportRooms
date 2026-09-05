import Link from "next/link";
import { ProsePage, Section } from "@/components/prose-page";

export const metadata = { title: "Verification" };

export default function VerificationPage() {
  return (
    <ProsePage
      title="Verification"
      intro="What our verified badge does and doesn't tell you."
    >
      <Section heading="What we check">
        <p>
          A provider sends us documents — company or charity registration, insurance, a headed
          letter, or similar. A person on our team looks at them and decides whether the
          organisation is who it says it is. If it checks out, the badge appears on their profile
          and adverts.
        </p>
      </Section>

      <Section heading="What it doesn&apos;t mean">
        <p>
          It is not a licence, an inspection, a rating, or any kind of regulatory approval. We do
          not assess the quality of accommodation or support, and the badge should not be read as
          us recommending anyone. Regulation of supported accommodation varies by service type and
          nation — check the relevant regulator directly if that matters to you.
        </p>
      </Section>

      <Section heading="Applying as a provider">
        <p>
          Verification is free and open to any provider with an account. Send your documents from
          your company profile and we&apos;ll come back to you.
        </p>
        <p>
          <Link href="/provider/settings" className="text-pine-dark hover:underline">
            Start verification
          </Link>
        </p>
      </Section>

      <Section heading="Losing the badge">
        <p>
          We remove verification if documents turn out to be inaccurate, if an organisation stops
          responding to reports, or if we suspend the account. Providers are told why.
        </p>
      </Section>
    </ProsePage>
  );
}
