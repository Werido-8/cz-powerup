import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function DragUploadOverlay({ active, compact }: { active: boolean; compact?: boolean }) {
  if (!active) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-3 z-20 grid place-items-center rounded-[16px] border border-dashed border-[#349BAC] bg-[rgba(52,155,172,0.08)] backdrop-blur-[1px]",
        compact && "inset-2 rounded-[12px]",
      )}
    >
      <div className="flex flex-col items-center gap-3 rounded-[14px] border border-[#DCE8EA] bg-white px-8 py-6 text-center shadow-[0_8px_24px_rgba(31,52,64,0.08)]">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#EAF7F9] text-[#349BAC]">
          <UploadCloud className="h-6 w-6" />
        </span>
        <div className="text-[15px] font-semibold text-[#1F3440]">释放文件，上传到当前目录</div>
        <div className="text-[12px] text-[#607681]">上传后将按当前知识库权限进入解析或审批流程</div>
      </div>
    </div>
  );
}
