"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AuditAction, GoalStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { THRUST_AREAS } from "@/lib/goal-utils";

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.ADMIN) redirect("/employee");
  return session;
}

// ── Unlock goal ────────────────────────────────────────────────────────────────

export async function unlockGoalAction(goalId: string, note: string) {
  const session = await requireAdmin();

  const goal = await db.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true },
  });

  if (!goal) return;

  await db.goal.update({
    where: { id: goalId },
    data: { isLocked: false },
  });

  // Also set sheet back to DRAFT so employee can re-edit
  await db.goalSheet.update({
    where: { id: goal.goalSheetId },
    data: { status: GoalStatus.DRAFT },
  });

  await db.auditLog.create({
    data: {
      action: AuditAction.GOAL_UNLOCKED_BY_ADMIN,
      entityType: "Goal",
      entityId: goalId,
      changedById: session.userId,
      goalSheetId: goal.goalSheetId,
      note,
    },
  });

  revalidatePath("/admin");
}

// ── Push shared goal ───────────────────────────────────────────────────────────

const SharedGoalSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  thrustArea: z.enum(THRUST_AREAS),
  uomType: z.enum(["MIN", "MAX", "TIMELINE", "ZERO"] as const),
  targetValue: z.coerce.number().positive(),
  weightage: z.coerce.number().min(10).max(100),
  employeeIds: z.array(z.string()).min(1),
});

export type SharedGoalState =
  | { errors?: Record<string, string[]>; message?: string; success?: boolean }
  | undefined;

export async function pushSharedGoalAction(
  data: z.infer<typeof SharedGoalSchema>
): Promise<SharedGoalState> {
  const session = await requireAdmin();
  const cycleYear = new Date().getFullYear();

  const validated = SharedGoalSchema.safeParse(data);
  if (!validated.success)
    return { errors: validated.error.flatten().fieldErrors };

  const { employeeIds, ...goalData } = validated.data;

  // Create a root "parent" goal in admin's context, then push to each employee
  for (const employeeId of employeeIds) {
    const sheet = await db.goalSheet.upsert({
      where: { userId_cycleYear: { userId: employeeId, cycleYear } },
      update: {},
      create: { userId: employeeId, cycleYear, status: GoalStatus.DRAFT },
    });

    if (sheet.status === GoalStatus.APPROVED || sheet.status === GoalStatus.LOCKED) continue;

    const existingGoals = await db.goal.count({ where: { goalSheetId: sheet.id } });
    if (existingGoals >= 8) continue;

    const goal = await db.goal.create({
      data: {
        ...goalData,
        goalSheetId: sheet.id,
        isShared: true,
      },
    });

    await db.auditLog.create({
      data: {
        action: AuditAction.SHARED_GOAL_PUSHED,
        entityType: "Goal",
        entityId: goal.id,
        changedById: session.userId,
        goalSheetId: sheet.id,
        after: { ...goalData, employeeId },
      },
    });
  }

  revalidatePath("/admin");
  return { success: true };
}

// ── Trigger Cron Manually ──────────────────────────────────────────────────────

export async function triggerCronAction(path: string) {
  await requireAdmin();
  const url = `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
    });
    const data = await res.json();
    return { success: res.ok, data };
  } catch (error) {
    return { success: false, data: { error: "Network or Server Error" } };
  }
}
