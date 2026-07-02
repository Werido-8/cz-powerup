import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search as SearchIcon,
  Filter,
  Star,
  MessagesSquare,
  NotebookPen,
  ArrowRight,
  Building2,
  Calendar,
  Tag as TagIcon,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { PageHeader } from "@/components/learning/ui";
import { DocDrawer } from "@/components/common/DocDrawer";
import { SafetyBanner } from "@/components/common/SafetyBanner";
import { DOCS, DOC_TYPES, HOT_KEYWORDS, PLANTS, type Doc } from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";
import { toast } from "sonner";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({ meta: [{ title: "资料检索 · 涉网运行 AI 训练平台" }] }),
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [plant, setPlant] = useState<string>("");
  const [openFilter, setOpenFilter] = useState(false);
  const [drawer, setDrawer] = useState<Doc | null>(null);
  const { state, toggleFavorite } = useMockStore();

  const results = useMemo(() => {
    const kw = submitted.trim();
    return DOCS.filter((d) => {
      if (types.length && !types.includes(d.docType)) return false;
      if (plant && d.plant !== plant) return false;
      if (!kw) return true;
      return (
        d.title.includes(kw) ||
        d.snippet.includes(kw) ||
        d.equipment.includes(kw) ||
        d.highlight.some((h) => h.includes(kw))
      );
    });
  }, [submitted, types, plant]);

  const highlight = (text: string) => {
    if (!submitted) return text;
    const idx = text.indexOf(submitted);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="rounded bg-warning-soft px-0.5 text-warning-foreground">{submitted}</mark>
        {text.slice(idx + submitted.length)}
      </>
    );
  };

  const submit = (val?: string) => {
    const v = val ?? q;
    setQ(v);
    setSubmitted(v);
  };

  const toggleType = (t: string) =>
    setTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  return (
    <PageShell>
      <PageHeader
        title="资料检索"
        subtitle="按场景、设备、关键词查找可追溯依据,所有结果均带来源标注"
      />

      <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="输入关键词、设备、任务或故障现象…"
              className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-3 text-[13.5px] text-foreground outline-none transition-colors focus:border-primary"
            />
          </div>
          <button
            onClick={() => submit()}
            className="rounded-lg bg-primary px-5 py-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            搜索
          </button>
          <button
            onClick={() => setOpenFilter((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-3 text-[13px] font-medium text-foreground hover:bg-muted"
          >
            <Filter className="h-4 w-4" /> 高级筛选
          </button>
        </div>

        {openFilter && (
          <div className="mt-4 grid gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-[12px] font-medium text-foreground">资料类型</div>
              <div className="flex flex-wrap gap-2">
                {DOC_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                      types.includes(t)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-foreground">厂站</div>
              <select
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] outline-none focus:border-primary"
              >
                <option value="">全部厂站</option>
                {PLANTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!submitted && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] text-muted-foreground">热门检索:</span>
            {HOT_KEYWORDS.map((k) => (
              <button
                key={k}
                onClick={() => submit(k)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px] text-foreground hover:border-primary hover:text-primary"
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* <div className="mt-4">
        <SafetyBanner compact />
      </div> */}

      <div className="mt-5 mb-3 flex items-center justify-between">
        <div className="text-[12.5px] text-muted-foreground">
          共找到 <span className="font-semibold text-foreground">{results.length}</span> 条 · 用时 0.3s
        </div>
      </div>

      {results.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="text-[14px] font-medium">未找到匹配资料</div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            可尝试放宽筛选，或调整关键词后重新检索
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((d) => {
            const fav = state.favorites.includes(d.id);
            return (
              <article
                key={d.id}
                className="group rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] font-medium text-accent-foreground">
                    {d.docType}
                  </span>
                  <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10.5px] text-muted-foreground">
                    {d.source}
                  </span>
                  {d.source === "厂站资料" && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success-soft px-2 py-0.5 text-[10.5px] font-medium text-success">
                      厂站优先
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setDrawer(d)}
                  className="text-left text-[15px] font-semibold text-foreground hover:text-primary"
                >
                  {highlight(d.title)}
                </button>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/80">
                  {highlight(d.snippet)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {d.plant}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <TagIcon className="h-3 w-3" /> {d.equipment}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> 更新 {d.updatedAt}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setDrawer(d)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:border-primary hover:text-primary"
                  >
                    查看详情 <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      toggleFavorite(d.id);
                      toast.success(fav ? "已取消收藏" : "已收藏到个人沉淀");
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      fav
                        ? "border-warning/40 bg-warning-soft text-warning-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <Star className={`h-3 w-3 ${fav ? "fill-current" : ""}`} />
                    {fav ? "已收藏" : "收藏"}
                  </button>
                  {/* 本期暂不开放：智能问答
                  <Link
                    to="/chat"
                    search={{ prefill: d.title }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:border-primary hover:text-primary"
                  >
                    <MessagesSquare className="h-3 w-3" /> 去问答
                  </Link>
                  */}
                  <button
                    onClick={() => toast.success("已加入笔记草稿")}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted"
                  >
                    <NotebookPen className="h-3 w-3" /> 加入笔记
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <DocDrawer doc={drawer} onClose={() => setDrawer(null)} highlightKeyword={submitted} />
    </PageShell>
  );
}
