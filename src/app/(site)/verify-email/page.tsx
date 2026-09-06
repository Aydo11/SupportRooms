import Link from "next/link";
import { ResendVerificationForm } from "@/components/auth-forms";

export const metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const success = query.result === "success";
  return (
    <div className="shell max-w-xl py-14">
      <div className="card p-6 sm:p-8">
        <p className="eyebrow">Secure account</p>
        <h1 className="mt-2 text-[30px]">{success ? "Email verified" : "Check your email"}</h1>
        {success ? (
          <>
            <p className="mt-3 text-ink-soft">Your email address is confirmed. You can now sign in to RoomsNow.</p>
            <Link href="/login?verified=1" className="btn-primary mt-6">Continue to sign in</Link>
          </>
        ) : (
          <>
            <p className="mt-3 leading-relaxed text-ink-soft">
              {query.result === "expired" || query.result === "invalid"
                ? "That verification link is invalid or has expired. Request a fresh one below."
                : "We sent a 24-hour verification link. Open it before signing in so we know the email address belongs to you."}
            </p>
            <ResendVerificationForm initialEmail={query.email ?? ""} />
          </>
        )}
      </div>
    </div>
  );
}
