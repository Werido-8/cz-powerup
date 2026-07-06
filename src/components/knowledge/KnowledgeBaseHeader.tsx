import { FolderPlus, LockKeyhole, Search, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeBase, KnowledgeSortBy } from "@/lib/mock/knowledge-space";
import { canManageKnowledgeBase, canUploadToKnowledgeBase, getDepartmentById } from "@/lib/mock/knowledge-utils";
import { KnowledgeBaseSwitcher } from "./KnowledgeBaseSwitcher";

type KnowledgeBaseHeaderProps = {
  base: KnowledgeBase;
  query: string;
  sortBy: KnowledgeSortBy;
  onQueryChange: (query: string) => void;
  onSortChange: (sortBy: KnowledgeSortBy) => void;
};

export function KnowledgeBaseHeader({
  base,
  query,
  sortBy,
  onQueryChange,
  onSortChange,
}: KnowledgeBaseHeaderProps) {
  const department = base.departmentId ? getDepartmentById(base.departmentId) : undefined;
  const canManage = canManageKnowledgeBase(base);
  const canUpload = canUploadToKnowledgeBase(base.id);

  return (
    <header className="shrink-0 border-b border-[#EDF3F5] bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 text-[12px] text-[#607681]">
            {department?.name ?? (base.spaceType === "public" ? "公共空间" : "我的")} / 当前知识库
          </div>
          <KnowledgeBaseSwitcher current={base} />
          <p className="mt-1 max-w-[760px] text-[12.5px] leading-relaxed text-[#607681]">
            {base.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex h-9 w-[260px] items-center gap-2 rounded-lg border border-[#DCE8EA] bg-white px-3 text-[12.5px] text-[#607681] focus-within:border-[#349BAC]">
            <Search className="h-3.5 w-3.5 text-[#91A3AA]" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="搜索本库文件"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#91A3AA]"
            />
          </label>
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as KnowledgeSortBy)}
            className="h-9 rounded-lg border border-[#DCE8EA] bg-white px-3 text-[12px] text-[#1F3440] outline-none focus:border-[#349BAC]"
          >
            <option value="updated">最近更新</option>
            <option value="name">文件名称</option>
            <option value="uploaded">上传时间</option>
          </select>
          <ActionButton
            icon={canUpload ? Upload : LockKeyhole}
            label={canUpload ? "上传文件" : "申请上传权限"}
            onClick={() =>
              toast.message(canUpload ? "上传文件（演示占位）" : "申请上传权限（演示占位）")
            }
            primary={canUpload}
          />
          {canManage && (
            <>
              <ActionButton
                icon={FolderPlus}
                label="新建目录"
                onClick={() => toast.message("新建目录（演示占位）")}
              />
              <ActionButton
                icon={ShieldCheck}
                label="权限管理"
                onClick={() => toast.message("权限管理（演示占位）")}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: typeof Upload;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? "inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#349BAC] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#2F8D9D]"
          : "inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DCE8EA] bg-white px-3 text-[12px] font-medium text-[#607681] transition-colors hover:bg-[#F5FAFB] hover:text-[#1F3440]"
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
