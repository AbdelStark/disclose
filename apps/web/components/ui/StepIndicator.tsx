import clsx from "clsx";

type StepIndicatorProps = {
  steps: string[];
  current: number;
};

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step, index) => (
        <div
          key={step}
          className={clsx(
            "dc-badge",
            index === current ? "bg-accent text-paper" : "bg-paper text-fg"
          )}
        >
          {index + 1}. {step}
        </div>
      ))}
    </div>
  );
}
