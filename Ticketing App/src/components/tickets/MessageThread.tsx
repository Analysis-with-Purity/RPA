import type { Message } from "@/lib/types";
import { MessageBubble } from "@/components/tickets/MessageBubble";

export function MessageThread({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
