"use client";

import { useState, useTransition } from "react";
import { unlockGoalAction } from "@/lib/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { LockOpen, Check } from "lucide-react";
import { toast } from "sonner";

type Props = { goalId: string; goalTitle: string };

export function UnlockGoalButton({ goalId, goalTitle }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUnlock() {
    const note = `Unlocked by admin for re-editing: "${goalTitle}"`;
    startTransition(async () => {
      await unlockGoalAction(goalId, note);
      setUnlocked(true);
      toast.success("Goal unlocked — employee can now edit and resubmit.");
    });
  }

  if (unlocked) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600">
        <Check className="w-3 h-3" /> Unlocked
      </span>
    );
  }

  return (
    <Button
      id={`unlock-goal-${goalId}`}
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={handleUnlock}
      className="rounded-lg text-xs gap-1.5 h-7 text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-400 dark:text-amber-300 dark:border-amber-800"
    >
      <LockOpen className="w-3 h-3" />
      {isPending ? "Unlocking…" : "Unlock"}
    </Button>
  );
}
