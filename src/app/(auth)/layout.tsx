import Link from "next/link";
import { AuthCard } from "@/components/auth-card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-6 py-12">
      <Link
        href="/"
        className="mb-6 inline-block py-2 font-heading text-lg font-semibold tracking-tight whitespace-nowrap"
      >
        Quick<span className="text-primary">Errand</span>
      </Link>
      <AuthCard>{children}</AuthCard>
    </div>
  );
}
