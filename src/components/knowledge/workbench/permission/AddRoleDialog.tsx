import { Check, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { KbFilterSelect } from "@/components/knowledge/ui";
import {
  PERMISSION_LEVEL_OPTIONS,
  SYSTEM_ROLES,
  permissionLevelLabel,
  type KbRoleGrant,
  type PermissionLevel,
} from "@/lib/knowledge/permission";
import { cn } from "@/lib/utils";

export function AddRoleDialog({
  open,
  existingRoleIds,
  onClose,
  onAdd,
}: {
  open: boolean;
  existingRoleIds: string[];
  onClose: () => void;
  onAdd: (roles: KbRoleGrant[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [level, setLevel] = useState<PermissionLevel>("view");

  const available = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SYSTEM_ROLES.filter((role) => !existingRoleIds.includes(role.id)).filter(
      (role) =>
        !normalized ||
        role.name.toLowerCase().includes(normalized) ||
        role.scopeLabel.toLowerCase().includes(normalized),
    );
  }, [existingRoleIds, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const roles: KbRoleGrant[] = SYSTEM_ROLES.filter((role) => selected.has(role.id)).map((role) => ({
      roleId: role.id,
      roleName: role.name,
      scopeLabel: role.scopeLabel,
      memberCount: role.memberCount,
      level,
    }));
    onAdd(roles);
    setQuery("");
    setSelected(new Set());
    setLevel("view");
  };

  return (
    <AppFormDialog
      open={open}
      size="compact"
      title="添加角色"
      titleIcon={Users}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={handleAdd} disabled={selected.size === 0}>
            {selected.size > 0 ? `添加 ${selected.size} 个角色` : "添加角色"}
          </AppDialogButton>
        </>
      }
    >
      <div className="mb-3 flex h-9 items-center gap-2 rounded-[8px] border border-kb-border bg-card px-3">
        <Search className="h-4 w-4 shrink-0 text-kb-muted" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索角色名称或所属部门"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-kb-body outline-none placeholder:text-kb-muted"
        />
      </div>

      <div className="scrollbar-thin max-h-[300px] space-y-1.5 overflow-y-auto">
        {available.length === 0 ? (
          <p className="py-10 text-center text-[12.5px] text-kb-muted">无可添加的角色</p>
        ) : (
          available.map((role) => {
            const active = selected.has(role.id);
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggle(role.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[8px] border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary/60 bg-primary-soft/25"
                    : "border-kb-border bg-white hover:border-primary/30 hover:bg-[#F6FBFC]",
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-colors",
                    active ? "border-primary bg-primary text-white" : "border-[#C7D3D8] bg-white",
                  )}
                >
                  {active && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-kb-heading">
                  {role.name}
                </span>
                <span className="shrink-0 text-[12px] text-kb-muted">{role.scopeLabel}</span>
                <span className="w-14 shrink-0 text-right text-[12px] tabular-nums text-kb-muted">
                  {role.memberCount} 人
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F4] pt-4">
        <span className="text-[12.5px] font-medium text-kb-heading">授予权限</span>
        <KbFilterSelect
          value={level}
          onChange={(value) => setLevel(value as PermissionLevel)}
          options={PERMISSION_LEVEL_OPTIONS.map((option) => ({
            value: option.value,
            label: `${permissionLevelLabel(option.value)}权限`,
          }))}
          className="min-w-[140px]"
        />
      </div>
    </AppFormDialog>
  );
}
