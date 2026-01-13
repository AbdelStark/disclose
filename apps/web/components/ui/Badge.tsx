import { HTMLAttributes } from "react";
import clsx from "clsx";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

export default function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  const toneClass =
    tone === "success"
      ? "bg-success text-paper"
      : tone === "warning"
        ? "bg-warning text-fg"
        : tone === "danger"
          ? "bg-danger text-paper"
          : tone === "info"
            ? "bg-info text-paper"
            : "bg-paper text-fg";

  return <span className={clsx("dc-badge", toneClass, className)} {...props} />;
}
