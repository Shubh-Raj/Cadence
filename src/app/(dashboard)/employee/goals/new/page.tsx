import { createGoalAction } from "@/lib/actions/goal.actions";
import { GoalForm } from "@/components/goals/goal-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Goal" };

export default function NewGoalPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Add Goal</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Define a goal for the current cycle. Weightage must be at least 10%; total across all goals must equal 100%.
        </p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <GoalForm action={createGoalAction} submitLabel="Save Goal" />
      </div>
    </div>
  );
}
