import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = parseInt(request.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear()));

  const sheets = await db.goalSheet.findMany({
    where: { cycleYear: year },
    include: {
      user: { select: { name: true, email: true, department: true } },
      goals: {
        include: {
          checkIns: { where: { cycleYear: year } },
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  const rows: string[] = [
    [
      "Employee",
      "Email",
      "Department",
      "Goal Title",
      "Thrust Area",
      "UoM",
      "Target",
      "Weightage %",
      "Status",
      "Period",
      "Actual",
      "Progress Score %",
      "Check-in Status",
    ].join(","),
  ];

  for (const sheet of sheets) {
    if (sheet.goals.length === 0) {
      rows.push(
        [
          q(sheet.user.name),
          q(sheet.user.email),
          q(sheet.user.department ?? ""),
          q("—"), q("—"), q("—"), "", "", q(sheet.status), q("—"), "", "", "",
        ].join(",")
      );
      continue;
    }

    for (const goal of sheet.goals) {
      if (goal.checkIns.length === 0) {
        rows.push(
          [
            q(sheet.user.name),
            q(sheet.user.email),
            q(sheet.user.department ?? ""),
            q(goal.title),
            q(goal.thrustArea),
            q(goal.uomType),
            goal.targetValue,
            goal.weightage,
            q(sheet.status),
            q("—"), "", "", "",
          ].join(",")
        );
      } else {
        for (const ci of goal.checkIns) {
          rows.push(
            [
              q(sheet.user.name),
              q(sheet.user.email),
              q(sheet.user.department ?? ""),
              q(goal.title),
              q(goal.thrustArea),
              q(goal.uomType),
              goal.targetValue,
              goal.weightage,
              q(sheet.status),
              q(ci.period),
              ci.actualValue ?? "",
              ci.computedScore !== null ? Math.round((ci.computedScore ?? 0) * 100) : "",
              q(ci.status),
            ].join(",")
          );
        }
      }
    }
  }

  const csv = rows.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="cadence-${year}.csv"`,
    },
  });
}

function q(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
