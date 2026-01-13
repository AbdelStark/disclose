import { AssistanceGrade } from "@/lib/types";

export const assistanceGradePercent: Record<AssistanceGrade, number> = {
  none: 0,
  light: 10,
  moderate: 30,
  heavy: 60,
  full: 90
};

export function gradeToApproxPercent(grade: AssistanceGrade): number {
  return assistanceGradePercent[grade];
}
