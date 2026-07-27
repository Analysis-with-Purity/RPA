import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[1400px] px-6 md:px-10", className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="text-[11px] uppercase tracking-[0.3em] text-gold">{eyebrow}</span>
      )}
      <h2 className="font-serif text-3xl md:text-4xl text-ink">{title}</h2>
      {subtitle && (
        <p className="max-w-xl text-sm md:text-base text-ink/60 leading-relaxed">{subtitle}</p>
      )}
      <span className="mt-1 h-px w-16 bg-gold" />
    </div>
  );
}
