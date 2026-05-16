"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { GoalStatus, UoMType, AuditAction } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendGoalSubmittedEmail } from "@/lib/email";
import { notifyGoalSubmitted } from "@/lib/teams";
import { THRUST_AREAS, MAX_GOALS, MIN_WEIGHTAGE } from "@/lib/goal-utils";

// ── Schema ─────────────────────────────────────────────────────────────────────

const GoalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(500).optional(),
  thrustArea: z.enum(THRUST_AREAS, { error: "Select a valid thrust area" }),
  uomType: z.enum(["MIN", "MAX", "TIMELINE", "ZERO"] as const, {
    error: "Select a valid UoM",
  }),
  targetValue: z.coerce.number().positive("Target must be a positive number"),
  weightage: z.coerce
    .number()
    .min(MIN_WEIGHTAGE, `Minimum weightage is ${MIN_WEIGHTAGE}%`)
    .max(100, "Weightage cannot exceed 100%"),
});

// ── Helpers ────────────────────────────────────────────────────────────────────

async function requireEmployee() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "EMPLOYEE") redirect("/manager");
  return session;
}

async function getOrCreateSheet(userId: string, cycleYear: number) {
  return db.goalSheet.upsert({
    where: { userId_cycleYear: { userId, cycleYear } },
    update: {},
    create: { userId, cycleYear, status: GoalStatus.DRAFT },
  });
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

// ── Create Goal ────────────────────────────────────────────────────────────────

export type GoalActionState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function createGoalAction(
  _state: GoalActionState,
  formData: FormData
): Promise<GoalActionState> {
  const session = await requireEmployee();
  const cycleYear = new Date().getFullYear();

  const raw = Object.fromEntries(formData.entries());
  const validated = GoalSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const sheet = await getOrCreateSheet(session.userId, cycleYear);

  if (sheet.status !== GoalStatus.DRAFT && sheet.status !== GoalStatus.REJECTED) {
    return { message: "Goals can only be added when the sheet is in Draft or Rejected state." };
  }

  const existingGoals = await db.goal.findMany({ where: { goalSheetId: sheet.id } });
  if (existingGoals.length >= MAX_GOALS) {
    return { message: `You cannot have more than ${MAX_GOALS} goals.` };
  }

  const totalWithNew =
    existingGoals.reduce((s, g) => s + g.weightage, 0) + validated.data.weightage;
  if (totalWithNew > 100) {
    return {
      message: `Adding this goal would bring total weightage to ${totalWithNew}%. Total cannot exceed 100%.`,
    };
  }

  const goal = await db.goal.create({
    data: {
      ...validated.data,
      goalSheetId: sheet.id,
    },
  });

  await writeAudit({
    action: AuditAction.GOAL_CREATED,
    entityType: "Goal",
    entityId: goal.id,
    changedById: session.userId,
    goalSheetId: sheet.id,
    after: goal,
  });

  revalidatePath("/employee/goals");
  redirect("/employee/goals");
}

// ── Update Goal ────────────────────────────────────────────────────────────────

export async function updateGoalAction(
  goalId: string,
  _state: GoalActionState,
  formData: FormData
): Promise<GoalActionState> {
  const session = await requireEmployee();

  const goal = await db.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true },
  });

  if (!goal || goal.goalSheet.userId !== session.userId) {
    return { message: "Goal not found." };
  }
  if (goal.isLocked) {
    return { message: "This goal is locked and cannot be edited." };
  }
  if (
    goal.goalSheet.status !== GoalStatus.DRAFT &&
    goal.goalSheet.status !== GoalStatus.REJECTED
  ) {
    return { message: "Goals can only be edited when the sheet is in Draft or Rejected state." };
  }

  const raw = Object.fromEntries(formData.entries());
  const validated = GoalSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  // Recalculate total weightage excluding this goal
  const others = await db.goal.findMany({
    where: { goalSheetId: goal.goalSheetId, id: { not: goalId } },
  });
  const totalWithNew =
    others.reduce((s, g) => s + g.weightage, 0) + validated.data.weightage;
  if (totalWithNew > 100) {
    return {
      message: `Updating this goal would bring total weightage to ${totalWithNew}%. Total cannot exceed 100%.`,
    };
  }

  const before = { ...goal };
  const updated = await db.goal.update({
    where: { id: goalId },
    data: validated.data,
  });

  await writeAudit({
    action: AuditAction.GOAL_CREATED, // reuse as update — no GOAL_UPDATED enum; extend if needed
    entityType: "Goal",
    entityId: goalId,
    changedById: session.userId,
    goalSheetId: goal.goalSheetId,
    before,
    after: updated,
  });

  revalidatePath("/employee/goals");
  redirect("/employee/goals");
}

// ── Delete Goal ────────────────────────────────────────────────────────────────

export async function deleteGoalAction(goalId: string) {
  const session = await requireEmployee();

  const goal = await db.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true },
  });

  if (!goal || goal.goalSheet.userId !== session.userId) return;
  if (goal.isLocked) return;
  if (
    goal.goalSheet.status !== GoalStatus.DRAFT &&
    goal.goalSheet.status !== GoalStatus.REJECTED
  )
    return;

  await db.goal.delete({ where: { id: goalId } });
  revalidatePath("/employee/goals");
}

// ── Submit Goal Sheet ──────────────────────────────────────────────────────────

export async function submitGoalSheetAction(sheetId: string) {
  const session = await requireEmployee();

  const sheet = await db.goalSheet.findUnique({
    where: { id: sheetId },
    include: { goals: true },
  });

  if (!sheet || sheet.userId !== session.userId) return;
  if (sheet.status !== GoalStatus.DRAFT && sheet.status !== GoalStatus.REJECTED) return;

  // Validations
  if (sheet.goals.length === 0) return;
  if (sheet.goals.length > MAX_GOALS) return;
  if (sheet.goals.some((g) => g.weightage < MIN_WEIGHTAGE)) return;

  const total = sheet.goals.reduce((s, g) => s + g.weightage, 0);
  if (Math.round(total) !== 100) return;

  await db.goalSheet.update({
    where: { id: sheetId },
    data: { status: GoalStatus.PENDING_APPROVAL, submittedAt: new Date() },
  });

  // Notify manager via email
  const employee = await db.user.findUnique({
    where: { id: session.userId },
    include: { manager: { select: { id: true, email: true, name: true } } },
  });
  if (employee?.manager) {
    await Promise.all([
      sendGoalSubmittedEmail({
        managerEmail: employee.manager.email,
        managerName: employee.manager.name,
        employeeName: employee.name,
        goalCount: sheet.goals.length,
      }),
      notifyGoalSubmitted({
        employeeName: employee.name,
        managerId: employee.manager.id ?? "",
        goalCount: sheet.goals.length,
        sheetUserId: session.userId,
      }),
    ]);
  }

  await writeAudit({
    action: AuditAction.GOAL_SUBMITTED,
    entityType: "GoalSheet",
    entityId: sheetId,
    changedById: session.userId,
    goalSheetId: sheetId,
  });

  revalidatePath("/employee");
  revalidatePath("/employee/goals");
}
