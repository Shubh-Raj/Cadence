"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type GoalActionState } from "@/lib/actions/goal.actions";
import { THRUST_AREAS } from "@/lib/goal-utils";
import { cn } from "@/lib/utils";

type Props = {
  action: (state: GoalActionState, formData: FormData) => Promise<GoalActionState>;
  defaultValues?: {
    title?: string;
    description?: string;
    thrustArea?: string;
    uomType?: string;
    targetValue?: number;
    weightage?: number;
  };
  submitLabel?: string;
  isShared?: boolean; // shared goals: only weightage is editable
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      id="goal-form-submit"
      type="submit"
      disabled={pending}
      className="gradient-brand text-white shadow-lg shadow-primary/20 rounded-xl w-full sm:w-auto"
    >
      {pending ? "Saving…" : label}
    </Button>
  );
}

const UOM_OPTIONS = [
  { value: "MIN", label: "Numeric / % — Higher is better (e.g. Revenue, Sales)" },
  { value: "MAX", label: "Numeric / % — Lower is better (e.g. TAT, Cost)" },
  { value: "TIMELINE", label: "Timeline — Date-based completion" },
  { value: "ZERO", label: "Zero-based — Zero = Success (e.g. Safety incidents)" },
];

export function GoalForm({ action, defaultValues = {}, submitLabel = "Save Goal", isShared = false }: Props) {
  const [state, formAction] = useActionState(action, undefined);

  function err(field: string) {
    return (state?.errors as Record<string, string[]> | undefined)?.[field]?.[0];
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          {state.message}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Goal Title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Increase quarterly sales revenue by 15%"
          defaultValue={defaultValues.title}
          disabled={isShared}
          className={cn("rounded-xl", err("title") && "border-red-400")}
        />
        {err("title") && <p className="text-xs text-red-500">{err("title")}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Additional context, key activities, or KPIs"
          defaultValue={defaultValues.description}
          disabled={isShared}
          rows={3}
          className="rounded-xl resize-none"
        />
      </div>

      {/* Thrust Area */}
      <div className="space-y-1.5">
        <Label htmlFor="thrustArea">Thrust Area *</Label>
        <Select name="thrustArea" defaultValue={defaultValues.thrustArea} disabled={isShared}>
          <SelectTrigger id="thrustArea" className={cn("rounded-xl", err("thrustArea") && "border-red-400")}>
            <SelectValue placeholder="Select a thrust area" />
          </SelectTrigger>
          <SelectContent>
            {THRUST_AREAS.map((area) => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {err("thrustArea") && <p className="text-xs text-red-500">{err("thrustArea")}</p>}
      </div>

      {/* UoM Type */}
      <div className="space-y-1.5">
        <Label htmlFor="uomType">Unit of Measurement (UoM) *</Label>
        <Select name="uomType" defaultValue={defaultValues.uomType} disabled={isShared}>
          <SelectTrigger id="uomType" className={cn("rounded-xl", err("uomType") && "border-red-400")}>
            <SelectValue placeholder="How will achievement be measured?" />
          </SelectTrigger>
          <SelectContent>
            {UOM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {err("uomType") && <p className="text-xs text-red-500">{err("uomType")}</p>}
      </div>

      {/* Target Value + Weightage row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="targetValue">Target Value *</Label>
          <Input
            id="targetValue"
            name="targetValue"
            type="number"
            step="any"
            placeholder="e.g. 1000000"
            defaultValue={defaultValues.targetValue}
            disabled={isShared}
            className={cn("rounded-xl", err("targetValue") && "border-red-400")}
          />
          {err("targetValue") && <p className="text-xs text-red-500">{err("targetValue")}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="weightage">
            Weightage (%) *
            <span className="text-muted-foreground font-normal text-xs ml-1">(min 10%)</span>
          </Label>
          <Input
            id="weightage"
            name="weightage"
            type="number"
            min={10}
            max={100}
            step={5}
            placeholder="e.g. 20"
            defaultValue={defaultValues.weightage}
            className={cn("rounded-xl", err("weightage") && "border-red-400")}
          />
          {err("weightage") && <p className="text-xs text-red-500">{err("weightage")}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <a href="/employee/goals">
          <Button id="goal-form-cancel" type="button" variant="outline" className="rounded-xl">
            Cancel
          </Button>
        </a>
      </div>
    </form>
  );
}
