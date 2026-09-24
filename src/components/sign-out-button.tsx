"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// Icon-only on phones, where the header has no room for the word.
export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Sign out"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
