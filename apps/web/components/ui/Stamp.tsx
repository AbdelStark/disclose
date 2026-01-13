import { HTMLAttributes } from "react";
import clsx from "clsx";

type StampProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "self" | "timestamp" | "warning";
};

export default function Stamp({ tone = "self", className, ...props }: StampProps) {
  const toneClass =
    tone === "timestamp"
      ? "bg-stamp text-paper"
      : tone === "warning"
        ? "bg-warning text-fg"
        : "bg-paper text-fg";

  return <div className={clsx("dc-stamp", toneClass, className)} {...props} />;
}
