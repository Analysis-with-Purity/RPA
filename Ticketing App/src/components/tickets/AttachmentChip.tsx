import { FileIcon, ImageIcon } from "lucide-react";

import type { Attachment } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

export function AttachmentChip({ attachment }: { attachment: Attachment }) {
  const Icon = attachment.mimeType.startsWith("image/") ? ImageIcon : FileIcon;

  return (
    <a
      href={attachment.url}
      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatBytes(attachment.fileSizeBytes)}
      </span>
    </a>
  );
}
