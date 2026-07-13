import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  KbButton,
  KbDrawer,
  KbEmptyState,
  KbFilterSelect,
  KbStatusTag,
} from "@/components/knowledge/ui";
import { PERMISSION_MEMBERS } from "@/lib/knowledge/data";
import { getPermissionRequestsForBase, permissionGroupLabel } from "@/lib/knowledge/model";
import type {
  KnowledgeBase,
  KnowledgePermissionGroup,
  PermissionMember,
} from "@/lib/knowledge/types";
import { kbCardShell, kbRadius } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

const permissionOptions: KnowledgePermissionGroup[] = ["view", "upload", "manage"];

export function PermissionConfigDrawer({
  base,
  onClose,
}: {
  base: KnowledgeBase;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<PermissionMember[]>(PERMISSION_MEMBERS[base.id] ?? []);
  const requests = getPermissionRequestsForBase(base.id);

  return (
    <KbDrawer open title="权限配置" subtitle={base.name} onClose={onClose}>
      <section className={cn(kbCardShell, kbRadius.md, "bg-kb-surface p-4")}>
        <div className="text-[13px] font-semibold text-kb-heading">默认权限</div>
        <p className="mt-1 text-[12px] leading-relaxed text-kb-muted">
          授权成员默认具备浏览组权限；上传组和管理组通过指定成员授权。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {permissionOptions.map((group) => (
            <KbStatusTag key={group} tone={group === "view" ? "accent" : "neutral"}>
              {permissionGroupLabel(group)}
            </KbStatusTag>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-kb-heading">指定成员权限</h3>
          <KbButton
            variant="outline"
            size="sm"
            onClick={() =>
              setMembers((previous) => [
                ...previous,
                { id: `member-${Date.now()}`, name: "新成员", group: "view" },
              ])
            }
          >
            添加成员
          </KbButton>
        </div>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className={cn(kbCardShell, kbRadius.sm, "flex items-center gap-2 p-2")}
            >
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-kb-heading">
                {member.name}
              </span>
              <KbFilterSelect
                value={member.group}
                onChange={(value) =>
                  setMembers((previous) =>
                    previous.map((item) =>
                      item.id === member.id
                        ? { ...item, group: value as KnowledgePermissionGroup }
                        : item,
                    ),
                  )
                }
                options={permissionOptions.map((group) => ({
                  value: group,
                  label: permissionGroupLabel(group),
                }))}
              />
              <button
                type="button"
                onClick={() =>
                  setMembers((previous) => previous.filter((item) => item.id !== member.id))
                }
                className="grid h-8 w-8 place-items-center rounded-[8px] text-kb-muted hover:bg-danger-soft hover:text-destructive"
                aria-label="移除成员"
              >
                <Trash2 className="h-4 w-4 stroke-[1.8]" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="mb-2 text-[13px] font-semibold text-kb-heading">待审批权限申请</h3>
        <div className="space-y-2">
          {requests.map((request) => (
            <div key={request.id} className={cn(kbCardShell, kbRadius.sm, "p-3")}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-kb-heading">
                  {request.applicantName}
                </span>
                <KbStatusTag tone="accent">{permissionGroupLabel(request.group)}</KbStatusTag>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-kb-muted">{request.reason}</p>
              <div className="mt-3 flex justify-end gap-2">
                <KbButton
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("权限申请已通过")}
                >
                  通过
                </KbButton>
                <KbButton
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("权限申请已驳回")}
                >
                  驳回
                </KbButton>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <KbEmptyState
              title="暂无权限申请"
              description="用户从无权限态申请后会汇总到这里。"
            />
          )}
        </div>
      </section>
    </KbDrawer>
  );
}
