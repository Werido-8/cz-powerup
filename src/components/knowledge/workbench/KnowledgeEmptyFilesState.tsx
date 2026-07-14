import { Upload } from "lucide-react";
import emptyFilesIllustration from "@/assets/knowledge-empty-files.png";
import { KbButton } from "@/components/knowledge/ui";
import { cn } from "@/lib/utils";

export function KnowledgeEmptyFilesState({
  canUpload,
  onUpload,
  className,
}: {
  canUpload?: boolean;
  onUpload?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[360px] flex-col items-center justify-center px-6 py-10",
        className,
      )}
    >
      <div className="relative flex w-full max-w-[340px] flex-col items-center">
        <img
          src={emptyFilesIllustration}
          alt=""
          aria-hidden
          className="pointer-events-none h-auto w-full select-none"
          draggable={false}
        />

        {canUpload && onUpload ? (
          <div className="absolute left-1/2 top-[92%] -translate-x-1/2 -translate-y-1/2">
            <KbButton
              size="md"
              onClick={onUpload}
              className="min-w-[112px] shadow-[0_8px_20px_rgba(52,155,172,0.28)]"
            >
              <Upload className="h-3.5 w-3.5 stroke-[1.8]" />
              上传文件
            </KbButton>
          </div>
        ) : null}
      </div>

      <div className="mt-5 max-w-[330px] text-center">
        <p className="text-[15px] font-semibold text-kb-heading">暂无文件</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-kb-muted">
          {canUpload
            ? "点击上方按钮上传第一份资料，或将文件拖拽到此区域。"
            : "该知识库当前还没有文件。"}
        </p>
      </div>
    </div>
  );
}
