import { FileWarning, FolderTree, Library, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { KbEmptyState } from "@/components/knowledge/ui";
import {
  CURRENT_KNOWLEDGE_USER,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_DEPARTMENTS,
  PERMISSION_MEMBERS,
  PERMISSION_REQUESTS,
  UPLOAD_APPROVALS,
} from "@/lib/knowledge/data";
import {
  canSeeCategoryManager,
  canViewKnowledgeAdmin,
  getCategoryChildren,
  getManageableBases,
  getParseExceptionsForScope,
  getPermissionRequestsForBase,
  isKnowledgeAdmin,
} from "@/lib/knowledge/model";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import type { KnowledgeBase, KnowledgeBaseStatus } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { AdminNavButton, AdminSidebar } from "./admin/AdminSidebar";
import { ApprovalCenterSection } from "./admin/ApprovalCenterSection";
import { KnowledgeBaseAdminSection } from "./admin/KnowledgeBaseAdminSection";
import { ParseExceptionSection } from "./admin/ParseExceptionSection";
import { CategoryManagerSection } from "./admin/CategoryManagerSection";
import { KnowledgeBaseFormDrawer } from "./admin/KnowledgeBaseFormDrawer";
import { PermissionConfigDrawer } from "./admin/PermissionConfigDrawer";

type AdminSection = "categories" | "bases" | "approvals" | "exceptions";

export function KnowledgeAdminPage() {
  const [section, setSection] = useState<AdminSection>("bases");
  const [bases, setBases] = useState(() => getManageableBases());
  const [formBase, setFormBase] = useState<KnowledgeBase | "new" | null>(null);
  const [permissionBase, setPermissionBase] = useState<KnowledgeBase | null>(null);

  if (!canViewKnowledgeAdmin()) {
    return (
      <main className={cn(kbMainPanel, "items-center justify-center p-6")}>
        <KbEmptyState
          title="暂无管理端权限"
          description="知识库管理仅知识库管理员和部门管理员可见。"
        />
      </main>
    );
  }

  const visibleSection = section === "categories" && !canSeeCategoryManager() ? "bases" : section;
  const parseExceptions = getParseExceptionsForScope();
  const permissionRequestCount = PERMISSION_REQUESTS.filter((request) =>
    bases.some((base) => base.id === request.knowledgeBaseId),
  ).length;

  return (
    <main className={cn(kbMainPanel, "overflow-hidden")}>
      <AdminSidebar
        subtitle={isKnowledgeAdmin() ? "全库范围" : `${CURRENT_KNOWLEDGE_USER.departmentName}范围`}
      >
        {canSeeCategoryManager() && (
          <AdminNavButton
            icon={FolderTree}
            label="分类管理"
            active={visibleSection === "categories"}
            onClick={() => setSection("categories")}
          />
        )}
        <AdminNavButton
          icon={Library}
          label="知识库"
          active={visibleSection === "bases"}
          onClick={() => setSection("bases")}
        />
        <AdminNavButton
          icon={ShieldCheck}
          label="审批台"
          badge={UPLOAD_APPROVALS.length + permissionRequestCount}
          active={visibleSection === "approvals"}
          onClick={() => setSection("approvals")}
        />
        <AdminNavButton
          icon={FileWarning}
          label="解析异常"
          badge={parseExceptions.length}
          badgeTone="danger"
          active={visibleSection === "exceptions"}
          onClick={() => setSection("exceptions")}
        />
      </AdminSidebar>

      <section className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
        {visibleSection === "categories" && <CategoryManagerSection />}
        {visibleSection === "bases" && (
          <KnowledgeBaseAdminSection
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
        {visibleSection === "approvals" && <ApprovalCenterSection manageableBases={bases} />}
        {visibleSection === "exceptions" && <ParseExceptionSection items={parseExceptions} />}
      </section>

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
    </main>
  );
}
