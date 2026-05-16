import { db } from "@/lib/db";
import { GoalStatus, EscalationLevel, CheckInPeriod, Role } from "@prisma/client";
import { notifyEscalation } from "@/lib/teams";
import { sendEmail } from "@/lib/email";

const GOAL_SUBMISSION_DEADLINE_DAYS = 14;
const APPROVAL_DEADLINE_DAYS = 7;
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

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function sendEscalationEmail(to: string, name: string, reason: string, level: EscalationLevel) {
  const levelLabel: Record<EscalationLevel, string> = {
    EMPLOYEE: "Employee",
    MANAGER: "Manager",
    HR: "HR / Admin",
  };
  await sendEmail({
    to,
    subject: `Action Required: Goal Portal Escalation`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#b45309;margin-bottom:8px">Escalation Notice — ${levelLabel[level]}</h2>
        <p>Hi ${name},</p>
        <p>${reason}</p>
        <a href="${BASE}/admin/escalations"
           style="display:inline-block;margin-top:20px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          View Escalations →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#9ca3af">AtomQuest Portal · ${new Date().getFullYear()}</p>
      </div>
    `,
  });
}

export async function runEscalationRules() {
  const cycleYear = new Date().getFullYear();
  const openDate = cycleOpenDate(cycleYear);
  const daysOpen = daysSince(openDate);
  const period = currentCheckInPeriod();

  const employees = await db.user.findMany({
    where: { role: Role.EMPLOYEE },
    include: {
      manager: { select: { id: true, email: true, name: true } },
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

    // ── Rule 1: Employee hasn't submitted within deadline ──────────────────────
    if (
      daysOpen >= GOAL_SUBMISSION_DEADLINE_DAYS &&
      (!sheet || sheet.status === GoalStatus.DRAFT || sheet.status === GoalStatus.REJECTED)
    ) {
      const alreadyEscalated = await db.escalationLog.findFirst({
        where: {
          employeeId: emp.id,
          isResolved: false,
          metadata: { path: ["type"], equals: "NO_SUBMISSION" },
        },
      });

      if (!alreadyEscalated) {
        const reason = `Employee has not submitted goals — ${daysOpen} days into the cycle`;

        await db.escalationLog.create({
          data: {
            employeeId: emp.id,
            level: EscalationLevel.MANAGER,
            reason,
            metadata: { type: "NO_SUBMISSION", cycleYear, daysOpen },
          },
        });

        // Notify the employee themselves and their manager
        await Promise.allSettled([
          sendEscalationEmail(emp.email, emp.name, reason, EscalationLevel.MANAGER),
          emp.manager
            ? sendEscalationEmail(emp.manager.email, emp.manager.name, `${emp.name}: ${reason}`, EscalationLevel.MANAGER)
            : Promise.resolve(),
          notifyEscalation({ employeeName: emp.name, reason, level: "Manager Level" }),
        ]);

        results.push({ type: "NO_SUBMISSION", employeeId: emp.id, reason });
      }
    }

    // ── Rule 2: Manager hasn't approved within deadline ────────────────────────
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
          const reason = `Goal sheet pending manager approval for ${daysPending} days`;

          await db.escalationLog.create({
            data: {
              employeeId: emp.id,
              level: EscalationLevel.HR,
              reason,
              metadata: { type: "APPROVAL_OVERDUE", cycleYear, daysPending, sheetId: sheet.id },
            },
          });

          await Promise.allSettled([
            emp.manager
              ? sendEscalationEmail(emp.manager.email, emp.manager.name, reason, EscalationLevel.HR)
              : Promise.resolve(),
            notifyEscalation({ employeeName: emp.name, reason, level: "HR Level" }),
          ]);

          results.push({ type: "APPROVAL_OVERDUE", employeeId: emp.id, reason });
        }
      }
    }

    // ── Rule 3: Check-in not submitted during active window ────────────────────
    if (period && sheet?.status === GoalStatus.APPROVED) {
      const lockedGoals = sheet.goals.filter((g) => g.isLocked);
      const missingCheckIns = lockedGoals.filter((g) => g.checkIns.length === 0);

      if (missingCheckIns.length > 0) {
        const alreadyEscalated = await db.escalationLog.findFirst({
          where: {
            employeeId: emp.id,
            isResolved: false,
            metadata: { path: ["type"], equals: "CHECKIN_MISSING" },
          },
        });

        if (!alreadyEscalated) {
          const reason = `${missingCheckIns.length} check-in(s) not submitted for ${period}`;

          await db.escalationLog.create({
            data: {
              employeeId: emp.id,
              level: EscalationLevel.MANAGER,
              reason,
              metadata: {
                type: "CHECKIN_MISSING",
                cycleYear,
                period,
                missingGoals: missingCheckIns.map((g) => g.id),
              },
            },
          });

          await Promise.allSettled([
            sendEscalationEmail(emp.email, emp.name, reason, EscalationLevel.MANAGER),
            notifyEscalation({ employeeName: emp.name, reason, level: "Manager Level" }),
          ]);

          results.push({ type: "CHECKIN_MISSING", employeeId: emp.id, reason });
        }
      }
    }
  }

  return results;
}
