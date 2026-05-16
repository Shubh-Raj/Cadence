"use client";

import { useState, useTransition } from "react";
import { managerEditGoalAction } from "@/lib/actions/approval.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Lock } from "lucide-react";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  thrustArea: string;
  targetValue: number;
  weightage: number;
  isShared: boolean;
  isLocked: boolean;
};

type Props = {
  goal: Goal;
  sheetId: string;
  canEdit: boolean;
  uomLabel: string;
};

export function ManagerGoalRow({ goal, canEdit, uomLabel }: Props) {
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState(String(goal.targetValue));
  const [weight, setWeight] = useState(String(goal.weightage));
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await managerEditGoalAction(goal.id, {
        targetValue: parseFloat(target),
        weightage: parseFloat(weight),
      });
      setEditing(false);
    });
  }

  return (
    <div className="px-5 py-4 flex items-start gap-4 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground text-sm">{goal.title}</p>
          {goal.isShared && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Shared
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {goal.thrustArea} · {uomLabel}
        </p>
        {goal.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{goal.description}</p>
        )}
      </div>

      {/* Target + Weightage */}
      {editing ? (
        <div className="flex items-center gap-2 shrink-0">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Target</label>
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              type="number"
              className="h-7 w-24 text-xs rounded-lg"
              disabled={goal.isShared}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Weight %</label>
            <Input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              type="number"
              min={10}
              max={100}
              className="h-7 w-20 text-xs rounded-lg"
            />
          </div>
          <div className="flex items-center gap-1 mt-4">
            <Button
              id={`save-goal-${goal.id}`}
              size="icon"
              className="h-7 w-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={save}
              disabled={isPending}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button
              id={`cancel-edit-${goal.id}`}
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg"
              onClick={() => {
                setTarget(String(goal.targetValue));
                setWeight(String(goal.weightage));
                setEditing(false);
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">
              {goal.weightage}%
            </p>
            <p className="text-xs text-muted-foreground">Target: {goal.targetValue}</p>
          </div>
          {canEdit && !goal.isLocked && (
            <Button
              id={`edit-goal-${goal.id}`}
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {goal.isLocked && (
            <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
          )}
        </div>
      )}
    </div>
  );
}
