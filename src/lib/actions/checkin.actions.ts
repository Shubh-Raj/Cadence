"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AuditAction, CheckInPeriod, Role, UoMType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";

// ── Score computation (per BRD) ────────────────────────────────────────────────

export function computeScore(
  uomType: UoMType,
  targetValue: number,
  actualValue: number
): number {
  if (actualValue == null || actualValue === undefined) return 0;
  switch (uomType) {
    case UoMType.MIN:
      return Math.min(actualValue / targetValue, 1);
    case UoMType.MAX:
      return actualValue === 0 ? 0 : Math.min(targetValue / actualValue, 1);
    case UoMType.TIMELINE:
      // targetValue = deadline unix ms, actualValue = completion unix ms
      return actualValue <= targetValue ? 1 : 0;
    case UoMType.ZERO:
      return actualValue === 0 ? 1 : 0;
    default:
      return 0;
  }
}

// ── Current period helper ──────────────────────────────────────────────────────

export function getCurrentPeriod(): CheckInPeriod | null {
  const month = new Date().getMonth() + 1;
  if (month === 7 || month === 8) return CheckInPeriod.Q1;
  if (month >= 9 && month <= 11) return CheckInPeriod.Q2;
  if (month >= 12 || month <= 2) return CheckInPeriod.Q3;
  if (month >= 3 && month <= 4) return CheckInPeriod.Q4;
  return null;
}

// ── Schema ─────────────────────────────────────────────────────────────────────

const CheckInSchema = z.object({
  actualValue: z.coerce.number({ error: "Enter a numeric value" }),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"], {
    error: "Select a status",
  }),
  employeeNote: z.string().max(500).optional(),
});

export type CheckInState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

// ── Upsert Employee Check-in ───────────────────────────────────────────────────

export async function upsertCheckInAction(
  goalId: string,
  period: CheckInPeriod,
  _state: CheckInState,
  formData: FormData
): Promise<CheckInState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.EMPLOYEE) return { message: "Only employees can submit check-ins." };

  const goal = await db.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true },
  });

  if (!goal || goal.goalSheet.userId !== session.userId) return { message: "Goal not found." };
  if (!goal.isLocked) return { message: "Goals must be approved before check-ins can be submitted." };

  const raw = Object.fromEntries(formData.entries());
  const validated = CheckInSchema.safeParse(raw);
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const { actualValue, status, employeeNote } = validated.data;
  const computedScore = computeScore(goal.uomType, goal.targetValue, actualValue);
  const cycleYear = new Date().getFullYear();

  const checkIn = await db.checkIn.upsert({
    where: { goalId_period_cycleYear: { goalId, period, cycleYear } },
    update: { actualValue, status, employeeNote, computedScore },
    create: {
      goalId,
      period,
      cycleYear,
      actualValue,
      status,
      employeeNote,
      computedScore,
      employeeId: session.userId,
    },
  });

  await db.auditLog.create({
    data: {
      action: AuditAction.CHECKIN_SUBMITTED,
      entityType: "CheckIn",
      entityId: checkIn.id,
      changedById: session.userId,
      goalSheetId: goal.goalSheet.id,
      after: { actualValue, status, computedScore },
    },
  });

  revalidatePath("/employee/checkins");
  return undefined;
}

// ── Manager Comment ────────────────────────────────────────────────────────────

const CommentSchema = z.object({
  comment: z.string().min(5, "Comment must be at least 5 characters").max(500),
});

export type CommentState =
  | { errors?: { comment?: string[] }; message?: string; success?: boolean }
  | undefined;

export async function addManagerCommentAction(
  checkInId: string,
  _state: CommentState,
  formData: FormData
): Promise<CommentState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.MANAGER && session.role !== Role.ADMIN) {
    return { message: "Only managers can add check-in comments." };
  }

  const validated = CommentSchema.safeParse({ comment: formData.get("comment") });
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const checkIn = await db.checkIn.findUnique({
    where: { id: checkInId },
    include: { goal: { include: { goalSheet: { include: { user: true } } } } },
  });

  if (!checkIn) return { message: "Check-in not found." };

  await db.checkIn.update({
    where: { id: checkInId },
    data: {
      reviewerComment: validated.data.comment,
      reviewerId: session.userId,
      reviewedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      action: AuditAction.CHECKIN_COMMENTED,
      entityType: "CheckIn",
      entityId: checkInId,
      changedById: session.userId,
      note: validated.data.comment,
    },
  });

  revalidatePath("/manager/checkins");
  return { success: true };
}
