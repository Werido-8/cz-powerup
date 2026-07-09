import { useCallback, useRef, useState, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function KbDragUploadOverlay({
  children,
  onFiles,
  disabled,
  className,
}: {
  children: ReactNode;
  onFiles?: (files: FileList) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const depthRef = useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled || !onFiles) return;
      depthRef.current += 1;
      if (e.dataTransfer.types.includes("Files")) setDragging(true);
    },
    [disabled, onFiles],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled || !onFiles) return;
      depthRef.current -= 1;
      if (depthRef.current <= 0) {
        depthRef.current = 0;
        setDragging(false);
      }
    },
    [disabled, onFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      depthRef.current = 0;
      setDragging(false);
      if (disabled || !onFiles || !e.dataTransfer.files.length) return;
      onFiles(e.dataTransfer.files);
    },
    [disabled, onFiles],
  );

  return (
    <div
      className={cn("relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {dragging && onFiles && !disabled && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[12px] border-2 border-dashed border-kb-primary/50 bg-kb-primary/8 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kb-primary/15 text-kb-primary">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-[14px] font-medium text-kb-heading">松开鼠标上传文件</p>
            <p className="text-[12px] text-kb-muted">支持 PDF、Word、Excel、PPT 等格式</p>
          </div>
        </div>
      )}
    </div>
  );
}
