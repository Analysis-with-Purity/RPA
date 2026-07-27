"use client";

import { use } from "react";
import { SearchXIcon } from "lucide-react";

import { useTicket } from "@/lib/query/useTicket";
import { useTicketMessages } from "@/lib/query/useTicketMessages";
import { useTicketActivity } from "@/lib/query/useTicketActivity";
import { getAttachmentsByIds } from "@/lib/mock-data/attachments";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketDetailHeader } from "@/components/tickets/TicketDetailHeader";
import { TicketStepper } from "@/components/tickets/TicketStepper";
import { MessageThread } from "@/components/tickets/MessageThread";
import { MessageThreadSkeleton } from "@/components/tickets/MessageThreadSkeleton";
import { ReplyBox } from "@/components/tickets/ReplyBox";
import { ActivityTimeline } from "@/components/tickets/ActivityTimeline";
import { AttachmentList } from "@/components/tickets/AttachmentList";
import { AgentAssignmentCard } from "@/components/tickets/AgentAssignmentCard";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = use(params);

  const ticketQuery = useTicket(ticketId);
  const messagesQuery = useTicketMessages(ticketId);
  const activityQuery = useTicketActivity(ticketId);

  if (ticketQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (ticketQuery.isError) {
    return <ErrorState onRetry={() => ticketQuery.refetch()} />;
  }

  if (!ticketQuery.data) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="Ticket not found"
        description="This ticket may have been removed, or the link is incorrect."
      />
    );
  }

  const ticket = ticketQuery.data;
  const attachments = getAttachmentsByIds(ticket.attachmentIds);

  return (
    <div className="space-y-6">
      <TicketDetailHeader ticket={ticket} />

      <Card>
        <CardContent className="py-2">
          <TicketStepper status={ticket.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="conversation">
                <TabsList>
                  <TabsTrigger value="conversation">Conversation</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="conversation" className="space-y-4 pt-4">
                  {messagesQuery.isLoading && <MessageThreadSkeleton />}
                  {messagesQuery.isError && <ErrorState onRetry={() => messagesQuery.refetch()} />}
                  {messagesQuery.data && <MessageThread messages={messagesQuery.data} />}
                  <ReplyBox ticketId={ticket.id} />
                </TabsContent>
                <TabsContent value="activity" className="pt-4">
                  {activityQuery.isLoading && <Skeleton className="h-40 w-full" />}
                  {activityQuery.isError && <ErrorState onRetry={() => activityQuery.refetch()} />}
                  {activityQuery.data && <ActivityTimeline events={activityQuery.data} />}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assigned agent</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentAssignmentCard agentId={ticket.assignedAgentId} />
            </CardContent>
          </Card>

          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentList attachments={attachments} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {ticket.description}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
