import { Role } from "@prisma/client";

export function roleRedirect(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return "/admin";
    case Role.MANAGER:
      return "/manager";
    default:
      return "/employee";
  }
}
