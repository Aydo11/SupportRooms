import { ProsePage, Section } from "@/components/prose-page";
import { brand } from "@/brand.config";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <ProsePage
      title="Privacy"
      intro={`A plain summary of what ${brand.name} holds and who can see it. This is a template for a demonstration build — take legal advice before running it as a real service.`}
      updated="on deployment"
    >
      <Section heading="What we hold">
        <p>
          Your account details, anything you put in your profile, adverts you post, requests and
          referrals you make, messages you send, and basic usage records such as when an advert was
          viewed.
        </p>
        <p>
          Some of this is special category data under UK GDPR — support needs often reveal health
          information. That&apos;s why nothing in your profile is public unless you switch it on.
        </p>
      </Section>

      <Section heading="Who can see what">
        <p>
          Your profile is private by default. Providers only see it if you turn on the option to be
          found. When you send a request, the provider you sent it to sees what you wrote — nobody
          else does. Referral details are visible to the referrer who made it, the provider it went
          to, and our admin team.
        </p>
        <p>
          Our admins can see account and moderation records, but cannot read the contents of
          messages between people.
        </p>
      </Section>

      <Section heading="Addresses">
        <p>
          Advert addresses show only the town and outward postcode unless the provider chooses to
          publish the full address.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You can download everything we hold about you from your settings page, and delete your
          account there too. Deleting removes your profile and adverts immediately; a minimal record
          is kept briefly so providers you contacted can close their side, then it goes.
        </p>
      </Section>

      <Section heading="Third parties">
        <p>
          Storage, email, SMS, payments and maps run through adapters, so the actual suppliers
          depend on how the site is configured. Whoever operates the site should list them here.
        </p>
      </Section>
    </ProsePage>
  );
}
