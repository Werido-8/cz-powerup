import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Star,
  NotebookPen,
  BookOpen,
  Trash2,
  Pencil,
  Plus,
  Sparkles,
  ListChecks,
  RotateCcw,
  FolderOpen,
  Clock,
  MessageSquare,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageShell } from "@/components/workbench/PageShell";
import { DOCS, QUESTIONS } from "@/lib/mock/data";
import { useMockStore, type NoteItem } from "@/lib/mock/store";
import { NoteEditor } from "@/components/common/NoteEditor";
import { CHAT_FAVORITES, FAVORITE_META, NOTE_META } from "@/lib/mock/learning-hub";
import { PersonalDepositionOverview } from "@/components/learning/personal-deposition-overview";
import {
  PageHeader,
  ModuleTabs,
  ModulePanel,
  SearchBar,
  PillSelect,
  PersonalAssetCard,
  listActionClass,
  Tag,
  ActionButton,
  EmptyState,
} from "@/components/learning/ui";
import {
  getPersonalDepositionOverview,
  type PersonalOverviewCardKey,
} from "@/lib/mock/personal-deposition";

const assetsSearchSchema = z.object({
  tab: z.enum(["todo", "note", "fav", "qa"]).optional().catch(undefined),
});

export const Route = createFileRoute("/assets")({
  validateSearch: assetsSearchSchema,
  component: AssetsPage,
  head: () => ({ meta: [{ title: "个人沉淀 · 涉网运行能力智能提升平台" }] }),
});

type Tab = "todo" | "note" | "fav" | "qa";

const TAB_FILTER_OPTIONS: Record<Tab, { value: string; label: string }[]> = {
  todo: [
    { value: "all", label: "全部任务" },
    { value: "today", label: "今天可完成" },
  ],
  fav: [
    { value: "all", label: "全部" },
    { value: "规程", label: "规程" },
    { value: "问答摘录", label: "问答摘录" },
    { value: "题目", label: "题目" },
  ],
  note: [
    { value: "all", label: "全部" },
    { value: "AGC", label: "AGC/两细则" },
    { value: "主变", label: "主变/操作" },
    { value: "继电保护", label: "继电保护" },
  ],
  qa: [
    { value: "all", label: "全部问答" },
    { value: "AGC", label: "AGC/两细则" },
    { value: "继电保护", label: "继电保护" },
  ],
};

const SEARCH_PLACEHOLDERS: Record<Tab, string> = {
  todo: "搜索待整理内容",
  fav: "搜索收藏标题、问答摘录或题目",
  note: "搜索笔记标题或内容",
  qa: "搜索问答标题或摘要",
};

const ASSET_TABS: { key: Tab; label: string; desc: string; icon: typeof Star }[] = [
  { key: "todo", label: "待整理", desc: "4 条内容需要归档", icon: FolderOpen },
  { key: "note", label: "学习笔记", desc: "要点、来源与更新记录", icon: NotebookPen },
  { key: "fav", label: "我的收藏", desc: "资料与收藏题目", icon: Star },
  { key: "qa", label: "问答沉淀", desc: "收藏问答与追问", icon: MessageSquare },
];

function AssetsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/assets" });
  const {
    state,
    removeFavorite,
    removeFavoriteQuestion,
    addNote,
    updateNote,
    removeNote,
    createCollection,
    addToCollection,
  } = useMockStore();

  const [tab, setTab] = useState<Tab>(search.tab ?? "todo");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [tabFilters, setTabFilters] = useState<Record<Tab, string>>({
    todo: "all",
    fav: "all",
    note: "all",
    qa: "all",
  });
  const [editor, setEditor] = useState<{ open: boolean; note?: NoteItem }>({ open: false });
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [activeOverviewKey, setActiveOverviewKey] = useState<PersonalOverviewCardKey | null>(null);

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

  const depositionOverview = useMemo(() => getPersonalDepositionOverview(state), [state]);

  const handleOverviewCardClick = (key: PersonalOverviewCardKey) => {
    setActiveOverviewKey(key);
    switch (key) {
      case "docFav":
        setTab("fav");
        setTabFilters((prev) => ({ ...prev, fav: "规程" }));
        navigate({ to: "/assets", search: { tab: "fav" }, replace: true });
        break;
      case "qaFav":
        setTabAndUrl("qa");
        break;
      case "notes":
        setTabAndUrl("note");
        break;
      case "pending":
        setTabAndUrl("todo");
        break;
      default:
        break;
    }
  };

  const handleViewFavorites = () => {
    setActiveOverviewKey("docFav");
    setTabAndUrl("fav");
    setTabFilters((prev) => ({ ...prev, fav: "all" }));
  };

  const handleOrganize = () => {
    setActiveOverviewKey("pending");
    setTabAndUrl("todo");
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
        if (activeFilter === "问答摘录" || activeFilter === "题目") return false;
        if (activeFilter === "all") return true;
        if (activeFilter === "规程") {
          return doc.docType.includes("规程") || meta.source === "智能问答依据";
        }
        if (activeFilter === "SOP") {
          return doc.docType === "典型操作" || doc.docType === "厂家SOP";
        }
        if (activeFilter === "问答") return meta.source.includes("问答");
        if (activeFilter === "题单") return meta.source.includes("题单");
        return true;
      });
  }, [state.favorites, appliedQuery, activeFilter]);

  const filteredFavoriteQuestions = useMemo(() => {
    const typeLabel: Record<string, string> = {
      single: "单选",
      multiple: "多选",
      judge: "判断",
      text: "简答",
    };
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
      .map((q) => ({ q, typeLabel: typeLabel[q.type] ?? q.type }));
  }, [state.favoriteQuestions, appliedQuery, activeFilter]);

  const filteredNotes = useMemo(() => {
    return NOTE_META.filter((n) => {
      const exists = state.notes.some((sn) => sn.id === n.id) || true;
      if (!exists) return false;
      if (appliedQuery && !n.title.includes(appliedQuery) && !n.summary.includes(appliedQuery))
        return false;
      if (activeFilter !== "all" && !n.tags.some((t) => t.includes(activeFilter))) return false;
      return true;
    });
  }, [state.notes, appliedQuery, activeFilter]);

  // 本期暂不开放：智能题单
  // const filteredQuizSets = useMemo(() => {
  //   return state.quizSets.filter((q) => {
  //     if (appliedQuery && !q.title.includes(appliedQuery)) return false;
  //     if (activeFilter !== "all" && q.status !== activeFilter) return false;
  //     return true;
  //   });
  // }, [state.quizSets, appliedQuery, activeFilter]);

  const filteredChatFavorites = useMemo(() => {
    return CHAT_FAVORITES.filter((c) => {
      if (activeFilter !== "all" && !c.tags.some((tag) => tag.includes(activeFilter))) return false;
      if (
        appliedQuery &&
        !c.question.includes(appliedQuery) &&
        !c.summary.includes(appliedQuery) &&
        !c.tags.join("").includes(appliedQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [appliedQuery, activeFilter]);

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
    <PageShell>
      <PageHeader
        title="个人学习成果"
        subtitle="把零散收藏、问答和笔记整理为可复用的个人知识成果。"
        className="mb-4"
      />

      <PersonalDepositionOverview
        data={depositionOverview}
        activeKey={activeOverviewKey}
        onCardClick={handleOverviewCardClick}
        onOrganize={handleOrganize}
        onViewFavorites={handleViewFavorites}
      />

      {/* Tab 面板 */}
      <section className="mb-5">
        <ModulePanel>
          <ModuleTabs
            tabs={ASSET_TABS.map((t) => ({
              key: t.key,
              label: t.label,
              desc: t.desc,
              icon: <t.icon className="h-4 w-4" />,
            }))}
            value={tab}
            onChange={setTabAndUrl}
          />

          <div className="flex flex-col gap-3 border-b border-divider px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSearch={handleSearch}
                placeholder={SEARCH_PLACEHOLDERS[tab]}
              />
              <PillSelect
                options={TAB_FILTER_OPTIONS[tab]}
                value={activeFilter}
                onChange={setActiveFilter}
              />
            </div>
            {tab === "note" && (
              <ActionButton onClick={() => setEditor({ open: true })}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                新建笔记
              </ActionButton>
            )}
          </div>

          <div className="p-4">
            {tab === "todo" && (
              <div className="divide-y divide-divider overflow-hidden rounded-[12px] border border-kb-border">
                {[
                  ["2 条问答尚未归类", "补充标签并归入 AGC / 两细则", "整理问答"],
                  ["差动保护笔记未关联资料", "建议关联《继电保护动作逻辑说明》", "关联资料"],
                  ["1 道收藏题目缺少用途", "选择用于错题复习或专项练习", "设置用途"],
                  ["学习摘录待转为笔记", "来自 AGC 考核主要依据哪些文件？", "转为笔记"],
                ].map(([title, desc, action], index) => (
                  <div key={title} className="flex flex-wrap items-center gap-4 bg-white px-4 py-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-remind-soft text-[12px] font-semibold text-remind-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-kb-heading">{title}</div>
                      <div className="mt-1 text-[11.5px] text-kb-muted">{desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.success(`${action}已完成`)}
                      className="min-h-9 rounded-[8px] border border-primary/20 px-3 text-[12px] font-medium text-primary hover:bg-primary-soft"
                    >
                      {action}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* 收藏 */}
            {(tab === "fav" || tab === "qa") && (
              <div className="space-y-3">
                {(
                  tab === "fav"
                    ? filteredFavorites.length === 0 && filteredFavoriteQuestions.length === 0
                    : filteredChatFavorites.length === 0
                ) ? (
                  <EmptyState description="还没有收藏内容，可在资料检索、学习页面、智能问答或错题本点击「收藏」。" />
                ) : (
                  <>
                    {tab === "fav" &&
                      filteredFavorites.map(({ doc, meta }) => (
                        <PersonalAssetCard
                          key={doc.id}
                          icon={<Star className="h-5 w-5 fill-current" />}
                          title={doc.title}
                          tags={
                            <Tag variant="outline">
                              {meta.source.includes("规程")
                                ? "规程"
                                : doc.docType === "典型操作"
                                  ? "SOP"
                                  : "规程"}
                            </Tag>
                          }
                          meta={
                            <>
                              {/* <span>所属专题：{meta.topicTitle}</span>
                    <span>·</span> */}
                              <span>来源：{meta.source}</span>
                              <span>·</span>
                              <span>更新：{doc.updatedAt}</span>
                            </>
                          }
                          actions={
                            <>
                              <Link
                                to="/learn/doc/$id"
                                params={{ id: doc.id }}
                                className={listActionClass("text")}
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                                阅读
                              </Link>
                              {/* 本期暂不开放：智能问答
                    <Link
                      to="/chat"
                      search={{ prefill: `请基于资料《${doc.title}》总结要点` }}
                      className={listActionClass("text")}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      提问
                    </Link>
                    */}
                              <button
                                type="button"
                                className={listActionClass("text")}
                                onClick={() => {
                                  removeFavorite(doc.id);
                                  toast.success("已取消收藏");
                                }}
                              >
                                <Star className="h-3.5 w-3.5" />
                                取消收藏
                              </button>
                            </>
                          }
                        />
                      ))}
                    {tab === "fav" &&
                      filteredFavoriteQuestions.map(({ q, typeLabel }) => (
                        <PersonalAssetCard
                          key={q.id}
                          icon={<ListChecks className="h-5 w-5" />}
                          title={q.stem}
                          tags={
                            <>
                              <Tag variant="primary">题目</Tag>
                              <Tag variant="outline">{typeLabel}</Tag>
                              {q.knowledgePoints.slice(0, 2).map((k) => (
                                <Tag key={k} variant="outline">
                                  {k}
                                </Tag>
                              ))}
                            </>
                          }
                          meta={
                            <>
                              <span>来源：错题本收藏</span>
                              <span>·</span>
                              <span>{q.knowledgePoints[0] ?? "综合"}</span>
                            </>
                          }
                          actions={
                            <>
                              <Link
                                to="/training/session/$id"
                                params={{ id: `复习-${q.id}` }}
                                search={{ mode: "review", filter: "", count: 1, limit: 0 }}
                                className={listActionClass("textPrimary")}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                复习
                              </Link>
                              <Link to="/training/wrong" className={listActionClass("text")}>
                                <ListChecks className="h-3.5 w-3.5" />
                                错题本
                              </Link>
                              <button
                                type="button"
                                className={listActionClass("text")}
                                onClick={() => {
                                  removeFavoriteQuestion(q.id);
                                  toast.success("已取消收藏");
                                }}
                              >
                                <Star className="h-3.5 w-3.5 fill-current" />
                                取消收藏
                              </button>
                            </>
                          }
                        />
                      ))}
                    {tab === "qa" &&
                      filteredChatFavorites.map((c) => (
                        <PersonalAssetCard
                          key={c.id}
                          icon={<MessageSquare className="h-5 w-5" />}
                          title={c.question}
                          tags={
                            <>
                              <Tag variant="primary">问答摘录</Tag>
                              {c.tags.map((t) => (
                                <Tag key={t} variant="outline">
                                  {t}
                                </Tag>
                              ))}
                            </>
                          }
                          meta={
                            <>
                              <span className="line-clamp-2 text-[13px] text-foreground/80">
                                {c.summary}
                              </span>
                              <span className="mt-1 inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {c.source} · {c.createdAt}
                              </span>
                            </>
                          }
                          actions={
                            <>
                              <Link
                                to="/chat"
                                search={{ prefill: c.question }}
                                className={listActionClass("text")}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                继续追问
                              </Link>
                              {/* 本期暂不开放：问答生成练习题
                    <Link to="/training/practice" className={listActionClass("textPrimary")}>
                      <Sparkles className="h-3.5 w-3.5" />
                      生成练习
                    </Link>
                    */}
                            </>
                          }
                        />
                      ))}
                  </>
                )}
              </div>
            )}

            {/* 笔记 */}
            {tab === "note" && (
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <aside className="rounded-2xl border border-border bg-card p-3">
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
                      />
                    ))}
                  </ul>
                </aside>
                <div className="space-y-3">
                  {filteredNotes.length === 0 ? (
                    <EmptyState description="此目录下还没有笔记，点击「新建笔记」开始记录。" />
                  ) : (
                    filteredNotes.map((n) => (
                      <PersonalAssetCard
                        key={n.id}
                        icon={<NotebookPen className="h-5 w-5" />}
                        title={n.title}
                        tags={n.tags.map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                        meta={
                          <>
                            <span className="line-clamp-2 text-[13px] text-foreground/80">
                              {n.summary}
                            </span>
                            {n.relatedDocTitle && (
                              <>
                                <span className="mt-1 block w-full">
                                  关联资料：{n.relatedDocTitle}
                                </span>
                              </>
                            )}
                            <span className="mt-1 inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              创建 {n.createdAt}
                            </span>
                          </>
                        }
                        actions={
                          <>
                            <button
                              type="button"
                              className={listActionClass("text")}
                              onClick={() => {
                                const note = state.notes.find((sn) => sn.id === n.id);
                                if (note) setEditor({ open: true, note });
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              查看
                            </button>
                            <button
                              type="button"
                              className={listActionClass("text")}
                              onClick={() => {
                                const note = state.notes.find((sn) => sn.id === n.id);
                                if (note) setEditor({ open: true, note });
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              编辑
                            </button>
                            <Link
                              to="/training/session/$id"
                              params={{ id: `笔记生成-${n.id}` }}
                              search={{
                                mode: "practice",
                                filter: n.tags[0] ?? "",
                                count: 5,
                                limit: 0,
                              }}
                              className={listActionClass("text")}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              生成训练题
                            </Link>
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
                          </>
                        }
                      />
                    ))
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
        </ModulePanel>
      </section>

      <NoteEditor
        open={editor.open}
        initial={editor.note}
        collections={state.collections}
        onClose={() => setEditor({ open: false })}
        onSave={handleSaveNote}
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
    </PageShell>
  );
}

function FolderRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-colors ${
          active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span
          className={`tabular-nums text-[10.5px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}
        >
          {count}
        </span>
      </button>
    </li>
  );
}
