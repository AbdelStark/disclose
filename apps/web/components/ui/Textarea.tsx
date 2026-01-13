import { TextareaHTMLAttributes } from "react";
import clsx from "clsx";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={clsx("dc-input", "min-h-[120px]", className)} {...props} />;
}
