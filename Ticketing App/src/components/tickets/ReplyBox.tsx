"use client";

import { useState } from "react";
import { SendIcon } from "lucide-react";

import { useAddReply } from "@/lib/query/useAddReply";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ReplyBox({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState("");
  const addReply = useAddReply(ticketId);

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || addReply.isPending) return;
    addReply.mutate(trimmed);
    setBody("");
  }

  return (
    <div className="space-y-2 rounded-xl border bg-card p-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Write a reply... (Enter to send, Shift+Enter for a new line)"
        className="min-h-20 resize-none border-none px-1 shadow-none focus-visible:ring-0"
      />
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={!body.trim() || addReply.isPending} size="sm">
          <SendIcon /> {addReply.isPending ? "Sending..." : "Send reply"}
        </Button>
      </div>
    </div>
  );
}
