import { CheckIcon } from "lucide-react";

import type { TicketStatus } from "@/lib/types";
import { TICKET_STEPPER_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TicketStepperProps {
  status: TicketStatus;
  variant?: "full" | "compact";
  className?: string;
}

type StepState = "complete" | "current" | "upcoming";

function stepState(index: number, currentIndex: number): StepState {
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export function TicketStepper({ status, variant = "full", className }: TicketStepperProps) {
  const currentIndex = TICKET_STEPPER_STEPS.findIndex((s) => s.status === status);
  const currentLabel = TICKET_STEPPER_STEPS[currentIndex]?.label ?? status;

  if (variant === "compact") {
    return (
      <div
        className={cn("flex items-center gap-1", className)}
        role="img"
        aria-label={`Status: ${currentLabel}`}
      >
        {TICKET_STEPPER_STEPS.map((step, index) => {
          const state = stepState(index, currentIndex);
          return (
            <span
              key={step.status}
              className={cn(
                "h-1.5 w-4 rounded-full transition-colors",
                state === "complete" && "bg-primary/50",
                state === "current" && "bg-primary",
                state === "upcoming" && "bg-muted"
              )}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("min-w-[36rem] overflow-x-auto sm:min-w-0", className)}>
      <div className="flex items-start">
        {TICKET_STEPPER_STEPS.map((step, index) => {
          const state = stepState(index, currentIndex);
          const isLast = index === TICKET_STEPPER_STEPS.length - 1;

          return (
            <div key={step.status} className="flex flex-1 flex-col items-center last:flex-none">
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium",
                    state === "complete" && "border-primary bg-primary text-primary-foreground",
                    // Current is hollow rather than solid — with gold gone, fill vs outline
                    // is what separates "done" from "here".
                    state === "current" &&
                      "border-primary bg-background text-primary ring-4 ring-primary/15",
                    state === "upcoming" && "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {state === "complete" ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <span
                      className={cn(
                        state === "current" && "relative flex size-2 rounded-full bg-primary"
                      )}
                    >
                      {state === "current" && (
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                      )}
                      {state === "upcoming" && index + 1}
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn("h-0.5 flex-1", state === "complete" ? "bg-primary" : "bg-muted")}
                  />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-center text-xs",
                  state === "current" ? "font-medium text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
