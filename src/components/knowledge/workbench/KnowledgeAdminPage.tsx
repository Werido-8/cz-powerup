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
import { CURRENT_KNOWLEDGE_USER, PERMISSION_REQUESTS, UPLOAD_APPROVALS } from "@/lib/knowledge/data";
import {
  canSeeCategoryManager,
  canViewKnowledgeAdmin,
  getManageableBases,
  getParseExceptionsForScope,
  isKnowledgeAdmin,
} from "@/lib/knowledge/model";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import type { KnowledgeBase, KnowledgeBaseStatus } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { ApprovalCenterSection } from "./admin/ApprovalCenterSection";
import { KnowledgeBaseAdminSection } from "./admin/KnowledgeBaseAdminSection";
import { ParseExceptionSection } from "./admin/ParseExceptionSection";
import { CategoryManagerSection } from "./admin/CategoryManagerSection";
import { KnowledgeBaseFormDrawer } from "./admin/KnowledgeBaseFormDrawer";
import { PermissionConfigDrawer } from "./admin/PermissionConfigDrawer";
import { KnowledgeAdminSectionHeader } from "./KnowledgeAdminSectionHeader";
import { KnowledgeAdminTitleBanner } from "./KnowledgeAdminTitleBanner";
import { KnowledgeSidebarQuickLinks } from "./KnowledgeSidebarQuickLinks";

type AdminSection = "categories" | "bases" | "approvals" | "exceptions";

const SECTION_META: Record<
  AdminSection,
  { title: string; description: string; icon: ReactNode }
> = {
  categories: {
    title: "分类管理",
    description: "分类用于组织公共和部门知识库，可嵌套维护。下属仍有知识库时禁止删除。",
    icon: <FolderTree className="stroke-[1.8]" />,
  },
  bases: {
    title: "库清单",
    description: "管理知识库基础信息、使用状态、所属部门、权限范围与文件资产。",
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
  const [section, setSection] = useState<AdminSection>("bases");
  const [bases, setBases] = useState(() => getManageableBases());
  const [formBase, setFormBase] = useState<KnowledgeBase | "new" | null>(null);
  const [permissionBase, setPermissionBase] = useState<KnowledgeBase | null>(null);

  const scopeSubtitle = isKnowledgeAdmin() ? (
    <>
      全库范围
      <br />
      存得住、找得到、管得住
    </>
  ) : (
    <>
      {CURRENT_KNOWLEDGE_USER.departmentName}范围
      <br />
      部门范围管理
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
          description="知识管理仅知识库管理员和部门管理员可见。"
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
        <div className="flex min-h-0 flex-1 flex-col">
          <KnowledgeAdminSectionHeader
            title={sectionMeta.title}
            description={sectionMeta.description}
            action={
              visibleSection === "bases" ? (
                <KbButton onClick={() => setFormBase("new")}>
                  <Plus className="h-4 w-4 stroke-[1.8]" />
                  新建知识库
                </KbButton>
              ) : visibleSection === "categories" ? (
                <KbButton onClick={() => toast.success("已预留新建根分类入口")}>
                  <Plus className="h-4 w-4 stroke-[1.8]" />
                  新建根分类
                </KbButton>
              ) : undefined
            }
          />

          <div className="min-h-0 flex-1 overflow-y-auto">
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
        </div>
      </main>

      {formBase && (
        <KnowledgeBaseFormDrawer
          base={formBase === "new" ? undefined : formBase}
          onClose={() => setFormBase(null)}
          onSubmit={(base) => {
            if (formBase === "new") {
              setBases((previous) => [base, ...previous]);
              toast.success("知识库已创建");
            } else {
              setBases((previous) =>
                previous.map((item) => (item.id === base.id ? base : item)),
              );
              toast.success("知识库信息已更新");
            }
            setFormBase(null);
          }}
        />
      )}
      {permissionBase && (
        <PermissionConfigDrawer base={permissionBase} onClose={() => setPermissionBase(null)} />
      )}
    </>
  );
}
