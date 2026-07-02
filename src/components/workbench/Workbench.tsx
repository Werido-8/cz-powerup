import {
  TrendingUp,
  Target,
  Activity,
  Clock,
  ArrowRight,
  Wrench,
  FileSearch,
  BookOpen,
  Brain,
  MessagesSquare,
  ClipboardList,
  FileText,
  ChevronRight,
  Sparkles,
  GraduationCap,
  BookMarked,
  Layers,
  Bot,
  Info,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

type EntryRoute = "/learn" | "/training" | "/chat" | "/assets";
type ScenarioRoute = "/scenario/typical" | "/scenario/fault";
type TaskRoute = "/training/wrong" | "/learn/topic/$id" | "/training/practice";
type DocRoute = "/learn/doc/$id";
type TopicRoute = "/learn/topic/$id";

const CARD =
  "rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-[#fafcfd]";
const CARD_SHADOW = "shadow-[0_1px_2px_0_rgba(52,155,172,0.04)]";

const METRICS = [
  {
    label: "学习进度",
    value: 85,
    suffix: "%",
    desc: "岗位能力路径完成度",
    icon: TrendingUp,
    bar: "primary" as const,
  },
  {
    label: "答题正确率",
    value: 92,
    suffix: "%",
    desc: "近 30 天知识掌握情况",
    icon: Target,
    bar: "success" as const,
  },
  {
    label: "练习次数",
    value: 24,
    suffix: "次",
    desc: "近 30 天场景练习记录",
    icon: Activity,
    bar: "primary" as const,
    progress: 80,
  },
];

const WEAK_POINTS = [
  { name: "继电保护动作原理", rate: 62 },
  { name: "变压器有载调压", rate: 68 },
  { name: "AGC / AVC 闭环逻辑", rate: 71 },
];

const TASKS: {
  id: string;
  title: string;
  meta: string;
  tag: string;
  tagTone: "muted" | "memory" | "weak";
  action: string;
  to: TaskRoute;
  params?: { id: string };
  highlight?: boolean;
}[] = [
  {
    id: "1",
    title: "错题巩固：220kV 变电站典型故障处置",
    meta: "昨日错题 · 3 题待巩固",
    tag: "错题",
    tagTone: "muted",
    action: "去巩固",
    to: "/training/wrong",
  },
  // 本期暂不开放：艾宾浩斯复习
  // {
  //   id: "2",
  //   title: "专题复习：继电保护动作逻辑",
  //   meta: "艾宾浩斯 · 第 4 天复习节点",
  //   tag: "记忆",
  //   tagTone: "memory",
  //   action: "去复习",
  //   to: "/learn/topic/$id",
  //   params: { id: "t-fault" },
  // },
  {
    id: "3",
    title: "薄弱点强化：母线差动保护原理",
    meta: "近 7 日正确率 62%",
    tag: "薄弱",
    tagTone: "weak",
    action: "去练习",
    to: "/training/practice",
    highlight: true,
  },
];

const ENTRIES: { icon: typeof BookOpen; title: string; desc: string; tag: string; to: EntryRoute }[] = [
  {
    icon: BookOpen,
    title: "知识学习",
    desc: "结构化课程与专题资料，按岗位能力递进",
    tag: "今日 3 节",
    to: "/learn",
  },
  {
    icon: ClipboardList,
    title: "题库训练",
    desc: "智能组卷、错题回顾、考点画像",
    tag: "1280 题",
    to: "/training",
  },
  // 本期暂不开放：智能问答
  // {
  //   icon: MessagesSquare,
  //   title: "智能问答",
  //   desc: "基于内部知识库的多轮答疑与原文引用",
  //   tag: "AI",
  //   to: "/chat",
  // },
  {
    icon: Brain,
    title: "个人沉淀",
    desc: "复盘记录、错因分析与能力成长轨迹",
    tag: "已沉淀 48",
    to: "/assets",
  },
];

const SCENARIOS: {
  icon: typeof Wrench;
  title: string;
  desc: string;
  stats: string[];
  bg: string;
  to: ScenarioRoute;
}[] = [
  {
    icon: Wrench,
    title: "典型操作训练",
    desc: "围绕启停、任务前准备、操作步骤、关键确认点和易错环节，进行情景化练习。",
    stats: ["12 条规程", "48 个操作场景", "覆盖 220kV / 500kV"],
    bg: "bg-primary-soft/50",
    to: "/scenario/typical",
  },
  {
    icon: FileSearch,
    title: "故障处置复盘训练",
    desc: "围绕故障现象、保护动作、处置流程和复盘依据，提升异常场景下的判断能力。",
    stats: ["36 个典型案例", "保护动作逻辑", "时间线复盘"],
    bg: "bg-remind-soft/80",
    to: "/scenario/fault",
  },
];

const PATHS: { step: string; title: string; meta: string; progress: number; topicId: string; recommend?: boolean }[] = [
  { step: "01", title: "新员工入门专题", meta: "12 课时 · 4 周", progress: 35, topicId: "t-newbie", recommend: true },
  { step: "02", title: "典型操作专项", meta: "8 课时 · 含 6 个案例", progress: 60, topicId: "t-op" },
  { step: "03", title: "考评冲刺", meta: "问答 · 规程 · 30 天", progress: 12, topicId: "t-agc" },
];

const UPDATES: { type: string; title: string; time: string; docId: string }[] = [
  {
    type: "规程",
    title: "《国家电网公司变电站典型操作票》2024 修订版",
    time: "2 小时前",
    docId: "d4",
  },
  // {
  //   type: "SOP",
  //   title: "220kV 主变停送电标准化作业流程 v3.2",
  //   time: "今天 09:20",
  //   docId: "d2",
  // },
  {
    type: "案例",
    title: "某 500kV 变电站母差保护动作分析报告",
    time: "昨天",
    docId: "d3",
  },
  {
    type: "通知",
    title: "迎峰度夏期间运行风险提示（第 12 期）",
    time: "2 天前",
    docId: "d7",
  },
];

const TAG_STYLES: Record<string, string> = {
  规程: "bg-primary-soft text-accent-foreground",
  SOP: "bg-success-soft text-success",
  案例: "bg-remind-soft text-remind-foreground",
  通知: "bg-muted text-muted-foreground",
};

const TASK_TAG_STYLES: Record<string, string> = {
  muted: "bg-muted text-muted-foreground",
  memory: "bg-primary-soft text-accent-foreground",
  weak: "bg-remind-soft text-remind-foreground",
};

function ProgressBar({
  value,
  tone = "primary",
  className = "",
}: {
  value: number;
  tone?: "primary" | "success" | "remind";
  className?: string;
}) {
  const fill =
    tone === "success" ? "bg-success" : tone === "remind" ? "bg-remind" : "bg-primary";
  return (
    <div className={`h-1 overflow-hidden rounded-full bg-divider ${className}`}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${CARD} ${CARD_SHADOW} p-6 ${className}`}>{children}</div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Workbench() {
  return (
    <main className="mx-auto max-w-[1760px] px-8 py-6">
      {/* Welcome Banner */}
      <section
        className={`relative overflow-hidden ${CARD} border-primary/10 bg-gradient-to-r from-primary-soft/80 via-primary-soft/40 to-card px-6 py-5`}
        style={{ minHeight: 140 }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary/8 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-primary/5 blur-xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              今日任务 3 项待完成
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              下午好，张工
              <span className="mx-2 font-normal text-muted-foreground">｜</span>
              <span className="text-primary">让我们开始今天的能力提升</span>
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              你已连续学习 <span className="font-medium text-foreground">7 天</span>，本周目标完成度{" "}
              <span className="font-medium text-foreground">68%</span>，继续保持。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["今日任务 3 项", "连续学习 7 天", "本周完成度 68%"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-white/80 px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full max-w-[300px] shrink-0 rounded-xl border border-remind/20 bg-remind-soft/60 p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-remind-foreground">
              <Bot className="h-3.5 w-3.5 text-remind" />
              AI 学习助手提示
            </div>
            <p className="text-[12px] leading-relaxed text-remind-foreground/90">
              本平台提供知识学习、场景练习和能力成长辅助，关键操作仍需以现场规程、票卡和岗位要求为准。
            </p>
            <Link
              to="/governance"
              className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary/80"
            >
              <Info className="h-3 w-3" />
              查看使用说明
            </Link>
          </div>
        </div>
      </section>

      {/* Growth Overview + Today's Tasks */}
      <section className="mt-5 grid grid-cols-12 gap-5">
        <SectionCard className="col-span-12 lg:col-span-8">
          <SectionHeader
            title="能力成长概览"
            subtitle="综合学习进度、答题表现和场景练习情况生成"
          />

          <div className="grid grid-cols-3 gap-3">
            {METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="rounded-xl border border-border bg-[#fafcfd] p-4 transition-all hover:border-primary/20"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[12px] text-muted-foreground">{m.label}</span>
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-[28px] font-bold leading-none tracking-tight text-foreground">
                      {m.value}
                    </span>
                    <span className="text-[13px] text-muted-foreground">{m.suffix}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{m.desc}</p>
                  <ProgressBar
                    value={m.suffix === "%" ? m.value : (m.progress ?? 80)}
                    tone={m.bar}
                    className="mt-3"
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-divider pt-5">
            <div className="mb-3 flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-primary" />
              <span className="text-[14px] font-semibold text-foreground">薄弱知识点</span>
              <span className="rounded-full bg-remind-soft px-2 py-0.5 text-[10px] font-medium text-remind-foreground">
                需要重点关注
              </span>
            </div>
            <ul className="space-y-3">
              {WEAK_POINTS.map((w) => (
                <li key={w.name} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{w.name}</span>
                  <ProgressBar value={w.rate} tone="remind" className="w-28" />
                  <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-muted-foreground">
                    {w.rate}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        <SectionCard className="col-span-12 flex flex-col lg:col-span-4">
          <SectionHeader
            title="今日学习与情景巩固"
            subtitle="基于历史学习表现和近期资料更新智能推荐"
            action={
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                <Clock className="h-3 w-3" />
                预计 15 分钟
              </span>
            }
          />

          <ul className="flex flex-1 flex-col gap-3">
            {TASKS.map((t) => (
              <li
                key={t.id}
                className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all ${
                  t.highlight
                    ? "border-primary/25 bg-primary-soft/30"
                    : "border-border bg-[#fafcfd] hover:border-primary/20"
                }`}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-foreground">{t.title}</span>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${TASK_TAG_STYLES[t.tagTone]}`}
                    >
                      {t.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t.meta}</p>
                </div>
                {t.params ? (
                  <Link
                    to={t.to as TopicRoute}
                    params={t.params}
                    className="shrink-0 rounded-lg border border-primary/20 bg-white px-2.5 py-1.5 text-[12px] font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft"
                  >
                    {t.action}
                  </Link>
                ) : (
                  <Link
                    to={t.to as "/training/wrong" | "/training/practice"}
                    className="shrink-0 rounded-lg border border-primary/20 bg-white px-2.5 py-1.5 text-[12px] font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft"
                  >
                    {t.action}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* 本期暂不开放：复习统计
          <div className="mt-4 flex items-center justify-between rounded-xl border border-divider bg-muted/40 px-4 py-2.5 text-[12px] text-muted-foreground">
            <span>
              本周累计复习 <span className="font-semibold text-foreground">18</span> 项
            </span>
            <span>
              记忆路径覆盖 <span className="font-semibold text-primary">86%</span>
            </span>
          </div>
          */}
        </SectionCard>
      </section>

      {/* Core Entries + Scenario Training */}
      <section className="mt-5 grid grid-cols-12 items-stretch gap-5">
        <div className="col-span-12 flex flex-col xl:col-span-5">
          <div className="mb-4 flex min-h-14 items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">核心能力入口</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">知识学习与题库训练核心入口</p>
            </div>
            <span className="mb-0.5 shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
              高频使用
            </span>
          </div>
          <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-4">
            {ENTRIES.map((e) => {
              const Icon = e.icon;
              return (
                <Link
                  key={e.title}
                  to={e.to}
                  className={`group flex h-full flex-col ${CARD} ${CARD_SHADOW} p-5`}
                >
                  <div className="mb-3 flex w-full items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {e.tag}
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold text-foreground">{e.title}</div>
                  <p className="mt-1 flex-1 text-[12px] leading-relaxed text-muted-foreground">{e.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 flex flex-col xl:col-span-7">
          <div className="mb-4 flex min-h-14 items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">场景训练</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                沉浸式情景练习，连接知识点与一线作业
              </p>
            </div>
         
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            {SCENARIOS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.title}
                  to={s.to}
                  className={`group relative flex h-full overflow-hidden ${CARD} ${CARD_SHADOW} p-5`}
                >
                  <div className={`absolute inset-0 ${s.bg} opacity-70`} />
                  <div className="relative flex h-full flex-col">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-white text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-[16px] font-semibold text-foreground">{s.title}</h3>
                    <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">{s.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.stats.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border/80 bg-white/80 px-2 py-0.5 text-[10.5px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-primary transition-transform group-hover:translate-x-0.5">
                      开始训练
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learning Paths + Recent Updates */}
      <section className="mt-5 grid grid-cols-12 gap-5">
        <SectionCard className="col-span-12 lg:col-span-8">
          <SectionHeader
            title="推荐学习路径"
            subtitle="根据岗位、学习记录和薄弱点智能生成"
            action={
              <Link to="/learn" className="text-[12px] font-medium text-primary hover:text-primary/80">
                全部路径
              </Link>
            }
          />
          <div className="space-y-3">
            {PATHS.map((p) => (
              <Link
                key={p.step}
                to="/learn/topic/$id"
                params={{ id: p.topicId }}
                className={`group flex items-center gap-4 rounded-xl border border-border bg-[#f8fbfc] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary-soft/20`}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-[14px] font-bold text-primary-foreground">
                  {p.step}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-foreground">{p.title}</span>
                    {p.recommend && (
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                        推荐
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{p.meta}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={p.progress} className="flex-1" />
                    <span className="w-9 text-right text-[11px] tabular-nums text-muted-foreground">
                      {p.progress}%
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="col-span-12 lg:col-span-4">
          <SectionHeader
            title="近期资料更新"
            subtitle="知识库资料、规程、案例和 SOP 更新动态"
            action={
              <Link to="/search" className="text-[12px] font-medium text-primary hover:text-primary/80">
                全部
              </Link>
            }
          />
          <ul className="divide-y divide-divider">
            {UPDATES.map((u) => (
              <li key={u.docId}>
                <Link
                  to="/learn/doc/$id"
                  params={{ id: u.docId }}
                  className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TAG_STYLES[u.type] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {u.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[13px] leading-snug text-foreground group-hover:text-primary">
                      {u.title}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{u.time}</div>
                  </div>
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </section>
    </main>
  );
}
