import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function RootPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Redirect to role-specific dashboard
  switch (session.role) {
    case Role.ADMIN:
      redirect("/admin");
    case Role.MANAGER:
      redirect("/manager");
    default:
      redirect("/employee");
  }
}
