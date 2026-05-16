"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function resolveEscalationAction(escalationId: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.ADMIN) return;

  await db.escalationLog.update({
    where: { id: escalationId },
    data: { isResolved: true, resolvedAt: new Date() },
  });

  revalidatePath("/admin/escalations");
}
