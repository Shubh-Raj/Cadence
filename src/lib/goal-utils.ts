// Non-async goal constants — safe to import from both server and client components.
// These are extracted from goal.actions.ts because "use server" files can only
// export async functions in Next.js 16.

export const THRUST_AREAS = [
  "Business Growth",
  "Customer Excellence",
  "Operational Efficiency",
  "People & Culture",
  "Innovation",
  "Quality & Compliance",
  "Cost Optimisation",
  "Safety & ESG",
] as const;

export type ThrustArea = (typeof THRUST_AREAS)[number];

export const MAX_GOALS = 8;
export const MIN_WEIGHTAGE = 10;
