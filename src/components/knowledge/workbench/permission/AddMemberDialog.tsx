import { Check, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { KbFilterSelect } from "@/components/knowledge/ui";
import {
  PERMISSION_LEVEL_OPTIONS,
  SYSTEM_MEMBERS,
  permissionLevelLabel,
  type KbMemberGrant,
  type PermissionLevel,
} from "@/lib/knowledge/permission";
import { cn } from "@/lib/utils";

export function AddMemberDialog({
  open,
  existingMemberIds,
  onClose,
  onAdd,
}: {
  open: boolean;
  existingMemberIds: string[];
  onClose: () => void;
  onAdd: (members: KbMemberGrant[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [level, setLevel] = useState<PermissionLevel>("view");

  const available = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SYSTEM_MEMBERS.filter((item) => !existingMemberIds.includes(item.id)).filter(
      (item) =>
        !normalized ||
        item.name.toLowerCase().includes(normalized) ||
        item.department.toLowerCase().includes(normalized) ||
        item.roleName?.toLowerCase().includes(normalized),
    );
  }, [existingMemberIds, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const members: KbMemberGrant[] = SYSTEM_MEMBERS.filter((item) => selected.has(item.id)).map(
      (item) => ({
        memberId: item.id,
        name: item.name,
        department: item.department,
        roleName: item.roleName,
        roleLevel: null,
        directLevel: level,
      }),
    );
    onAdd(members);
    setQuery("");
    setSelected(new Set());
    setLevel("view");
  };

  return (
    <AppFormDialog
      open={open}
      size="compact"
      title="添加成员"
      titleIcon={UserPlus}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={handleAdd} disabled={selected.size === 0}>
            {selected.size > 0 ? `添加 ${selected.size} 名成员` : "添加成员"}
          </AppDialogButton>
        </>
      }
    >
      <div className="mb-3 flex h-9 items-center gap-2 rounded-[8px] border border-kb-border bg-card px-3">
        <Search className="h-4 w-4 shrink-0 text-kb-muted" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索姓名、工号或部门"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-kb-body outline-none placeholder:text-kb-muted"
        />
      </div>

      <div className="scrollbar-thin max-h-[300px] space-y-1.5 overflow-y-auto">
        {available.length === 0 ? (
          <p className="py-10 text-center text-[12.5px] text-kb-muted">无可添加的成员</p>
        ) : (
          available.map((item) => {
            const active = selected.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
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
                  {item.name}
                </span>
                <span className="shrink-0 text-[12px] text-kb-muted">{item.department}</span>
                <span className="w-20 shrink-0 truncate text-right text-[12px] text-kb-muted">
                  {item.roleName ?? "—"}
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
