import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Star,
  NotebookPen,
  BookMarked,
  BookOpen,
  Trash2,
  Pencil,
  Plus,
  Sparkles,
  ListChecks,
  RotateCcw,
  FileText,
  FolderOpen,
  Clock,
  TrendingUp,
  MessageSquare,
  FileSearch,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/workbench/PageShell";
import { DOCS, QUESTIONS } from "@/lib/mock/data";
import { useMockStore, type NoteItem } from "@/lib/mock/store";
import { NoteEditor } from "@/components/common/NoteEditor";
import {
  PRACTICE_RECORDS,
  WRONG_QUESTION_DETAILS,
  FAVORITE_META,
  NOTE_META,
  GROWTH_REMINDER,
  PERSONAL_OVERVIEW,
} from "@/lib/mock/learning-hub";
import {
  PageHeader,
  OverviewStatCard,
  ModuleTabs,
  ModulePanel,
  SearchBar,
  PillSelect,
  PersonalAssetCard,
  ListCard,
  RecordRow,
  RECORDS_TABLE_GRID,
  listActionClass,
  Tag,
  LinkButton,
  ActionButton,
  EmptyState,
} from "@/components/learning/ui";

const assetsSearchSchema = z.object({
  tab: z
    .enum(["fav", "note", "wrong", "records"])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/assets")({
  validateSearch: assetsSearchSchema,
  component: AssetsPage,
  head: () => ({ meta: [{ title: "个人沉淀 · 涉网运行能力智能提升平台" }] }),
});

type Tab = "fav" | "note" | "wrong" | "records";

const TAB_FILTER_OPTIONS: Record<Tab, { value: string; label: string }[]> = {
  fav: [
    { value: "all", label: "全部" },
    { value: "规程", label: "规程" },
    // { value: "SOP", label: "SOP" },
    { value: "案例", label: "案例" },
    // { value: "问答", label: "问答" },
    // { value: "题单", label: "题单" },
    { value: "题目", label: "题目" },
  ],
  note: [
    { value: "all", label: "全部" },
    { value: "AGC", label: "AGC/两细则" },
    { value: "主变", label: "主变/操作" },
    { value: "继电保护", label: "继电保护" },
  ],
  wrong: [
    { value: "all", label: "全部" },
    { value: "AGC", label: "AGC" },
    { value: "典型操作", label: "典型操作" },
    { value: "继电保护", label: "继电保护" },
    { value: "AVC", label: "AVC" },
  ],
  records: [
    { value: "all", label: "全部" },
    // { value: "智能问答生成", label: "智能问答" },
    { value: "知识学习生成", label: "知识学习" },
    { value: "错题本", label: "错题本" },
    { value: "模拟考试", label: "模拟考试" },
  ],
};

const SEARCH_PLACEHOLDERS: Record<Tab, string> = {
  fav: "搜索收藏资料标题或专题",
  note: "搜索笔记标题或内容",
  wrong: "搜索错题题干或知识点",
  records: "搜索练习名称",
};

const ASSET_TABS: { key: Tab; label: string; desc: string; icon: typeof Star }[] = [
  { key: "fav", label: "我的收藏", desc: "规程、SOP 与案例资料", icon: Star },
  { key: "note", label: "我的笔记", desc: "学习要点与关联资料", icon: NotebookPen },
  // 本期暂不开放：智能题单
  // { key: "quizsets", label: "我的题单", desc: "AI 智能生成练习题单", icon: Sparkles },
  { key: "wrong", label: "错题本", desc: "错题收集与巩固练习", icon: BookMarked },
  { key: "records", label: "练习记录", desc: "历次训练结果与统计", icon: ListChecks },
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
    removeWrong,
    resetAll,
    createCollection,
    addToCollection,
  } = useMockStore();

  const [tab, setTab] = useState<Tab>(search.tab ?? "fav");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [tabFilters, setTabFilters] = useState<Record<Tab, string>>({
    fav: "all",
    note: "all",
    wrong: "all",
    records: "all",
  });
  const [editor, setEditor] = useState<{ open: boolean; note?: NoteItem }>({ open: false });
  const [activeFolder, setActiveFolder] = useState<string>("all");

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

  const wrongCount = state.wrong.length || PERSONAL_OVERVIEW.wrongToReview;
  const lastPractice = PRACTICE_RECORDS[0];
  const latestNote = state.notes[state.notes.length - 1];
  const latestFavoriteDoc = state.favorites
    .map((id) => DOCS.find((d) => d.id === id))
    .filter(Boolean)[0];

  const overviewStats = [
    {
      key: "fav" as const,
      label: "收藏资料",
      value: state.favorites.length,
      hint: "规程与案例",
      detail: latestFavoriteDoc ? `最近：${latestFavoriteDoc.title.slice(0, 14)}…` : "暂无收藏",
      icon: <Star className="h-[18px] w-[18px]" />,
    },
    {
      key: "note" as const,
      label: "学习笔记",
      value: state.notes.length,
      hint: "学习过程记录",
      detail: latestNote ? `最近：${latestNote.title}` : "暂无笔记",
      icon: <NotebookPen className="h-[18px] w-[18px]" />,
    },
    {
      key: "wrong" as const,
      label: "错题待复习",
      value: wrongCount,
      hint: "待巩固题目",
      detail: GROWTH_REMINDER.weakPoints[0]
        ? `薄弱：${GROWTH_REMINDER.weakPoints[0]}`
        : "暂无薄弱点",
      icon: <BookMarked className="h-[18px] w-[18px]" />,
      emphasis: wrongCount > 0 ? ("remind" as const) : ("default" as const),
    },
    {
      key: "records" as const,
      label: "练习记录",
      value: PRACTICE_RECORDS.length,
      hint: "近期训练回看",
      detail: lastPractice
        ? `最近：${lastPractice.title.slice(0, 12)}… · ${lastPractice.accuracy}%`
        : "暂无记录",
      icon: <ListChecks className="h-[18px] w-[18px]" />,
    },
  ];

  const filteredFavorites = useMemo(() => {
    return FAVORITE_META.filter((f) => state.favorites.includes(f.docId))
      .map((meta) => {
        const doc = DOCS.find((d) => d.id === meta.docId);
        return doc ? { doc, meta } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .filter(({ doc, meta }) => {
        if (appliedQuery && !doc.title.includes(appliedQuery) && !meta.topicTitle.includes(appliedQuery)) {
          return false;
        }
        if (activeFilter === "all") return true;
        if (activeFilter === "规程") {
          return doc.docType.includes("规程") || meta.source === "智能问答依据";
        }
        if (activeFilter === "SOP") {
          return doc.docType === "典型操作" || doc.docType === "厂家SOP";
        }
        if (activeFilter === "案例") return doc.docType === "历史案例";
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
        if (appliedQuery && !q.stem.includes(appliedQuery) && !q.knowledgePoints.join("").includes(appliedQuery)) {
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
      if (appliedQuery && !n.title.includes(appliedQuery) && !n.summary.includes(appliedQuery)) return false;
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

  const filteredWrong = useMemo(() => {
    return WRONG_QUESTION_DETAILS.filter((w) => {
      if (appliedQuery && !w.stem.includes(appliedQuery) && !w.knowledge.includes(appliedQuery)) return false;
      if (activeFilter !== "all" && w.knowledge !== activeFilter) return false;
      return state.wrong.some((sw) => sw.qid === w.qid) || true;
    });
  }, [appliedQuery, activeFilter, state.wrong]);

  const filteredRecords = useMemo(() => {
    return PRACTICE_RECORDS.filter((r) => {
      if (r.source === "智能问答生成") return false;
      if (appliedQuery && !r.title.includes(appliedQuery)) return false;
      if (activeFilter !== "all" && r.source !== activeFilter) return false;
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
        title="个人沉淀"
        subtitle="收藏、笔记、错题与练习记录，集中管理你的学习成果"
      />

      {/* 概览 */}
      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {overviewStats.map((s, i) => (
          <OverviewStatCard
            key={s.key}
            label={s.label}
            value={s.value}
            hint={s.hint}
            detail={s.detail}
            icon={s.icon}
            tint={i}
            emphasis={"emphasis" in s ? s.emphasis : i === 0 ? "primary" : "default"}
            active={tab === s.key}
            onClick={() => setTabAndUrl(s.key)}
          />
        ))}
      </section>

      {/* 学习跟进 */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-foreground">学习跟进</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              建议今日复习{" "}
              <span className="font-medium text-foreground">{GROWTH_REMINDER.wrongToday} 题</span>
              错题
              <span className="mx-2 text-border">·</span>
              薄弱点{" "}
              <span className="text-foreground">{GROWTH_REMINDER.weakPoints.join("、")}</span>
              {lastPractice && (
                <>
                  <span className="mx-2 text-border">·</span>
                  上次练习正确率{" "}
                  <span className="font-medium text-foreground">{lastPractice.accuracy}%</span>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/training/session/$id"
              params={{ id: "今日回看" }}
              search={{
                mode: "review",
                filter: "",
                count: GROWTH_REMINDER.wrongToday,
                limit: 0,
              }}
            >
              <ActionButton>
                <RotateCcw className="h-3.5 w-3.5" />
                复习错题
              </ActionButton>
            </Link>
            {/* {activeQuiz && (
              <ActionButton variant="outline" onClick={() => setTabAndUrl("quizsets")}>
                继续题单
                <ChevronRight className="h-3.5 w-3.5" />
              </ActionButton>
            )} */}
          </div>
        </div>
      </section>

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
      {/* 收藏 */}
      {tab === "fav" && (
        <div className="space-y-3">
          {filteredFavorites.length === 0 && filteredFavoriteQuestions.length === 0 ? (
            <EmptyState description="还没有收藏内容，可在资料检索、学习页面或错题本点击「收藏」。" />
          ) : (
            <>
            {filteredFavorites.map(({ doc, meta }) => (
              <PersonalAssetCard
                key={doc.id}
                icon={<Star className="h-5 w-5 fill-current" />}
                title={doc.title}
                tags={<Tag variant="outline">{meta.source.includes("规程") ? "规程" : doc.docType === "典型操作" ? "SOP" : "规程"}</Tag>}
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
                    <Link to="/learn/doc/$id" params={{ id: doc.id }} className={listActionClass("text")}>
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
            {filteredFavoriteQuestions.map(({ q, typeLabel }) => (
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
                    <Link to="/assets" search={{ tab: "wrong" }} className={listActionClass("text")}>
                      <BookMarked className="h-3.5 w-3.5" />
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
            </>
          )}
        </div>
      )}

      {/* 笔记 */}
      {tab === "note" && (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[11.5px] font-medium text-muted-foreground">笔记目录</span>
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
              <FolderRow label="全部笔记" count={state.notes.length} active={activeFolder === "all"} onClick={() => setActiveFolder("all")} />
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
                      <span className="line-clamp-2 text-[13px] text-foreground/80">{n.summary}</span>
                      {n.relatedDocTitle && (
                        <>
                          <span className="mt-1 block w-full">关联资料：{n.relatedDocTitle}</span>
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
                        search={{ mode: "practice", filter: n.tags[0] ?? "", count: 5, limit: 0 }}
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

      {/* 错题本 */}
      {tab === "wrong" && (
        <div className="space-y-3">
          {filteredWrong.length === 0 ? (
            <EmptyState description="暂无错题，继续保持！" />
          ) : (
            filteredWrong.map((w) => (
              <PersonalAssetCard
                key={w.qid}
                icon={<BookMarked className="h-5 w-5" />}
                title={w.stem}
                tags={
                  <>
                    <Tag>{w.typeLabel}</Tag>
                    {/* <Tag variant="outline">{w.errorReason}</Tag> */}
                    <Tag variant="outline">{w.knowledge}</Tag>
                  </>
                }
                meta={
                  <>
                    <span>来源：{w.sourceQuiz}</span>
                    <span>·</span>
                    <span>最近错误：{w.lastWrongAt}</span>
                    <span>·</span>
                    <span>复习 {w.reviewCount} 次</span>
                  </>
                }
                actions={
                  <>
                    <Link
                      to="/training/session/$id"
                      params={{ id: `解析-${w.qid}` }}
                      search={{ mode: "review", filter: "", count: 1, limit: 0 }}
                      className={listActionClass("text")}
                    >
                      <FileSearch className="h-3.5 w-3.5" />
                      查看解析
                    </Link>
                    <Link
                      to="/training/session/$id"
                      params={{ id: `复习-${w.qid}` }}
                      search={{ mode: "review", filter: "", count: 1, limit: 0 }}
                      className={listActionClass("textPrimary")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      再练一次
                    </Link>
                    <button
                      type="button"
                      className={listActionClass("text")}
                      onClick={() => toast.success("已加入今日复习")}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      加入今日复习
                    </button>
                    <button
                      type="button"
                      className={listActionClass("text")}
                      onClick={() => {
                        removeWrong(w.qid);
                        toast.success("已从错题本移除");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      移除
                    </button>
                  </>
                }
              />
            ))
          )}
        </div>
      )}

      {/* 练习记录 */}
      {tab === "records" && (
        <ListCard className="rounded-md shadow-none">
          <div
            className={cn(
              "hidden border-b border-divider px-5 py-3 text-[11.5px] font-medium text-muted-foreground lg:grid lg:items-center lg:gap-4",
              RECORDS_TABLE_GRID,
            )}
          >
            <span>练习名称</span>
            <span>来源</span>
            <span>完成时间</span>
            <span>题数</span>
            <span>正确率</span>
            <span>错题</span>
            <span>用时</span>
            <span className="text-right">操作</span>
          </div>
          {filteredRecords.length === 0 ? (
            <div className="p-8">
              <EmptyState description="暂无练习记录" />
            </div>
          ) : (
            filteredRecords.map((r) => (
              <RecordRow
                key={r.id}
                cells={[
                  r.title,
                  r.source,
                  r.completedAt,
                  `${r.questionCount} 题`,
                  `${r.accuracy}%`,
                  `错题 ${r.wrongCount}`,
                  r.duration,
                ]}
                actions={
                  <>
                    <Link to="/training/result/$id" params={{ id: r.id }} className={listActionClass("text")}>
                      <FileSearch className="h-3.5 w-3.5" />
                      查看结果
                    </Link>
                    <Link
                      to="/training/session/$id"
                      params={{ id: `再练-${r.id}` }}
                      search={{ mode: "practice", filter: r.filter, count: r.questionCount, limit: 0 }}
                      className={listActionClass("textPrimary")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      再练一次
                    </Link>
                  </>
                }
              />
            ))
          )}
        </ListCard>
      )}
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
        <span className={`tabular-nums text-[10.5px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {count}
        </span>
      </button>
    </li>
  );
}
