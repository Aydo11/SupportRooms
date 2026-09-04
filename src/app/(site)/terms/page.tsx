import { ProsePage, Section } from "@/components/prose-page";
import { brand } from "@/brand.config";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <ProsePage
      title="Terms of use"
      intro={`Template terms for the ${brand.name} demonstration build. Replace them with terms drafted for your service before going live.`}
      updated="on deployment"
    >
      <Section heading="What this service is">
        <p>
          {brand.name} is a listings platform. We are not a landlord, a support provider, a housing
          authority or an agent. We don&apos;t assess anyone&apos;s eligibility for accommodation or
          support, and nothing here is a placement decision.
        </p>
      </Section>

      <Section heading="Accounts">
        <p>
          You must give accurate details, keep your login to yourself, and be 18 or over to hold an
          account. Professional and provider accounts must be used in the course of the work they
          describe.
        </p>
      </Section>

      <Section heading="Adverts">
        <p>
          Providers are responsible for the accuracy of their adverts, including rent, availability
          and what support is actually provided. Adverts are reviewed before going live, but review
          is not verification of every claim. We can remove an advert or suspend an account at any
          time.
        </p>
      </Section>

      <Section heading="Referrals and personal data">
        <p>
          If you refer someone, you must have their informed consent or another lawful basis for
          sharing their information. You remain responsible for what you send.
        </p>
      </Section>

      <Section heading="Promoted adverts">
        <p>
          Providers can pay to promote an advert. Promoted adverts appear higher in matching
          searches and are always labelled as promoted. Paying does not affect verification or
          moderation.
        </p>
      </Section>

      <Section heading="Liability">
        <p>
          We provide the platform as it is. We aren&apos;t party to any agreement you reach with a
          provider or an applicant, and we can&apos;t be responsible for what happens in
          accommodation found through the site.
        </p>
      </Section>
    </ProsePage>
  );
}
