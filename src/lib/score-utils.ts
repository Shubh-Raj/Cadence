// Non-async score computation utilities — extracted from checkin.actions.ts
// because "use server" files can only export async functions in Next.js 16.

import { CheckInPeriod, UoMType } from "@prisma/client";

export function computeScore(
  uomType: UoMType,
  targetValue: number,
  actualValue: number
): number {
  if (actualValue == null || actualValue === undefined) return 0;
  switch (uomType) {
    case UoMType.MIN:
      return Math.min(actualValue / targetValue, 1);
    case UoMType.MAX:
      return actualValue === 0 ? 0 : Math.min(targetValue / actualValue, 1);
    case UoMType.TIMELINE:
      return actualValue <= targetValue ? 1 : 0;
    case UoMType.ZERO:
      return actualValue === 0 ? 1 : 0;
    default:
      return 0;
  }
}

export function getCurrentPeriod(): CheckInPeriod | null {
  const month = new Date().getMonth() + 1;
  if (month === 7 || month === 8) return CheckInPeriod.Q1;
  if (month >= 9 && month <= 11) return CheckInPeriod.Q2;
  if (month >= 12 || month <= 2) return CheckInPeriod.Q3;
  if (month >= 3 && month <= 4) return CheckInPeriod.Q4;
  return null;
}
