"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { rejectGoalSheetAction } from "@/lib/actions/approval.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { XCircle } from "lucide-react";

type Props = { sheetId: string };

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button
      id="reject-sheet-btn"
      type="submit"
      disabled={pending}
      className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 w-full"
    >
      <XCircle className="w-4 h-4" />
      {pending ? "Sending…" : "Return for Rework"}
    </Button>
  );
}

export function RejectForm({ sheetId }: Props) {
  const boundAction = rejectGoalSheetAction.bind(null, sheetId);
  const [state, formAction] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <Textarea
        id="reject-note"
        name="note"
        rows={3}
        placeholder="e.g. Weightage for Business Growth goal should be at least 20%…"
        className="rounded-xl text-sm resize-none"
      />
      {state?.errors?.note?.[0] && (
        <p className="text-xs text-red-500">{state.errors.note[0]}</p>
      )}
      {state?.message && (
        <p className="text-xs text-red-500">{state.message}</p>
      )}
      <SubmitBtn />
    </form>
  );
}
