import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export default function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "dc-button",
        variant === "primary" && "dc-button-primary",
        variant === "secondary" && "dc-button-secondary",
        variant === "ghost" && "dc-button-ghost",
        className
      )}
      {...props}
    />
  );
}
