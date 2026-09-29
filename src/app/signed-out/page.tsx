"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

// Where requireRole() sends a session that's no longer valid (the account
// was deleted, or deactivated by an admin). NextAuth's own GET
// /api/auth/signout is a confirmation page that needs a click, it doesn't
// clear the session on its own, this page does that immediately instead
// and explains why, rather than leaving someone looking at an
// unexplained "sign out?" prompt they never asked for. Outside the
// proxy's matcher (see proxy.ts), so it renders regardless of session
// state.
export default function SignedOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 text-center">
      <p className="font-heading text-lg font-semibold tracking-tight">Signing you out</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your account is no longer available on this session. Redirecting to
        login…
      </p>
    </div>
  );
}
