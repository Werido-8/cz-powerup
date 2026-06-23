import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Star,
  NotebookPen,
  BookMarked,
  RotateCcw,
  BookOpen,
  ChevronRight,
  Trash2,
  Pencil,
  Plus,
  ExternalLink,
  Search,
  Award,
  Clock,
  CalendarCheck,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { DOCS, QUESTIONS, TODAY_REVIEW, ACHIEVEMENTS } from "@/lib/mock/data";
import { useMockStore, type NoteItem } from "@/lib/mock/store";
import { NoteEditor } from "@/components/common/NoteEditor";

export const Route = createFileRoute("/assets")({
  component: AssetsPage,
  head: () => ({ meta: [{ title: "个人沉淀 · 涉网运行 AI 训练平台" }] }),
});

type Tab = "fav" | "note" | "wrong" | "review" | "badge";

function AssetsPage() {
  const navigate = useNavigate();
  const {
    state,
    removeFavorite,
    addNote,
    updateNote,
    removeNote,
    removeWrong,
    setReview,
    resetAll,
    createCollection,
    addToCollection,
  } = useMockStore();
  const [tab, setTab] = useState<Tab>("fav");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; note?: NoteItem }>({ open: false });
  const [activeFolder, setActiveFolder] = useState<string>("all"); // "all" | "none" | collectionId

  const completedReviews = state.reviews.filter((r) => r.done).map((r) => r.id);
  const todayList = TODAY_REVIEW.filter((r) => !completedReviews.includes(r.id));
  const wrongInline = state.wrong.slice(0, 5);

  const filteredFavorites = useMemo(
    () =>
      state.favorites
        .map((id) => DOCS.find((d) => d.id === id))
        .filter((d): d is (typeof DOCS)[number] => !!d)
        .filter((d) => !query || d.title.includes(query) || d.docType.includes(query)),
    [state.favorites, query],
  );

  const filteredNotes = useMemo(
    () =>
      state.notes
        .filter((n) => {
          if (activeFolder === "all") return true;
          if (activeFolder === "none") return !n.collectionIds || n.collectionIds.length === 0;
          return n.collectionIds?.includes(activeFolder);
        })
        .filter(
          (n) =>
            !query || n.title.includes(query) || (n.tag ?? "").includes(query) || n.body.includes(query),
        ),
    [state.notes, query, activeFolder],
  );

  const stats = [
    { l: "收藏资料", v: state.favorites.length, k: "fav" as Tab },
    { l: "学习笔记", v: state.notes.length, k: "note" as Tab },
  ];

  const noteCountForFolder = (id: string) =>
    state.notes.filter((n) => n.collectionIds?.includes(id)).length;
  const uncategorizedCount = state.notes.filter(
    (n) => !n.collectionIds || n.collectionIds.length === 0,
  ).length;

  const handleSaveNote = (n: Parameters<typeof addNote>[0]) => {
    if (editor.note) {
      const prevIds = editor.note.collectionIds ?? [];
      updateNote(editor.note.id, n);
      // sync collection.noteIds for newly added folders
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">个人沉淀</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            收藏、笔记、错题本、今日复习与成长成就一站式管理
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("将重置所有本地沉淀数据(收藏 / 笔记 / 错题 / 复习状态),确认?")) {
              resetAll();
              toast.success("已重置本地数据");
            }
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-muted-foreground hover:bg-muted"
        >
          重置示例数据
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-2">
        {stats.map((s) => {
          const Icon = s.k === "fav" ? Star : NotebookPen;
          return (
            <button
              key={s.l}
              onClick={() => setTab(s.k)}
              className={`group relative overflow-hidden rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 ${
                tab === s.k
                  ? "border-primary bg-gradient-to-br from-primary-soft/50 to-transparent"
                  : "border-border bg-card"
              }`}
            >
              <svg
                className="absolute inset-0 h-full w-full opacity-[0.12]"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <defs>
                  <pattern
                    id={`grid-stat-${s.k}`}
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#grid-stat-${s.k})`} />
              </svg>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">{s.l}</div>
                  <div className="mt-1 text-[22px] font-semibold tabular-nums">{s.v}</div>
                </div>
                <div
                  className={`grid h-10 w-10 place-items-center rounded-lg transition-colors ${
                    tab === s.k
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary-soft text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-1 rounded-lg border border-border bg-card p-1 min-w-[280px]">
          {(
            [
              { k: "fav", l: "我的收藏", icon: Star },
              { k: "note", l: "我的笔记", icon: NotebookPen },
            ] as { k: Tab; l: string; icon: typeof Star }[]
          ).map((t) => {
            const Icon = t.icon;
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.l}
              </button>
            );
          })}
        </div>
        {(tab === "fav" || tab === "note") && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索…"
              className="w-56 rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-[12.5px] outline-none focus:border-primary"
            />
          </div>
        )}
        {tab === "note" && (
          <button
            onClick={() => setEditor({ open: true })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> 新建笔记
          </button>
        )}
      </div>

      {tab === "fav" && (
        <div className="space-y-3">
          {filteredFavorites.length === 0 ? (
            <Empty text="还没有收藏内容,可在资料检索或学习页面点击「收藏」。" />
          ) : (
            filteredFavorites.map((d) => (
              <div
                key={d.id}
                className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-warning-soft text-warning-foreground">
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium">{d.title}</div>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-[11.5px] text-muted-foreground">
                    <span>{d.docType}</span>
                    <span>·</span>
                    <span>{d.plant}</span>
                    <span>·</span>
                    <span>更新 {d.updatedAt}</span>
                  </div>
                </div>
                <Link
                  to="/learn/doc/$id"
                  params={{ id: d.id }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] hover:bg-muted"
                >
                  <BookOpen className="h-3 w-3" /> 阅读
                </Link>
                <Link
                  to="/chat"
                  search={{ prefill: `请基于资料《${d.title}》总结要点` }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] hover:bg-muted"
                >
                  <ExternalLink className="h-3 w-3" /> 提问
                </Link>
                <button
                  onClick={() => {
                    removeFavorite(d.id);
                    toast.success("已取消收藏");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "note" && (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          {/* Folder sidebar */}
          <aside className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[11.5px] font-medium text-muted-foreground">笔记目录</span>
              <button
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
              <FolderRow
                label="未分类"
                count={uncategorizedCount}
                active={activeFolder === "none"}
                onClick={() => setActiveFolder("none")}
              />
              {state.collections.length > 0 && (
                <li className="px-2 pb-1 pt-2 text-[10.5px] uppercase tracking-wider text-muted-foreground/70">
                  目录
                </li>
              )}
              {state.collections.map((c) => (
                <FolderRow
                  key={c.id}
                  label={c.name}
                  count={noteCountForFolder(c.id)}
                  active={activeFolder === c.id}
                  onClick={() => setActiveFolder(c.id)}
                />
              ))}
            </ul>
          </aside>

          {/* Notes list */}
          <div className="space-y-3">
            {filteredNotes.length === 0 ? (
              <Empty text="此目录下还没有笔记,点击右上「新建笔记」开始记录。" />
            ) : (
              filteredNotes.map((n) => {
                const linkedDoc = n.docId ? DOCS.find((d) => d.id === n.docId) : null;
                const noteFolders = (n.collectionIds ?? [])
                  .map((cid) => state.collections.find((c) => c.id === cid))
                  .filter((c): c is NonNullable<typeof c> => !!c);
                return (
                  <div
                    key={n.id}
                    className="rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {n.tag && (
                            <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] text-accent-foreground">
                              {n.tag}
                            </span>
                          )}
                          <span className="text-[13.5px] font-semibold">{n.title}</span>
                          {noteFolders.map((c) => (
                            <span
                              key={c.id}
                              className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
                            >
                              <FolderOpen className="h-2.5 w-2.5" /> {c.name}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground/80">
                          {n.body || <span className="italic text-muted-foreground">(空)</span>}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[10.5px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>创建 {n.createdAt}</span>
                          {n.updatedAt && <span>· 更新 {n.updatedAt}</span>}
                          {linkedDoc && (
                            <>
                              <span>·</span>
                              <Link
                                to="/learn/doc/$id"
                                params={{ id: linkedDoc.id }}
                                className="text-primary hover:underline"
                              >
                                来源:{linkedDoc.title}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => setEditor({ open: true, note: n })}
                          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            removeNote(n.id);
                            toast.success("笔记已删除");
                          }}
                          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {tab === "wrong" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-gradient-to-r from-warning-soft/40 to-transparent p-4">
            <div>
              <div className="text-[13px] font-medium">错题速览</div>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                显示最近 5 题待巩固,完整列表请进入错题本
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/training/session/$id"
                params={{ id: "错题集中复习" }}
                search={{ mode: "review", filter: "", count: state.wrong.length || 5, limit: 0 }}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] hover:bg-muted"
              >
                集中复习
              </Link>
              <Link
                to="/training/wrong"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                进入错题本 <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          {wrongInline.length === 0 ? (
            <Empty text="暂无错题,继续保持!" />
          ) : (
            wrongInline.map((w) => {
              const q = QUESTIONS.find((x) => x.id === w.qid);
              if (!q) return null;
              return (
                <div
                  key={w.qid}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <span className="mt-0.5 rounded-md bg-destructive/10 px-2 py-0.5 text-[10.5px] font-medium text-destructive">
                    {w.mastery}
                  </span>
                  <div className="min-w-0 flex-1 text-[13px]">{q.stem}</div>
                  <Link
                    to="/training/session/$id"
                    params={{ id: `复习-${w.qid}` }}
                    search={{ mode: "review", filter: "", count: 1, limit: 0 }}
                    className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    复习
                  </Link>
                  <button
                    onClick={() => {
                      removeWrong(w.qid);
                      toast.success("已从错题本移除");
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "review" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-gradient-to-r from-primary-soft/60 to-transparent p-4">
            <div>
              <div className="text-[13px] font-medium">今日复习计划</div>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                基于艾宾浩斯曲线,共 {TODAY_REVIEW.length} 项 · 已完成{" "}
                {TODAY_REVIEW.length - todayList.length} 项
              </p>
            </div>
            <Link
              to="/training/session/$id"
              params={{ id: "今日复习" }}
              search={{ mode: "review", filter: "", count: 5, limit: 0 }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 一键开始
            </Link>
          </div>

          {todayList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-success/30 bg-success-soft/30 p-10 text-center">
              <CalendarCheck className="mx-auto h-8 w-8 text-success" />
              <div className="mt-2 text-[13.5px] font-medium text-success">今日复习全部完成 🎉</div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                可以继续做专项练习,或休息一下吧。
              </p>
            </div>
          ) : (
            todayList.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  {r.kind === "错题" ? <BookMarked className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-medium">{r.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    类型:{r.kind} · 下次复习 {r.nextAt}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReview(r.id, { deferTo: "明天" });
                    toast.message("已延后至明天");
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] hover:bg-muted"
                >
                  延后
                </button>
                <button
                  onClick={() => {
                    setReview(r.id, { done: true });
                    toast.success("已标记完成");
                  }}
                  className="rounded-lg border border-success/30 bg-success-soft/50 px-3 py-1.5 text-[12px] text-success hover:bg-success-soft"
                >
                  标记完成
                </button>
                <button
                  onClick={() =>
                    navigate({
                      to: "/training/session/$id",
                      params: { id: `复习-${r.id}` },
                      search: { mode: "review", filter: "", count: 3, limit: 0 },
                    })
                  }
                  className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  立即复习
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "badge" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.id}
              className={`group rounded-lg border p-5 transition-all hover:-translate-y-0.5 ${
                a.earned
                  ? "border-primary/40 bg-gradient-to-br from-primary-soft/60 to-transparent"
                  : "border-dashed border-border bg-muted/30 opacity-70"
              }`}
            >
              <div className="text-[28px]">{a.icon}</div>
              <div className="mt-2 text-[14px] font-semibold">{a.name}</div>
              <p className="mt-1 text-[12px] text-muted-foreground">{a.desc}</p>
              <div
                className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  a.earned
                    ? "bg-success-soft text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {a.earned ? "已获得" : "未达成"}
              </div>
            </div>
          ))}
        </div>
      )}

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
        onClick={onClick}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "text-foreground/80 hover:bg-muted"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span
          className={`tabular-nums text-[10.5px] ${
            active ? "text-primary-foreground/80" : "text-muted-foreground"
          }`}
        >
          {count}
        </span>
      </button>
    </li>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center text-[12.5px] text-muted-foreground">
      {text}
    </div>
  );
}

