import { CheckIcon, ClockIcon } from "lucide-react";

import type { Message } from "@/lib/types";
import { formatRelativeTime, formatDateTime, cn } from "@/lib/utils";
import { getAttachmentsByIds } from "@/lib/mock-data/attachments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AttachmentList } from "@/components/tickets/AttachmentList";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MessageBubble({ message }: { message: Message }) {
  if (message.author.role === "system") {
    return (
      <div className="flex items-center justify-center py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.body} &middot; {formatRelativeTime(message.createdAt)}
        </span>
      </div>
    );
  }

  const isCustomer = message.author.role === "customer";
  const attachments = getAttachmentsByIds(message.attachmentIds);

  return (
    <div className={cn("flex gap-3", isCustomer ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="mt-0.5 size-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isCustomer ? "bg-primary text-primary-foreground" : "bg-primary-muted text-primary"
          )}
        >
          {initials(message.author.name)}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[85%] flex-col gap-1.5 sm:max-w-[70%]", isCustomer && "items-end")}>
        <div className={cn("flex items-baseline gap-2", isCustomer && "flex-row-reverse")}>
          <span className="text-sm font-medium">{message.author.name}</span>
          <span
            title={formatDateTime(message.createdAt)}
            className="text-xs text-muted-foreground"
          >
            {formatRelativeTime(message.createdAt)}
          </span>
        </div>

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
            isCustomer
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-muted text-foreground",
            message.pending && "opacity-60"
          )}
        >
          {message.body}
        </div>

        {attachments.length > 0 && <AttachmentList attachments={attachments} />}

        {message.pending && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ClockIcon className="size-3" /> Sending&hellip;
          </span>
        )}
        {message.failed && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            Failed to send
          </span>
        )}
        {!message.pending && !message.failed && isCustomer && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckIcon className="size-3" /> Sent
          </span>
        )}
      </div>
    </div>
  );
}
