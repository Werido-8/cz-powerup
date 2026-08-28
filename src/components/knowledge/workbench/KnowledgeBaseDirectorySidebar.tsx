import { Folder, FolderPlus, Pencil, Upload, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { hasSiblingInternalDirectoryName } from "@/lib/knowledge/model";
import {
  addStoreInternalDirectory,
  removeStoreInternalDirectoryCascade,
  updateStoreInternalDirectory,
} from "@/lib/knowledge/store";
import type { KnowledgeFile, KnowledgeInternalDirectory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { InternalDirectoryTreeSelect, INTERNAL_DIRECTORY_ROOT_VALUE } from "./InternalDirectoryTreeSelect";
import {
  KNOWLEDGE_DIRECTORY_ALL_ID,
  KnowledgeInternalDirectoryTree,
} from "./KnowledgeInternalDirectoryTree";

type EditorState =
  | { mode: "create"; parentId?: string; parentLocked: boolean }
  | { mode: "rename"; directory: KnowledgeInternalDirectory };

export function KnowledgeBaseDirectorySidebar({
  baseId,
  directories,
  files,
  selectedId,
  canManage,
  canUpload,
  onSelect,
  onUpload,
}: {
  baseId: string;
  directories: KnowledgeInternalDirectory[];
  files: KnowledgeFile[];
  selectedId: string;
  canManage: boolean;
  canUpload: boolean;
  onSelect: (directoryId: string) => void;
  onUpload: () => void;
}) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeInternalDirectory | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!editor) return;
    if (editor.mode === "rename") {
      setName(editor.directory.name);
      setParentId("");
    } else {
      setName("");
      setParentId(editor.parentId ?? (editor.parentLocked ? INTERNAL_DIRECTORY_ROOT_VALUE : ""));
    }
    setNameError("");
  }, [editor]);

  const submitEditor = () => {
    const normalized = name.trim();
    if (!normalized || !editor) return;

    const resolvedParentId =
      editor.mode === "rename"
        ? editor.directory.parentId
        : !parentId || parentId === INTERNAL_DIRECTORY_ROOT_VALUE
          ? undefined
          : parentId;

    if (
      hasSiblingInternalDirectoryName(
        baseId,
        resolvedParentId,
        normalized,
        editor.mode === "rename" ? editor.directory.id : undefined,
      )
    ) {
      setNameError("同一目录下已存在同名目录");
      return;
    }

    if (editor.mode === "rename") {
      updateStoreInternalDirectory(editor.directory.id, { name: normalized });
      toast.success(`目录已重命名为「${normalized}」`);
    } else {
      const directory: KnowledgeInternalDirectory = {
        id: `dir-${baseId}-${Date.now()}`,
        knowledgeBaseId: baseId,
        parentId: resolvedParentId,
        name: normalized,
      };
      addStoreInternalDirectory(directory);
      onSelect(directory.id);
      toast.success(`已新建目录「${normalized}」`);
    }
    setEditor(null);
  };

  return (
    <>
      <aside className="flex min-h-0 w-[224px] shrink-0 flex-col border-r border-[#E4EEF0] bg-[#FBFDFD] max-[900px]:w-full max-[900px]:max-h-[260px] max-[900px]:border-b max-[900px]:border-r-0">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#E8F0F2] px-3.5">
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-kb-heading">库内目录</div>
            <div className="mt-0.5 text-[10.5px] text-kb-muted">{directories.length} 个目录</div>
          </div>
          {canUpload && <DirectoryActionButton icon={Upload} label="上传文件" onClick={onUpload} />}
          {canManage && (
            <DirectoryActionButton
              icon={FolderPlus}
              label="新建目录"
              onClick={() => setEditor({ mode: "create", parentLocked: false })}
            />
          )}
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 py-2.5">
          <KnowledgeInternalDirectoryTree
            baseId={baseId}
            directories={directories}
            files={files}
            selectedId={selectedId}
            showAll
            onSelect={(directoryId) => directoryId && onSelect(directoryId)}
            onCreate={
              canManage
                ? (parentId) => setEditor({ mode: "create", parentId, parentLocked: true })
                : undefined
            }
            onRename={
              canManage ? (directory) => setEditor({ mode: "rename", directory }) : undefined
            }
            onDelete={canManage ? setDeleteTarget : undefined}
          />
        </div>
      </aside>

      <AppFormDialog
        open={Boolean(editor)}
        size="small"
        title={editor?.mode === "rename" ? "编辑目录" : "新建目录"}
        titleIcon={editor?.mode === "rename" ? Pencil : FolderPlus}
        onClose={() => setEditor(null)}
        footer={
          <>
            <AppDialogButton variant="outline" onClick={() => setEditor(null)}>
              取消
            </AppDialogButton>
            <AppDialogButton variant="primary" disabled={!name.trim()} onClick={submitEditor}>
              确认
            </AppDialogButton>
          </>
        }
      >
        {editor?.mode === "create" && (
          <label className="mb-4 block">
            <span className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-kb-body">
              <Folder className="h-3.5 w-3.5 stroke-[1.8] text-kb-muted" />
              父级目录
              {editor.parentLocked ? (
                <span className="font-normal text-kb-muted">（已定位，不可更改）</span>
              ) : (
                <span className="font-normal text-kb-muted">（可不选）</span>
              )}
            </span>
            <InternalDirectoryTreeSelect
              directories={directories}
              value={parentId}
              includeRoot
              rootLabel="根目录"
              disabled={editor.parentLocked}
              placeholder="不选择则创建在根目录"
              onChange={setParentId}
            />
            <span className="mt-1.5 block text-[11px] text-kb-muted">
              {editor.parentLocked
                ? "将在当前目录下创建子目录"
                : "可指定上级目录，不选则创建在知识库根目录"}
            </span>
          </label>
        )}
        <label className="block">
          <span className="mb-2 block text-[12px] font-medium text-kb-body">目录名称</span>
          <input
            autoFocus
            value={name}
            maxLength={30}
            onChange={(event) => {
              setName(event.target.value);
              setNameError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitEditor();
            }}
            placeholder="请输入目录名称"
            className={cn(
              "h-9 w-full rounded-[8px] border bg-white px-3 text-[13px] text-kb-heading outline-none placeholder:text-kb-muted focus:border-primary focus:ring-2 focus:ring-primary/10",
              nameError ? "border-[#C94747]" : "border-kb-border",
            )}
          />
          {nameError ? (
            <span className="mt-1.5 block text-[11px] text-[#C94747]">{nameError}</span>
          ) : (
            <span className="mt-1.5 block text-[11px] text-kb-muted">不超过 30 个字符</span>
          )}
        </label>
      </AppFormDialog>

      <AppFormDialog
        open={Boolean(deleteTarget)}
        size="small"
        title="删除目录"
        titleIcon={FolderPlus}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <AppDialogButton variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </AppDialogButton>
            <AppDialogButton
              variant="primary"
              className="border-[#C94747] bg-[#C94747] hover:border-[#B23C3C] hover:bg-[#B23C3C]"
              onClick={() => {
                if (!deleteTarget) return;
                removeStoreInternalDirectoryCascade(deleteTarget.id);
                if (selectedId === deleteTarget.id) onSelect(KNOWLEDGE_DIRECTORY_ALL_ID);
                toast.success(`目录「${deleteTarget.name}」已删除，原文件已移至根目录`);
                setDeleteTarget(null);
              }}
            >
              确认删除
            </AppDialogButton>
          </>
        }
      >
        <p className="text-[13px] leading-6 text-kb-body">
          确认删除目录「
          <strong className="font-semibold text-kb-heading">{deleteTarget?.name}</strong>」？
          子目录会一并删除，目录内文件将移至知识库根目录。
        </p>
      </AppFormDialog>
    </>
  );
}

function DirectoryActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-[6px] text-[#6E858E] transition-colors",
        "hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
      )}
    >
      <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
    </button>
  );
}
