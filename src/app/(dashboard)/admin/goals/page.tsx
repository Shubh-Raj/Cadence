import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { PushSharedGoalForm } from "@/components/admin/push-shared-goal-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Push Shared Goal" };

export default async function AdminGoalsPage() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/login");

  const employees = await db.user.findMany({
    where: { role: Role.EMPLOYEE },
    select: { id: true, name: true, email: true, department: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Push Shared Goal
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Push a departmental KPI to multiple employees. Recipients can adjust
          weightage only — title and target are read-only for them.
        </p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <PushSharedGoalForm employees={employees} />
      </div>
    </div>
  );
}
