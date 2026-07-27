import type { Attachment } from "@/lib/types";
import { AttachmentChip } from "@/components/tickets/AttachmentChip";

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <AttachmentChip key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}
