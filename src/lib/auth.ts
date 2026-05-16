import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const tenantId = process.env.AZURE_AD_TENANT_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID ?? "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
      // v5 uses issuer URL instead of tenantId directly
      issuer: tenantId
        ? `https://login.microsoftonline.com/${tenantId}/v2.0`
        : undefined,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  // AUTH_SECRET preferred in v5, fall back to SESSION_SECRET
  secret: process.env.AUTH_SECRET ?? process.env.SESSION_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async redirect() {
      // After OAuth completes → our SSO bridge creates the aq_session
      return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/sso-callback`;
    },
  },
});
