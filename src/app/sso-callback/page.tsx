import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { roleRedirect } from "@/lib/role-utils";
import { redirect } from "next/navigation";

/**
 * SSO Bridge Page
 *
 * This server component runs after Microsoft Entra ID OAuth completes.
 * NextAuth has already verified the identity. We:
 *   1. Read the NextAuth session to get the user's verified email
 *   2. Look them up in our DB
 *   3. Create our custom aq_session cookie
 *   4. Redirect to their role dashboard
 */
export default async function SsoCallbackPage() {
  const nextAuthSession = await auth();

  if (!nextAuthSession?.user?.email) {
    // OAuth failed or was cancelled
    redirect("/login?error=sso_failed");
  }

  const email = nextAuthSession.user.email;

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    // Azure AD user exists but not provisioned in our system
    redirect("/login?error=not_provisioned");
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect(roleRedirect(user.role));
}
