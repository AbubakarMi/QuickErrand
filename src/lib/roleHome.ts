import type { Role } from "@prisma/client";

// The single place that decides where a session "belongs." Used right
// after sign-in and as the bounce target when a role layout rejects a
// mismatched session. See src/app/post-login/page.tsx and the three
// role layouts under src/app.
export function roleHomePath(role: Role): string {
  switch (role) {
    case "USER":
      return "/user/dashboard";
    case "RUNNER":
      return "/runner/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
  }
}
