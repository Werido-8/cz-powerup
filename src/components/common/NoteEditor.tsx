import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Check,
  FileText,
  FolderOpen,
  NotebookPen,
  Pencil,
  Plus,
  Save,
  Tag,
  Trash2,
  Type,
} from "lucide-react";
import type { Collection } from "@/lib/mock/scenario";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { AppFormField, AppFormInput, AppFormTextarea } from "@/components/ui/app-form";
import { cn } from "@/lib/utils";

export type NoteDraft = {
  title: string;
  body: string;
  tag?: string;
  docId?: string;
  collectionIds?: string[];
};

const DEFAULT_TAGS = ["AGC", "典型操作", "差动保护", "AVC", "异常处置", "新员工"];

const chipBase =
  "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] transition-colors";

export function NoteEditor({
  open,
  initial,
  collections = [],
  extraTags = [],
  onClose,
  onSave,
  onDelete,
  onCreateCollection,
  onRenameTag,
}: {
  open: boolean;
  initial?: NoteDraft & { id?: string };
  collections?: Collection[];
  extraTags?: string[];
  onClose: () => void;
  onSave: (n: NoteDraft) => void;
  onDelete?: () => void;
  onCreateCollection?: (name: string) => string;
  onRenameTag?: (from: string, to: string) => void;
}) {
  const isEditing = Boolean(initial?.id);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [tagOptions, setTagOptions] = useState<string[]>(DEFAULT_TAGS);
  const [creating, setCreating] = useState<null | "tag" | "dir">(null);
  const creatingRef = useRef<null | "tag" | "dir">(null);
  const [createName, setCreateName] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setBody(initial?.body ?? "");
    setTag(initial?.tag ?? "");
    setCollectionId(initial?.collectionIds?.[0] ?? "");
    const merged = [...DEFAULT_TAGS];
    for (const item of [...extraTags, initial?.tag ?? ""]) {
      if (item && !merged.includes(item)) merged.push(item);
    }
    setTagOptions(merged);
    creatingRef.current = null;
    setCreating(null);
    setCreateName("");
    setEditingTag(null);
    setEditName("");
  }, [open, initial?.id]); // eslint-disable-line

  const sortedCollections = useMemo(() => collections, [collections]);

  const startCreate = (kind: "tag" | "dir") => {
    setEditingTag(null);
    creatingRef.current = kind;
    setCreating(kind);
    setCreateName("");
  };

  const cancelCreate = () => {
    creatingRef.current = null;
    setCreating(null);
    setCreateName("");
  };

  const confirmCreate = () => {
    const kind = creatingRef.current;
    const name = createName.trim();
    if (!kind || !name) return;
    if (kind === "tag") {
      if (!tagOptions.includes(name)) setTagOptions((current) => [...current, name]);
      setTag(name);
    }
    if (kind === "dir") {
      if (!onCreateCollection) return;
      const exists = sortedCollections.find((item) => item.name === name);
      const id = exists?.id ?? onCreateCollection(name);
      setCollectionId(id);
    }
    cancelCreate();
  };

  const confirmRenameTag = () => {
    const from = editingTag;
    const to = editName.trim();
    if (!from) return;
    if (!to || to === from) {
      setEditingTag(null);
      setEditName("");
      return;
    }
    if (tagOptions.includes(to) && to !== from) {
      setTag((current) => (current === from ? to : current));
      setTagOptions((current) => current.filter((item) => item !== from));
      onRenameTag?.(from, to);
    } else {
      setTagOptions((current) => current.map((item) => (item === from ? to : item)));
      if (tag === from) setTag(to);
      onRenameTag?.(from, to);
    }
    setEditingTag(null);
    setEditName("");
  };

  const onCreateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmCreate();
    }
    if (event.key === "Escape") cancelCreate();
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      body,
      tag: tag || undefined,
      docId: initial?.docId,
      collectionIds: collectionId ? [collectionId] : [],
    });
  };

  return (
    <AppFormDialog
      open={open}
      size="medium"
      title={isEditing ? "编辑笔记" : "新建笔记"}
      titleIcon={isEditing ? Pencil : NotebookPen}
      onClose={onClose}
      footer={
        <>
          {onDelete ? (
            <AppDialogButton
              variant="outline"
              onClick={onDelete}
              className="mr-auto border-destructive/30 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              删除
            </AppDialogButton>
          ) : null}
          <AppDialogButton variant="outline" onClick={onClose}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" disabled={!title.trim()} onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            保存
          </AppDialogButton>
        </>
      }
    >
      <AppFormField label="标题" icon={Type} required>
        <AppFormInput
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="一句话总结要点…"
        />
      </AppFormField>

      <AppFormField label="标签" icon={Tag}>
        <div className="flex flex-wrap items-center gap-1.5">
          {tagOptions.map((item) =>
            editingTag === item ? (
              <input
                key={item}
                autoFocus
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                onBlur={confirmRenameTag}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    confirmRenameTag();
                  }
                  if (event.key === "Escape") {
                    setEditingTag(null);
                    setEditName("");
                  }
                }}
                className={cn(
                  chipBase,
                  "w-28 border-primary bg-white text-foreground outline-none focus:ring-1 focus:ring-primary/20",
                )}
              />
            ) : (
              <span
                key={item}
                className={cn(
                  "group",
                  chipBase,
                  tag === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => setTag(item === tag ? "" : item)}
                  className="max-w-[140px] truncate"
                >
                  {item}
                </button>
                <button
                  type="button"
                  aria-label={`编辑标签 ${item}`}
                  onClick={() => {
                    setCreating(null);
                    setEditingTag(item);
                    setEditName(item);
                  }}
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                    tag === item ? "hover:bg-white/20" : "hover:bg-muted",
                  )}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </span>
            ),
          )}
          <CreateChip
            active={creating === "tag"}
            value={createName}
            placeholder="新标签…"
            ariaLabel="新建标签"
            onStart={() => startCreate("tag")}
            onChange={setCreateName}
            onConfirm={confirmCreate}
            onCancel={cancelCreate}
            onKeyDown={onCreateKeyDown}
          />
        </div>
      </AppFormField>

      <AppFormField label="归入目录" icon={FolderOpen}>
        <div className="flex flex-wrap items-center gap-1.5">
          {sortedCollections.length === 0 && creating !== "dir" && (
            <span className="text-[11.5px] text-muted-foreground">暂无目录，可点击 + 新建</span>
          )}
          {sortedCollections.map((item) => {
            const selected = collectionId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCollectionId(selected ? "" : item.id)}
                className={cn(
                  chipBase,
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40",
                )}
              >
                {selected && <Check className="h-3 w-3" />}
                {item.name}
              </button>
            );
          })}
          {onCreateCollection && (
            <CreateChip
              active={creating === "dir"}
              value={createName}
              placeholder="新目录…"
              ariaLabel="新建目录"
              onStart={() => startCreate("dir")}
              onChange={setCreateName}
              onConfirm={confirmCreate}
              onCancel={cancelCreate}
              onKeyDown={onCreateKeyDown}
            />
          )}
        </div>
      </AppFormField>

      <AppFormField label="内容" icon={FileText} className="mb-0">
        <AppFormTextarea
          rows={12}
          value={body}
          showCount={false}
          onChange={(event) => setBody(event.target.value)}
          placeholder="按要点 / 步骤 / 易错点记录…"
          className="min-h-[280px] resize-y pb-3"
        />
      </AppFormField>
    </AppFormDialog>
  );
}

function CreateChip({
  active,
  value,
  placeholder,
  ariaLabel,
  onStart,
  onChange,
  onConfirm,
  onCancel,
  onKeyDown,
}: {
  active: boolean;
  value: string;
  placeholder: string;
  ariaLabel: string;
  onStart: () => void;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  if (active) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          if (value.trim()) onConfirm();
          else onCancel();
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          chipBase,
          "w-28 border-primary bg-white text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/20",
        )}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onStart}
      className={cn(
        chipBase,
        "min-w-7 justify-center border-dashed border-primary/45 px-0 text-primary hover:border-primary hover:bg-primary-soft/40",
      )}
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  );
}
