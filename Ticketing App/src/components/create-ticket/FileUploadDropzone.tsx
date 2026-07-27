"use client";

import { useRef, useState } from "react";
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";

import { formatBytes, cn } from "@/lib/utils";

export interface AttachmentMeta {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

interface FileUploadDropzoneProps {
  value: AttachmentMeta[];
  onChange: (files: AttachmentMeta[]) => void;
  max?: number;
}

export function FileUploadDropzone({ value, onChange, max = 5 }: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming: AttachmentMeta[] = Array.from(fileList)
      .slice(0, Math.max(0, max - value.length))
      .map((file) => ({
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
      }));
    if (incoming.length > 0) {
      onChange([...value, ...incoming]);
    }
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-input hover:bg-accent/40"
        )}
      >
        <UploadCloudIcon className="size-5 text-muted-foreground" />
        <p className="text-sm">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">Up to {max} files, 10MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((file, index) => (
            <li
              key={`${file.fileName}-${index}`}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.fileName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(file.fileSizeBytes)}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${file.fileName}`}
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
