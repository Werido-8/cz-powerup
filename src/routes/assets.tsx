import { createFileRoute, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Star,
  NotebookPen,
  Trash2,
  Pencil,
  Plus,
  FolderOpen,
  Clock,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { DOCS, QUESTIONS, type Question } from "@/lib/mock/data";
import { useMockStore, type NoteItem } from "@/lib/mock/store";
import { NoteEditor } from "@/components/common/NoteEditor";
import { FAVORITE_META } from "@/lib/mock/learning-hub";
import { KbDataTable, KbDataTableRow } from "@/components/knowledge/ui";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { getFileById } from "@/lib/knowledge/model";
import { openFileDetailInNewTab } from "@/lib/knowledge/searchNav";
import { LearningBreadcrumb, LearningPageShell } from "@/components/learning/learning-breadcrumb";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  ModuleTabs,
  SearchBar,
  FilterComboSelect,
  listActionClass,
  Tag,
  ActionButton,
  EmptyState,
} from "@/components/learning/ui";

const assetsSearchSchema = z.object({
  tab: z.enum(["note", "fav"]).optional().catch(undefined),
});

export const Route = createFileRoute("/assets")({
  validateSearch: assetsSearchSchema,
  component: AssetsPage,
  head: () => ({ meta: [{ title: "个人沉淀 · 涉网运行能力智能提升平台" }] }),
});

type Tab = "note" | "fav";

const QUESTION_TYPE_LABEL: Record<string, string> = {
  single: "单选",
  multiple: "多选",
  judge: "判断",
  text: "简答",
};

const TAB_FILTER_OPTIONS: Record<Tab, { value: string; label: string }[]> = {
  fav: [
    { value: "all", label: "全部" },
    { value: "资料", label: "资料" },
    { value: "题目", label: "题目" },
  ],
  note: [
    { value: "all", label: "全部" },
    { value: "AGC", label: "AGC/两细则" },
    { value: "主变", label: "主变/操作" },
    { value: "继电保护", label: "继电保护" },
  ],
};

const SEARCH_PLACEHOLDERS: Record<Tab, string> = {
  fav: "搜索收藏资料或题目",
  note: "搜索笔记标题或内容",
};

const FILTER_PLACEHOLDERS: Record<Tab, string> = {
  fav: "全部类型",
  note: "全部分类",
};

const ASSET_TABS: { key: Tab; label: string; desc: string; icon: typeof Star }[] = [
  { key: "note", label: "学习笔记", desc: "要点、来源与更新记录", icon: NotebookPen },
  { key: "fav", label: "我的收藏", desc: "资料与收藏题目", icon: Star },
];

const FAVORITE_LIST_GRID =
  "grid-cols-[minmax(240px,1.8fr)_72px_minmax(120px,0.85fr)_minmax(140px,0.9fr)_110px_88px] min-w-[880px]";

function AssetsPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = useSearch({ from: "/assets" });
  const {
    state,
    removeFavorite,
    removeFavoriteQuestion,
    addNote,
    updateNote,
    removeNote,
    createCollection,
    updateCollection,
    removeCollection,
    addToCollection,
  } = useMockStore();

  const [tab, setTab] = useState<Tab>(search.tab ?? "note");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [tabFilters, setTabFilters] = useState<Record<Tab, string>>({
    fav: "all",
    note: "all",
  });
  const [editor, setEditor] = useState<{ open: boolean; note?: NoteItem }>({ open: false });
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const activeFilter = tabFilters[tab];
  const setActiveFilter = (value: string) => {
    setTabFilters((prev) => ({ ...prev, [tab]: value }));
  };

  useEffect(() => {
    if (search.tab) setTab(search.tab);
  }, [search.tab]);

  const setTabAndUrl = (t: Tab) => {
    setTab(t);
    setSearchInput("");
    setAppliedQuery("");
    navigate({ to: "/assets", search: { tab: t }, replace: true });
  };

  const handleSearch = () => {
    setAppliedQuery(searchInput.trim());
  };

  const filteredFavorites = useMemo(() => {
    return FAVORITE_META.filter((f) => state.favorites.includes(f.docId))
      .map((meta) => {
        const doc = DOCS.find((d) => d.id === meta.docId);
        return doc ? { doc, meta } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .filter(({ doc, meta }) => {
        if (
          appliedQuery &&
          !doc.title.includes(appliedQuery) &&
          !meta.topicTitle.includes(appliedQuery)
        ) {
          return false;
        }
        if (activeFilter === "题目") return false;
        if (activeFilter === "all" || activeFilter === "资料") return true;
        return true;
      });
  }, [state.favorites, appliedQuery, activeFilter]);

  const filteredFavoriteQuestions = useMemo(() => {
    return state.favoriteQuestions
      .map((qid) => QUESTIONS.find((q) => q.id === qid))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .filter((q) => {
        if (
          appliedQuery &&
          !q.stem.includes(appliedQuery) &&
          !q.knowledgePoints.join("").includes(appliedQuery)
        ) {
          return false;
        }
        if (activeFilter === "all" || activeFilter === "题目") return true;
        return false;
      })
      .map((q) => ({ q, typeLabel: QUESTION_TYPE_LABEL[q.type] ?? q.type }));
  }, [state.favoriteQuestions, appliedQuery, activeFilter]);

  const filteredNotes = useMemo(() => {
    return state.notes.filter((n) => {
      if (activeFolder !== "all" && !(n.collectionIds ?? []).includes(activeFolder)) return false;
      const haystack = `${n.title}${n.body}${n.tag ?? ""}`;
      if (appliedQuery && !haystack.includes(appliedQuery)) return false;
      if (activeFilter !== "all" && !haystack.includes(activeFilter)) return false;
      return true;
    });
  }, [state.notes, appliedQuery, activeFilter, activeFolder]);

  const handleOpenFavoriteDoc = (docId: string) => {
    const doc = DOCS.find((item) => item.id === docId);
    if (!doc) return;
    const knowledgeFile = doc.knowledgeFileId ? getFileById(doc.knowledgeFileId) : undefined;
    if (knowledgeFile) {
      openFileDetailInNewTab(router, knowledgeFile, { from: "/assets?tab=fav" });
      return;
    }
    const href = router.buildLocation({
      to: "/learn/doc/$id",
      params: { id: doc.id },
    }).href;
    window.open(href, "_blank", "noreferrer");
  };

  const handleSaveNote = (n: Parameters<typeof addNote>[0]) => {
    if (editor.note) {
      const prevIds = editor.note.collectionIds ?? [];
      updateNote(editor.note.id, n);
      (n.collectionIds ?? []).forEach((cid) => {
        if (!prevIds.includes(cid)) addToCollection(cid, { noteId: editor.note!.id });
      });
      toast.success("笔记已更新");
    } else {
      const id = addNote(n);
      (n.collectionIds ?? []).forEach((cid) => addToCollection(cid, { noteId: id }));
      toast.success("笔记已保存");
    }
    setEditor({ open: false });
  };

  return (
    <LearningPageShell>
      <LearningBreadcrumb current="assets" />
      <PageHeader
        title="个人沉淀"
        subtitle="把收藏资料、题目和学习笔记整理为可复用的个人知识成果。"
        size="md"
        className="mb-3 shrink-0"
      />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ModuleTabs
          tabs={ASSET_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            desc: t.desc,
            icon: <t.icon className="h-4 w-4" />,
          }))}
          value={tab}
          onChange={setTabAndUrl}
          className="shrink-0 bg-transparent px-0"
        />

        <div className="flex shrink-0 flex-col gap-3 border-b border-divider py-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSearch={handleSearch}
            placeholder={SEARCH_PLACEHOLDERS[tab]}
            extra={
              <FilterComboSelect
                options={TAB_FILTER_OPTIONS[tab]}
                value={activeFilter}
                onChange={setActiveFilter}
                placeholder={FILTER_PLACEHOLDERS[tab]}
                searchable={false}
                className="h-[38px] min-h-[38px] rounded-md"
              />
            }
          />
          {tab === "note" && (
            <ActionButton onClick={() => setEditor({ open: true })}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              新建笔记
            </ActionButton>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden pt-4">
          {tab === "fav" && (
              <div className="scrollbar-thin h-full overflow-auto rounded-[12px] border border-kb-border">
                {filteredFavorites.length === 0 && filteredFavoriteQuestions.length === 0 ? (
                  <EmptyState description="还没有收藏内容，可在资料检索、学习页面或错题本点击「收藏」。" />
                ) : (
                  <KbDataTable
                    variant="flat"
                    minWidth={FAVORITE_LIST_GRID}
                    className="border-0 shadow-none"
                    header={
                      <>
                        <span>标题</span>
                        <span>类型</span>
                        <span>分类</span>
                        <span>来源</span>
                        <span>更新时间</span>
                        <span className="text-right">操作</span>
                      </>
                    }
                  >
                    {filteredFavorites.map(({ doc, meta }) => (
                      <KbDataTableRow
                        key={doc.id}
                        variant="flat"
                        className={FAVORITE_LIST_GRID}
                        onClick={() => handleOpenFavoriteDoc(doc.id)}
                      >
                        <span className="min-w-0 truncate font-medium text-kb-heading">{doc.title}</span>
                        <span className="text-kb-muted">资料</span>
                        <span className="truncate text-kb-muted">{doc.docType}</span>
                        <span className="truncate text-kb-muted">{meta.source}</span>
                        <span className="truncate tabular-nums text-kb-muted">{doc.updatedAt}</span>
                        <span className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[12px] text-primary transition-colors hover:bg-primary-soft/40"
                            onClick={() => {
                              removeFavorite(doc.id);
                              toast.success("已取消收藏");
                            }}
                          >
                            <Star className="h-3.5 w-3.5" />
                            取消收藏
                          </button>
                        </span>
                      </KbDataTableRow>
                    ))}
                    {filteredFavoriteQuestions.map(({ q, typeLabel }) => (
                      <KbDataTableRow
                        key={q.id}
                        variant="flat"
                        className={FAVORITE_LIST_GRID}
                        onClick={() => setPreviewQuestion(q)}
                      >
                        <span className="min-w-0 truncate font-medium text-kb-heading">{q.stem}</span>
                        <span className="text-kb-muted">题目</span>
                        <span className="truncate text-kb-muted">
                          {[typeLabel, ...q.knowledgePoints.slice(0, 1)].join(" · ")}
                        </span>
                        <span className="truncate text-kb-muted">错题本收藏</span>
                        <span className="truncate tabular-nums text-kb-muted">—</span>
                        <span className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[12px] text-primary transition-colors hover:bg-primary-soft/40"
                            onClick={() => {
                              removeFavoriteQuestion(q.id);
                              toast.success("已取消收藏");
                            }}
                          >
                            <Star className="h-3.5 w-3.5 fill-current" />
                            取消收藏
                          </button>
                        </span>
                      </KbDataTableRow>
                    ))}
                  </KbDataTable>
                )}
              </div>
            )}

            {/* 笔记 */}
            {tab === "note" && (
              <div className="grid h-full min-h-0 gap-4 overflow-hidden lg:grid-cols-[220px_1fr]">
                <aside className="scrollbar-thin min-h-0 overflow-y-auto rounded-2xl border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-[11.5px] font-medium text-muted-foreground">
                      笔记目录
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt("新目录名称");
                        if (!name?.trim()) return;
                        createCollection({
                          name: name.trim(),
                          desc: "",
                          tags: [],
                          docIds: [],
                          noteIds: [],
                          scenarioIds: [],
                        });
                        toast.success("已创建目录");
                      }}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-primary hover:bg-primary-soft/40"
                    >
                      <Plus className="h-3 w-3" /> 新建
                    </button>
                  </div>
                  <ul className="space-y-0.5">
                    <FolderRow
                      label="全部笔记"
                      count={state.notes.length}
                      active={activeFolder === "all"}
                      onClick={() => setActiveFolder("all")}
                    />
                    {state.collections.map((c) => (
                      <FolderRow
                        key={c.id}
                        label={c.name}
                        count={state.notes.filter((n) => n.collectionIds?.includes(c.id)).length}
                        active={activeFolder === c.id}
                        onClick={() => setActiveFolder(c.id)}
                        onRename={(name) => {
                          updateCollection(c.id, { name });
                          toast.success("目录已重命名");
                        }}
                        onDelete={() => {
                          if (!window.confirm(`删除目录「${c.name}」？目录内笔记不会被删除。`)) return;
                          if (activeFolder === c.id) setActiveFolder("all");
                          removeCollection(c.id);
                          toast.success("目录已删除");
                        }}
                      />
                    ))}
                  </ul>
                </aside>
                <div className="scrollbar-thin min-h-0 space-y-3 overflow-y-auto">
                  {filteredNotes.length === 0 ? (
                    <EmptyState description="此目录下还没有笔记，点击「新建笔记」开始记录。" />
                  ) : (
                    filteredNotes.map((n) => {
                      const relatedDoc = n.docId ? DOCS.find((d) => d.id === n.docId) : undefined;
                      return (
                        <article
                          key={n.id}
                          className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors duration-200 hover:border-primary/30"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[15px] font-semibold leading-snug text-foreground">
                                {n.title}
                              </h3>
                              {n.tag && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <Tag>{n.tag}</Tag>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
                              <button
                                type="button"
                                className={listActionClass("text")}
                                onClick={() => setEditor({ open: true, note: n })}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                查看
                              </button>
                              <button
                                type="button"
                                className={listActionClass("text")}
                                onClick={() => setEditor({ open: true, note: n })}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                编辑
                              </button>
                              <button
                                type="button"
                                className={listActionClass("text")}
                                onClick={() => {
                                  removeNote(n.id);
                                  toast.success("笔记已删除");
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                删除
                              </button>
                            </div>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-[1.75] text-kb-body">
                            {n.body}
                          </p>
                          <div className="mt-3 flex min-w-0 items-center gap-x-5 overflow-hidden border-t border-divider pt-3 text-[12px]">
                            {relatedDoc && (
                              <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-kb-muted">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                                <span className="shrink-0 text-kb-heading/80">关联资料</span>
                                <button
                                  type="button"
                                  className="min-w-0 truncate text-left text-primary hover:underline"
                                  onClick={() => handleOpenFavoriteDoc(relatedDoc.id)}
                                >
                                  {relatedDoc.title}
                                </button>
                              </span>
                            )}
                            <span className="inline-flex shrink-0 items-center gap-1.5 text-kb-muted">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-warning" />
                              <span className="text-kb-heading/80">创建时间</span>
                              <span className="tabular-nums">{n.createdAt}</span>
                            </span>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 本期暂不开放：智能题单
      {tab === "quizsets" && (
        ...
      )}
      */}
        </div>
      </section>

      <FavoriteQuestionDialog
        question={previewQuestion}
        onClose={() => setPreviewQuestion(null)}
      />

      <NoteEditor
        open={editor.open}
        initial={editor.note}
        collections={state.collections}
        extraTags={state.notes.map((item) => item.tag).filter((item): item is string => Boolean(item))}
        onClose={() => setEditor({ open: false })}
        onSave={handleSaveNote}
        onRenameTag={(from, to) => {
          state.notes.forEach((item) => {
            if (item.tag === from) updateNote(item.id, { tag: to });
          });
        }}
        onCreateCollection={(name) =>
          createCollection({
            name,
            desc: "",
            tags: [],
            docIds: [],
            noteIds: [],
            scenarioIds: [],
          })
        }
        onDelete={
          editor.note
            ? () => {
                removeNote(editor.note!.id);
                toast.success("笔记已删除");
                setEditor({ open: false });
              }
            : undefined
        }
      />
    </LearningPageShell>
  );
}

function FolderRow({
  label,
  count,
  active,
  onClick,
  onRename,
  onDelete,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const canManage = Boolean(onRename || onDelete);

  useEffect(() => {
    setDraft(label);
  }, [label]);

  const commitRename = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === label) {
      setDraft(label);
      return;
    }
    onRename?.(next);
  };

  if (editing) {
    return (
      <li>
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitRename();
            }
            if (event.key === "Escape") {
              setDraft(label);
              setEditing(false);
            }
          }}
          aria-label="目录名称"
          className="w-full rounded-lg border border-primary bg-background px-2 py-1.5 text-[12.5px] text-foreground outline-none focus:ring-1 focus:ring-primary/20"
        />
      </li>
    );
  }

  return (
    <li>
      <div
        className={cn(
          "group relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-foreground/80 hover:bg-primary-soft/70",
        )}
      >
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 truncate text-left"
        >
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
        <span
          className={cn(
            "tabular-nums text-[10.5px] transition-opacity",
            canManage && "group-hover:opacity-0 group-focus-within:opacity-0",
            active ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {count}
        </span>
        {canManage && (
          <span className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            {onRename && (
              <button
                type="button"
                aria-label={`编辑目录 ${label}`}
                title="编辑"
                onClick={() => setEditing(true)}
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-md transition-colors",
                  active
                    ? "text-primary-foreground hover:bg-white/20"
                    : "text-primary hover:bg-white",
                )}
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                aria-label={`删除目录 ${label}`}
                title="删除"
                onClick={onDelete}
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-md transition-colors",
                  active
                    ? "text-primary-foreground hover:bg-white/20"
                    : "text-destructive hover:bg-white",
                )}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </span>
        )}
      </div>
    </li>
  );
}

function formatQuestionAnswer(q: Question) {
  if (q.type === "judge") {
    if (q.answer === "T") return "正确";
    if (q.answer === "F") return "错误";
  }
  if (Array.isArray(q.answer)) return q.answer.join("、");
  return q.answer;
}

function FavoriteQuestionDialog({
  question,
  onClose,
}: {
  question: Question | null;
  onClose: () => void;
}) {
  const typeLabel = question ? (QUESTION_TYPE_LABEL[question.type] ?? question.type) : "";

  return (
    <AppFormDialog
      open={Boolean(question)}
      onClose={onClose}
      title="查看题目"
      size="medium"
      variant="detail"
      footer={
        <AppDialogButton variant="outline" onClick={onClose}>
          关闭
        </AppDialogButton>
      }
    >
      {question && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[6px] bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary">
              {typeLabel}
            </span>
            {question.knowledgePoints.map((point) => (
              <span
                key={point}
                className="rounded-[6px] border border-kb-border px-2 py-1 text-[11px] text-kb-muted"
              >
                {point}
              </span>
            ))}
          </div>
          <p className="text-[15px] font-semibold leading-6 text-kb-heading">{question.stem}</p>
          {question.options && question.options.length > 0 && (
            <ul className="space-y-1.5">
              {question.options.map((option) => (
                <li
                  key={option.key}
                  className="rounded-[8px] border border-kb-border bg-[#F8FAFB] px-3 py-2 text-[13px] text-kb-body"
                >
                  <span className="mr-2 font-medium text-kb-heading">{option.key}.</span>
                  {option.label}
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-[10px] border border-kb-border bg-kb-surface/40 px-4 py-3 text-[13px] leading-relaxed text-kb-body">
            <p>
              <span className="font-medium text-kb-heading">正确答案：</span>
              {formatQuestionAnswer(question)}
            </p>
            <p className="mt-2">
              <span className="font-medium text-kb-heading">解析：</span>
              {question.analysis}
            </p>
            {question.relatedDocTitle && (
              <p className="mt-2">
                <span className="font-medium text-kb-heading">关联资料：</span>
                {question.relatedDocTitle}
              </p>
            )}
          </div>
        </div>
      )}
    </AppFormDialog>
  );
}
