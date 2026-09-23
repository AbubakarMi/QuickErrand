import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleHomePath } from "@/lib/roleHome";

// Not a real page, a session-aware redirector. The login form sends users
// here because it doesn't know their role until sign-in succeeds; each
// role layout also bounces mismatched sessions back here rather than
// hardcoding every cross-role redirect itself.
export default async function PostLoginPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  redirect(roleHomePath(session.user.role));
}
