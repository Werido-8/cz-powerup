import { useEffect, useMemo, useState } from "react";
import { X, Save, Trash2, FolderPlus, Check } from "lucide-react";
import type { Collection } from "@/lib/mock/scenario";

export type NoteDraft = {
  title: string;
  body: string;
  tag?: string;
  docId?: string;
  collectionIds?: string[];
};

export function NoteEditor({
  open,
  initial,
  collections = [],
  onClose,
  onSave,
  onDelete,
  onCreateCollection,
}: {
  open: boolean;
  initial?: NoteDraft & { id?: string };
  collections?: Collection[];
  onClose: () => void;
  onSave: (n: NoteDraft) => void;
  onDelete?: () => void;
  onCreateCollection?: (name: string) => string; // returns new collection id
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setBody(initial?.body ?? "");
      setTag(initial?.tag ?? "");
      setCollectionIds(initial?.collectionIds ?? []);
      setCreating(false);
      setNewName("");
    }
  }, [open, initial?.id]); // eslint-disable-line

  const sortedCollections = useMemo(() => collections, [collections]);

  if (!open) return null;

  const toggleColl = (id: string) =>
    setCollectionIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const handleCreate = () => {
    const name = newName.trim();
    if (!name || !onCreateCollection) return;
    const id = onCreateCollection(name);
    setCollectionIds((cur) => [...cur, id]);
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card-hover)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">{initial?.id ? "编辑笔记" : "新建笔记"}</h2>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1 block text-[11.5px] font-medium text-muted-foreground">标题</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="一句话总结要点…"
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
        />

        <label className="mb-1 block text-[11.5px] font-medium text-muted-foreground">标签</label>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {["AGC", "典型操作", "差动保护", "AVC", "异常处置", "新员工"].map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                tag === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-1 flex items-center justify-between">
          <label className="text-[11.5px] font-medium text-muted-foreground">
            归入目录(可多选)
          </label>
          {onCreateCollection && !creating && (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-primary hover:bg-primary-soft/40"
            >
              <FolderPlus className="h-3 w-3" /> 新建目录
            </button>
          )}
        </div>
        {creating && (
          <div className="mb-2 flex gap-1.5">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="目录名称…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] outline-none focus:border-primary"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              创建
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-[12px] hover:bg-muted"
            >
              取消
            </button>
          </div>
        )}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {sortedCollections.length === 0 ? (
            <span className="text-[11.5px] text-muted-foreground">暂无目录,可点击右上「新建目录」</span>
          ) : (
            sortedCollections.map((c) => {
              const on = collectionIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleColl(c.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {on && <Check className="h-3 w-3" />}
                  {c.name}
                </button>
              );
            })
          )}
        </div>

        <label className="mb-1 block text-[11.5px] font-medium text-muted-foreground">内容</label>
        <textarea
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="按要点 / 步骤 / 易错点记录…"
          className="w-full resize-none rounded-lg border border-border bg-background p-3 text-[13px] outline-none focus:border-primary"
        />

        <div className="mt-5 flex items-center justify-between">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-[12px] text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted"
            >
              取消
            </button>
            <button
              disabled={!title.trim()}
              onClick={() =>
                onSave({
                  title: title.trim(),
                  body,
                  tag: tag || undefined,
                  docId: initial?.docId,
                  collectionIds,
                })
              }
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> 保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
