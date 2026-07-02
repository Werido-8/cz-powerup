import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  CheckCircle2,
  NotebookPen,
  Star,
  ChevronLeft,
  X,
  Sparkles,
  Target,
  
  Info,
  ClipboardList,
  ListTree,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { DOCS, QUESTIONS, TOPICS, type Doc } from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";
import {
  getEffectiveDocStatus,
  getDocPracticeSessionId,
  getQuestionIdsForDoc,
  isDocLearned,
} from "@/lib/mock/learning-progress";
import { toast } from "sonner";
import { RichMindMap } from "@/components/learn/RichMindMap";
// 本期暂不开放：复习计划
// import { ReviewSchedulePreview } from "@/components/learning/spaced-review";
import { learningBtnRadius } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/doc/$id")({
  loader: ({ params }) => {
    const doc = DOCS.find((d) => d.id === params.id);
    if (!doc) throw notFound();
    return { doc };
  },
  component: DocPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
        未找到该资料,
        <Link to="/learn" className="ml-1 text-primary hover:underline">
          返回知识学习
        </Link>
      </div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        载入出错: {error.message}
      </div>
    </PageShell>
  ),
});

function DocPage() {
  const { doc } = Route.useLoaderData() as { doc: Doc };
  const { state, toggleFavorite, addNote, addToCollection, removeSpacedReview, markDocLearned, clearDocPractice, pushRecentDoc } =
    useMockStore();

  useEffect(() => {
    pushRecentDoc(doc.id);
  }, [doc.id, pushRecentDoc]);
  const learned = isDocLearned(doc.id, state);
  const docStatus = getEffectiveDocStatus(doc.id, state);
  // 本期暂不开放：复习计划
  // const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState(`《${doc.title}》学习笔记`);
  const [addToColl, setAddToColl] = useState<string>("");

  const fav = state.favorites.includes(doc.id);
  const topic = TOPICS.find((t) => t.id === doc.topicId);
  const topicDocs = topic ? topic.docIds.map((id) => DOCS.find((d) => d.id === id)).filter(Boolean) as Doc[] : [];
  const topicIdx = topicDocs.findIndex((d) => d.id === doc.id);
  const prev = topicIdx > 0 ? topicDocs[topicIdx - 1] : undefined;
  const next = topicIdx >= 0 && topicIdx < topicDocs.length - 1 ? topicDocs[topicIdx + 1] : undefined;
  const relatedIds = getQuestionIdsForDoc(doc.id);
  const related = QUESTIONS.filter((q) => relatedIds.includes(q.id));
  const practiceComplete = related.length > 0 && related.every((q) => getEffectiveDocStatus(doc.id, state) === "已学");
  const saveNote = (alsoCollection = false) => {
    if (!noteText.trim()) {
      toast.error("请填写笔记内容");
      return;
    }
    const id = addNote({
      docId: doc.id,
      title: noteTitle.trim() || `《${doc.title}》学习笔记`,
      body: noteText,
      tag: doc.docType,
    });
    if (alsoCollection && addToColl) {
      addToCollection(addToColl, { docId: doc.id, noteId: id });
    }
    setNoteText("");
    setNoteOpen(false);
    toast.success("已保存到个人沉淀-我的笔记");
  };

  return (
    <PageShell>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-[12px] text-muted-foreground">
        <Link to="/learn" className="hover:text-primary">
          知识学习
        </Link>
        <ChevronRight className="h-3 w-3" />
        {topic ? (
          <>
            <Link to="/learn/topic/$id" params={{ id: topic.id }} className="hover:text-primary">
              {topic.title}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        ) : null}
        <span className="truncate text-foreground">{doc.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main: header + 原文 */}
        <article className="lg:col-span-8">
          <div className="rounded-lg border border-border bg-card p-7 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] font-medium text-accent-foreground">
                {doc.docType}
              </span>
              <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10.5px] text-muted-foreground">
                {doc.source}
              </span>
              <span className={`rounded-md px-2 py-0.5 text-[10.5px] ${learned ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                {learned ? "已学" : docStatus}
              </span>
            </div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight">{doc.title}</h1>
            <div className="mt-2 text-[12px] text-muted-foreground">
              {doc.plant} · {doc.equipment} · 更新 {doc.updatedAt}
            </div>

            {/* Action bar */}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              {related.length > 0 ? (
                <Link
                  to="/training/session/$id"
                  params={{ id: getDocPracticeSessionId(doc.id) }}
                  search={{
                    mode: "practice",
                    docId: doc.id,
                    topicId: topic?.id ?? "",
                    filter: "",
                    count: related.length,
                    limit: 0,
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Target className="h-3.5 w-3.5" />
                  {practiceComplete ? "已完成练习" : docStatus === "学习中" ? "继续练习" : "开始关联练习"}
                </Link>
              ) : (
                <span className="text-[12px] text-muted-foreground">暂无关联题目</span>
              )}
              <button
                onClick={() => {
                  if (learned) {
                    markDocLearned(doc.id, false);
                    removeSpacedReview(`doc-${doc.id}`);
                    toast.success("已取消已学标记");
                    return;
                  }
                  markDocLearned(doc.id, true);
                  toast.success("已标记为已学");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 border px-3 py-2 text-[12.5px] font-medium transition-colors",
                  learningBtnRadius,
                  learned
                    ? "border-success/40 bg-success-soft text-success"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> {learned ? "已学" : "标记已学"}
              </button>
              <button
                onClick={() => setNoteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] font-medium hover:border-primary/40"
              >
                <NotebookPen className="h-3.5 w-3.5" /> 记笔记
              </button>
              <button
                onClick={() => {
                  toggleFavorite(doc.id);
                  toast.success(fav ? "已取消收藏" : "已收藏到个人沉淀");
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors ${
                  fav
                    ? "border-warning/40 bg-warning-soft text-warning-foreground"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`} />
                {fav ? "已收藏" : "收藏"}
              </button>
            </div>

            {/* 原文 */}
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <ListTree className="h-3.5 w-3.5" /> 文件原文
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-6">
                <article className="prose-sm max-w-none space-y-5 text-foreground/85">
                  {doc.body.map((b) => (
                    <section key={b.id} id={b.id} className="scroll-mt-20">
                      <h2 className="mb-2 text-[15px] font-semibold text-foreground">{b.title}</h2>
                      <p className="whitespace-pre-line text-[13.5px] leading-7">{b.text}</p>
                    </section>
                  ))}
                </article>
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            {prev ? (
              <Link
                to="/learn/doc/$id"
                params={{ id: prev.id }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] hover:border-primary"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> 上一篇
              </Link>
            ) : (
              <span />
            )}
            {topic && (
              <Link
                to="/learn/topic/$id"
                params={{ id: topic.id }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] hover:border-primary"
              >
                返回专题《{topic.title}》
              </Link>
            )}
            {next ? (
              <Link
                to="/learn/doc/$id"
                params={{ id: next.id }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] hover:border-primary"
              >
                下一篇 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-4 lg:col-span-4">
          {/* Mind map */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> 思维脑图
            </div>
            {doc.id === "d5" ? (
              <RichMindMap />
            ) : (
              <MindMap title={doc.title} nodes={doc.toc.map((t) => ({ id: t.id, title: t.title }))} />
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold">
              <Info className="h-4 w-4 text-primary" /> 资料信息
            </div>
            <dl className="space-y-2 text-[12.5px]">
              <Row k="文件来源" v={doc.source} />
              {doc.scenarioType && <Row k="业务场景类型" v={doc.scenarioType} />}
              {doc.id !== "d5" && <Row k="版本" v={`v${doc.year}`} />}
              <Row k="更新日期" v={doc.updatedAt} />
              {doc.id !== "d5" && <Row k="适用厂站" v={doc.plant} />}
              <Row k="关联设备" v={doc.equipment} />
              {topic && <Row k="所属专题" v={topic.title} />}
            </dl>

          </div>

          {/* Related questions */}
          {related.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold">
                <ClipboardList className="h-4 w-4 text-primary" /> 关联题目
              </div>
              <div className="space-y-2">
                {related.map((q) => (
                  <div key={q.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="mb-1 flex items-center gap-2 text-[10.5px]">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                        {q.type === "single"
                          ? "单选"
                          : q.type === "multiple"
                          ? "多选"
                          : q.type === "judge"
                          ? "判断"
                          : "简答"}
                      </span>
                      {q.knowledgePoints.slice(0, 2).map((k) => (
                        <span key={k} className="rounded bg-primary-soft px-1.5 py-0.5 text-accent-foreground">
                          {k}
                        </span>
                      ))}
                    </div>
                    <div className="line-clamp-2 text-[12px]">{q.stem}</div>
                  </div>
                ))}
              </div>
              <Link
                to="/training/practice"
                className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                去练习 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* 本期暂不开放：智能问答
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
              <MessageSquareText className="h-4 w-4 text-primary" /> 相关问答
            </div>
            <div className="space-y-2">
              <Link
                to="/chat"
                search={{ prefill: `请基于《${doc.title}》解释核心要点和易错点` }}
                className="block rounded-lg border border-border bg-background p-2.5 text-[12px] hover:border-primary/40"
              >
                带着本文提问 →
              </Link>
              <Link
                to="/chat"
                search={{ prefill: `《${doc.title}》中有哪些常见疑问?` }}
                className="block rounded-lg border border-border bg-background p-2.5 text-[12px] hover:border-primary/40"
              >
                常见疑问解答 →
              </Link>
            </div>
          </div>
          */}
        </aside>
      </div>

      {/* Note drawer */}
      {noteOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4"
          onClick={() => setNoteOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">新建笔记</h3>
              <button onClick={() => setNoteOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-muted-foreground">笔记标题</label>
                <input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11.5px] text-muted-foreground">
                <div>
                  来源资料:<span className="text-foreground">{doc.title}</span>
                </div>
                <div>
                  标签:<span className="text-foreground">{doc.docType}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">笔记内容</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={6}
                  placeholder="记录学习要点、疑问或个人理解…"
                  className="mt-1 w-full resize-none rounded-lg border border-border bg-background p-3 text-[13px] outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">归入目录(可选)</label>
                <select
                  value={addToColl}
                  onChange={(e) => setAddToColl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
                >
                  <option value="">不加入</option>
                  {state.collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setNoteOpen(false)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={() => saveNote(false)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-muted"
              >
                保存笔记
              </button>
              <button
                onClick={() => saveNote(true)}
                className="rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                保存并归入目录
              </button>
            </div>
          </div>
        </div>
      )}

    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="truncate text-right text-foreground">{v}</dd>
    </div>
  );
}

function MindMap({ title, nodes }: { title: string; nodes: { id: string; title: string }[] }) {
  const items = nodes.slice(0, 6);
  const W = 320;
  const H = Math.max(180, items.length * 38 + 20);
  const cx = 78;
  const cy = H / 2;
  const rightX = 210;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-gradient-to-br from-primary-soft/30 to-background p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        {items.map((n, i) => {
          const y = 20 + ((H - 40) / Math.max(items.length - 1, 1)) * i;
          return (
            <g key={n.id}>
              <path
                d={`M ${cx + 60} ${cy} C ${cx + 110} ${cy}, ${rightX - 30} ${y + 14}, ${rightX} ${y + 14}`}
                stroke="hsl(var(--primary) / 0.4)"
                strokeWidth="1.2"
                fill="none"
              />
              <rect x={rightX} y={y} width={W - rightX - 8} height={28} rx={6} className="fill-card stroke-border" strokeWidth={1} />
              <text x={rightX + 8} y={y + 18} className="fill-foreground" fontSize="10.5">
                {n.title.length > 14 ? n.title.slice(0, 13) + "…" : n.title}
              </text>
            </g>
          );
        })}
        <rect x={cx - 60} y={cy - 18} width={120} height={36} rx={10} className="fill-primary" />
        <text x={cx} y={cy + 4} textAnchor="middle" className="fill-primary-foreground" fontSize="11" fontWeight="600">
          {title.length > 8 ? title.slice(0, 7) + "…" : title}
        </text>
      </svg>
    </div>
  );
}
