import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock3,
  FilePlus2,
  Layers3,
  LoaderCircle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/learning/ui";
import { PageShell } from "@/components/workbench/PageShell";
import type { QuestionType } from "@/lib/mock/data";
import { KNOWLEDGE_CATEGORIES } from "@/lib/mock/data";
import { PRACTICE_TYPE_OPTIONS, type PracticeDifficulty } from "@/lib/mock/practice-filter";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/custom-exam")({
  component: CustomExamPage,
  head: () => ({ meta: [{ title: "自主组卷 · 训练中心" }] }),
});

const PROMPT_SAMPLES = [
  { label: "AGC 易错规则", prompt: "检验我对 AGC 与两细则的掌握，重点考易错规则" },
  { label: "主变操作进阶", prompt: "生成一套主变操作进阶测评，控制在 20 分钟" },
  { label: "结合最近错题", prompt: "结合最近错题，给我一套 15 题的查漏补缺卷" },
];

const DIFFICULTY_LABEL: Record<PracticeDifficulty, string> = {
  all: "综合",
  easy: "基础",
  hard: "进阶",
};

function CustomExamPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(PROMPT_SAMPLES[0].prompt);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedPrompt, setAppliedPrompt] = useState("");
  const [title, setTitle] = useState("AGC 与两细则能力自测");
  const [selectedCats, setSelectedCats] = useState<Set<string>>(() => new Set(["AGC"]));
  const [selectedTypes, setSelectedTypes] = useState<Set<QuestionType>>(
    () => new Set(["single", "multiple", "judge"]),
  );
  const [diff, setDiff] = useState<PracticeDifficulty>("all");
  const [count, setCount] = useState(20);
  const [limit, setLimit] = useState(30);
  const [passScore, setPassScore] = useState(60);

  const categoryKeys = useMemo(() => Array.from(selectedCats), [selectedCats]);
  const types = useMemo(() => Array.from(selectedTypes), [selectedTypes]);
  const selectedCategories = KNOWLEDGE_CATEGORIES.filter((item) => selectedCats.has(item.key));
  const selectedLabels = selectedCategories.map((item) => item.label);
  const available = selectedCategories.reduce((sum, item) => sum + item.questionCount, 0);
  const canCreate = title.trim().length > 0 && selectedCats.size > 0 && types.length > 0;

  const generateWithAi = () => {
    const input = prompt.trim();
    if (!input || isGenerating) return;
    setIsGenerating(true);

    window.setTimeout(() => {
      const nextCats = new Set<string>();
      KNOWLEDGE_CATEGORIES.forEach((item) => {
        if (input.includes(item.label) || input.toLowerCase().includes(item.key.toLowerCase())) {
          nextCats.add(item.key);
        }
      });
      if (input.includes("主变") || input.includes("倒闸") || input.includes("操作票")) {
        nextCats.add("主变停役");
      }
      if (input.includes("保护") || input.includes("故障复盘")) {
        nextCats.add("差动保护");
      }
      if (input.includes("调频")) nextCats.add("一次调频");
      if (nextCats.size === 0) nextCats.add("AGC");
      setSelectedCats(nextCats);
      setCount(input.includes("15") ? 15 : input.includes("30") ? 30 : 20);
      setLimit(input.includes("20 分钟") ? 20 : input.includes("45 分钟") ? 45 : 30);
      setDiff(input.includes("进阶") || input.includes("易错") ? "hard" : "all");
      setSelectedTypes(new Set(["single", "multiple", "judge"]));
      setTitle(input.includes("主变") ? "主变操作进阶自测" : "AGC 与两细则能力自测");
      setAppliedPrompt(input);
      setAiReady(true);
      setAiOpen(false);
      setIsGenerating(false);
    }, 450);
  };

  const toggleCategory = (key: string) => {
    setAiReady(false);
    setSelectedCats((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleType = (key: QuestionType) => {
    setAiReady(false);
    setSelectedTypes((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const createAndStart = () => {
    if (!canCreate) return;
    navigate({
      to: "/training/session/$id",
      params: { id: `自主组卷-${Date.now()}` },
      search: {
        mode: "exam",
        filter: "",
        filters: categoryKeys.join(","),
        types: types.join(","),
        diff,
        count,
        limit,
        passScore,
        title: title.trim(),
      },
    });
  };

  return (
    <PageShell compact>
      <div className="flex h-full min-h-0 flex-col">
        <nav aria-label="页面导航" className="mb-1 flex shrink-0 items-center text-[12px]">
          <Link
            to="/training"
            className="inline-flex min-h-8 items-center gap-1 text-kb-muted hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 训练中心
          </Link>
        </nav>
        <div className="shrink-0">
          <PageHeader
            title="自主组卷"
            subtitle="选择测试范围与规则，实时预览无误后即可开始个人自测。"
            size="md"
          />
        </div>

        <div className="grid min-h-0 flex-1 items-stretch gap-5 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_350px] xl:overflow-hidden">
          <main className="min-h-0 min-w-0">
            <section className="flex h-full min-h-[640px] flex-col overflow-hidden rounded-[18px] border border-kb-border bg-white shadow-[0_12px_36px_rgba(25,69,78,0.04)] xl:min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-kb-surface text-primary">
                    <SlidersHorizontal className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-semibold text-kb-heading">组卷设置</h2>
                    <p className="mt-0.5 text-[11.5px] text-kb-muted">
                      所有设置在一个页面内完成，修改后预览立即更新。
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aiReady && !aiOpen && (
                    <span className="hidden items-center gap-1.5 text-[11px] text-success sm:inline-flex">
                      <Check className="h-3.5 w-3.5" /> 智能方案已应用
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setAiOpen((open) => !open)}
                    aria-expanded={aiOpen}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-2 rounded-[9px] border px-3 text-[12px] font-medium transition-colors",
                      aiOpen
                        ? "border-primary/25 bg-primary-soft text-primary"
                        : "border-kb-border bg-white text-kb-body hover:border-primary/30 hover:text-primary",
                    )}
                  >
                    {aiOpen ? <X className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {aiOpen ? "收起" : aiReady ? "重新配置" : "智能配置"}
                  </button>
                </div>
              </div>

              {aiOpen && (
                <div className="border-b border-divider bg-[#fbfcfc] px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">描述希望如何组卷</span>
                      <input
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        className="min-h-11 w-full rounded-[10px] border border-kb-border bg-white px-3.5 text-[13px] text-kb-heading outline-none transition focus:border-primary/55 focus:ring-2 focus:ring-primary/10"
                        placeholder="一句话说明想考什么，例如：主变操作进阶，20 分钟"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={generateWithAi}
                      disabled={!prompt.trim() || isGenerating}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-[12.5px] font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" /> 正在配置
                        </>
                      ) : (
                        <>
                          应用建议 <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10.5px] text-kb-muted">快速选择：</span>
                    {PROMPT_SAMPLES.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => setPrompt(sample.prompt)}
                        className="min-h-8 rounded-full border border-kb-border bg-white px-3 text-[10.5px] text-kb-body transition hover:border-primary/30 hover:text-primary"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {aiReady && !aiOpen && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-success/10 bg-success-soft/30 px-5 py-2.5 text-[11px] sm:px-6">
                  <span className="inline-flex min-w-0 items-center gap-2 text-success">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    已根据“
                    <span className="max-w-[420px] truncate font-medium">{appliedPrompt}</span>
                    ”更新组卷设置
                  </span>
                  <button
                    type="button"
                    onClick={() => setAiOpen(true)}
                    className="font-medium text-primary hover:underline"
                  >
                    调整建议
                  </button>
                </div>
              )}

              <div className="min-h-0 flex-1 divide-y divide-divider overflow-y-auto px-5 sm:px-6">
                <SettingSection
                  index="01"
                  title="试卷名称与规则"
                  description="用于个人组卷记录，不计入单位正式考试。"
                >
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_150px]">
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="min-h-11 rounded-[9px] border border-kb-border px-3.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      aria-label="试卷名称"
                    />
                    <CompactSelect
                      value={limit}
                      options={[20, 30, 45, 60]}
                      suffix="分钟"
                      onChange={setLimit}
                      label="考试时长"
                    />
                    <CompactSelect
                      value={passScore}
                      options={[60, 70, 80]}
                      suffix="分及格"
                      onChange={setPassScore}
                      label="及格线"
                    />
                  </div>
                </SettingSection>

                <SettingSection
                  index="02"
                  title="测试范围"
                  description={`已选 ${selectedLabels.length} 个范围，可用 ${available.toLocaleString()} 道题。`}
                >
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {KNOWLEDGE_CATEGORIES.map((category) => {
                      const active = selectedCats.has(category.key);
                      return (
                        <button
                          key={category.key}
                          type="button"
                          onClick={() => toggleCategory(category.key)}
                          aria-pressed={active}
                          className={cn(
                            "flex min-h-12 items-center justify-between gap-3 rounded-[9px] border px-3 text-left transition-colors",
                            active
                              ? "border-primary/35 bg-primary-soft/60 text-primary"
                              : "border-kb-border bg-white text-kb-body hover:border-primary/25",
                          )}
                        >
                          <span className="truncate text-[12.5px] font-medium">
                            {category.label}
                          </span>
                          <span className="shrink-0 text-[10.5px] tabular-nums text-kb-muted">
                            {category.questionCount} 题
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </SettingSection>

                <SettingSection
                  index="03"
                  title="题型与难度"
                  description="根据测试目的选择题型，并设置基础、综合或进阶难度。"
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div>
                      <div className="mb-2 text-[11px] font-medium text-kb-muted">题型</div>
                      <div className="flex flex-wrap gap-2">
                        {PRACTICE_TYPE_OPTIONS.map((item) => (
                          <ChoiceButton
                            key={item.key}
                            active={selectedTypes.has(item.key)}
                            onClick={() => toggleType(item.key)}
                            label={item.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-[11px] font-medium text-kb-muted">难度</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(["easy", "all", "hard"] as PracticeDifficulty[]).map((value) => (
                          <ChoiceButton
                            key={value}
                            active={diff === value}
                            onClick={() => {
                              setAiReady(false);
                              setDiff(value);
                            }}
                            label={DIFFICULTY_LABEL[value]}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </SettingSection>

                <SettingSection
                  index="04"
                  title="题量"
                  description="建议控制在一次可以专注完成的范围内。"
                >
                  <div className="flex flex-wrap gap-2">
                    {[10, 15, 20, 30, 50].map((value) => (
                      <ChoiceButton
                        key={value}
                        active={count === value}
                        onClick={() => {
                          setAiReady(false);
                          setCount(value);
                        }}
                        label={`${value} 题`}
                      />
                    ))}
                  </div>
                </SettingSection>
              </div>
            </section>
          </main>

          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto">
            <section className="relative flex min-h-[390px] flex-1 flex-col overflow-hidden rounded-[18px] border border-kb-border bg-[#f4fafb] p-5 shadow-[0_14px_34px_rgba(25,69,78,0.055)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_55%_at_100%_0%,rgba(52,155,172,0.18),transparent_62%),radial-gradient(80%_50%_at_0%_100%,rgba(52,155,172,0.08),transparent_55%),linear-gradient(180deg,#eef7f8_0%,#f7fbfb_48%,#f4fafb_100%)]" />
              <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full border-[22px] border-primary/[0.04]" />
              <div className="pointer-events-none absolute -bottom-16 -left-14 h-52 w-52 rounded-full border-[22px] border-primary/[0.035]" />
              <div className="relative flex items-center gap-2 text-[11.5px] font-semibold text-primary">
                <Layers3 className="h-4 w-4" /> 实时试卷预览
              </div>
              <h2 className="relative mt-3 text-[19px] font-semibold leading-7 text-kb-heading">
                {title.trim() || "未命名试卷"}
              </h2>
              <div className="relative mt-5 grid grid-cols-3 gap-2">
                <PreviewMetric value={`${count}`} label="题" />
                <PreviewMetric value={`${limit}`} label="分钟" />
                <PreviewMetric value={`${passScore}`} label="及格" />
              </div>
              <div className="relative mt-5 space-y-3 border-t border-divider pt-4 text-[11.5px]">
                <PreviewRow
                  label="范围"
                  value={selectedLabels.length ? selectedLabels.join("、") : "未选择"}
                />
                <PreviewRow label="难度" value={DIFFICULTY_LABEL[diff]} />
                <PreviewRow label="题型" value={`${types.length} 种`} />
              </div>
              <div className="relative mt-auto rounded-[10px] border border-primary/10 bg-[#f7fbfb] p-3">
                <div className="flex items-center justify-between text-[10.5px] text-kb-muted">
                  <span>题目覆盖</span>
                  <span className="font-medium text-primary">
                    {Math.min(100, Math.round((available / Math.max(count, 1)) * 18))}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8eff0]">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, Math.round((available / Math.max(count, 1)) * 18))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[10.5px] leading-4 text-kb-muted">
                  题量与范围匹配良好，能够形成基础—应用—易错点梯度。
                </p>
              </div>
            </section>

            <section className="rounded-[16px] border border-kb-border bg-[linear-gradient(145deg,#ffffff,#f5fafb)] p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-success-soft text-success">
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-semibold text-kb-heading">
                    生成后直接进入自测
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-5 text-kb-muted">
                    答题记录归入个人组卷，不影响单位正式考试成绩。
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!canCreate}
                onClick={createAndStart}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-[13.5px] font-semibold text-white hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FilePlus2 className="h-4 w-4" /> 生成试卷并开始 <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function SettingSection({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 py-5 lg:grid-cols-[210px_minmax(0,1fr)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[10.5px] font-semibold text-primary">{index}</span>
        <div>
          <h3 className="text-[13.5px] font-semibold text-kb-heading">{title}</h3>
          <p className="mt-1 text-[11px] leading-5 text-kb-muted">{description}</p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function CompactSelect({
  value,
  options,
  suffix,
  onChange,
  label,
}: {
  value: number;
  options: number[];
  suffix: string;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <label className="relative block">
      <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kb-muted" />
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-11 w-full appearance-none rounded-[9px] border border-kb-border bg-white pl-9 pr-3 text-[12.5px] outline-none focus:border-primary"
        aria-label={label}
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item} {suffix}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChoiceButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 rounded-[8px] border px-3.5 text-[12px] font-medium transition-colors",
        active
          ? "border-primary/35 bg-primary-soft text-primary"
          : "border-kb-border bg-white text-kb-body hover:border-primary/30",
      )}
    >
      {label}
    </button>
  );
}

function PreviewMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[10px] border border-kb-border bg-white px-2 py-3 text-center">
      <strong className="block text-[20px] tabular-nums text-kb-heading">{value}</strong>
      <span className="text-[10px] text-kb-muted">{label}</span>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-kb-muted">{label}</dt>
      <dd className="text-right leading-5 text-kb-heading">{value}</dd>
    </div>
  );
}
