import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn(
      "block text-[11px] uppercase tracking-[0.14em] text-ink/70 mb-2",
      className
    )}
    {...props}
  />
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/35",
        "focus:outline-none focus:border-royal transition-colors duration-200",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/35",
        "focus:outline-none focus:border-royal transition-colors duration-200",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
