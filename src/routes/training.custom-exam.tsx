import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  History,
  Info,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageTitleMark } from "@/components/learning/ui";
import { TrainingPageFrame } from "@/components/learning/training-breadcrumb";
import { KNOWLEDGE_CATEGORIES, type QuestionType } from "@/lib/mock/data";
import {
  PRACTICE_TYPE_OPTIONS,
  countAvailableQuestions,
  type PracticeDifficulty,
} from "@/lib/mock/practice-filter";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/custom-exam")({
  component: CustomExamPage,
  head: () => ({ meta: [{ title: "AI自主组卷 · 训练中心" }] }),
});

const PROMPT_MAX = 200;
const COUNT_OPTIONS = [20, 30, 45] as const;
const DURATION_OPTIONS = [20, 30, 45] as const;
const COUNT_MIN = 1;
const COUNT_MAX = 200;
const DURATION_MIN = 1;
const DURATION_MAX = 180;

function clampInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function parseBoundedInt(text: string, pattern: RegExp, fallback: number, min: number, max: number) {
  const match = text.match(pattern);
  if (!match) return fallback;
  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed)) return fallback;
  return clampInt(parsed, min, max);
}

type ExamPrefs = {
  recentWrong: boolean;
  coverRules: boolean;
  avoidDup: boolean;
  scenario: boolean;
};

type PromptSample = {
  label: string;
  prompt: string;
  title: string;
  cats: string[];
  types: QuestionType[];
  count: number;
  limit: number;
  diff: PracticeDifficulty;
  audience: string;
  prefs: ExamPrefs;
};

const DEFAULT_PREFS: ExamPrefs = {
  recentWrong: false,
  coverRules: false,
  avoidDup: false,
  scenario: false,
};

const PROMPT_SAMPLES: PromptSample[] = [
  {
    label: "新员工入职测评",
    prompt: "为新员工生成入职测评，覆盖厂站规程与典型操作，控制在 30 分钟。",
    title: "新员工入职能力测评",
    cats: ["厂站规程", "主变停役", "规程规定和制度"],
    types: ["single", "judge", "multiple"],
    count: 20,
    limit: 30,
    diff: "easy",
    audience: "新员工 / 值班员",
    prefs: { recentWrong: false, coverRules: true, avoidDup: true, scenario: true },
  },
  {
    label: "班前抽考",
    prompt: "生成一套班前抽考卷，覆盖近期重点规则，题量精简、时长 20 分钟。",
    title: "班前重点规则抽考",
    cats: ["AGC", "一次调频"],
    types: ["single", "judge"],
    count: 20,
    limit: 20,
    diff: "easy",
    audience: "值班员",
    prefs: { recentWrong: false, coverRules: true, avoidDup: true, scenario: false },
  },
  {
    label: "AGC 易错点复盘",
    prompt: "检验我对 AGC、一次调频与两细则的掌握，重点考易错规则。",
    title: "AGC 与两细则能力自测",
    cats: ["AGC", "一次调频", "主变停役"],
    types: ["single", "judge", "multiple"],
    count: 20,
    limit: 30,
    diff: "all",
    audience: "值班员 / 新员工",
    prefs: { recentWrong: true, coverRules: true, avoidDup: true, scenario: false },
  },
  {
    label: "主变操作进阶",
    prompt: "生成一套主变操作进阶测评，控制在 20 分钟，加入情景题。",
    title: "主变操作进阶自测",
    cats: ["主变停役", "电网调度运行操作", "异常处置"],
    types: ["single", "multiple", "text"],
    count: 20,
    limit: 20,
    diff: "hard",
    audience: "值班员 / 值班长",
    prefs: { recentWrong: true, coverRules: true, avoidDup: true, scenario: true },
  },
];

const PREF_ITEMS: { key: keyof ExamPrefs; label: string }[] = [
  { key: "recentWrong", label: "优先最近错题" },
  { key: "coverRules", label: "覆盖重点规则" },
  { key: "avoidDup", label: "避免重复题目" },
  { key: "scenario", label: "加入情景题" },
];

const DIFFICULTY_LABEL: Record<PracticeDifficulty, string> = {
  all: "综合",
  easy: "基础",
  hard: "进阶",
};

const TYPE_RATIO: Record<QuestionType, number> = {
  single: 0.5,
  judge: 0.3,
  multiple: 0.2,
  text: 0.15,
};

function CustomExamPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedCats, setSelectedCats] = useState<Set<string>>(() => new Set(["AGC"]));
  const [selectedTypes, setSelectedTypes] = useState<Set<QuestionType>>(
    () => new Set(["single", "multiple", "judge"]),
  );
  const [diff, setDiff] = useState<PracticeDifficulty>("all");
  const [count, setCount] = useState(20);
  const [limit, setLimit] = useState(30);
  const [prefs, setPrefs] = useState<ExamPrefs>(DEFAULT_PREFS);
  const passScore = 60;

  const categoryKeys = useMemo(() => Array.from(selectedCats), [selectedCats]);
  const types = useMemo(() => Array.from(selectedTypes), [selectedTypes]);
  const selectedCategories = KNOWLEDGE_CATEGORIES.filter((item) => selectedCats.has(item.key));
  const selectedLabels = selectedCategories.map((item) => item.label);
  const available = useMemo(
    () => countAvailableQuestions({ categoryKeys, types, diff }),
    [categoryKeys, types, diff],
  );
  const typeShares = useMemo(() => distributeTypes(types, count), [types, count]);

  const resolvedTitle = title.trim() || "个人能力自测";
  const countValid = count >= COUNT_MIN && count <= COUNT_MAX;
  const limitValid = limit >= DURATION_MIN && limit <= DURATION_MAX;
  const canCreate = selectedCats.size > 0 && types.length > 0 && countValid && limitValid;
  const allCatsSelected =
    KNOWLEDGE_CATEGORIES.length > 0 && selectedCats.size === KNOWLEDGE_CATEGORIES.length;
  const allTypesSelected =
    PRACTICE_TYPE_OPTIONS.length > 0 && selectedTypes.size === PRACTICE_TYPE_OPTIONS.length;

  const coverage = canCreate
    ? Math.min(96, 64 + selectedCats.size * 6 + (prefs.coverRules ? 6 : 0) + (prefs.recentWrong ? 4 : 0))
    : 0;

  const applyPlan = (plan: Omit<PromptSample, "label" | "prompt">) => {
    setSelectedCats(new Set(plan.cats));
    setSelectedTypes(new Set(plan.types));
    setCount(clampInt(plan.count, COUNT_MIN, COUNT_MAX));
    setLimit(clampInt(plan.limit, DURATION_MIN, DURATION_MAX));
    setDiff(plan.diff);
    setTitle(plan.title);
    setAudience(plan.audience);
    setPrefs(plan.prefs);
    setAiReady(true);
  };

  const inferPlan = (input: string): Omit<PromptSample, "label" | "prompt"> => {
    const preset = PROMPT_SAMPLES.find(
      (sample) => sample.prompt === input || input.includes(sample.label),
    );
    if (preset) {
      return {
        title: preset.title,
        cats: preset.cats,
        types: preset.types,
        count: preset.count,
        limit: preset.limit,
        diff: preset.diff,
        audience: preset.audience,
        prefs: preset.prefs,
      };
    }

    const nextCats = new Set<string>();
    KNOWLEDGE_CATEGORIES.forEach((item) => {
      if (input.includes(item.label) || input.includes(item.key)) nextCats.add(item.key);
    });
    if (input.includes("主变") || input.includes("倒闸") || input.includes("操作票")) {
      nextCats.add("主变停役");
    }
    if (input.includes("保护") || input.includes("故障复盘")) nextCats.add("差动保护");
    if (input.includes("调频")) nextCats.add("一次调频");
    if (input.includes("新员工") || input.includes("入职") || input.includes("规程")) {
      nextCats.add("厂站规程");
    }
    if (nextCats.size === 0) nextCats.add("AGC");

    const nextTypes = new Set<QuestionType>(["single", "judge"]);
    if (!input.includes("抽考") && !input.includes("精简")) nextTypes.add("multiple");
    if (input.includes("情景") || input.includes("简答") || input.includes("进阶")) nextTypes.add("text");

    return {
      title: input.includes("主变")
        ? "主变操作进阶自测"
        : input.includes("新员工")
          ? "新员工入职能力测评"
          : "AGC 与两细则能力自测",
      cats: Array.from(nextCats),
      types: Array.from(nextTypes),
      count: parseBoundedInt(input, /(\d+)\s*(?:道)?题/, 20, COUNT_MIN, COUNT_MAX),
      limit: parseBoundedInt(input, /(\d+)\s*分钟/, 30, DURATION_MIN, DURATION_MAX),
      diff: input.includes("进阶") || input.includes("易错") ? "hard" : input.includes("新员工") || input.includes("班前") ? "easy" : "all",
      audience: input.includes("新员工") ? "新员工 / 值班员" : input.includes("班前") ? "值班员" : "值班员 / 运行人员",
      prefs: {
        recentWrong: input.includes("错题") || input.includes("易错"),
        coverRules: true,
        avoidDup: true,
        scenario: input.includes("情景") || input.includes("操作"),
      },
    };
  };

  const generateWithAi = (nextPrompt = prompt) => {
    const input = nextPrompt.trim();
    if (!input || isGenerating) return;
    setIsGenerating(true);
    window.setTimeout(() => {
      applyPlan(inferPlan(input));
      setIsGenerating(false);
    }, 420);
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

  const toggleAllCategories = () => {
    setAiReady(false);
    setSelectedCats(
      allCatsSelected ? new Set() : new Set(KNOWLEDGE_CATEGORIES.map((item) => item.key)),
    );
  };

  const toggleAllTypes = () => {
    setAiReady(false);
    setSelectedTypes(
      allTypesSelected ? new Set() : new Set(PRACTICE_TYPE_OPTIONS.map((item) => item.key)),
    );
  };

  const togglePref = (key: keyof ExamPrefs) => {
    setAiReady(false);
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
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
        title: resolvedTitle,
      },
    });
  };

  return (
    <TrainingPageFrame current="custom-exam">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <PageTitleMark className="pt-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-[18px] font-semibold text-kb-heading">自主组卷</h1>
              </div>
              <p className="mt-0.5 hidden text-[12px] text-kb-muted sm:block">
                输入目标后自动匹配约束，确认即可开始自测。
              </p>
            </div>
          </div>
          <Link
            to="/training/records"
            search={{ source: "模拟考试" }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] border border-kb-border bg-white px-3 text-[12px] font-medium text-kb-body transition-colors hover:border-primary/35 hover:text-primary"
          >
            <History className="h-3.5 w-3.5" />
            查看历史组卷
          </Link>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_300px] xl:overflow-hidden">
          <main className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
            <section className="shrink-0 rounded-[14px] border border-kb-border bg-white px-4 py-3">
              <SectionHeading
                index="01"
                title="组卷目标"
                description="告诉 AI 测评目标，将自动匹配组卷方案。"
              />
              <div className="relative mt-2.5">
                <label className="sr-only" htmlFor="exam-goal">
                  组卷目标
                </label>
                <textarea
                  id="exam-goal"
                  value={prompt}
                  maxLength={PROMPT_MAX}
                  onChange={(event) => setPrompt(event.target.value.slice(0, PROMPT_MAX))}
                  placeholder="例如：检验我对 AGC、一次调频与两细则的掌握，重点考易错规则，控制在 30 分钟。"
                  className="h-[84px] w-full resize-none rounded-[10px] border border-kb-border bg-[#F8FBFC] px-3 py-2.5 pr-[148px] text-[13px] leading-5 text-kb-heading outline-none transition placeholder:text-kb-muted/80 focus:border-primary/55 focus:bg-white focus:ring-2 focus:ring-primary/10"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <span className="text-[11px] tabular-nums text-kb-muted">
                    {prompt.length}/{PROMPT_MAX}
                  </span>
                  <button
                    type="button"
                    onClick={() => generateWithAi()}
                    disabled={!prompt.trim() || isGenerating}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isGenerating ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <WandSparkles className="h-3.5 w-3.5" />
                    )}
                    {isGenerating ? "匹配中" : "AI生成建议"}
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto">
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-kb-muted">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  快速建议
                </span>
                {PROMPT_SAMPLES.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setPrompt(sample.prompt);
                      generateWithAi(sample.prompt);
                    }}
                    className={cn(
                      "h-7 shrink-0 rounded-full border px-2.5 text-[11.5px] transition-colors",
                      prompt === sample.prompt
                        ? "border-primary/30 bg-primary-soft text-primary"
                        : "border-kb-border bg-white text-kb-body hover:border-primary/30 hover:text-primary",
                    )}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </section>

            <section
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-kb-border bg-white px-4 py-3",
                aiReady && "ring-1 ring-primary/15",
              )}
            >
              <SectionHeading
                index="02"
                title="组卷约束"
                description={
                  aiReady
                    ? `已根据目标自动匹配，已选 ${selectedLabels.length} 个范围，可抽取 ${available.toLocaleString()} 道题。`
                    : `已选 ${selectedLabels.length} 个范围，可抽取 ${available.toLocaleString()} 道题。`
                }
                extra={
                  aiReady ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-success">
                      <Check className="h-3.5 w-3.5" />
                      已自动匹配
                    </span>
                  ) : null
                }
              />

              <div className="mt-2.5 min-h-0 flex-1 space-y-3 overflow-y-auto">
                <div>
                  <div className="mb-1.5 text-[11px] font-medium text-kb-muted">知识范围</div>
                  <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    <button
                      type="button"
                      onClick={toggleAllCategories}
                      aria-pressed={allCatsSelected}
                      className={cn(
                        "flex h-10 items-center justify-between gap-2 rounded-[8px] border px-2.5 text-left transition-colors",
                        allCatsSelected
                          ? "border-primary/35 bg-primary-soft/60 text-primary"
                          : "border-kb-border bg-white text-kb-body hover:border-primary/25",
                      )}
                    >
                      <span className="truncate text-[12.5px] font-medium">全部</span>
                      <span className="shrink-0 text-[10.5px] tabular-nums text-kb-muted">
                        {KNOWLEDGE_CATEGORIES.reduce((sum, item) => sum + item.questionCount, 0).toLocaleString()}{" "}
                        题
                      </span>
                    </button>
                    {KNOWLEDGE_CATEGORIES.map((category) => {
                      const active = selectedCats.has(category.key);
                      return (
                        <button
                          key={category.key}
                          type="button"
                          onClick={() => toggleCategory(category.key)}
                          aria-pressed={active}
                          className={cn(
                            "flex h-10 items-center justify-between gap-2 rounded-[8px] border px-2.5 text-left transition-colors",
                            active
                              ? "border-primary/35 bg-primary-soft/60 text-primary"
                              : "border-kb-border bg-white text-kb-body hover:border-primary/25",
                          )}
                        >
                          <span className="truncate text-[12.5px] font-medium">{category.label}</span>
                          <span className="shrink-0 text-[10.5px] tabular-nums text-kb-muted">
                            {category.questionCount} 题
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <ConstraintRow label="题型">
                    <ChoiceButton
                      active={allTypesSelected}
                      onClick={toggleAllTypes}
                      label="全部"
                    />
                    {PRACTICE_TYPE_OPTIONS.map((item) => (
                      <ChoiceButton
                        key={item.key}
                        active={selectedTypes.has(item.key)}
                        onClick={() => toggleType(item.key)}
                        label={item.label}
                      />
                    ))}
                  </ConstraintRow>
                  <ConstraintRow label="难度">
                    {(["all", "easy", "hard"] as PracticeDifficulty[]).map((value) => (
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
                  </ConstraintRow>
                  <ConstraintRow label="题量" hint={`可输入 ${COUNT_MIN}–${COUNT_MAX} 题`}>
                    <NumberField
                      value={count}
                      min={COUNT_MIN}
                      max={COUNT_MAX}
                      unit="题"
                      ariaLabel="题量"
                      onChange={(value) => {
                        setAiReady(false);
                        setCount(value);
                      }}
                    />
                    {COUNT_OPTIONS.map((value) => (
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
                  </ConstraintRow>
                  <ConstraintRow label="时长" hint={`可输入 ${DURATION_MIN}–${DURATION_MAX} 分钟`}>
                    <NumberField
                      value={limit}
                      min={DURATION_MIN}
                      max={DURATION_MAX}
                      unit="分钟"
                      ariaLabel="考试时长"
                      onChange={(value) => {
                        setAiReady(false);
                        setLimit(value);
                      }}
                    />
                    {DURATION_OPTIONS.map((value) => (
                      <ChoiceButton
                        key={value}
                        active={limit === value}
                        onClick={() => {
                          setAiReady(false);
                          setLimit(value);
                        }}
                        label={`${value} 分钟`}
                      />
                    ))}
                  </ConstraintRow>
                </div>

                <ConstraintRow label="出题偏好">
                  {PREF_ITEMS.map((item) => (
                    <ChoiceButton
                      key={item.key}
                      active={prefs[item.key]}
                      onClick={() => togglePref(item.key)}
                      label={item.label}
                    />
                  ))}
                </ConstraintRow>
              </div>
            </section>
          </main>

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-kb-border bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-primary">
                <FileText className="h-3.5 w-3.5" />
                本次组卷预览
              </div>
              <h2 className="mt-2 text-[16px] font-semibold leading-6 text-kb-heading">
                {canCreate ? resolvedTitle : "等待生成试卷方案"}
              </h2>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                <PreviewMetric value={String(count)} label="题" />
                <PreviewMetric value={String(limit)} label="分钟" />
                <PreviewMetric value={canCreate ? "100" : "—"} label="分" />
                <PreviewMetric value={DIFFICULTY_LABEL[diff]} label="难度" />
              </div>
              <dl className="mt-3 space-y-2 border-t border-divider pt-3 text-[12px]">
                <PreviewRow
                  label="知识覆盖"
                  value={selectedLabels.length ? selectedLabels.join("、") : "未选择"}
                />
                <PreviewRow
                  label="题型构成"
                  value={
                    typeShares.length
                      ? typeShares.map((item) => `${item.label} ${item.n}`).join(" · ")
                      : "未选择"
                  }
                />
              </dl>
              <ul className="mt-3 space-y-1.5 border-t border-divider pt-3 text-[11.5px] leading-5 text-kb-body">
                {[
                  "根据目标自动匹配知识点与题型结构",
                  prefs.recentWrong ? "优先抽取近期错题与高频易错点" : "控制题型比例，避免单一题型堆叠",
                  "答题记录不影响正式考试成绩",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="shrink-0 border-t border-divider px-4 py-3">
              <button
                type="button"
                disabled={!canCreate}
                onClick={createAndStart}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-[13px] font-semibold text-white shadow-[0_6px_14px_rgba(52,155,172,0.24)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                开始组卷并进入测试
                <ArrowRight className="h-4 w-4" />
              </button>
     
              <p className="mt-1.5 flex items-start gap-1 text-[10.5px] leading-4 text-kb-muted">
                <ShieldCheck className="mt-px h-3 w-3 shrink-0" />
                答题记录记入个人训练，不影响正式考试。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </TrainingPageFrame>
  );
}

function distributeTypes(types: QuestionType[], total: number) {
  if (types.length === 0) return [];
  const weights = types.map((type) => TYPE_RATIO[type]);
  const sum = weights.reduce((acc, item) => acc + item, 0);
  const percents = weights.map((weight) => (weight / sum) * 100);
  const rounded = percents.map((item) => Math.round(item));
  rounded[rounded.length - 1] += 100 - rounded.reduce((acc, item) => acc + item, 0);

  const rawCounts = percents.map((percent) => (total * percent) / 100);
  const counts = rawCounts.map((item) => Math.floor(item));
  let remain = Math.max(0, total - counts.reduce((acc, item) => acc + item, 0));
  const order = rawCounts
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  order.forEach((item) => {
    if (remain <= 0) return;
    counts[item.index] += 1;
    remain -= 1;
  });

  return types.map((type, index) => ({
    type,
    label: PRACTICE_TYPE_OPTIONS.find((item) => item.key === type)?.label.replace("题", "") ?? type,
    percent: Math.max(0, rounded[index]),
    n: counts[index],
  }));
}

function SectionHeading({
  index,
  title,
  description,
  extra,
}: {
  index: string;
  title: string;
  description: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold text-white">
          {index}
        </span>
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold leading-5 text-kb-heading">{title}</h2>
          <p className="truncate text-[11.5px] leading-4 text-kb-muted">{description}</p>
        </div>
      </div>
      {extra}
    </div>
  );
}

function ConstraintRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <div className="text-[11px] font-medium text-kb-muted">{label}</div>
        {hint ? <span className="text-[10.5px] text-kb-muted/75">{hint}</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function NumberField({
  value,
  onChange,
  min,
  max,
  unit,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clampInt(parsed, min, max);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <label
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-[8px] border bg-white px-2.5 text-[12px] transition-colors",
        "border-primary/40 focus-within:border-primary/55 focus-within:ring-2 focus-within:ring-primary/10",
      )}
    >
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        aria-label={ariaLabel}
        value={draft}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          const parsed = Number.parseInt(nextDraft, 10);
          if (Number.isFinite(parsed) && parsed >= min && parsed <= max) {
            onChange(parsed);
          }
        }}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className="h-6 w-12 border-0 bg-transparent p-0 text-center text-[12px] font-medium tabular-nums text-kb-heading outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="shrink-0 text-kb-muted">{unit}</span>
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
        "h-8 rounded-[8px] border px-3 text-[12px] font-medium transition-colors",
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
    <div className="rounded-[8px] border border-kb-border bg-[#F7FBFC] px-1 py-1.5 text-center">
      <strong className="block text-[15px] font-semibold tabular-nums text-kb-heading">{value}</strong>
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
