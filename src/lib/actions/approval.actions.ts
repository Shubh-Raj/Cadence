"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { GoalStatus, AuditAction, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireManager() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.MANAGER && session.role !== Role.ADMIN) redirect("/employee");
  return session;
}

async function writeAudit(params: {
  action: AuditAction;
  entityType: string;
  entityId: string;
  changedById: string;
  goalSheetId?: string;
  before?: object;
  after?: object;
  note?: string;
}) {
  await db.auditLog.create({ data: params });
}

// ── Approve ────────────────────────────────────────────────────────────────────

export async function approveGoalSheetAction(sheetId: string) {
  const session = await requireManager();

  const sheet = await db.goalSheet.findUnique({
    where: { id: sheetId },
    include: { goals: true, user: { select: { managerId: true } } },
  });

  if (!sheet) return;
  if (sheet.status !== GoalStatus.PENDING_APPROVAL) return;
  // Verify this manager owns the employee
  if (sheet.user.managerId !== session.userId && session.role !== Role.ADMIN) return;

  await db.$transaction([
    db.goalSheet.update({
      where: { id: sheetId },
      data: { status: GoalStatus.APPROVED, approvedAt: new Date() },
    }),
    db.goal.updateMany({
      where: { goalSheetId: sheetId },
      data: { isLocked: true },
    }),
  ]);

  await writeAudit({
    action: AuditAction.GOAL_APPROVED,
    entityType: "GoalSheet",
    entityId: sheetId,
    changedById: session.userId,
    goalSheetId: sheetId,
  });

  revalidatePath("/manager/approvals");
  revalidatePath("/manager");
}

// ── Reject ─────────────────────────────────────────────────────────────────────

const RejectSchema = z.object({
  note: z.string().min(5, "Please provide a reason (min 5 characters)").max(500),
});

export type RejectState = { errors?: { note?: string[] }; message?: string } | undefined;

export async function rejectGoalSheetAction(
  sheetId: string,
  _state: RejectState,
  formData: FormData
): Promise<RejectState> {
  const session = await requireManager();

  const sheet = await db.goalSheet.findUnique({
    where: { id: sheetId },
    include: { user: { select: { managerId: true } } },
  });

  if (!sheet) return { message: "Goal sheet not found." };
  if (sheet.status !== GoalStatus.PENDING_APPROVAL) return { message: "This sheet is not pending approval." };
  if (sheet.user.managerId !== session.userId && session.role !== Role.ADMIN) {
    return { message: "You are not the reviewer for this sheet." };
  }

  const validated = RejectSchema.safeParse({ note: formData.get("note") });
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  await db.goalSheet.update({
    where: { id: sheetId },
    data: {
      status: GoalStatus.REJECTED,
      rejectedAt: new Date(),
      rejectionNote: validated.data.note,
    },
  });

  await writeAudit({
    action: AuditAction.GOAL_REJECTED,
    entityType: "GoalSheet",
    entityId: sheetId,
    changedById: session.userId,
    goalSheetId: sheetId,
    note: validated.data.note,
  });

  revalidatePath("/manager/approvals");
  revalidatePath("/manager");
  redirect("/manager/approvals");
}

// ── Manager Inline Edit ────────────────────────────────────────────────────────

const ManagerEditSchema = z.object({
  targetValue: z.coerce.number().positive().optional(),
  weightage: z.coerce.number().min(10).max(100).optional(),
});

export async function managerEditGoalAction(
  goalId: string,
  data: { targetValue?: number; weightage?: number }
) {
  const session = await requireManager();

  const goal = await db.goal.findUnique({
    where: { id: goalId },
    include: {
      goalSheet: {
        include: { user: { select: { managerId: true } }, goals: true },
      },
    },
  });

  if (!goal) return;
  if (goal.goalSheet.status !== GoalStatus.PENDING_APPROVAL) return;
  if (goal.goalSheet.user.managerId !== session.userId && session.role !== Role.ADMIN) return;

  // Validate weightage total if changing weightage
  if (data.weightage !== undefined) {
    const others = goal.goalSheet.goals.filter((g) => g.id !== goalId);
    const total = others.reduce((s, g) => s + g.weightage, 0) + data.weightage;
    if (total > 100) return;
  }

  const validated = ManagerEditSchema.safeParse(data);
  if (!validated.success) return;

  const before = { targetValue: goal.targetValue, weightage: goal.weightage };
  const updated = await db.goal.update({
    where: { id: goalId },
    data: validated.data,
  });

  await writeAudit({
    action: AuditAction.GOAL_EDITED_BY_MANAGER,
    entityType: "Goal",
    entityId: goalId,
    changedById: session.userId,
    goalSheetId: goal.goalSheetId,
    before,
    after: { targetValue: updated.targetValue, weightage: updated.weightage },
  });

  revalidatePath(`/manager/approvals`);
}
