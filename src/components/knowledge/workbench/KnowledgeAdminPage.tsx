import {
  FileWarning,
  FolderTree,
  Library,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { KbButton, KbEmptyState, KbSidebar, KbSidebarItem, KbSidebarSection } from "@/components/knowledge/ui";
import { PERMISSION_REQUESTS, UPLOAD_APPROVALS } from "@/lib/knowledge/data";
import {
  canSeeCategoryManager,
  canViewKnowledgeAdmin,
  getManageableBases,
  getParseExceptionsForScope,
} from "@/lib/knowledge/model";
import { addStoreBase, updateStoreBase } from "@/lib/knowledge/store";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import type { KnowledgeBase, KnowledgeBaseStatus } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { ApprovalCenterSection } from "./admin/ApprovalCenterSection";
import { KnowledgeBaseAdminSection } from "./admin/KnowledgeBaseAdminSection";
import { ParseExceptionSection } from "./admin/ParseExceptionSection";
import { CategoryManagerSection } from "./admin/CategoryManagerSection";
import { CreateKnowledgeBaseDialog } from "./admin/CreateKnowledgeBaseDialog";
import { EditKnowledgeBaseDialog } from "./admin/EditKnowledgeBaseDialog";
import { PermissionConfigDialog } from "./permission/PermissionConfigDialog";
import { PublicPermissionDialog } from "./permission/PublicPermissionDialog";
import { KnowledgeAdminTitleBanner } from "./KnowledgeAdminTitleBanner";
import { KnowledgeSidebarQuickLinks } from "./KnowledgeSidebarQuickLinks";

type AdminSection = "categories" | "bases" | "approvals" | "exceptions";

const SECTION_META: Record<
  AdminSection,
  { title: string; description: string; icon: ReactNode }
> = {
  categories: {
    title: "分类管理",
    description: "分类用于组织专业知识库，可嵌套维护。下属仍有知识库时禁止删除。",
    icon: <FolderTree className="stroke-[1.8]" />,
  },
  bases: {
    title: "库清单",
    description: "管理知识库基础信息、使用状态、权限范围与文件资产。",
    icon: <Library className="stroke-[1.8]" />,
  },
  approvals: {
    title: "审批台",
    description: "集中处理文件上传审批与权限申请，审批通过后进入解析或授权生效。",
    icon: <ShieldCheck className="stroke-[1.8]" />,
  },
  exceptions: {
    title: "解析异常",
    description: "展示解析失败文件，支持查看失败原因、重试解析和日志排查。",
    icon: <FileWarning className="stroke-[1.8]" />,
  },
};

export function KnowledgeAdminPage() {
  const [section, setSection] = useState<AdminSection>(() =>
    canSeeCategoryManager() ? "categories" : "bases",
  );
  const [bases, setBases] = useState(() => getManageableBases());
  const [formBase, setFormBase] = useState<KnowledgeBase | "new" | null>(null);
  const [permissionBase, setPermissionBase] = useState<KnowledgeBase | null>(null);

  const scopeSubtitle = (
    <>
      专业知识库管理
      <br />
      存得住、找得到、管得住
    </>
  );

  const visibleSection = section === "categories" && !canSeeCategoryManager() ? "bases" : section;
  const parseExceptions = getParseExceptionsForScope();
  const permissionRequestCount = PERMISSION_REQUESTS.filter((request) =>
    bases.some((base) => base.id === request.knowledgeBaseId),
  ).length;
  const approvalBadge = UPLOAD_APPROVALS.length + permissionRequestCount;

  const sectionMeta = SECTION_META[visibleSection];

  if (!canViewKnowledgeAdmin()) {
    return (
      <main className={cn(kbMainPanel, "items-center justify-center p-6")}>
        <KbEmptyState
          title="暂无管理端权限"
          description="知识管理仅管理员可见。"
        />
      </main>
    );
  }

  return (
    <>
      <KbSidebar
        width="browse"
        withDecor
        header={
          <>
            <KnowledgeAdminTitleBanner subtitle={scopeSubtitle} />
            <KnowledgeSidebarQuickLinks />
          </>
        }
      >
        <KbSidebarSection title="管理功能">
          {canSeeCategoryManager() && (
            <KbSidebarItem
              icon={FolderTree}
              label="分类管理"
              active={visibleSection === "categories"}
              onClick={() => setSection("categories")}
            />
          )}
          <KbSidebarItem
            icon={Library}
            label="库清单"
            active={visibleSection === "bases"}
            onClick={() => setSection("bases")}
          />
          <KbSidebarItem
            icon={ShieldCheck}
            label="审批台"
            badge={approvalBadge || undefined}
            badgeTone={approvalBadge > 0 ? "danger" : "neutral"}
            active={visibleSection === "approvals"}
            onClick={() => setSection("approvals")}
          />
          <KbSidebarItem
            icon={FileWarning}
            label="解析异常"
            badge={parseExceptions.length || undefined}
            badgeTone={parseExceptions.length > 0 ? "danger" : "neutral"}
            active={visibleSection === "exceptions"}
            onClick={() => setSection("exceptions")}
          />
        </KbSidebarSection>
      </KbSidebar>

      <main className={cn("scrollbar-thin", kbMainPanel)}>
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
            <section className="flex min-h-full flex-col overflow-hidden rounded-[12px] border border-[#DCEBED] bg-white shadow-[0_8px_24px_rgba(31,52,64,0.025)]">
              <div className="flex items-start justify-between gap-4 border-b border-[#E8F0F2] px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-kb-heading">{sectionMeta.title}</h2>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-kb-muted">
                    {sectionMeta.description}
                  </p>
                </div>
                {visibleSection === "bases" ? (
                  <KbButton onClick={() => setFormBase("new")}>
                    <Plus className="h-4 w-4 stroke-[1.8]" />
                    新建知识库
                  </KbButton>
                ) : null}
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                {visibleSection === "categories" && <CategoryManagerSection embedded />}
                {visibleSection === "bases" && (
                  <KnowledgeBaseAdminSection
                    embedded
                    bases={bases}
                    onCreate={() => setFormBase("new")}
                    onEdit={setFormBase}
                    onToggleStatus={(base) => {
                      const nextStatus: KnowledgeBaseStatus =
                        base.status === "enabled" ? "disabled" : "enabled";
                      const confirmMessage =
                        nextStatus === "disabled"
                          ? "停用后普通员工不可见，且不参与检索。确认停用？"
                          : "确认重新启用该知识库？";
                      if (typeof window !== "undefined" && !window.confirm(confirmMessage)) return;
                      setBases((previous) =>
                        previous.map((item) =>
                          item.id === base.id ? { ...item, status: nextStatus } : item,
                        ),
                      );
                      toast.success(nextStatus === "disabled" ? "知识库已停用" : "知识库已重新启用");
                    }}
                    onBatchToggleStatus={(ids, nextStatus) => {
                      const idSet = new Set(ids);
                      setBases((previous) =>
                        previous.map((item) =>
                          idSet.has(item.id) ? { ...item, status: nextStatus } : item,
                        ),
                      );
                    }}
                    onPermission={setPermissionBase}
                  />
                )}
                {visibleSection === "approvals" && (
                  <ApprovalCenterSection embedded manageableBases={bases} />
                )}
                {visibleSection === "exceptions" && (
                  <ParseExceptionSection embedded items={parseExceptions} />
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {formBase === "new" && (
        <CreateKnowledgeBaseDialog
          onClose={() => setFormBase(null)}
          onSubmit={(base) => {
            addStoreBase(base);
            setBases((previous) => [base, ...previous]);
            toast.success("知识库已创建");
            setFormBase(null);
          }}
        />
      )}
      {formBase && formBase !== "new" && (
        <EditKnowledgeBaseDialog
          base={formBase}
          onClose={() => setFormBase(null)}
          onSubmit={(base) => {
            updateStoreBase(base);
            setBases((previous) =>
              previous.map((item) => (item.id === base.id ? base : item)),
            );
            toast.success("知识库信息已更新");
            setFormBase(null);
          }}
        />
      )}
      {permissionBase?.scope === "public" && (
        <PublicPermissionDialog
          base={permissionBase}
          onClose={() => setPermissionBase(null)}
        />
      )}
      {permissionBase && permissionBase.scope === "professional" && (
        <PermissionConfigDialog
          base={permissionBase}
          onClose={() => setPermissionBase(null)}
        />
      )}
    </>
  );
}
