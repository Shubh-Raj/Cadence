"use client";

import { useState, useTransition } from "react";
import { pushSharedGoalAction } from "@/lib/actions/admin.actions";
import { THRUST_AREAS } from "@/lib/actions/goal.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Users } from "lucide-react";
import { toast } from "sonner";

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string | null;
};

const UOM_OPTIONS = [
  { value: "MIN", label: "Min — Higher is better (Revenue, Sales)" },
  { value: "MAX", label: "Max — Lower is better (TAT, Cost)" },
  { value: "TIMELINE", label: "Timeline — Date-based" },
  { value: "ZERO", label: "Zero-based — Zero = Success" },
];

export function PushSharedGoalForm({ employees }: { employees: Employee[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function toggleEmployee(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(employees.map((e) => e.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const data = {
      title: String(form.get("title")),
      description: String(form.get("description") ?? ""),
      thrustArea: String(form.get("thrustArea")) as (typeof THRUST_AREAS)[number],
      uomType: String(form.get("uomType")) as "MIN" | "MAX" | "TIMELINE" | "ZERO",
      targetValue: parseFloat(String(form.get("targetValue"))),
      weightage: parseFloat(String(form.get("weightage"))),
      employeeIds: Array.from(selected),
    };

    if (selected.size === 0) {
      toast.error("Select at least one employee.");
      return;
    }

    startTransition(async () => {
      const result = await pushSharedGoalAction(data);
      if (result?.success) {
        setSuccess(true);
        toast.success(`Shared goal pushed to ${selected.size} employee(s).`);
      } else if (result?.message) {
        toast.error(result.message);
      }
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-10 gap-3 text-center">
        <CheckCircle className="w-10 h-10 text-emerald-500" />
        <p className="font-heading font-semibold text-foreground">
          Shared goal pushed successfully
        </p>
        <p className="text-sm text-muted-foreground">
          It has been added to the draft goal sheets of the selected employees.
        </p>
        <Button
          id="push-another-btn"
          variant="outline"
          className="rounded-xl mt-2"
          onClick={() => {
            setSuccess(false);
            setSelected(new Set());
          }}
        >
          Push Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Goal details */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Goal Title *</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="e.g. Reduce operational costs by 10%"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            className="rounded-xl resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Thrust Area *</Label>
            <Select name="thrustArea" required>
              <SelectTrigger id="thrustArea" className="rounded-xl">
                <SelectValue placeholder="Select thrust area" />
              </SelectTrigger>
              <SelectContent>
                {THRUST_AREAS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Unit of Measurement *</Label>
            <Select name="uomType" required>
              <SelectTrigger id="uomType" className="rounded-xl">
                <SelectValue placeholder="Select UoM" />
              </SelectTrigger>
              <SelectContent>
                {UOM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="targetValue">Target Value *</Label>
            <Input
              id="targetValue"
              name="targetValue"
              type="number"
              step="any"
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="weightage">Weightage (%) *</Label>
            <Input
              id="weightage"
              name="weightage"
              type="number"
              min={10}
              max={100}
              step={5}
              required
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Employee selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Select Employees ({selected.size} selected)
          </Label>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={selectAll} className="text-primary hover:underline">
              All
            </button>
            <span className="text-muted-foreground">·</span>
            <button type="button" onClick={clearAll} className="text-muted-foreground hover:underline">
              Clear
            </button>
          </div>
        </div>

        <div className="border border-border rounded-xl divide-y divide-border max-h-60 overflow-y-auto">
          {employees.map((emp) => (
            <label
              key={emp.id}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(emp.id)}
                onChange={() => toggleEmployee(emp.id)}
                className="rounded border-border accent-primary"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{emp.name}</p>
                <p className="text-xs text-muted-foreground">{emp.email} · {emp.department ?? "—"}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button
        id="push-shared-goal-btn"
        type="submit"
        disabled={isPending}
        className="gradient-brand text-white rounded-xl shadow-lg shadow-primary/20 w-full sm:w-auto"
      >
        {isPending ? "Pushing…" : `Push to ${selected.size || "selected"} employees`}
      </Button>
    </form>
  );
}
