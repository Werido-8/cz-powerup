import { PersonalLibraryFilePanel } from "./personal-audit/PersonalLibraryFilePanel";

/** 个人库：全宽文件列表，筛选项对齐审批台 */
export function PersonalLibraryAuditSection() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <PersonalLibraryFilePanel />
    </div>
  );
}
