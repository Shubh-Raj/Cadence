"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addManagerCommentAction } from "@/lib/actions/checkin.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Check } from "lucide-react";

type Props = {
  checkInId: string;
  existingComment?: string;
};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button
      id="comment-submit-btn"
      type="submit"
      disabled={pending}
      variant="outline"
      size="sm"
      className="rounded-lg text-xs gap-1.5"
    >
      <MessageSquare className="w-3 h-3" />
      {pending ? "Saving…" : "Save Comment"}
    </Button>
  );
}

export function ManagerCommentForm({ checkInId, existingComment }: Props) {
  const boundAction = addManagerCommentAction.bind(null, checkInId);
  const [state, formAction] = useActionState(boundAction, undefined);

  if (state?.success) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600">
        <Check className="w-3 h-3" /> Comment saved
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <Textarea
        id={`comment-${checkInId}`}
        name="comment"
        rows={2}
        placeholder="Add structured check-in comment…"
        defaultValue={existingComment}
        className="rounded-xl text-xs resize-none"
      />
      {state?.errors?.comment?.[0] && (
        <p className="text-xs text-red-500">{state.errors.comment[0]}</p>
      )}
      <SubmitBtn />
    </form>
  );
}
