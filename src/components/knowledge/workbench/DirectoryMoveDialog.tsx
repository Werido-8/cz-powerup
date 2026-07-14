import { Check, ChevronDown, Folder, FolderInput, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getCategoryChildren,
  getCategoryPathLabel,
  getPersonalDirectoryChildren,
  getPersonalDirectoryPathLabel,
  PERSONAL_DIRECTORY_ROOT_ID,
} from "@/lib/knowledge/model";
import { PROFESSIONAL_CATEGORY_ROOT_ID } from "@/lib/knowledge/store";
import type { KnowledgeCategory, PersonalDirectory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export type DirectoryMoveTarget =
  | { kind: "category"; item: KnowledgeCategory }
  | { kind: "personal"; item: PersonalDirectory };

function getCategoryDescendantIds(categoryId: string): Set<string> {
  const ids = new Set<string>([categoryId]);
  const walk = (id: string) => {
    for (const child of getCategoryChildren(id)) {
      ids.add(child.id);
      walk(child.id);
    }
  };
  walk(categoryId);
  return ids;
}

function getPersonalDescendantIds(directoryId: string): Set<string> {
  const ids = new Set<string>([directoryId]);
  const walk = (id: string) => {
    for (const child of getPersonalDirectoryChildren(id)) {
      ids.add(child.id);
      walk(child.id);
    }
  };
  walk(directoryId);
  return ids;
}

export function DirectoryMoveDialog({
  target,
  loading,
  onClose,
  onConfirm,
}: {
  target: DirectoryMoveTarget | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (targetParentId: string) => void;
}) {
  const open = Boolean(target);
  const [parentId, setParentId] = useState("");
  const [treeOpen, setTreeOpen] = useState(false);

  useEffect(() => {
    if (open) setParentId("");
  }, [open, target]);

  const excludeIds = useMemo(() => {
    if (!target) return new Set<string>();
    return target.kind === "category"
      ? getCategoryDescendantIds(target.item.id)
      : getPersonalDescendantIds(target.item.id);
  }, [target]);

  const rootLabel =
    target?.kind === "category" ? "公共知识库根目录" : "个人空间根目录";
  const rootId =
    target?.kind === "category" ? PROFESSIONAL_CATEGORY_ROOT_ID : PERSONAL_DIRECTORY_ROOT_ID;

  const selectedLabel = useMemo(() => {
    if (!parentId) return "";
    if (parentId === rootId) return rootLabel;
    return target?.kind === "category"
      ? getCategoryPathLabel(parentId)
      : getPersonalDirectoryPathLabel(parentId);
  }, [parentId, rootId, rootLabel, target?.kind]);

  return (
    <AppFormDialog
      open={open}
      size="small"
      title="移动目录"
      titleIcon={FolderInput}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={loading}>
            取消
          </AppDialogButton>
          <AppDialogButton
            variant="primary"
            loading={loading}
            disabled={!parentId}
            onClick={() => parentId && onConfirm(parentId)}
          >
            确认移动
          </AppDialogButton>
        </>
      }
    >
      <div className="space-y-3.5">
        <p className="text-[13px] leading-relaxed text-[#526670]">
          将目录
          <strong className="mx-1 font-semibold text-foreground">{target?.item.name}</strong>
          及其子目录、知识库移动到新的父级位置。
        </p>

        <div className="space-y-1.5">
          <span className="block text-[12px] font-medium text-kb-body">目标父级目录</span>
          <Popover open={treeOpen} onOpenChange={setTreeOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-[8px] border border-kb-border bg-card px-3 text-left text-[13px] transition-colors",
                  "hover:border-primary/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20",
                  parentId ? "text-kb-body" : "text-kb-muted",
                )}
              >
                <Folder className="h-4 w-4 shrink-0 text-warning stroke-[1.8]" />
                <span className="min-w-0 flex-1 truncate">
                  {selectedLabel || "请选择目标父级目录"}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-kb-muted transition-transform",
                    treeOpen && "rotate-180",
                  )}
                  strokeWidth={1.8}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
              align="start"
              sideOffset={4}
            >
              <DirectoryTreePicker
                kind={target?.kind ?? "category"}
                excludeIds={excludeIds}
                value={parentId}
                rootId={rootId}
                rootLabel={rootLabel}
                onSelect={(id) => {
                  setParentId(id);
                  setTreeOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </AppFormDialog>
  );
}

function DirectoryTreePicker({
  kind,
  excludeIds,
  value,
  rootId,
  rootLabel,
  onSelect,
}: {
  kind: "category" | "personal";
  excludeIds: Set<string>;
  value: string;
  rootId: string;
  rootLabel: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const flatItems = useMemo(() => {
    const items: { id: string; label: string }[] = [
      { id: rootId, label: rootLabel },
    ];
    const walk = (parentId?: string, depth = 0) => {
      const children =
        kind === "category"
          ? getCategoryChildren(parentId)
          : getPersonalDirectoryChildren(parentId ?? PERSONAL_DIRECTORY_ROOT_ID);
      for (const item of children) {
        if (excludeIds.has(item.id)) continue;
        items.push({
          id: item.id,
          label:
            kind === "category"
              ? getCategoryPathLabel(item.id)
              : getPersonalDirectoryPathLabel(item.id),
        });
        walk(item.id, depth + 1);
      }
    };
    if (kind === "category") walk();
    else walk(PERSONAL_DIRECTORY_ROOT_ID);
    return items;
  }, [kind, excludeIds, rootId, rootLabel]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return flatItems.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [flatItems, query]);

  return (
    <>
      <div className="border-b border-divider px-2.5 py-2">
        <div className="flex h-8 items-center gap-2 rounded-[6px] border border-kb-border bg-card px-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-kb-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索目录"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-kb-body outline-none placeholder:text-kb-muted"
          />
        </div>
      </div>
      <div className="scrollbar-thin max-h-[240px] overflow-y-auto p-1">
        {query.trim() ? (
          filtered.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-kb-muted">无匹配目录</p>
          ) : (
            filtered.map((item) => (
              <DirRow
                key={item.id}
                label={item.label}
                selected={value === item.id}
                onSelect={() => onSelect(item.id)}
              />
            ))
          )
        ) : (
          <>
            <DirRow
              label={rootLabel}
              selected={value === rootId}
              depth={0}
              onSelect={() => onSelect(rootId)}
            />
            {kind === "category"
              ? getCategoryChildren().map((cat) =>
                  excludeIds.has(cat.id) ? null : (
                    <CategoryBranch
                      key={cat.id}
                      category={cat}
                      depth={0}
                      excludeIds={excludeIds}
                      value={value}
                      onSelect={onSelect}
                    />
                  ),
                )
              : getPersonalDirectoryChildren(PERSONAL_DIRECTORY_ROOT_ID).map((dir) =>
                  excludeIds.has(dir.id) ? null : (
                    <PersonalBranch
                      key={dir.id}
                      directory={dir}
                      depth={0}
                      excludeIds={excludeIds}
                      value={value}
                      onSelect={onSelect}
                    />
                  ),
                )}
          </>
        )}
      </div>
    </>
  );
}

function CategoryBranch({
  category,
  depth,
  excludeIds,
  value,
  onSelect,
}: {
  category: KnowledgeCategory;
  depth: number;
  excludeIds: Set<string>;
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <DirRow
        label={category.name}
        selected={value === category.id}
        depth={depth}
        onSelect={() => onSelect(category.id)}
      />
      {getCategoryChildren(category.id).map((child) =>
        excludeIds.has(child.id) ? null : (
          <CategoryBranch
            key={child.id}
            category={child}
            depth={depth + 1}
            excludeIds={excludeIds}
            value={value}
            onSelect={onSelect}
          />
        ),
      )}
    </div>
  );
}

function PersonalBranch({
  directory,
  depth,
  excludeIds,
  value,
  onSelect,
}: {
  directory: PersonalDirectory;
  depth: number;
  excludeIds: Set<string>;
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <DirRow
        label={directory.name}
        selected={value === directory.id}
        depth={depth}
        onSelect={() => onSelect(directory.id)}
      />
      {getPersonalDirectoryChildren(directory.id).map((child) =>
        excludeIds.has(child.id) ? null : (
          <PersonalBranch
            key={child.id}
            directory={child}
            depth={depth + 1}
            excludeIds={excludeIds}
            value={value}
            onSelect={onSelect}
          />
        ),
      )}
    </div>
  );
}

function DirRow({
  label,
  selected,
  depth = 0,
  onSelect,
}: {
  label: string;
  selected: boolean;
  depth?: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-[6px] py-1.5 pr-2 text-left text-[12.5px] transition-colors",
        selected ? "bg-primary-soft text-accent-foreground" : "text-kb-body hover:bg-kb-surface-hover",
      )}
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      <Folder className="h-3.5 w-3.5 shrink-0 text-warning stroke-[1.8]" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Check
        className={cn("h-3.5 w-3.5 shrink-0 text-primary", selected ? "opacity-100" : "opacity-0")}
      />
    </button>
  );
}
