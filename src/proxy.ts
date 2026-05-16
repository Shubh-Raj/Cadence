import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";
import { Role } from "@prisma/client";

// Role-based route protection
const ROLE_ROUTES: Record<string, Role[]> = {
  "/employee": [Role.EMPLOYEE, Role.MANAGER, Role.ADMIN],
  "/manager": [Role.MANAGER, Role.ADMIN],
  "/admin": [Role.ADMIN],
};

const PUBLIC_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Decode session from cookie
  const token = request.cookies.get("aq_session")?.value;
  const session = await decrypt(token);

  // Not authenticated → redirect to login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(session.role as Role)) {
        return NextResponse.redirect(
          new URL(roleFallback(session.role as Role), request.url)
        );
      }
      break;
    }
  }

  return NextResponse.next();
}

function roleFallback(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return "/admin";
    case Role.MANAGER:
      return "/manager";
    default:
      return "/employee";
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
