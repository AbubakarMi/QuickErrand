"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// The signed-in area's navigation. On a phone it's its own scrollable row
// under the header (so it can never push the page wider than the screen),
// on larger screens it sits inline. The current section is marked so you
// can tell where you are.
export function RoleNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="-mx-4 order-3 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 pb-2 sm:order-none sm:mx-0 sm:ml-6 sm:mr-auto sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0"
    >
      {items.map((item) => {
        // Profile links differ per user id, so match on the section prefix
        // (/user/profile) rather than the exact path.
        const section = item.href.replace(/\/[^/]+$/, "");
        const active =
          pathname === item.href ||
          pathname.startsWith(item.href + "/") ||
          (item.href.includes("/profile/") && pathname.startsWith(section + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
