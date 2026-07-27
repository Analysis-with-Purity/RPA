import type { Attachment } from "@/lib/types";

export const ATTACHMENTS: Attachment[] = [
  {
    id: "ATT-1",
    fileName: "duplicate-charges-screenshot.png",
    fileSizeBytes: 482_000,
    mimeType: "image/png",
    url: "#",
    uploadedAt: new Date().toISOString(),
  },
];

export function getAttachmentsByIds(ids: string[]): Attachment[] {
  return ids
    .map((id) => ATTACHMENTS.find((a) => a.id === id))
    .filter((a): a is Attachment => Boolean(a));
}
