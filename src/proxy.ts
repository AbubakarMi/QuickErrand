import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { roleHomePath } from "@/lib/roleHome";

// Two directions of the same rule:
//  - The guest pages (landing, login, register) are for people who aren't
//    signed in. A signed-in visitor, however they got there (typing the URL,
//    a back link, the logo), goes straight to their own dashboard instead,
//    so the only way out of a session is the Sign out button.
//  - The role areas are for people who are. Turning signed-out visitors away
//    here means their pages never render without a session, rather than
//    rendering in parallel with the layout's redirect and throwing.
// Which role may see which area is still decided by each area's layout.
const GUEST_PATHS = new Set(["/", "/login", "/register"]);

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isGuestPath = GUEST_PATHS.has(request.nextUrl.pathname);

  if (token && isGuestPath) {
    return NextResponse.redirect(new URL(roleHomePath(token.role), request.url));
  }
  if (!token && !isGuestPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/user/:path*", "/runner/:path*", "/admin/:path*"],
};
