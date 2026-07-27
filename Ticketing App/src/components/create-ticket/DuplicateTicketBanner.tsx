"use client";

import Link from "next/link";
import { CopyIcon } from "lucide-react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDuplicateDetection } from "@/lib/query/useAiMock";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import type { TicketStatus } from "@/lib/types";

interface DuplicateTicketBannerProps {
  subject: string;
  description: string;
}

export function DuplicateTicketBanner({ subject, description }: DuplicateTicketBannerProps) {
  const debouncedSubject = useDebouncedValue(subject, 500);
  const debouncedDescription = useDebouncedValue(description, 500);
  const duplicatesQuery = useDuplicateDetection(debouncedSubject, debouncedDescription, true);

  const matches = duplicatesQuery.data;
  if (duplicatesQuery.isFetching || !matches || matches.length === 0) {
    return null;
  }

  return (
    <Alert variant="warning">
      <CopyIcon />
      <AlertTitle>Possibly already reported</AlertTitle>
      <AlertDescription className="w-full">
        <p>These existing tickets look similar &mdash; check them before submitting a new one:</p>
        <ul className="mt-1 w-full space-y-1">
          {matches.map((match) => (
            <li key={match.ticketId}>
              <Link
                href={`/tickets/${match.ticketId}`}
                target="_blank"
                className="flex items-center justify-between gap-2 rounded-md border bg-background/60 px-2.5 py-1.5 text-xs transition-colors hover:border-warning/50"
              >
                <span className="min-w-0 truncate">
                  <span className="font-mono text-muted-foreground">{match.ticketId}</span>{" "}
                  {match.subject}
                </span>
                <StatusBadge status={match.status as TicketStatus} />
              </Link>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
