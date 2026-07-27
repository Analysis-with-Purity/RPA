export type ActivityEventType =
  | "created"
  | "status_changed"
  | "assigned"
  | "priority_changed"
  | "reopened";

export interface ActivityActor {
  id: string;
  name: string;
  role: "customer" | "agent" | "system";
}

export interface ActivityEvent {
  id: string;
  ticketId: string;
  type: ActivityEventType;
  actor: ActivityActor;
  fromValue?: string;
  toValue?: string;
  createdAt: string;
}
