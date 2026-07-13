import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormInput } from "@/components/ui/app-form";
import {
  KbButton,
  KbEmptyState,
  KbFormDialog,
  KbFormField,
  KbIconTextButton,
  KbPageContent,
  KbPageHeader,
  KbStatusTag,
} from "@/components/knowledge/ui";
import {
  getCategoryChildren,
  getCategoryNameMaxLength,
  hasSiblingCategoryName,
} from "@/lib/knowledge/model";
import {
  addStoreCategory,
  getKnowledgeStoreVersion,
  getStoreBases,
  getStoreCategories,
  removeStoreCategory,
  subscribeKnowledgeStore,
  updateStoreCategory,
} from "@/lib/knowledge/store";
import type { KnowledgeCategory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { kbCardShell, kbRadius } from "@/lib/knowledge/tokens";

function useKnowledgeStoreVersion() {
  const [version, setVersion] = useState(getKnowledgeStoreVersion);
  useEffect(() => subscribeKnowledgeStore(() => setVersion(getKnowledgeStoreVersion())), []);
  return version;
}

function countBasesInCategory(categoryId: string) {
  return getStoreBases().filter((base) => base.categoryId === categoryId).length;
}

type DialogState =
  | { mode: "create"; parentId?: string; parentName?: string }
  | { mode: "rename"; category: KnowledgeCategory }
  | null;

export function CategoryManagerSection({ embedded = false }: { embedded?: boolean }) {
  useKnowledgeStoreVersion();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(getStoreCategories().map((category) => category.id)),
  );

  const roots = getCategoryChildren();
  const totalCount = getStoreCategories().length;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateRoot = () => setDialog({ mode: "create" });

  const openCreateChild = (category: KnowledgeCategory) => {
    setExpanded((prev) => new Set(prev).add(category.id));
    setDialog({ mode: "create", parentId: category.id, parentName: category.name });
  };

  const openRename = (category: KnowledgeCategory) =>
    setDialog({ mode: "rename", category });

  const handleDelete = (category: KnowledgeCategory) => {
    const childCount = getCategoryChildren(category.id).length;
    const baseCount = countBasesInCategory(category.id);
    if (childCount > 0) {
      toast.error("该分类下仍有子分类，请先删除或移动子分类");
      return;
    }
    if (baseCount > 0) {
      toast.error("该分类下仍有知识库，无法删除");
      return;
    }
    if (typeof window !== "undefined" && !window.confirm(`确认删除分类「${category.name}」？该操作不可恢复。`)) {
      return;
    }
    removeStoreCategory(category.id);
    toast.success("分类已删除");
  };

  const toolbar = (
    <div className="flex items-center justify-between gap-3 px-1">
      <span className="text-[12px] text-kb-muted">
        共 <span className="font-semibold text-kb-body">{totalCount}</span> 个分类
      </span>
      {embedded && (
        <KbButton onClick={openCreateRoot}>
          <Plus className="h-4 w-4 stroke-[1.8]" />
          新建根分类
        </KbButton>
      )}
    </div>
  );

  const treeBody =
    roots.length > 0 ? (
      <div className={cn(kbCardShell, kbRadius.md, "p-2")}>
        {roots.map((category) => (
          <CategoryNode
            key={category.id}
            category={category}
            level={0}
            expanded={expanded}
            onToggle={toggle}
            onAddChild={openCreateChild}
            onRename={openRename}
            onDelete={handleDelete}
          />
        ))}
      </div>
    ) : (
      <div className={cn(kbCardShell, kbRadius.md, "p-6")}>
        <KbEmptyState
          title="还没有任何分类"
          description="创建根分类，用于组织专业知识库，可逐级嵌套维护。"
          action={
            <KbButton onClick={openCreateRoot}>
              <Plus className="h-4 w-4 stroke-[1.8]" />
              新建根分类
            </KbButton>
          }
        />
      </div>
    );

  const dialogNode = (
    <CategoryFormDialog state={dialog} onClose={() => setDialog(null)} />
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {toolbar}
        {treeBody}
        {dialogNode}
      </div>
    );
  }

  return (
    <KbPageContent>
      <KbPageHeader
        label="仅知识库管理员可见"
        title="分类管理"
        description="分类用于组织专业知识库，可嵌套维护。下属仍有子分类或知识库时禁止删除。"
        action={
          <KbButton onClick={openCreateRoot}>
            <Plus className="h-4 w-4 stroke-[1.8]" />
            新建根分类
          </KbButton>
        }
      />
      {toolbar}
      {treeBody}
      {dialogNode}
    </KbPageContent>
  );
}

function CategoryNode({
  category,
  level,
  expanded,
  onToggle,
  onAddChild,
  onRename,
  onDelete,
}: {
  category: KnowledgeCategory;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onAddChild: (category: KnowledgeCategory) => void;
  onRename: (category: KnowledgeCategory) => void;
  onDelete: (category: KnowledgeCategory) => void;
}) {
  const children = getCategoryChildren(category.id);
  const baseCount = countBasesInCategory(category.id);
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(category.id);
  const deletable = !hasChildren && baseCount === 0;

  return (
    <div>
      <div
        className="group flex min-h-10 items-center gap-1.5 rounded-[8px] px-2 text-[12.5px] text-kb-body transition-colors hover:bg-kb-surface-hover"
        style={{ paddingLeft: 8 + level * 18 }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={isOpen ? "折叠" : "展开"}
            onClick={() => onToggle(category.id)}
            className="grid h-5 w-5 place-items-center rounded-[6px] text-kb-muted transition-colors hover:bg-kb-surface hover:text-kb-body"
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="inline-block h-5 w-5" />
        )}

        <span className="flex-1 truncate font-medium">{category.name}</span>

        {baseCount > 0 && <KbStatusTag>{baseCount} 个库</KbStatusTag>}
        {hasChildren && (
          <span className="text-[11px] text-kb-muted">{children.length} 个子类</span>
        )}

        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
          <KbIconTextButton
            icon={Plus}
            label="子分类"
            onClick={() => onAddChild(category)}
          />
          <KbIconTextButton
            icon={Pencil}
            label="重命名"
            onClick={() => onRename(category)}
          />
          <KbIconTextButton
            icon={Trash2}
            label="删除"
            variant="danger-text"
            disabled={!deletable}
            onClick={() => onDelete(category)}
          />
        </div>
      </div>

      {isOpen &&
        children.map((child) => (
          <CategoryNode
            key={child.id}
            category={child}
            level={level + 1}
            expanded={expanded}
            onToggle={onToggle}
            onAddChild={onAddChild}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

function CategoryFormDialog({
  state,
  onClose,
}: {
  state: DialogState;
  onClose: () => void;
}) {
  const open = state !== null;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    setName(state.mode === "rename" ? state.category.name : "");
    setError(null);
  }, [state]);

  if (!state) return null;

  const isRename = state.mode === "rename";
  const title = isRename
    ? "重命名分类"
    : state.parentId
      ? "新建子分类"
      : "新建根分类";

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("请输入分类名称");
      return;
    }
    if (trimmed.length > getCategoryNameMaxLength()) {
      setError(`分类名称不超过 ${getCategoryNameMaxLength()} 个字符`);
      return;
    }

    if (isRename) {
      if (trimmed === state.category.name) {
        onClose();
        return;
      }
      if (hasSiblingCategoryName(state.category.parentId, trimmed, state.category.id)) {
        setError("同一层级下已存在同名分类");
        return;
      }
      updateStoreCategory(state.category.id, { name: trimmed });
      toast.success("分类已重命名");
      onClose();
      return;
    }

    if (hasSiblingCategoryName(state.parentId, trimmed)) {
      setError("同一层级下已存在同名分类");
      return;
    }
    const category: KnowledgeCategory = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      ...(state.parentId ? { parentId: state.parentId } : {}),
    };
    addStoreCategory(category);
    toast.success(state.parentId ? "子分类已创建" : "根分类已创建");
    onClose();
  };

  return (
    <KbFormDialog
      open={open}
      size="compact"
      variant="form"
      title={title}
      titleIcon={isRename ? Pencil : FolderTree}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={submit}>
            {isRename ? "保存" : "创建"}
          </AppDialogButton>
        </>
      }
    >
      {!isRename && state.parentName && (
        <p className="mb-3 text-[12px] text-kb-muted">
          将在「<span className="font-medium text-kb-body">{state.parentName}</span>」下创建子分类
        </p>
      )}
      <KbFormField label="分类名称" icon={Pencil} required className="mb-0" error={error}>
        <AppFormInput
          value={name}
          maxLength={getCategoryNameMaxLength()}
          error={Boolean(error)}
          autoFocus
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="请输入分类名称"
        />
      </KbFormField>
    </KbFormDialog>
  );
}
