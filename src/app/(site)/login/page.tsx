import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { brand } from "@/brand.config";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="shell max-w-md py-16">
      <h1 className="text-[30px]">Sign in</h1>
      <p className="mt-2 text-[15px] text-ink-soft">Welcome back to {brand.name}.</p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-[15px] text-ink-soft">
        No account yet? <Link href="/register" className="text-pine-dark underline">Create one</Link>
      </p>
    </div>
  );
}
