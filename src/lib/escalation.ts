import { db } from "@/lib/db";
import { GoalStatus, EscalationLevel, CheckInPeriod, Role } from "@prisma/client";

const GOAL_SUBMISSION_DEADLINE_DAYS = 14; // days after May 1
const APPROVAL_DEADLINE_DAYS = 7; // days after submission
const CYCLE_OPEN_MONTH = 5; // May

function cycleOpenDate(year: number) {
  return new Date(year, CYCLE_OPEN_MONTH - 1, 1);
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function currentCheckInPeriod(): CheckInPeriod | null {
  const month = new Date().getMonth() + 1;
  if (month === 7 || month === 8) return CheckInPeriod.Q1;
  if (month >= 9 && month <= 11) return CheckInPeriod.Q2;
  if (month >= 12 || month <= 2) return CheckInPeriod.Q3;
  if (month >= 3 && month <= 4) return CheckInPeriod.Q4;
  return null;
}

export async function runEscalationRules() {
  const cycleYear = new Date().getFullYear();
  const openDate = cycleOpenDate(cycleYear);
  const daysOpen = daysSince(openDate);
  const period = currentCheckInPeriod();

  const employees = await db.user.findMany({
    where: { role: Role.EMPLOYEE },
    include: {
      goalSheets: {
        where: { cycleYear },
        include: {
          goals: {
            include: { checkIns: { where: { cycleYear, period: period ?? undefined } } },
          },
        },
      },
    },
  });

  const results: { type: string; employeeId: string; reason: string }[] = [];

  for (const emp of employees) {
    const sheet = emp.goalSheets[0];

    // Rule 1: Employee hasn't submitted within deadline days
    if (
      daysOpen >= GOAL_SUBMISSION_DEADLINE_DAYS &&
      (!sheet ||
        sheet.status === GoalStatus.DRAFT ||
        sheet.status === GoalStatus.REJECTED)
    ) {
      const alreadyEscalated = await db.escalationLog.findFirst({
        where: {
          employeeId: emp.id,
          isResolved: false,
          metadata: { path: ["type"], equals: "NO_SUBMISSION" },
        },
      });
      if (!alreadyEscalated) {
        await db.escalationLog.create({
          data: {
            employeeId: emp.id,
            level: EscalationLevel.MANAGER,
            reason: `Employee has not submitted goals ${daysOpen} days into the cycle`,
            metadata: { type: "NO_SUBMISSION", cycleYear, daysOpen },
          },
        });
        results.push({
          type: "NO_SUBMISSION",
          employeeId: emp.id,
          reason: `${daysOpen} days overdue`,
        });
      }
    }

    // Rule 2: Manager hasn't approved within deadline after submission
    if (sheet?.status === GoalStatus.PENDING_APPROVAL && sheet.submittedAt) {
      const daysPending = daysSince(sheet.submittedAt);
      if (daysPending >= APPROVAL_DEADLINE_DAYS) {
        const alreadyEscalated = await db.escalationLog.findFirst({
          where: {
            employeeId: emp.id,
            isResolved: false,
            metadata: { path: ["type"], equals: "APPROVAL_OVERDUE" },
          },
        });
        if (!alreadyEscalated) {
          await db.escalationLog.create({
            data: {
              employeeId: emp.id,
              level: EscalationLevel.HR,
              reason: `Goal sheet pending manager approval for ${daysPending} days`,
              metadata: { type: "APPROVAL_OVERDUE", cycleYear, daysPending, sheetId: sheet.id },
            },
          });
          results.push({
            type: "APPROVAL_OVERDUE",
            employeeId: emp.id,
            reason: `${daysPending} days pending approval`,
          });
        }
      }
    }

    // Rule 3: Check-in not submitted during active window
    if (period && sheet?.status === GoalStatus.APPROVED) {
      const lockedGoals = sheet.goals.filter((g) => g.isLocked);
      const missingCheckIns = lockedGoals.filter((g) => g.checkIns.length === 0);

      if (missingCheckIns.length > 0) {
        const alreadyEscalated = await db.escalationLog.findFirst({
          where: {
            employeeId: emp.id,
            isResolved: false,
            metadata: {
              path: ["type"],
              equals: "CHECKIN_MISSING",
            },
          },
        });
        if (!alreadyEscalated) {
          await db.escalationLog.create({
            data: {
              employeeId: emp.id,
              level: EscalationLevel.MANAGER,
              reason: `${missingCheckIns.length} check-in(s) not submitted for ${period}`,
              metadata: {
                type: "CHECKIN_MISSING",
                cycleYear,
                period,
                missingGoals: missingCheckIns.map((g) => g.id),
              },
            },
          });
          results.push({
            type: "CHECKIN_MISSING",
            employeeId: emp.id,
            reason: `${missingCheckIns.length} goals missing ${period} check-in`,
          });
        }
      }
    }
  }

  return results;
}
