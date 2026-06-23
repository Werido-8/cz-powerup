import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Layers,
  ChevronRight,
  LayoutGrid,
  List,
  FileText,
  Building2,
  Calendar,
  Tag,
  Sparkles,
  Wrench,
  AlertTriangle,
  Activity,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { TOPICS, DOCS, DOC_TYPES, type LearnStatus } from "@/lib/mock/data";

export const Route = createFileRoute("/learn/")({
  component: LearnPage,
  head: () => ({ meta: [{ title: "知识学习 · 涉网运行 AI 训练平台" }] }),
});

const STATUS_STYLE: Record<LearnStatus, string> = {
  未学: "bg-muted text-muted-foreground",
  学习中: "bg-primary-soft text-accent-foreground",
  已学: "bg-success-soft text-success",
  需复习: "bg-warning-soft text-warning-foreground",
};

type TopicVisual = { Icon: LucideIcon; accent: string; iconBg: string };
const TOPIC_VISUAL_DEFAULT: TopicVisual = {
  Icon: BookOpen,
  accent: "from-primary/15 via-primary/5 to-transparent text-primary",
  iconBg: "text-primary",
};
const TOPIC_VISUAL: Record<string, TopicVisual> = {
  "t-newbie": {
    Icon: Users,
    accent: "from-sky-500/20 via-sky-500/5 to-transparent text-sky-600",
    iconBg: "text-sky-600",
  },
  "t-op": {
    Icon: Wrench,
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent text-emerald-600",
    iconBg: "text-emerald-600",
  },
  "t-fault": {
    Icon: AlertTriangle,
    accent: "from-rose-500/20 via-rose-500/5 to-transparent text-rose-600",
    iconBg: "text-rose-600",
  },
  "t-agc": {
    Icon: Activity,
    accent: "from-violet-500/20 via-violet-500/5 to-transparent text-violet-600",
    iconBg: "text-violet-600",
  },
};

function LearnPage() {
  const [tab, setTab] = useState<"all" | "topic" | "mine">("topic");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [view, setView] = useState<"card" | "table">("card");

  const filteredDocs = DOCS.filter((d) => !typeFilter || d.docType === typeFilter);
  const myDocs = DOCS.filter((d) => d.status === "学习中" || d.status === "需复习");

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight">知识学习</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          专题学习 + 资料浏览 + 学习状态,与训练 / 问答 / 沉淀联动
        </p>
      </div>

      <div className="mb-5 flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        {[
          { k: "topic" as const, l: "专题学习", icon: Layers },
          { k: "all" as const, l: "全部资料", icon: BookOpen },
          { k: "mine" as const, l: "我的学习", icon: GraduationCap },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                tab === t.k
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.l}
            </button>
          );
        })}
      </div>

      {tab === "topic" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {TOPICS.map((t) => {
            const { Icon, accent, iconBg } = TOPIC_VISUAL[t.id] ?? TOPIC_VISUAL_DEFAULT;
            return (
              <Link
                key={t.id}
                to="/learn/topic/$id"
                params={{ id: t.id }}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
              >
                {/* Cover with subtle pattern + icon */}
                <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${accent}`}>
                  <svg
                    className="absolute inset-0 h-full w-full opacity-[0.18]"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <defs>
                      <pattern
                        id={`grid-${t.id}`}
                        width="22"
                        height="22"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 22 0 L 0 0 0 22"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.6"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${t.id})`} />
                  </svg>
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-0.5 text-[10.5px] font-medium text-foreground backdrop-blur">
                    {t.role}
                  </div>
                  <div
                    className={`absolute -bottom-3 left-5 grid h-14 w-14 place-items-center rounded-lg border border-border bg-card shadow-[var(--shadow-card)] ${iconBg}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5 pt-6">
                  <h3 className="text-[15px] font-semibold leading-snug">{t.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                    {t.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[11.5px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" /> 资料 {t.docIds.length}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> 题目 {t.questionCount}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">进度 {t.progress}%</span>
                    <span className="inline-flex items-center text-primary">
                      进入
                      <ChevronRight className="ml-0.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}


      {tab === "all" && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTypeFilter("")}
              className={`rounded-full border px-2.5 py-1 text-[11.5px] ${
                !typeFilter
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              全部
            </button>
            {DOC_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] ${
                  typeFilter === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                {t}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
              <button
                onClick={() => setView("card")}
                aria-label="卡片视图"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] transition-colors ${
                  view === "card"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> 卡片
              </button>
              <button
                onClick={() => setView("table")}
                aria-label="表格视图"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] transition-colors ${
                  view === "table"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <List className="h-3.5 w-3.5" /> 表格
              </button>
            </div>
          </div>

          {view === "card" ? (
            <DocCardGrid docs={filteredDocs} />
          ) : (
            <DocList docs={filteredDocs} />
          )}
        </>
      )}

      {tab === "mine" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12.5px] text-muted-foreground">
              正在学习或需复习的资料 · 共 {myDocs.length} 条
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
              <button
                onClick={() => setView("card")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] transition-colors ${
                  view === "card"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> 卡片
              </button>
              <button
                onClick={() => setView("table")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] transition-colors ${
                  view === "table"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <List className="h-3.5 w-3.5" /> 表格
              </button>
            </div>
          </div>
          {view === "card" ? (
            <DocCardGrid docs={myDocs} actionLabel="继续学习" />
          ) : (
            <DocList docs={myDocs} actionLabel="继续学习" />
          )}
        </div>
      )}
    </PageShell>
  );
}

function DocList({ docs, actionLabel = "开始学习" }: { docs: typeof DOCS; actionLabel?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-[13px]">
        <thead className="bg-muted/40 text-[11.5px] text-muted-foreground">
          <tr>
            <th className="px-5 py-3 text-left font-medium">标题</th>
            <th className="px-5 py-3 text-left font-medium">类型</th>
            <th className="px-5 py-3 text-left font-medium">厂站</th>
            <th className="px-5 py-3 text-left font-medium">学习状态</th>
            <th className="px-5 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className="border-t border-border transition-colors hover:bg-muted/30">
              <td className="px-5 py-3">
                <Link
                  to="/learn/doc/$id"
                  params={{ id: d.id }}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {d.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{d.docType}</td>
              <td className="px-5 py-3 text-muted-foreground">{d.plant}</td>
              <td className="px-5 py-3">
                <span className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[d.status]}`}>
                  {d.status}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <Link
                  to="/learn/doc/$id"
                  params={{ id: d.id }}
                  className="text-[12px] font-medium text-primary hover:underline"
                >
                  {actionLabel} →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TYPE_ACCENT: Record<string, string> = {
  规程标准: "from-sky-500/15 to-sky-500/0 text-sky-600",
  典型操作: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
  故障处置: "from-rose-500/15 to-rose-500/0 text-rose-600",
  厂站资料: "from-violet-500/15 to-violet-500/0 text-violet-600",
  历史案例: "from-amber-500/15 to-amber-500/0 text-amber-600",
  厂家SOP: "from-cyan-500/15 to-cyan-500/0 text-cyan-600",
  "两细则/考核": "from-orange-500/15 to-orange-500/0 text-orange-600",
};

function DocCardGrid({ docs, actionLabel = "开始学习" }: { docs: typeof DOCS; actionLabel?: string }) {
  if (docs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center text-[13px] text-muted-foreground">
        暂无符合条件的资料
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {docs.map((d) => {
        const accent = TYPE_ACCENT[d.docType] ?? "from-primary/15 to-primary/0 text-primary";
        return (
          <Link
            key={d.id}
            to="/learn/doc/$id"
            params={{ id: d.id }}
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
          >
            <div className={`relative h-20 bg-gradient-to-br ${accent}`}>
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-background/85 px-2 py-0.5 text-[10.5px] font-medium backdrop-blur">
                <Tag className="h-3 w-3" /> {d.docType}
              </div>
              <FileText className="absolute right-4 top-4 h-8 w-8 opacity-70" />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-2 min-h-[40px] text-[14px] font-semibold leading-snug text-foreground group-hover:text-primary">
                {d.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                {d.snippet}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {d.highlight.slice(0, 3).map((h) => (
                  <span
                    key={h}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {d.plant}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {d.updatedAt}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[d.status]}`}>
                  {d.status}
                </span>
                <span className="inline-flex items-center text-[12px] font-medium text-primary">
                  {actionLabel} <ChevronRight className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
