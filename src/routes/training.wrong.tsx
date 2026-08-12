import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Trash2,
  Star,
  FileSearch,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { DocDrawer } from "@/components/common/DocDrawer";
import { DOCS, QUESTIONS, type Question } from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";
import {
  PageHeader,
  PillSelect,
  listActionClass,
  EmptyState,
  TableListPager,
  TABLE_PAGE_SIZE_DEFAULT,
} from "@/components/learning/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/wrong")({
  component: WrongPage,
  head: () => ({ meta: [{ title: "错题本 · 训练中心" }] }),
});

const TYPE_LABEL: Record<string, string> = {
  single: "单选",
  multiple: "多选",
  judge: "判断",
  text: "简答",
};

const TYPE_FILTERS = [
  { k: "all", l: "全部" },
  { k: "single", l: "单选" },
  { k: "multiple", l: "多选" },
  { k: "judge", l: "判断" },
  { k: "text", l: "简答" },
] as const;

type TypeFilter = (typeof TYPE_FILTERS)[number]["k"];

const selectClass =
  "h-8 rounded-md border border-border bg-card px-2 text-[12px] outline-none focus:border-primary/50";

function resolveOptionContent(q: Question, key: string) {
  return q.options?.find((o) => o.key === key)?.label ?? key;
}

function formatAnswer(q: Question) {
  if (q.type === "judge") {
    if (q.answer === "T") return "正确";
    if (q.answer === "F") return "错误";
  }
  if (Array.isArray(q.answer)) {
    return q.answer.map((key) => resolveOptionContent(q, key)).join("；");
  }
  if (q.type === "text" || !q.options?.length) {
    return q.answer;
  }
  return resolveOptionContent(q, q.answer);
}

function WrongPage() {
  const { state, removeWrong, toggleFavoriteQuestion } = useMockStore();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [knowledgeFilter, setKnowledgeFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drawerDocId, setDrawerDocId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  const drawerDoc = useMemo(
    () => (drawerDocId ? (DOCS.find((d) => d.id === drawerDocId) ?? null) : null),
    [drawerDocId],
  );

  const knowledgeOptions = useMemo(() => {
    const set = new Set<string>();
    state.wrong.forEach((w) => {
      const q = QUESTIONS.find((x) => x.id === w.qid);
      q?.knowledgePoints.forEach((k) => set.add(k));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [state.wrong]);

  const filtered = useMemo(
    () =>
      state.wrong.filter((w) => {
        const q = QUESTIONS.find((x) => x.id === w.qid);
        if (!q) return false;
        if (typeFilter !== "all" && q.type !== typeFilter) return false;
        if (knowledgeFilter !== "all" && !q.knowledgePoints.includes(knowledgeFilter)) return false;
        return true;
      }),
    [state.wrong, typeFilter, knowledgeFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, knowledgeFilter]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (knowledgeFilter !== "all" && !knowledgeOptions.includes(knowledgeFilter)) {
      setKnowledgeFilter("all");
    }
  }, [knowledgeFilter, knowledgeOptions]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: state.wrong.length };
    TYPE_FILTERS.slice(1).forEach(({ k }) => {
      c[k] = state.wrong.filter((w) => {
        const q = QUESTIONS.find((x) => x.id === w.qid);
        return q?.type === k;
      }).length;
    });
    return c;
  }, [state.wrong]);

  const pillOptions = useMemo(
    () =>
      TYPE_FILTERS.map((f) => ({
        value: f.k,
        label: `${f.l} (${typeCounts[f.k] ?? 0})`,
      })),
    [typeCounts],
  );

  return (
    <PageShell>
      <nav aria-label="页面导航" className="mb-2 flex items-center gap-1 text-[12px]">
        <Link
          to="/training"
          className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          训练中心
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/30" aria-hidden />
        <span className="text-foreground/70">错题本</span>
      </nav>

      <PageHeader
        title="错题本"
        subtitle={`共 ${state.wrong.length} 题待巩固 · 支持按题型与知识点筛选复习`}
        size="md"
        action={
          state.wrong.length > 0 ? (
            <Link
              to="/training/session/$id"
              params={{ id: "错题集中复习" }}
              search={{
                mode: "review",
                filter: "",
                count: Math.max(1, state.wrong.length),
                limit: 0,
              }}
              className={listActionClass("primary")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              开始集中复习
            </Link>
          ) : undefined
        }
      />
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <PillSelect
            options={pillOptions}
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as TypeFilter)}
          />
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[11.5px] text-muted-foreground">知识点</span>
            <select
              value={knowledgeFilter}
              onChange={(e) => setKnowledgeFilter(e.target.value)}
              className={cn(selectClass, "min-w-[120px] max-w-[200px]")}
            >
              <option value="all">全部知识点</option>
              {knowledgeOptions.map((kp) => (
                <option key={kp} value={kp}>
                  {kp}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4">
          {filtered.length === 0 ? (
            <EmptyState description="当前筛选下没有错题，继续保持！" />
          ) : (
            <div className="overflow-hidden rounded-md border border-border/80">
              {pageItems.map((w) => {
                const q = QUESTIONS.find((x) => x.id === w.qid);
                if (!q) return null;
                const fav = state.favoriteQuestions.includes(w.qid);
                const open = expanded === w.qid;
                const relatedDoc = q.relatedDocId
                  ? DOCS.find((d) => d.id === q.relatedDocId)
                  : undefined;
                return (
                  <div key={w.qid} className="border-b border-divider px-4 py-3.5 last:border-b-0">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded border border-border/80 bg-muted/30 px-1.5 py-px text-[10px] text-muted-foreground">
                            {TYPE_LABEL[q.type] ?? q.type}
                          </span>
                          {q.knowledgePoints.map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-center rounded border border-border/70 bg-background px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
                            >
                              {k}
                            </span>
                          ))}
                        </div>

                        <div className="text-[13.5px] font-medium leading-snug text-foreground">
                          {q.stem}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-[10.5px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0 text-muted-foreground/55" />
                            错误{" "}
                            <span className="tabular-nums text-foreground/80">
                              {w.wrongCount}
                            </span>{" "}
                            次
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0 text-muted-foreground/55" />
                            最近答错 {w.lastWrongAt}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                          <button
                            type="button"
                            onClick={() => setExpanded(open ? null : w.qid)}
                            className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-primary transition-colors hover:text-primary/80"
                          >
                            <FileSearch className="h-3.5 w-3.5 shrink-0" />
                            {open ? "收起解析" : "查看解析"}
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 transition-transform",
                                open && "rotate-180",
                              )}
                            />
                          </button>

                          {relatedDoc && (
                            <button
                              type="button"
                              onClick={() => setDrawerDocId(relatedDoc.id)}
                              className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-primary sm:max-w-[min(100%,28rem)]"
                            >
                              <BookOpen className="h-3.5 w-3.5 shrink-0" />
                              <span className="shrink-0">查依据</span>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="truncate">{relatedDoc.title}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 lg:shrink-0 lg:justify-end">
                        <Link
                          to="/training/session/$id"
                          params={{ id: `复习-${w.qid}` }}
                          search={{ mode: "review", filter: "", count: 1, limit: 0 }}
                          className={listActionClass("soft")}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          立即复习
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            toggleFavoriteQuestion(w.qid);
                            toast.success(fav ? "已取消收藏" : "已收藏到个人沉淀");
                          }}
                          className={listActionClass(fav ? "soft" : "outline")}
                        >
                          <Star className={cn("h-3.5 w-3.5", fav && "fill-current")} />
                          {fav ? "已收藏" : "收藏"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("确认从错题本移除该题？")) {
                              removeWrong(w.qid);
                              toast.success("已移除");
                            }
                          }}
                          className={listActionClass(
                            "outline",
                            "text-destructive hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive",
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          移除
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="mt-3 rounded-md border border-border/80 bg-muted/25 p-3 text-[12px] leading-relaxed text-foreground/85">
                        <div>
                          <span className="font-medium text-foreground">正确答案：</span>
                          {formatAnswer(q)}
                        </div>
                        <div className="mt-1.5">
                          <span className="font-medium text-foreground">解析：</span>
                          {q.analysis}
                        </div>
                        {fav && (
                          <Link
                            to="/assets"
                            search={{ tab: "fav" }}
                            className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-primary hover:underline"
                          >
                            <Star className="h-3 w-3 fill-current" />
                            已在个人沉淀 · 我的收藏
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <TableListPager
                page={safePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}

          <p className="mt-4 text-[11.5px] text-muted-foreground">
            错题由练习与考试答错自动收录；「收藏」会同步至
            <Link
              to="/assets"
              search={{ tab: "fav" }}
              className="mx-0.5 text-primary hover:underline"
            >
              个人沉淀 · 我的收藏
            </Link>
            。
          </p>
        </div>
      </div>

      <DocDrawer doc={drawerDoc} onClose={() => setDrawerDocId(null)} />
    </PageShell>
  );
}
