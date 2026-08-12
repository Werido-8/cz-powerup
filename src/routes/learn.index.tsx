import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers3,
  Search,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { PageHeader } from "@/components/learning/ui";
import { DOCS, DOC_TYPES, type Doc, type LearnStatus } from "@/lib/mock/data";
import { ENRICHED_TOPICS, type EnrichedTopic } from "@/lib/mock/learning-hub";
import { cn } from "@/lib/utils";

const learnSearchSchema = z.object({
  tab: z.enum(["topic", "all", "mine"]).optional().catch(undefined),
});

export const Route = createFileRoute("/learn/")({
  validateSearch: learnSearchSchema,
  component: LearnPage,
  head: () => ({ meta: [{ title: "知识学习 · 涉网运行能力智能提升平台" }] }),
});

type TabKey = "topic" | "all" | "mine";
type SpecialtyKey =
  | "all"
  | "operation"
  | "electrical"
  | "relay"
  | "grid"
  | "boiler"
  | "turbine"
  | "chemistry";

const TABS: { key: TabKey; label: string; icon: typeof Layers3 }[] = [
  { key: "topic", label: "专题学习", icon: Layers3 },
  { key: "all", label: "全部资料", icon: BookOpen },
  { key: "mine", label: "我的学习资料", icon: GraduationCap },
];

const SPECIALTIES: {
  key: SpecialtyKey;
  label: string;
  matches: (topic: EnrichedTopic) => boolean;
}[] = [
  { key: "all", label: "全部专题", matches: () => true },
  {
    key: "operation",
    label: "运行值班",
    matches: (topic) => topic.roleTags.includes("运行") || topic.id === "t-newbie",
  },
  {
    key: "electrical",
    label: "电气专业",
    matches: (topic) =>
      topic.roleTags.some((tag) => ["电气", "典型操作", "故障处置"].includes(tag)) ||
      ["t-op", "t-meter"].includes(topic.id),
  },
  {
    key: "relay",
    label: "继电保护",
    matches: (topic) => topic.roleTags.includes("继保") || topic.id === "t-relay",
  },
  {
    key: "grid",
    label: "涉网与调度",
    matches: (topic) => topic.roleTags.some((tag) => ["涉网", "调度"].includes(tag)),
  },
  { key: "boiler", label: "锅炉专业", matches: (topic) => topic.roleTags.includes("锅炉") },
  { key: "turbine", label: "汽机专业", matches: (topic) => topic.roleTags.includes("汽机") },
  { key: "chemistry", label: "化学专业", matches: (topic) => topic.roleTags.includes("化学") },
];

const STATUS_STYLE: Record<LearnStatus, string> = {
  未学: "bg-kb-surface text-kb-muted",
  学习中: "bg-primary-soft text-primary",
  已学: "bg-success-soft text-success",
  需复习: "bg-remind-soft text-remind-foreground",
};

function LearnPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/learn/" });
  const [tab, setTab] = useState<TabKey>(search.tab ?? "topic");
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<SpecialtyKey>("all");
  const [docType, setDocType] = useState<string>("all");

  const switchTab = (next: TabKey) => {
    setTab(next);
    setQuery("");
    navigate({ to: "/learn", search: { tab: next }, replace: true });
  };

  return (
    <PageShell>
      <div className="w-full">
        <PageHeader
          title="知识学习"
          subtitle="继续当前学习，或按岗位与任务选择经过审核的专题和资料。"
        />

        <nav
          className="mb-5 flex min-h-12 items-end justify-between gap-2 border-b border-kb-border sm:justify-start sm:gap-7"
          aria-label="知识学习分类"
        >
          {TABS.map((item) => {
            const active = item.key === tab;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => switchTab(item.key)}
                className={cn(
                  "relative inline-flex min-h-12 items-center gap-1.5 whitespace-nowrap px-0.5 text-[13px] font-medium transition-colors sm:gap-2 sm:px-1 sm:text-[14px]",
                  active ? "text-primary" : "text-kb-muted hover:text-kb-heading",
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="h-[17px] w-[17px]" />
                {item.label}
                {active && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-primary" />}
              </button>
            );
          })}
        </nav>

        {tab === "topic" ? (
          <TopicWorkspace
            query={query}
            onQueryChange={setQuery}
            specialty={specialty}
            onSpecialtyChange={setSpecialty}
          />
        ) : (
          <MaterialWorkspace
            mode={tab}
            query={query}
            onQueryChange={setQuery}
            docType={docType}
            onDocTypeChange={setDocType}
          />
        )}
      </div>
    </PageShell>
  );
}

function TopicWorkspace({
  query,
  onQueryChange,
  specialty,
  onSpecialtyChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  specialty: SpecialtyKey;
  onSpecialtyChange: (value: SpecialtyKey) => void;
}) {
  const activeSpecialty = SPECIALTIES.find((item) => item.key === specialty) ?? SPECIALTIES[0];
  const filteredTopics = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return ENRICHED_TOPICS.filter((topic) => {
      if (!activeSpecialty.matches(topic)) return false;
      if (!normalized) return true;
      return [topic.title, topic.desc, ...topic.roleTags].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
  }, [activeSpecialty, query]);
  const continuing = ENRICHED_TOPICS.find((topic) => topic.progress > 0 && topic.progress < 100);

  return (
    <>
      {continuing && (
        <section className="mb-5 grid overflow-hidden rounded-[20px] border border-kb-border bg-white shadow-[0_14px_38px_rgba(28,72,81,0.045)] lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="relative overflow-hidden p-6 sm:p-7">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-[36%] bg-[radial-gradient(circle_at_85%_35%,rgba(52,155,172,.09),transparent_62%)]" />
            <div className="pointer-events-none absolute right-14 top-7 hidden h-28 w-28 rounded-full border border-dashed border-primary/15 md:block" />
            <span className="pointer-events-none absolute right-[112px] top-[62px] hidden h-3 w-3 rounded-full bg-primary/20 md:block" />
            <div className="relative max-w-3xl">
              <div className="flex items-center gap-2 text-[11.5px] font-semibold text-primary">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft">
                  <GraduationCap className="h-4 w-4" />
                </span>
                继续上次学习
              </div>
              <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.025em] text-kb-heading">
                {continuing.title}
              </h2>
              <p className="mt-2 text-[12.5px] leading-6 text-kb-muted">
                上次学习到“AGC 考核指标与响应时间”，还剩 5 份资料与 45
                道练习。建议先完成当前资料，再进入对应练习。
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link
                  to="/learn/topic/$id"
                  params={{ id: continuing.id }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[11px] bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(52,155,172,.18)] hover:bg-primary/90"
                >
                  继续学习 <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-[11.5px] text-kb-muted">预计 18 分钟完成当前章节</span>
              </div>
            </div>
          </div>
          <div className="border-t border-kb-border p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-kb-muted">专题总体进度</p>
                <strong className="mt-1 block text-[26px] text-kb-heading">
                  {continuing.progress}%
                </strong>
              </div>
              <div className="relative grid h-[70px] w-[70px] place-items-center rounded-full bg-[conic-gradient(#349bac_0_45%,#edf3f4_45%_100%)]">
                <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-white text-[11px] font-semibold text-primary">
                  学习中
                </span>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eef2f3]">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${continuing.progress}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <ProgressMetric
                label="资料进度"
                value={`${Math.max(1, Math.round((continuing.docCount * continuing.progress) / 100))}/${continuing.docCount}`}
              />
              <ProgressMetric
                label="练习进度"
                value={`${Math.round((continuing.questionCount * continuing.progress) / 100)}/${continuing.questionCount}`}
              />
              <ProgressMetric label="正确率" value="76%" />
            </div>
          </div>
        </section>
      )}
      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-[14px] border border-kb-border bg-kb-surface/70 p-3 lg:sticky lg:top-4 lg:block">
          <div className="px-2 pb-2 pt-1 text-[12px] font-semibold text-kb-heading">按专业筛选</div>
          <div className="space-y-1">
            {SPECIALTIES.map((item) => {
              const active = item.key === specialty;
              const count = ENRICHED_TOPICS.filter(item.matches).length;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSpecialtyChange(item.key)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between rounded-[9px] px-3 text-left text-[13px] transition-colors",
                    active
                      ? "bg-white font-semibold text-primary shadow-[0_2px_8px_rgba(31,78,88,0.06)]"
                      : "text-kb-body hover:bg-white/70",
                  )}
                >
                  <span>{item.label}</span>
                  <span className="text-[11px] tabular-nums text-kb-muted">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 border-t border-kb-border px-2 pb-1 pt-3 text-[11.5px] leading-5 text-kb-muted">
            专题资料由培训老师从知识库筛选，并在发布前完成人工确认。
          </div>
        </aside>

        <main className="min-w-0">
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
            {SPECIALTIES.map((item) => {
              const active = item.key === specialty;
              const count = ENRICHED_TOPICS.filter(item.matches).length;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSpecialtyChange(item.key)}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[12.5px] transition-colors",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-kb-border bg-white text-kb-body",
                  )}
                >
                  <span>{item.label}</span>
                  <span className={cn("tabular-nums", active ? "text-white/75" : "text-kb-muted")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-semibold text-kb-heading">{activeSpecialty.label}</h2>
              <p className="mt-1 text-[12.5px] text-kb-muted">
                共 {filteredTopics.length} 个可学习专题
              </p>
            </div>
            <label className="relative block w-full sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kb-muted" />
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="搜索专题或专业关键词"
                className="h-11 w-full rounded-[10px] border border-kb-border bg-white pl-10 pr-3 text-[13px] text-kb-heading outline-none placeholder:text-kb-muted focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              />
            </label>
          </div>

          {filteredTopics.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredTopics.map((topic) => (
                <TopicRow key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <EmptyResult
              title="没有找到匹配专题"
              description="可以更换专业分类或缩短搜索关键词。"
            />
          )}
        </main>
      </div>
    </>
  );
}

function ProgressMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[64px] flex-col justify-center rounded-[11px] border border-kb-border bg-[#fafcfc] px-3">
      <strong className="text-[17px] font-semibold tabular-nums text-kb-heading">{value}</strong>
      <span className="mt-1 text-[10px] text-kb-muted">{label}</span>
    </div>
  );
}

function TopicRow({ topic }: { topic: EnrichedTopic }) {
  const inProgress = topic.progress > 0 && topic.progress < 100;
  const priorityTag =
    topic.progress === 100
      ? "已完成"
      : topic.id === "t-newbie"
        ? "最近学习"
        : topic.title.includes("AGC")
          ? "必修"
          : inProgress
            ? "学习中"
            : "推荐";
  return (
    <Link
      to="/learn/topic/$id"
      params={{ id: topic.id }}
      className="group flex min-h-[196px] flex-col rounded-[14px] border border-kb-border bg-white p-5 transition-[border-color,box-shadow] duration-200 hover:border-primary/35 hover:shadow-[0_12px_28px_-18px_rgba(52,155,172,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {topic.roleTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-kb-surface px-2 py-1 text-[10.5px] text-kb-body"
            >
              {tag}
            </span>
          ))}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-1 text-[10.5px] font-medium",
            inProgress
              ? "bg-primary-soft text-primary"
              : topic.progress === 100
                ? "bg-success-soft text-success"
                : "bg-remind-soft text-remind-foreground",
          )}
        >
          {priorityTag}
        </span>
      </div>
      <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.01em] text-kb-heading">
        {topic.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-kb-muted">{topic.desc}</p>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
        <div className="flex items-center gap-5 text-[11.5px] text-kb-muted">
          <span>
            <strong className="mr-1 text-[15px] text-kb-heading">{topic.docCount}</strong>份资料
          </span>
          <span>
            <strong className="mr-1 text-[15px] text-kb-heading">{topic.questionCount}</strong>
            道练习
          </span>
        </div>
        <span className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-primary">
          {inProgress ? "继续学习" : "查看专题"}{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      {topic.progress > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-kb-surface">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${topic.progress}%` }}
            />
          </div>
          <span className="w-9 text-right text-[10.5px] tabular-nums text-kb-muted">
            {topic.progress}%
          </span>
        </div>
      )}
    </Link>
  );
}

function MaterialWorkspace({
  mode,
  query,
  onQueryChange,
  docType,
  onDocTypeChange,
}: {
  mode: "all" | "mine";
  query: string;
  onQueryChange: (value: string) => void;
  docType: string;
  onDocTypeChange: (value: string) => void;
}) {
  const docs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return DOCS.filter((doc) => {
      if (mode === "mine" && doc.status === "未学") return false;
      if (docType !== "all" && doc.docType !== docType) return false;
      if (!normalized) return true;
      return [doc.title, doc.snippet, doc.source, doc.equipment, ...doc.highlight].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
  }, [docType, mode, query]);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-kb-heading">
            {mode === "all" ? "全部学习资料" : "我的学习资料"}
          </h2>
          <p className="mt-1 text-[12.5px] text-kb-muted">
            {mode === "all" ? "直接查找规程、案例和厂站资料。" : "查看已经开始或完成学习的资料。"}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label className="relative min-w-0 flex-1 sm:w-[310px] sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kb-muted" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="搜索资料、设备或知识点"
              className="h-11 w-full rounded-[10px] border border-kb-border bg-white pl-10 pr-3 text-[13px] outline-none placeholder:text-kb-muted focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <select
            value={docType}
            onChange={(event) => onDocTypeChange(event.target.value)}
            className="h-11 rounded-[10px] border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            aria-label="资料类型"
          >
            <option value="all">全部类型</option>
            {DOC_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-kb-border bg-white">
        <div className="grid min-h-11 grid-cols-[minmax(0,1fr)_140px_130px_110px] items-center bg-kb-table-head px-5 text-[11.5px] font-medium text-kb-muted max-lg:hidden">
          <span>资料名称</span>
          <span>类型</span>
          <span>来源</span>
          <span className="text-right">学习状态</span>
        </div>
        {docs.length ? (
          docs.map((doc) => <MaterialRow key={doc.id} doc={doc} />)
        ) : (
          <EmptyResult title="没有找到匹配资料" description="可以切换资料类型或缩短搜索关键词。" />
        )}
      </div>
    </section>
  );
}

function MaterialRow({ doc }: { doc: Doc }) {
  return (
    <Link
      to="/learn/doc/$id"
      params={{ id: doc.id }}
      className="group grid min-h-[92px] grid-cols-1 gap-3 border-t border-divider px-5 py-4 transition-colors first:border-t-0 hover:bg-primary-soft/15 lg:grid-cols-[minmax(0,1fr)_140px_130px_110px] lg:items-center"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px] bg-primary-soft text-primary">
          <FileText className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-kb-heading">
            {doc.title}
          </span>
          <span className="mt-1 block line-clamp-1 text-[11.5px] text-kb-muted">{doc.snippet}</span>
        </span>
      </div>
      <span className="text-[12px] text-kb-body max-lg:hidden">{doc.docType}</span>
      <span className="text-[12px] text-kb-muted max-lg:hidden">{doc.source}</span>
      <span className="flex items-center justify-between gap-3 lg:justify-end">
        <span className={cn("rounded-md px-2 py-1 text-[10.5px]", STATUS_STYLE[doc.status])}>
          {doc.status}
        </span>
        <ChevronRight className="h-4 w-4 text-kb-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </span>
    </Link>
  );
}

function EmptyResult({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-[220px] place-items-center px-6 text-center">
      <div>
        <div className="text-[14px] font-semibold text-kb-heading">{title}</div>
        <div className="mt-1 text-[12px] text-kb-muted">{description}</div>
      </div>
    </div>
  );
}
