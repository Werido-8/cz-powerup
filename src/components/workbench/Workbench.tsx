import { useState } from "react";
import {
  ShieldAlert,
  TrendingUp,
  Target,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Wrench,
  Siren,
  BookOpen,
  Brain,
  MessagesSquare,
  ClipboardList,
  FileText,
  ChevronRight,
  Sparkles,
  X,
  GraduationCap,
  Zap,
  Award,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

type EntryRoute = "/learn" | "/training" | "/chat" | "/assets";
type ScenarioRoute = "/scenario/typical" | "/scenario/fault";

type ReviewItem = {
  id: string;
  title: string;
  meta: string;
  tag: string;
  done: boolean;
};

const INITIAL_REVIEW: ReviewItem[] = [
  {
    id: "1",
    title: "错题巩固：220kV 变电站典型故障处置",
    meta: "昨日错题 · 3 题待复习",
    tag: "错题",
    done: false,
  },
  {
    id: "2",
    title: "知识卡片复习：继电保护动作逻辑",
    meta: "艾宾浩斯 · 第 4 次复习节点",
    tag: "记忆",
    done: false,
  },
  {
    id: "3",
    title: "薄弱点强化：母线差动保护原理",
    meta: "近 7 日正确率 62%",
    tag: "薄弱",
    done: false,
  },
];

const METRICS = [
  { label: "学习进度", value: 85, suffix: "%", icon: TrendingUp, hue: "primary" },
  { label: "答题正确率", value: 92, suffix: "%", icon: Target, hue: "success" },
  { label: "训练次数", value: 24, suffix: "次", icon: Activity, hue: "primary" },
];

const WEAK_POINTS = [
  { name: "母线差动保护原理", rate: 62 },
  { name: "变压器有载调压", rate: 68 },
  { name: "AGC/AVC 闭环逻辑", rate: 71 },
];

const ENTRIES: { icon: typeof BookOpen; title: string; desc: string; tag: string; to: EntryRoute }[] = [
  {
    icon: BookOpen,
    title: "知识学习",
    desc: "结构化课程与知识卡片，按岗位推送",
    tag: "今日 3 节",
    to: "/learn",
  },
  {
    icon: ClipboardList,
    title: "题库训练",
    desc: "智能组卷 · 错题溯源 · 考点画像",
    tag: "1280 题",
    to: "/training",
  },
  {
    icon: MessagesSquare,
    title: "智能问答",
    desc: "基于内部规程的多轮检索增强问答",
    tag: "AI",
    to: "/chat",
  },
  {
    icon: Brain,
    title: "个人沉淀",
    desc: "复盘笔记、错题本与能力雷达",
    tag: "已沉淀 48",
    to: "/assets",
  },
];

const SCENARIOS: { icon: typeof Wrench; title: string; desc: string; stats: string[]; accent: string; to: ScenarioRoute }[] = [
  {
    icon: Wrench,
    title: "典型操作训练",
    desc: "围绕设备、任务和前置条件，学习典型操作关键步骤、风险点和依据。",
    stats: ["12 类设备", "48 个操作场景", "覆盖 220kV / 500kV"],
    accent: "from-primary/15 to-primary/0",
    to: "/scenario/typical",
  },
  {
    icon: Siren,
    title: "故障处置复盘训练",
    desc: "围绕现象、保护动作和开关状态，训练核查思路和复盘能力。",
    stats: ["36 个真实案例", "保护动作还原", "时间线复盘"],
    accent: "from-[oklch(0.7_0.17_55)]/15 to-[oklch(0.7_0.17_55)]/0",
    to: "/scenario/fault",
  },
];

const PATHS = [
  { step: "01", title: "新员工入门专题", meta: "12 课时 · 4 周", progress: 35 },
  { step: "02", title: "典型操作专项", meta: "8 课时 · 含 6 个实训", progress: 60 },
  { step: "03", title: "考证冲刺", meta: "押题 + 模考 · 30 天", progress: 12 },
];

const UPDATES = [
  { type: "规程", title: "《国家电网公司变电站典型操作票》2024 修订版", time: "2 小时前" },
  { type: "SOP", title: "220kV 主变停送电标准化作业流程 v3.2", time: "今天 09:20" },
  { type: "案例", title: "某 500kV 变电站母差误动事故分析报告", time: "昨天" },
  { type: "通知", title: "迎峰度夏期间运行风险提示（第 12 期）", time: "2 天前" },
];

export function Workbench() {
  const [reviews, setReviews] = useState(INITIAL_REVIEW);
  const [modal, setModal] = useState<ReviewItem | null>(null);

  const completeReview = (id: string) => {
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, done: true } : r)));
    setModal(null);
  };

  return (
    <main className="mx-auto max-w-[1760px] px-8 py-8">
      {/* Section A: Welcome + Safety */}
      <section className="relative overflow-hidden rounded-lg border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="absolute right-0 top-0 h-full w-2/3 bg-gradient-to-l from-primary-soft/60 to-transparent" />
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
              <Sparkles className="h-3 w-3" />
              <span>今日推荐 3 项训练</span>
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
              下午好，张工 <span className="text-muted-foreground font-normal">·</span>{" "}
              <span className="bg-gradient-to-r from-primary to-[oklch(0.5_0.13_205)] bg-clip-text text-transparent">
                让我们开启今天的训练
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              你已连续学习 <span className="font-medium text-foreground">7 天</span>，本周训练目标完成{" "}
              <span className="font-medium text-foreground">68%</span>，继续保持。
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft/70 px-4 py-3 text-[12.5px] text-warning-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="max-w-md leading-relaxed">
              <span className="font-medium">安全边界提示：</span>
              本平台为 AI 智能训练辅助系统，不替代正式操作票、调度指令或事故定性结论。
            </div>
          </div>
        </div>
      </section>

      {/* Section B: Growth + Review */}
      <section className="mt-6 grid grid-cols-12 gap-6">
        {/* Left: Capability */}
        <div className="col-span-12 lg:col-span-7 rounded-lg border border-border bg-card p-7 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">能力成长概览</h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                综合学习、训练与考核的近 30 天表现
              </p>
            </div>
            <Link to="/training/growth" className="flex items-center gap-1 text-[12.5px] font-medium text-primary hover:text-primary/80">
              查看能力雷达 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {METRICS.map((m) => {
              const Icon = m.icon;
              const isSuccess = m.hue === "success";
              return (
                <div
                  key={m.label}
                  className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-background to-muted/40 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground">{m.label}</span>
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-lg ${
                        isSuccess ? "bg-success-soft text-success" : "bg-primary-soft text-primary"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight text-foreground">
                      {m.value}
                    </span>
                    <span className="text-sm text-muted-foreground">{m.suffix}</span>
                  </div>
                  {m.suffix === "%" && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isSuccess ? "bg-success" : "bg-primary"
                        }`}
                        style={{ width: `${m.value}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-[13px] font-medium">薄弱知识点</span>
              <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10.5px] font-medium text-warning-foreground">
                需重点关注
              </span>
            </div>
            <ul className="space-y-2.5">
              {WEAK_POINTS.map((w) => (
                <li key={w.name} className="flex items-center gap-3">
                  <span className="flex-1 text-[13px] text-foreground">{w.name}</span>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-warning"
                      style={{ width: `${w.rate}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[12px] tabular-nums text-muted-foreground">
                    {w.rate}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Ebbinghaus Review */}
        <div className="col-span-12 lg:col-span-5 rounded-lg border border-border bg-card p-7 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">今日复习与错题巩固</h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                基于艾宾浩斯遗忘曲线智能编排
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
              <Clock className="h-3 w-3" />
              <span>预计 15 分钟</span>
            </div>
          </div>

          <ul className="space-y-3">
            {reviews.map((r) => (
              <li
                key={r.id}
                className={`group flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all ${
                  r.done
                    ? "opacity-60"
                    : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors ${
                    r.done
                      ? "bg-success-soft text-success"
                      : "bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                  }`}
                >
                  {r.done ? <CheckCircle2 className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`truncate text-[13.5px] font-medium ${
                        r.done ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {r.title}
                    </span>
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {r.tag}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">{r.meta}</div>
                </div>
                {r.done ? (
                  <span className="text-[12px] font-medium text-success">已完成</span>
                ) : (
                  <button
                    onClick={() => setModal(r)}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[var(--shadow-glow)]"
                  >
                    去复习 <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-[12px] text-muted-foreground">
              本周累计复习 <span className="font-semibold text-foreground">18</span> 项
            </span>
            <div className="flex items-center gap-1 text-[12px] font-medium text-success">
              <Award className="h-3.5 w-3.5" /> 记忆稳固度 86%
            </div>
          </div>
        </div>
      </section>

      {/* Section C: Core entries + Scenario training */}
      <section className="mt-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-5">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-semibold tracking-tight">核心能力入口</h2>
            <span className="text-[12px] text-muted-foreground">高频使用</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {ENTRIES.map((e) => {
              const Icon = e.icon;
              return (
                <Link
                  key={e.title}
                  to={e.to}
                  className="group flex flex-col items-start rounded-lg border border-border bg-card p-5 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="mb-4 flex w-full items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                      {e.tag}
                    </span>
                  </div>
                  <div className="text-[14.5px] font-semibold tracking-tight text-foreground">
                    {e.title}
                  </div>
                  <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {e.desc}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">场景训练</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                沉浸式仿真训练，连接知识与一线作业
              </p>
            </div>
            <span className="rounded-full border border-destructive/30 bg-destructive/5 px-2 py-0.5 text-[10.5px] font-medium text-destructive">
              P0 · 高优先级
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SCENARIOS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.title}
                  to={s.to}
                  className="group relative block overflow-hidden rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.accent} opacity-60`}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="grid h-11 w-11 place-items-center rounded-lg bg-card shadow-sm ring-1 ring-border">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                        P0
                      </span>
                    </div>
                    <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-foreground">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {s.desc}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {s.stats.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary transition-transform group-hover:translate-x-0.5">
                      开始训练 <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section D: Paths + Updates */}
      <section className="mt-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 rounded-lg border border-border bg-card p-7 shadow-[var(--shadow-card)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">推荐学习路径</h2>
            </div>
            <Link to="/learn" className="text-[12px] font-medium text-primary hover:text-primary/80">
              全部路径
            </Link>
          </div>
          <div className="space-y-3">
            {PATHS.map((p, i) => (
              <Link
                to="/learn"
                key={p.step}
                className="group flex items-center gap-5 rounded-lg border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/0 text-[15px] font-semibold text-primary ring-1 ring-primary/15">
                  {p.step}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-foreground">{p.title}</span>
                    {i === 0 && (
                      <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                        推荐
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12px] text-muted-foreground">{p.meta}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.5_0.13_205)]"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-[11.5px] tabular-nums text-muted-foreground">
                      {p.progress}%
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 rounded-lg border border-border bg-card p-7 shadow-[var(--shadow-card)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">近期资料更新</h2>
            </div>
            <Link to="/learn" className="text-[12px] font-medium text-primary hover:text-primary/80">
              全部
            </Link>
          </div>
          <ul className="space-y-2">
            {UPDATES.map((u, i) => (
              <li key={i}>
                <Link
                  to="/learn"
                  className="group flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/60"
                >
                <span
                  className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    u.type === "规程"
                      ? "bg-primary-soft text-accent-foreground"
                      : u.type === "SOP"
                        ? "bg-success-soft text-success"
                        : u.type === "案例"
                          ? "bg-warning-soft text-warning-foreground"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {u.type}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-foreground group-hover:text-primary">
                    {u.title}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">{u.time}</div>
                </div>
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Review Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-card p-7 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-foreground">
              开始复习
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{modal.title}</p>
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-[12.5px] text-muted-foreground">
              <div className="mb-2 flex items-center gap-1.5 text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">AI 编排</span>
              </div>
              基于你的近 7 日表现，本次复习将聚焦 <span className="text-foreground">3 个核心考点</span>
              ，预计 5 分钟完成。
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-border bg-background py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                稍后再说
              </button>
              <button
                onClick={() => completeReview(modal.id)}
                className="flex-1 rounded-lg bg-primary py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[var(--shadow-glow)]"
              >
                标记已完成
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
