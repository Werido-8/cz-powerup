import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { kbRadius } from "@/lib/knowledge/tokens";
import { KbButton } from "./KbButtons";

export function KbUploadCard({
  title = "拖拽文件到此处，或点击选择",
  hint = "支持 PDF、Word、Excel、PPT 等格式",
  onUpload,
  compact = false,
  className,
}: {
  title?: string;
  hint?: string;
  onUpload?: (files: FileList) => void;
  compact?: boolean;
  className?: string;
}) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      if (onUpload) {
        onUpload(files);
      } else {
        toast.success(`已选择 ${files.length} 个文件，进入审批流程`);
      }
    },
    [onUpload],
  );

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-4 border border-dashed border-kb-border bg-card transition-colors duration-150",
        kbRadius.sm,
        compact ? "min-h-[88px] max-h-[120px] px-4 py-3" : "min-h-[120px] px-5 py-4",
        dragging && "border-primary/50 bg-primary-soft/30",
        className,
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-primary-soft text-primary">
        <Upload className="h-5 w-5 stroke-[1.8]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-kb-heading">{title}</div>
        <div className="mt-0.5 text-[11.5px] text-kb-muted">{hint}</div>
      </div>
      <KbButton variant="outline" size="sm" className="shrink-0 pointer-events-none">
        选择文件
      </KbButton>
    </label>
  );
}
