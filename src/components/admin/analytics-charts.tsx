"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

// ── Submission bar chart ───────────────────────────────────────────────────────

type DeptData = {
  dept: string;
  submitted: number;
  approved: number;
  total: number;
};

export function SubmissionBarChart({ data }: { data: DeptData[] }) {
  const chartData = data.map((d) => ({
    name: d.dept.length > 14 ? d.dept.slice(0, 13) + "…" : d.dept,
    Submitted: d.submitted,
    Approved: d.approved,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barGap={4} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 270)" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Submitted" fill="oklch(0.55 0.26 270)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Approved" fill="oklch(0.62 0.20 155)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Thrust area pie chart ──────────────────────────────────────────────────────

type ThrustData = { name: string; value: number };

const PIE_COLOURS = [
  "oklch(0.55 0.26 270)",
  "oklch(0.62 0.20 155)",
  "oklch(0.65 0.20 45)",
  "oklch(0.60 0.22 330)",
  "oklch(0.58 0.24 200)",
  "oklch(0.68 0.18 90)",
  "oklch(0.52 0.28 300)",
  "oklch(0.70 0.16 20)",
];

export function ThrustAreaPieChart({ data }: { data: ThrustData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={40}
          dataKey="value"
          label={({ name, percent }) =>
            `${(name ?? "").split(" ")[0]} ${Math.round((percent ?? 0) * 100)}%`
          }
          labelLine={false}
          fontSize={11}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Progress score line chart (per period) ────────────────────────────────────

type PeriodScore = { period: string; avgScore: number };

export function ProgressLineChart({ data }: { data: PeriodScore[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 270)" />
        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
        <Tooltip formatter={(v) => `${typeof v === 'number' ? v : 0}%`} />
        <Line
          type="monotone"
          dataKey="avgScore"
          name="Avg Score"
          stroke="oklch(0.55 0.26 270)"
          strokeWidth={2}
          dot={{ fill: "oklch(0.55 0.26 270)", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Manager effectiveness grouped bar chart ───────────────────────────────────

type ManagerMetric = {
  name: string;
  "Submission %": number;
  "Approval %": number;
  "Comment Rate %": number;
};

export function ManagerEffectivenessChart({ data }: { data: ManagerMetric[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={3} barSize={16}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 270)" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
        <Tooltip formatter={(v) => `${typeof v === "number" ? v : 0}%`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Submission %" fill="oklch(0.55 0.26 270)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Approval %" fill="oklch(0.62 0.20 155)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Comment Rate %" fill="oklch(0.65 0.20 45)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
