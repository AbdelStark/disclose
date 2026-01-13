import { HTMLAttributes } from "react";
import clsx from "clsx";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
};

export default function Card({ hoverable, className, ...props }: CardProps) {
  return (
    <div
      className={clsx("dc-card", hoverable && "dc-card-hover", className)}
      {...props}
    />
  );
}
