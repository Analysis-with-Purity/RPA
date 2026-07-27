"use client";

import { useState } from "react";
import {
  BotIcon,
  HeadsetIcon,
  LockIcon,
  PaperclipIcon,
  SendIcon,
  UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAddComment, useAgentSession, useTicketComments } from "@/lib/agent-api/hooks";
import type { CommentDto, TicketDto } from "@/lib/agent-api/types";

const AUTHOR_ICON = {
  Customer: UserIcon,
  Agent: HeadsetIcon,
  System: BotIcon,
} as const;

function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(/[\s.@]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TicketThread({ ticket }: { ticket: TicketDto }) {
  const { data, isLoading } = useTicketComments(ticket.ticketId);
  const comments = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">
          Conversation
          {data && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {data.total} {data.total === 1 ? "message" : "messages"}
            </span>
          )}
        </CardTitle>
        <Badge variant="outline" className="text-[10px]">
          <LockIcon className="size-3" />
          Includes internal notes
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No replies yet. The description above is all the customer has told us.
          </p>
        ) : (
          <ol className="space-y-4">
            {comments.map((comment) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
          </ol>
        )}

        <ReplyBox ticket={ticket} />
      </CardContent>
    </Card>
  );
}

function CommentRow({ comment }: { comment: CommentDto }) {
  const Icon = AUTHOR_ICON[comment.authorType] ?? UserIcon;
  const isSystem = comment.authorType === "System";

  return (
    <li className="flex gap-3">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-[10px]",
            comment.isInternal
              ? "bg-warning-muted text-warning"
              : comment.authorType === "Agent"
                ? "bg-primary text-primary-foreground"
                : isSystem
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary-muted text-primary",
          )}
        >
          {isSystem ? <Icon className="size-3.5" /> : initials(comment.author)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium">{comment.author}</span>
          <span className="text-muted-foreground">{comment.authorType}</span>
          {comment.isInternal && (
            <Badge variant="warning" className="text-[10px]">
              <LockIcon className="size-3" />
              Internal
            </Badge>
          )}
          {comment.channel && (
            <span className="text-muted-foreground">via {comment.channel}</span>
          )}
          <span className="ml-auto text-muted-foreground">
            {formatTimestamp(comment.postedAt)}
          </span>
        </div>

        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap",
            comment.isInternal
              ? "border-warning/30 bg-warning-muted/50"
              : isSystem
                ? "border-dashed bg-muted/40 text-muted-foreground"
                : "bg-card",
          )}
        >
          {comment.body}
        </div>

        {comment.attachmentReferences.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {comment.attachmentReferences.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-primary"
              >
                <PaperclipIcon className="size-3" />
                {url.split("/").pop() ?? "attachment"}
              </a>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * One box, two destinations.
 *
 * A customer-visible agent reply is what stops the first-response SLA clock server-side, so
 * the internal toggle is deliberately prominent — posting a note when you meant to reply
 * leaves the customer waiting and the clock running.
 */
function ReplyBox({ ticket }: { ticket: TicketDto }) {
  const { session } = useAgentSession();
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const addComment = useAddComment(ticket.ticketId);

  const canPost = body.trim().length > 0 && !addComment.isPending;
  const cancelled = ticket.status === "Cancelled";

  async function submit() {
    if (!canPost || !session) return;
    await addComment.mutateAsync({
      body: body.trim(),
      authorType: "Agent",
      author: session.name,
      authorEmail: session.subject,
      isInternal,
      channel: "Web",
    });
    setBody("");
  }

  if (cancelled) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">
        This ticket was cancelled and can no longer receive replies.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-3 transition-colors",
        isInternal && "border-warning/40 bg-warning-muted/30",
      )}
    >
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={10_000}
        placeholder={
          isInternal
            ? "Internal note — the customer will never see this."
            : "Reply to the customer…"
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="internal-toggle"
            checked={isInternal}
            onCheckedChange={setIsInternal}
          />
          <Label
            htmlFor="internal-toggle"
            className={cn("text-sm", isInternal && "text-warning")}
          >
            <LockIcon className="size-3.5" />
            Internal note
          </Label>
        </div>

        <span className="text-xs text-muted-foreground">
          {isInternal
            ? "Visible to agents only."
            : "Sent to the customer, and stops the first-response clock."}
        </span>

        <Button
          className="ml-auto gap-2"
          size="sm"
          disabled={!canPost}
          onClick={() => void submit()}
        >
          <SendIcon className="size-4" />
          {addComment.isPending ? "Posting…" : isInternal ? "Add note" : "Send reply"}
        </Button>
      </div>
    </div>
  );
}
