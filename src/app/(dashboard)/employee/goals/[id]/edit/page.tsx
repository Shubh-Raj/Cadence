import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { GoalForm } from "@/components/goals/goal-form";
import { updateGoalAction } from "@/lib/actions/goal.actions";
import { GoalStatus } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Goal" };

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const goal = await db.goal.findUnique({
    where: { id },
    include: { goalSheet: true },
  });

  if (!goal || goal.goalSheet.userId !== session.userId) notFound();

  if (goal.isLocked) redirect("/employee/goals");
  if (
    goal.goalSheet.status !== GoalStatus.DRAFT &&
    goal.goalSheet.status !== GoalStatus.REJECTED
  )
    redirect("/employee/goals");

  // Bind goalId into the action
  const boundAction = updateGoalAction.bind(null, id);

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Edit Goal</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update your goal details. Weightage rules still apply.
        </p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <GoalForm
          action={boundAction}
          submitLabel="Save Changes"
          isShared={goal.isShared}
          defaultValues={{
            title: goal.title,
            description: goal.description ?? undefined,
            thrustArea: goal.thrustArea,
            uomType: goal.uomType,
            targetValue: goal.targetValue,
            weightage: goal.weightage,
          }}
        />
      </div>
    </div>
  );
}
