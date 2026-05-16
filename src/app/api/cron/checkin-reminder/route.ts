import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GoalStatus, CheckInPeriod } from "@prisma/client";
import { sendCheckInReminderEmail } from "@/lib/email";
import { notifyCheckInReminder } from "@/lib/teams";

// ── Check-in Reminder Cron ────────────────────────────────────────────────────
//
// Called by Vercel Cron (see vercel.json) on the first day of each quarter window:
//   Q1 → July 1,  Q2 → October 1,  Q3 → January 1,  Q4 → April 1
//
// Finds all employees with APPROVED/LOCKED goal sheets who have NOT yet submitted
// a check-in for the current quarter, then notifies them via Email + Teams.

function currentPeriod(): CheckInPeriod | null {
  const month = new Date().getMonth() + 1; // 1-12
  if (month === 7)  return CheckInPeriod.Q1;
  if (month === 10) return CheckInPeriod.Q2;
  if (month === 1)  return CheckInPeriod.Q3;
  if (month === 4)  return CheckInPeriod.Q4;
  return null; // Not a reminder month — safe no-op
}

const PERIOD_DUE: Record<CheckInPeriod, string> = {
  Q1: "31st July",
  Q2: "31st October",
  Q3: "31st January",
  Q4: "30th April",
};

export async function GET(req: NextRequest) {
  // Secure the endpoint with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = currentPeriod();
  if (!period) {
    return NextResponse.json({ message: "Not a check-in reminder month — no-op." });
  }

  const cycleYear = new Date().getFullYear();
  const dueDate   = PERIOD_DUE[period];

  // Find all employees with active (APPROVED/LOCKED) goal sheets
  const activeSheets = await db.goalSheet.findMany({
    where: {
      cycleYear,
      status: { in: [GoalStatus.APPROVED, GoalStatus.LOCKED] },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      goals: {
        select: {
          id: true,
          checkIns: { where: { period, cycleYear }, select: { id: true } },
        },
      },
    },
  });

  let notified = 0;

  for (const sheet of activeSheets) {
    // Check if ANY goal in this sheet has a check-in for this quarter
    const hasAnyCheckIn = sheet.goals.some((g) => g.checkIns.length > 0);
    if (hasAnyCheckIn) continue; // Already started — skip

    const { email, name } = sheet.user;
    await Promise.allSettled([
      sendCheckInReminderEmail({ employeeEmail: email, employeeName: name, period, dueDate }),
      notifyCheckInReminder({ employeeName: name, period, dueDate }),
    ]);
    notified++;
  }

  return NextResponse.json({
    success: true,
    period,
    notified,
    message: `Sent ${period} check-in reminders to ${notified} employee(s).`,
  });
}
