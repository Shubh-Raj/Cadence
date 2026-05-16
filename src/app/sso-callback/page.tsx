import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { roleRedirect } from "@/lib/role-utils";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

/**
 * SSO Bridge Page — Full Auto-Provisioning
 *
 * This server component runs after Microsoft Entra ID OAuth completes.
 * NextAuth has already verified the identity. We:
 *   1. Read the NextAuth session (email, name, groups from Entra ID)
 *   2. Auto-provision user in DB if not found (first-time SSO login)
 *   3. Sync their managerId from Entra ID `manager` attribute
 *   4. Map their Role from Entra ID group membership
 *   5. Create our custom aq_session cookie
 *   6. Redirect to their role-specific dashboard
 */

const GROUP_ROLE_MAP: Record<string, Role> = {
  // Map Azure AD Group Object IDs → Portal Role
  // These values come from AZURE_AD_GROUP_EMPLOYEE, _MANAGER, _ADMIN env vars
  [process.env.AZURE_AD_GROUP_ADMIN   ?? "__none_admin__"]:    Role.ADMIN,
  [process.env.AZURE_AD_GROUP_MANAGER ?? "__none_manager__"]:  Role.MANAGER,
  [process.env.AZURE_AD_GROUP_EMPLOYEE?? "__none_employee__"]: Role.EMPLOYEE,
};

function inferRoleFromGroups(groups: string[] | undefined): Role {
  if (!groups || groups.length === 0) return Role.EMPLOYEE;
  // Priority: ADMIN > MANAGER > EMPLOYEE
  if (groups.some((g) => g === process.env.AZURE_AD_GROUP_ADMIN))   return Role.ADMIN;
  if (groups.some((g) => g === process.env.AZURE_AD_GROUP_MANAGER)) return Role.MANAGER;
  return Role.EMPLOYEE;
}

export default async function SsoCallbackPage() {
  const nextAuthSession = await auth();

  if (!nextAuthSession?.user?.email) {
    redirect("/login?error=sso_failed");
  }

  const { email, name } = nextAuthSession.user;

  // NextAuth v5 exposes extra token claims via session.user when configured
  // The groups array comes from the id_token when `groupMembershipClaims` is enabled in Azure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenUser = nextAuthSession.user as any;
  const groups: string[] = tokenUser?.groups ?? [];
  const azureAdId: string | undefined = tokenUser?.sub ?? tokenUser?.oid ?? undefined;
  const managerEmail: string | undefined = tokenUser?.managerEmail ?? undefined;

  const inferredRole = inferRoleFromGroups(groups);

  // Resolve managerId from manager's email (if Entra sends it via custom claim)
  let managerId: string | undefined;
  if (managerEmail) {
    const mgr = await db.user.findUnique({
      where: { email: managerEmail },
      select: { id: true },
    });
    managerId = mgr?.id;
  }

  // Upsert — auto-provision on first SSO login, keep existing data on subsequent logins
  const user = await db.user.upsert({
    where: { email: email! },
    update: {
      // Re-sync name, Azure AD ID, role & manager on every login
      ...(azureAdId ? { azureAdId } : {}),
      ...(name ? { name } : {}),
      // Only sync role if groups were provided (don't demote manually-set roles otherwise)
      ...(groups.length > 0 ? { role: inferredRole } : {}),
      ...(managerId ? { managerId } : {}),
    },
    create: {
      email: email!,
      name: name ?? email!.split("@")[0],
      role: inferredRole,
      azureAdId,
      managerId,
      // No passwordHash — SSO-only account
    },
    select: { id: true, name: true, email: true, role: true },
  });

  await createSession({
    userId: user.id,
    role:   user.role,
    name:   user.name,
    email:  user.email,
  });

  redirect(roleRedirect(user.role));
}
