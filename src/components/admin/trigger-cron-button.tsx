"use client";

import { useState } from "react";
import { RefreshCw, Play } from "lucide-react";
import { triggerCronAction } from "@/lib/actions/admin.actions";

export function TriggerCronButton({ name, path }: { name: string; path: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);

  async function handleTrigger() {
    setState("loading");
    try {
      const res = await triggerCronAction(path);
      if (res.success) {
        setResult(`Triggered: ${res.data.triggered ?? res.data.remindersSent ?? "Success"}`);
        setState("done");
      } else {
        setResult(res.data.error ?? "Error running cron");
        setState("error");
      }
    } catch {
      setResult("Network error");
      setState("error");
    }
    setTimeout(() => {
      setState("idle");
      setResult(null);
    }, 5000);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleTrigger}
        disabled={state === "loading"}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-xs font-medium text-foreground disabled:opacity-50"
      >
        {state === "loading" ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
        Run Now
      </button>
      {result && (
        <span className={`text-xs font-medium ${state === "done" ? "text-emerald-500" : "text-red-500"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
