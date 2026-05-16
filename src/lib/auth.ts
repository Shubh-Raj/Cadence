import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const tenantId = process.env.AZURE_AD_TENANT_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId:     process.env.AZURE_AD_CLIENT_ID ?? "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
      issuer: tenantId
        ? `https://login.microsoftonline.com/${tenantId}/v2.0`
        : undefined,
      authorization: {
        params: {
          // Request group memberships and openid claims
          scope: "openid profile email GroupMember.Read.All",
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET ?? process.env.SESSION_SECRET,
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  callbacks: {
    // Forward Azure AD token claims (groups, oid, managerEmail) into the session
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = profile as any;
        // `groups` — present when "groupMembershipClaims": "SecurityGroup" in app manifest
        token.groups  = p.groups ?? [];
        // `oid` — stable Azure AD object ID (better than sub for dedup)
        token.oid     = p.oid ?? token.sub;
        // Custom attribute — map manager's email via optional claims
        token.managerEmail = p.managerEmail ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose claims on session.user so the SSO bridge page can read them
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = session.user as any;
      u.groups       = token.groups  ?? [];
      u.oid          = token.oid     ?? token.sub;
      u.sub          = token.oid     ?? token.sub;
      u.managerEmail = token.managerEmail ?? undefined;
      return session;
    },
    async redirect() {
      // After OAuth completes → our SSO bridge auto-provisions and creates the aq_session
      return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/sso-callback`;
    },
  },
});
