import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { AssistanceGrade, TemplateStage } from "@/lib/types";
import { gradeToApproxPercent } from "@/lib/assistance";

const grades: AssistanceGrade[] = ["none", "light", "moderate", "heavy", "full"];

const gradeLabels: Record<AssistanceGrade, string> = {
  none: "None",
  light: "Light",
  moderate: "Moderate",
  heavy: "Heavy",
  full: "Full"
};

type AssistanceMeterProps = {
  global: { human: number; ai: number };
  stages: TemplateStage[];
  stageGrades: Record<string, AssistanceGrade>;
  onChangeGlobal: (next: { human: number; ai: number }) => void;
  onChangeStage: (key: string, grade: AssistanceGrade) => void;
};

export default function AssistanceMeter({
  global,
  stages,
  stageGrades,
  onChangeGlobal,
  onChangeStage
}: AssistanceMeterProps) {
  const [showStages, setShowStages] = useState(false);
  const handleRange = (value: number) => {
    const ai = Math.min(100, Math.max(0, value));
    onChangeGlobal({ human: 100 - ai, ai });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold">Assistance Meter</h3>
            <p className="text-sm text-muted">Self-reported contribution split.</p>
          </div>
          <div className="dc-stamp bg-paper text-fg">Self-Reported</div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Human {global.human}%</span>
            <span>AI {global.ai}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={global.ai}
            onChange={(event) => handleRange(Number(event.target.value))}
            className="mt-3 w-full"
          />
          <div className="mt-4 flex gap-3 text-xs text-muted">
            <span>0% AI</span>
            <span className="ml-auto">100% AI</span>
          </div>
        </div>
        <div className="mt-6">
          <Button type="button" variant="ghost" onClick={() => setShowStages((s) => !s)}>
            {showStages ? "Hide per-stage breakdown" : "Advanced: per-stage breakdown"}
          </Button>
        </div>
      </Card>

      {showStages && stages.length ? (
        <Card className="p-6">
          <h4 className="text-sm font-extrabold uppercase tracking-widest text-muted">Per-stage grades</h4>
          <div className="mt-4 space-y-4">
            {stages.map((stage) => (
              <div key={stage.key} className="rounded-dc0 border-2 border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{stage.label}</p>
                    {stage.description ? (
                      <p className="text-xs text-muted">{stage.description}</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">
                    Approx AI: {gradeToApproxPercent(stageGrades[stage.key] || "none")}%
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {grades.map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => onChangeStage(stage.key, grade)}
                      className={
                        stageGrades[stage.key] === grade
                          ? "dc-button dc-button-primary"
                          : "dc-button dc-button-secondary"
                      }
                    >
                      {gradeLabels[grade]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
