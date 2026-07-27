import { UserIcon } from "lucide-react";

import { getAgentById } from "@/lib/mock-data/agents";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AgentAssignmentCard({ agentId }: { agentId?: string }) {
  const agent = getAgentById(agentId);

  if (!agent) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-muted">
          <UserIcon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Unassigned</p>
          <p className="text-xs text-muted-foreground">Waiting to be picked up</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-primary text-primary-foreground">
          {initials(agent.name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{agent.name}</p>
        <p className="text-xs text-muted-foreground">{agent.title}</p>
      </div>
    </div>
  );
}
