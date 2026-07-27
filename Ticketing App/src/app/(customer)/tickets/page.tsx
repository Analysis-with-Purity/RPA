"use client";

import Link from "next/link";
import { PlusIcon, TicketIcon } from "lucide-react";

import { useTicketFiltersStore } from "@/lib/store/ticket-filters-store";
import { useTickets } from "@/lib/query/useTickets";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { TicketListFilters } from "@/components/tickets/TicketListFilters";
import { TicketListRow } from "@/components/tickets/TicketListRow";
import { TicketListSkeleton } from "@/components/tickets/TicketListSkeleton";

export default function TicketsPage() {
  const { search, status, priority, departmentId, sort } = useTicketFiltersStore();
  const ticketsQuery = useTickets({ search, status, priority, departmentId, sort });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tickets"
        description="Every ticket you've submitted, in one place."
        actions={
          <Button asChild variant="default">
            <Link href="/tickets/new">
              <PlusIcon /> New ticket
            </Link>
          </Button>
        }
      />

      <TicketListFilters />

      {ticketsQuery.isLoading && <TicketListSkeleton />}

      {ticketsQuery.isError && (
        <ErrorState onRetry={() => ticketsQuery.refetch()} />
      )}

      {!ticketsQuery.isLoading && !ticketsQuery.isError && (
        <>
          {ticketsQuery.data && ticketsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {ticketsQuery.data.map((ticket) => (
                <TicketListRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TicketIcon}
              title="No tickets match your filters"
              description="Try adjusting your search or filters, or submit a new ticket."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/tickets/new">Create a ticket</Link>
                </Button>
              }
            />
          )}
        </>
      )}
    </div>
  );
}
