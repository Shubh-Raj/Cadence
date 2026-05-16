"use client";

import { cn } from "@/lib/utils";

type Props = {
  goals: { weightage: number }[];
  className?: string;
};

export function WeightageBar({ goals, className }: Props) {
  const total = goals.reduce((s, g) => s + g.weightage, 0);
  const pct = Math.min(total, 100);
  const over = total > 100;
  const exact = Math.round(total) === 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">Weightage allocation</span>
        <span
          className={cn(
            "font-bold font-heading tabular-nums",
            exact ? "text-emerald-600" : over ? "text-red-500" : "text-amber-600"
          )}
        >
          {total}%{" "}
          <span className="font-normal text-muted-foreground">/ 100%</span>
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            exact ? "gradient-brand" : over ? "bg-red-500" : "bg-amber-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!exact && (
        <p className={cn("text-xs", over ? "text-red-500" : "text-amber-600")}>
          {over
            ? `${total - 100}% over limit — reduce weightage on some goals`
            : `${100 - total}% remaining — adjust goals to reach 100%`}
        </p>
      )}
      {exact && (
        <p className="text-xs text-emerald-600">
          ✓ Weightage balanced — ready to submit
        </p>
      )}
    </div>
  );
}
