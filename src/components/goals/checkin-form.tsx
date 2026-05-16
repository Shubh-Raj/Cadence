"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckInPeriod } from "@prisma/client";
import { upsertCheckInAction } from "@/lib/actions/checkin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare } from "lucide-react";

type Props = {
  goalId: string;
  period: CheckInPeriod;
  defaultValues?: {
    actualValue?: number;
    status?: string;
    employeeNote?: string;
  };
  reviewerComment?: string;
};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button
      id="checkin-submit-btn"
      type="submit"
      disabled={pending}
      className="gradient-brand text-white rounded-xl shadow shadow-primary/20 text-sm"
    >
      {pending ? "Saving…" : "Save Check-in"}
    </Button>
  );
}

export function CheckInForm({ goalId, period, defaultValues = {}, reviewerComment }: Props) {
  const boundAction = upsertCheckInAction.bind(null, goalId, period);
  const [state, formAction] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <p className="text-xs text-red-500">{state.message}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Actual Value */}
        <div className="space-y-1.5">
          <Label htmlFor={`actual-${goalId}`} className="text-xs">Actual Achievement</Label>
          <Input
            id={`actual-${goalId}`}
            name="actualValue"
            type="number"
            step="any"
            placeholder="Enter actual value"
            defaultValue={defaultValues.actualValue}
            className="rounded-xl text-sm"
          />
          {(state?.errors as Record<string, string[]> | undefined)?.actualValue?.[0] && (
            <p className="text-xs text-red-500">{(state?.errors as Record<string, string[]>)?.actualValue?.[0]}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select name="status" defaultValue={defaultValues.status ?? "NOT_STARTED"}>
            <SelectTrigger id={`status-${goalId}`} className="rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="ON_TRACK">On Track</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit */}
        <div className="flex items-end">
          <SubmitBtn />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <Label htmlFor={`note-${goalId}`} className="text-xs">Your Note (optional)</Label>
        <Textarea
          id={`note-${goalId}`}
          name="employeeNote"
          rows={2}
          placeholder="Key activities, blockers, context…"
          defaultValue={defaultValues.employeeNote}
          className="rounded-xl text-sm resize-none"
        />
      </div>

      {/* Manager comment */}
      {reviewerComment && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
          <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Manager comment</p>
            <p className="text-sm text-foreground">{reviewerComment}</p>
          </div>
        </div>
      )}
    </form>
  );
}
