"use client";

import { useTransition, useState } from "react";
import { resolveEscalationAction } from "@/lib/actions/escalation.actions";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function ResolveEscalationButton({ escalationId }: { escalationId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 shrink-0">
        <Check className="w-3 h-3" /> Resolved
      </span>
    );
  }

  return (
    <Button
      id={`resolve-${escalationId}`}
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await resolveEscalationAction(escalationId);
          setDone(true);
        })
      }
      className="rounded-lg text-xs h-7 shrink-0 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
    >
      {isPending ? "Saving…" : "Mark Resolved"}
    </Button>
  );
}
