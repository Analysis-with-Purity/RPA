export type MessageAuthorRole = "customer" | "agent" | "system";

export interface MessageAuthor {
  id: string;
  name: string;
  role: MessageAuthorRole;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  ticketId: string;
  author: MessageAuthor;
  body: string;
  attachmentIds: string[];
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
}
