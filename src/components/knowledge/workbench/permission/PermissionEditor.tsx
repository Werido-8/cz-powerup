import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  KbButton,
  KbEmptyState,
  KbSegmentControl,
  KbStatusTag,
} from "@/components/knowledge/ui";
import {
  grantTierLabel,
  hasManager,
  levelToTier,
  memberEffectiveLevel,
  summarizeGrants,
  type KbMemberGrant,
  type KbRoleGrant,
  type PermissionGrants,
  type PermissionLevel,
} from "@/lib/knowledge/permission";
import { getPermissionRequestsForBase } from "@/lib/knowledge/model";
import type { PermissionRequest } from "@/lib/knowledge/types";
import { kbCardShell, kbRadius } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";
import { AddMemberDialog } from "./AddMemberDialog";
import { AddRoleDialog } from "./AddRoleDialog";
import { ApproveRequestDialog } from "./ApproveRequestDialog";

type EditorTab = "roles" | "members" | "requests";

function effectiveLevelTone(level: PermissionLevel | null) {
  if (level === "manage") return "accent" as const;
  return "neutral" as const;
}

function effectiveTierLabel(level: PermissionLevel | null) {
  const tier = levelToTier(level);
  return tier ? grantTierLabel(tier) : "—";
}

export function PermissionEditor({
  grants,
  onChange,
  baseId,
  showRequests = true,
  showSummary = true,
  className,
}: {
  grants: PermissionGrants;
  onChange: (grants: PermissionGrants) => void;
  baseId?: string;
  showRequests?: boolean;
  showSummary?: boolean;
  className?: string;
}) {
  const [tab, setTab] = useState<EditorTab>("roles");
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [approveRequest, setApproveRequest] = useState<PermissionRequest | null>(null);
  const [processedRequestIds, setProcessedRequestIds] = useState<Set<string>>(new Set());

  const requests = useMemo(() => {
    const fromData = baseId ? getPermissionRequestsForBase(baseId) : [];
    return fromData.filter((item) => !processedRequestIds.has(item.id));
  }, [baseId, processedRequestIds]);

  const summary = summarizeGrants(grants);

  const tabOptions = useMemo(() => {
    const options = [
      { value: "roles", label: "角色授权" },
      { value: "members", label: "成员授权" },
    ];
    if (showRequests) {
      options.push({
        value: "requests",
        label: requests.length > 0 ? `权限申请 (${requests.length})` : "权限申请",
      });
    }
    return options;
  }, [requests.length, showRequests]);

  const filteredMembers = useMemo(() => {
    const normalized = memberQuery.trim().toLowerCase();
    return grants.members.filter((item) => {
      if (!normalized) return true;
      return (
        item.name.toLowerCase().includes(normalized) ||
        item.department.toLowerCase().includes(normalized) ||
        item.roleName?.toLowerCase().includes(normalized)
      );
    });
  }, [grants.members, memberQuery]);

  const removeRole = (roleId: string) => {
    onChange({ ...grants, roles: grants.roles.filter((item) => item.roleId !== roleId) });
  };

  const removeMember = (member: KbMemberGrant) => {
    if (member.directLevel == null) {
      toast.message("该成员仅通过角色获得权限，请前往角色授权调整");
      return;
    }
    const nextMembers = grants.members.filter((item) => item.memberId !== member.memberId);
    if (!hasManager({ ...grants, members: nextMembers })) {
      toast.error("至少保留一名管理者");
      return;
    }
    onChange({ ...grants, members: nextMembers });
  };

  const handleAddRoles = (roles: KbRoleGrant[]) => {
    const existing = new Set(grants.roles.map((item) => item.roleId));
    const toAdd = roles.filter((item) => !existing.has(item.roleId));
    if (toAdd.length === 0) {
      toast.message("所选角色已在列表中");
      return;
    }
    onChange({ ...grants, roles: [...grants.roles, ...toAdd] });
    setAddRoleOpen(false);
    toast.success(`已添加 ${toAdd.length} 个角色`);
  };

  const handleAddMembers = (members: KbMemberGrant[]) => {
    const existing = new Set(grants.members.map((item) => item.memberId));
    const toAdd = members.filter((item) => !existing.has(item.memberId));
    if (toAdd.length === 0) {
      toast.message("所选成员已在列表中");
      return;
    }
    onChange({ ...grants, members: [...grants.members, ...toAdd] });
    setAddMemberOpen(false);
    toast.success(`已添加 ${toAdd.length} 名成员`);
  };

  const handleApprove = (level: PermissionLevel, addToMembers: boolean) => {
    if (!approveRequest) return;
    if (addToMembers) {
      const existing = grants.members.find((item) => item.name === approveRequest.applicantName);
      if (existing) {
        onChange({
          ...grants,
          members: grants.members.map((item) =>
            item.name === approveRequest.applicantName ? { ...item, directLevel: level } : item,
          ),
        });
      } else {
        onChange({
          ...grants,
          members: [
            ...grants.members,
            {
              memberId: `member-${Date.now()}`,
              name: approveRequest.applicantName,
              department: "—",
              roleLevel: null,
              directLevel: level,
            },
          ],
        });
      }
    }
    setProcessedRequestIds((prev) => new Set([...prev, approveRequest.id]));
    setApproveRequest(null);
    toast.success("权限申请已通过");
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      {showSummary && (
        <div
          className={cn(
            kbCardShell,
            kbRadius.md,
            "mb-4 grid grid-cols-2 gap-3 bg-[#F8FAFB] p-4 sm:grid-cols-4",
          )}
        >
          <SummaryItem label="授权角色" value={`${summary.roleCount} 个`} />
          <SummaryItem label="单独授权成员" value={`${summary.directMemberCount} 人`} />
          {showRequests && (
            <SummaryItem label="待处理申请" value={`${requests.length} 项`} highlight={requests.length > 0} />
          )}
        </div>
      )}

      <KbSegmentControl
        options={tabOptions}
        value={tab}
        onChange={(value) => setTab(value as EditorTab)}
        className="mb-4 w-full"
      />

      {tab === "roles" && (
        <section className="min-h-0 flex-1">
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="max-w-[520px] text-[12px] leading-relaxed text-kb-muted">
              通过系统角色批量授予知识库权限。角色成员变化后，权限自动同步。
            </p>
            <KbButton variant="outline" size="sm" onClick={() => setAddRoleOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              添加角色
            </KbButton>
          </div>

          {grants.roles.length === 0 ? (
            <KbEmptyState
              title="尚未添加角色授权"
              description="点击「添加角色」为知识库批量授予权限。"
            />
          ) : (
            <div className={cn(kbCardShell, kbRadius.md, "overflow-hidden")}>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#EEF2F4] bg-[#F8FAFB] text-[11.5px] font-medium text-kb-muted">
                    <th className="px-4 py-2.5">角色</th>
                    <th className="px-4 py-2.5 text-right">人员</th>
                    <th className="px-4 py-2.5 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {grants.roles.map((role) => (
                    <tr key={role.roleId} className="border-b border-[#EEF2F4] last:border-b-0">
                      <td className="px-4 py-3 text-[13px] font-medium text-kb-heading">
                        {role.roleName}
                      </td>
                      <td className="px-4 py-3 text-right text-[12.5px] tabular-nums text-kb-body">
                        {role.memberCount} 人
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeRole(role.roleId)}
                          className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2 text-[12px] text-kb-muted hover:bg-danger-soft hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          移除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "members" && (
        <section className="min-h-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="max-w-[480px] text-[12px] leading-relaxed text-kb-muted">
              对指定人员单独授权。当前一期仅展示成员、角色与部门信息，授权后默认具备基础访问能力。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-[180px] items-center gap-1.5 rounded-[8px] border border-kb-border bg-white px-2.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-kb-muted" />
                <input
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="搜索成员"
                  className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-kb-muted"
                />
              </div>
              <KbButton variant="outline" size="sm" onClick={() => setAddMemberOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                添加成员
              </KbButton>
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <KbEmptyState
              title="尚未添加成员授权"
              description="点击「添加成员」为指定人员单独授权。"
            />
          ) : (
            <div className={cn(kbCardShell, kbRadius.md, "overflow-hidden")}>
              {/* 二期：权限档位细化后，再恢复「个人权限」与「最终权限」列及对应编辑控件。 */}
              <table className="w-full table-fixed text-left">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[24%]" />
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[22%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[#EEF2F4] bg-[#F8FAFB] text-[11.5px] font-medium text-kb-muted">
                    <th className="px-3 py-2.5">成员名称</th>
                    <th className="px-3 py-2.5">所属角色</th>
                    <th className="px-3 py-2.5">所属部门</th>
                    <th className="px-3 py-2.5">角色权限</th>
                    <th className="px-3 py-2.5 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => {
                    const canRemove = member.directLevel != null;
                    return (
                      <tr
                        key={member.memberId}
                        className="border-b border-[#EEF2F4] last:border-b-0"
                        >
                        <td className="truncate px-3 py-3 text-[13px] font-medium text-kb-heading" title={member.name}>
                          {member.name}
                        </td>
                        <td className="truncate px-3 py-3 text-[12.5px] text-kb-body" title={member.roleName ?? "—"}>
                          {member.roleName ?? "—"}
                        </td>
                        <td className="truncate px-3 py-3 text-[12.5px] text-kb-muted" title={member.department}>
                          {member.department}
                        </td>
                        <td className="truncate px-3 py-3 text-[12.5px] text-kb-body">
                          {member.roleLevel ? effectiveTierLabel(member.roleLevel) : "无"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {canRemove ? (
                            <button
                              type="button"
                              onClick={() => removeMember(member)}
                              className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2 text-[12px] text-kb-muted hover:bg-danger-soft hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              移除
                            </button>
                          ) : (
                            <span className="text-[11.5px] text-kb-muted">角色授权</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "requests" && showRequests && (
        <section className="min-h-0 flex-1">
          {requests.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px] font-medium text-kb-heading">暂无待处理的权限申请</p>
              <p className="mt-1 text-[12px] text-kb-muted">新的访问申请将在这里统一处理</p>
            </div>
          ) : (
            <div className={cn(kbCardShell, kbRadius.md, "overflow-x-auto")}>
              <table className="min-w-[680px] w-full text-left">
                <thead>
                  <tr className="border-b border-[#EEF2F4] bg-[#F8FAFB] text-[11.5px] font-medium text-kb-muted">
                    <th className="px-4 py-2.5">申请人</th>
                    <th className="px-4 py-2.5">申请权限</th>
                    <th className="px-4 py-2.5">申请理由</th>
                    <th className="px-4 py-2.5">申请时间</th>
                    <th className="px-4 py-2.5 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-[#EEF2F4] last:border-b-0">
                      <td className="px-4 py-3 text-[13px] font-medium text-kb-heading">
                        {request.applicantName}
                      </td>
                      <td className="px-4 py-3">
                        <KbStatusTag tone="accent" variant="outline">
                          {effectiveTierLabel(request.group)}
                        </KbStatusTag>
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-[12px] leading-relaxed text-kb-muted">
                        {request.reason}
                      </td>
                      <td className="px-4 py-3 text-[12px] tabular-nums text-kb-muted">
                        {request.submittedAt}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <KbButton
                            variant="outline"
                            size="sm"
                            onClick={() => setApproveRequest(request)}
                          >
                            通过
                          </KbButton>
                          <KbButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProcessedRequestIds((prev) => new Set([...prev, request.id]));
                              toast.success("权限申请已驳回");
                            }}
                          >
                            驳回
                          </KbButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <AddRoleDialog
        open={addRoleOpen}
        existingRoleIds={grants.roles.map((item) => item.roleId)}
        onClose={() => setAddRoleOpen(false)}
        onAdd={handleAddRoles}
      />
      <AddMemberDialog
        open={addMemberOpen}
        existingMemberIds={grants.members.map((item) => item.memberId)}
        onClose={() => setAddMemberOpen(false)}
        onAdd={handleAddMembers}
      />
      <ApproveRequestDialog
        request={approveRequest}
        onClose={() => setApproveRequest(null)}
        onConfirm={handleApprove}
      />
    </div>
  );
}

function SummaryItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[11.5px] text-kb-muted">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-[15px] font-semibold tabular-nums",
          highlight ? "text-destructive" : "text-kb-heading",
        )}
      >
        {value}
      </div>
    </div>
  );
}

/** 新建流程第二步用的精简概览条 */
export function PermissionOverviewStrip({ grants }: { grants: PermissionGrants }) {
  const summary = summarizeGrants(grants);
  return (
    <div className="flex flex-wrap gap-4 text-[12.5px] text-kb-muted">
      <span>
        已授权角色{" "}
        <strong className="font-semibold text-kb-heading">{summary.roleCount}</strong> 个
      </span>
      <span>
        单独授权成员{" "}
        <strong className="font-semibold text-kb-heading">{summary.directMemberCount}</strong> 人
      </span>
    </div>
  );
}
