import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookMarked,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  History,
  Play,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/learning/ui";
import { PageShell } from "@/components/workbench/PageShell";
import { useMockStore } from "@/lib/mock/store";
import {
  RECOMMENDED_PRACTICES,
  TRAINING_OVERVIEW,
  getVisiblePracticeRecords,
} from "@/lib/mock/learning-hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/")({
  component: TrainingHome,
  head: () => ({ meta: [{ title: "训练中心 · 涉网运行能力智能提升平台" }] }),
});

const trainingTools = [
  {
    title: "专项练习",
    description: "按知识点即时练习",
    action: "选择范围",
    to: "/training/practice" as const,
    icon: Target,
    tone: "teal",
  },
  {
    title: "AI 自主组卷",
    description: "描述需求，快速生成自测卷",
    action: "智能组卷",
    to: "/training/custom-exam" as const,
    icon: Sparkles,
    tone: "blue",
  },
  {
    title: "正式考试",
    description: "查看单位下发的考试",
    action: "查看安排",
    to: "/training/exam" as const,
    icon: ClipboardList,
    tone: "slate",
  },
  {
    title: "错题本",
    description: "集中复习未掌握题目",
    action: "复习错题",
    to: "/training/wrong" as const,
    icon: BookMarked,
    tone: "amber",
  },
] as const;

function TrainingHome() {
  const { state } = useMockStore();
  const wrongCount = state.wrong.length || TRAINING_OVERVIEW.wrongToReview;
  const recentRecords = getVisiblePracticeRecords();
  const todayPractice = RECOMMENDED_PRACTICES[0];

  return (
    <PageShell compact>
      <div className="flex h-full min-h-0 w-full flex-col [&_h1]:font-semibold">
        <div className="shrink-0">
          <PageHeader
            title="训练中心"
            subtitle="先完成今天最值得练的一组题，再按结果决定下一步。"
            size="md"
            className="mb-2"
            action={
              <Link
                to="/training/records"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-kb-border bg-white px-4 text-[13px] font-medium text-kb-body shadow-[0_4px_16px_rgba(22,65,74,0.04)] transition hover:border-primary/35 hover:text-primary"
              >
                <History className="h-4 w-4" /> 训练记录
              </Link>
            }
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto xl:overflow-hidden">
          <section className="grid gap-3 xl:min-h-0 xl:flex-[1.28] xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.62fr)]">
            <article className="relative flex min-h-[240px] overflow-hidden rounded-[20px] border border-[#cfe4e8] bg-white p-5 shadow-[0_18px_50px_rgba(28,88,99,0.07)] xl:min-h-0 xl:p-6">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_72%_38%,rgba(52,155,172,.11),transparent_64%)]" />
              <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[32px] border-primary/[0.055]" />
              <div
                className="pointer-events-none absolute bottom-6 right-20 hidden h-20 w-40 opacity-55 lg:block"
                aria-hidden
              >
                <span className="absolute left-0 top-11 h-2.5 w-2.5 rounded-full bg-primary/25" />
                <span className="absolute left-16 top-2 h-3 w-3 rounded-full bg-primary/18" />
                <span className="absolute right-1 top-16 h-2.5 w-2.5 rounded-full bg-primary/25" />
                <span className="absolute left-2 top-12 h-px w-16 -rotate-[30deg] bg-primary/20" />
                <span className="absolute left-[75px] top-8 h-px w-24 rotate-[22deg] bg-primary/20" />
              </div>

              <div className="relative flex min-h-0 w-full max-w-[820px] flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3 py-1 text-[12px] font-semibold text-primary backdrop-blur">
                      <Target className="h-3.5 w-3.5" /> 今日推荐
                    </span>
                    <span className="text-[12px] text-kb-muted">依据近 7 天答题表现生成</span>
                  </div>
                  <h2 className="mt-3 max-w-[760px] text-[26px] font-bold tracking-[-0.035em] text-kb-heading xl:text-[32px]">
                    {todayPractice.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-[13px] leading-6 text-kb-muted">
                    AGC
                    相关题目正确率低于个人平均水平。先完成这组短练习，系统会据此更新薄弱点与错题建议。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {todayPractice.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white bg-white/75 px-3 py-1 text-[12px] text-kb-body shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link
                    to="/training/practice"
                    className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-primary px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(52,155,172,0.22)] transition hover:-translate-y-0.5 hover:bg-[#2b91a3]"
                  >
                    <Play className="h-4 w-4 fill-current" /> 开始今日练习
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className="flex items-center gap-5 text-[12px] text-kb-muted">
                    <span>
                      <strong className="mr-1 text-[18px] text-kb-heading">
                        {todayPractice.count}
                      </strong>
                      题
                    </span>
                    <span>
                      <strong className="mr-1 text-[18px] text-kb-heading">12</strong>分钟
                    </span>
                    <span>
                      <strong className="mr-1 text-[18px] text-[#b56a20]">
                        {todayPractice.mastery}%
                      </strong>
                      掌握度
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <aside className="flex min-h-0 flex-col rounded-[20px] border border-kb-border bg-white p-4 shadow-[0_14px_42px_rgba(28,65,72,0.05)]">
              <div className="flex shrink-0 items-center justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-kb-heading">训练工具</h2>
                  <p className="mt-0.5 text-[12px] text-kb-muted">需要时再选择，不打断今日任务</p>
                </div>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <nav
                className="mt-2 flex min-h-0 flex-1 flex-col justify-between"
                aria-label="训练功能入口"
              >
                {trainingTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.title}
                      to={tool.to}
                      className="group grid min-h-11 flex-1 grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] px-2.5 transition hover:bg-[#f2f8f9]"
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-[10px]",
                          tool.tone === "teal" && "bg-[#e3f4f6] text-primary",
                          tool.tone === "blue" && "bg-[#e8f1fb] text-[#3e77a9]",
                          tool.tone === "slate" && "bg-[#eef2f3] text-[#597079]",
                          tool.tone === "amber" && "bg-[#fff1e1] text-[#b3681d]",
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-[13.5px] text-kb-heading">
                          {tool.title}
                        </strong>
                        <span className="mt-0.5 block truncate text-[12px] text-kb-muted">
                          {tool.description}
                        </span>
                      </span>
                      <span className="flex items-center gap-0.5 text-[12px] font-medium text-primary opacity-0 transition group-hover:opacity-100">
                        {tool.action}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </section>

          <section className="grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.28fr)_minmax(300px,.72fr)]">
            <article className="flex min-h-0 flex-col rounded-[18px] border border-kb-border bg-white p-4">
              <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b06b24]">
                    Next focus
                  </span>
                  <h2 className="mt-0.5 text-[16px] font-semibold text-kb-heading">薄弱点强化</h2>
                  <p className="mt-0.5 text-[12px] text-kb-muted">
                    完成今日练习后，从这里选择下一轮强化内容。
                  </p>
                </div>
                <Link
                  to="/training/practice"
                  className="inline-flex min-h-10 items-center gap-1 text-[12.5px] font-medium text-primary"
                >
                  查看全部知识点 <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-3 grid min-h-0 flex-1 gap-3 md:grid-cols-3">
                {RECOMMENDED_PRACTICES.slice(0, 3).map((item, index) => (
                  <Link
                    key={item.id}
                    to="/training/practice"
                    className="group relative flex min-h-[128px] flex-col overflow-hidden rounded-[14px] border border-kb-border bg-[linear-gradient(155deg,#ffffff_0%,#f7fafb_100%)] p-3.5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_26px_rgba(28,85,96,0.07)] xl:min-h-0"
                  >
                    <span className="absolute -right-6 -top-7 h-16 w-16 rounded-full border-[12px] border-primary/[0.035]" />
                    <span className="text-[11px] font-semibold text-primary">0{index + 1}</span>
                    <h3 className="mt-2 line-clamp-2 text-[13.5px] font-semibold leading-5 text-kb-heading">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-[12px] text-kb-muted">
                      {item.tags.join(" · ")}
                    </p>
                    <div className="mt-auto pt-3">
                      <div className="flex items-center justify-between text-[11px] text-kb-muted">
                        <span>建议 {item.count} 题</span>
                        <strong className="text-[#ae671f]">掌握度 {item.mastery}%</strong>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#edf1f2]">
                        <div
                          className="h-full rounded-full bg-[#e6a04f]"
                          style={{ width: `${item.mastery}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <div className="grid min-h-0 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <article className="relative flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#eadbc9] bg-[linear-gradient(135deg,#fffdf9_0%,#fff7ed_100%)] p-4">
                <div className="pointer-events-none absolute -bottom-10 -right-8 h-28 w-28 rounded-full border-[18px] border-[#d99145]/[0.06]" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-medium text-[#a35e1b]">周五 · 14:00</span>
                    <h2 className="mt-1 text-[15px] font-semibold text-kb-heading">
                      运行基础能力月度测评
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-[12px] text-kb-muted">
                      <Clock3 className="h-3.5 w-3.5" />
                      限时 45 分钟 · 单位下发
                    </p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-white text-[#b56a20] shadow-sm">
                    <CalendarClock className="h-4 w-4" />
                  </span>
                </div>
                <Link
                  to="/training/exam"
                  className="relative mt-auto inline-flex min-h-10 items-center gap-1.5 pt-2 text-[12.5px] font-semibold text-[#9b5a1c]"
                >
                  查看考试安排 <ChevronRight className="h-4 w-4" />
                </Link>
              </article>

              <Link
                to="/training/growth"
                className="group flex min-h-0 flex-col rounded-[18px] border border-kb-border bg-[linear-gradient(145deg,#ffffff_0%,#f4faf9_100%)] p-4 transition hover:border-primary/30 hover:shadow-[0_10px_25px_rgba(28,85,96,.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-kb-heading">本周训练反馈</h2>
                    <p className="mt-0.5 text-[12px] text-kb-muted">比上周多完成 12 题</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary">
                    查看详情{" "}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                <div className="mt-auto flex items-end justify-between gap-4 pt-3">
                  <div>
                    <strong className="text-[26px] leading-none text-kb-heading">
                      {TRAINING_OVERVIEW.accuracy}%
                    </strong>
                    <span className="ml-2 text-[12px] text-kb-muted">正确率</span>
                  </div>
                  <div className="flex h-9 items-end gap-1" aria-label="一周训练趋势">
                    {[30, 46, 38, 62, 52, 76, 68].map((height, index) => (
                      <span
                        key={index}
                        className={cn(
                          "w-2 rounded-t-sm",
                          index === 5 ? "bg-primary" : "bg-primary/20",
                        )}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-kb-muted">
                  <span>{TRAINING_OVERVIEW.weeklyAnswers} 题已完成</span>
                  <span>{TRAINING_OVERVIEW.streakDays} 天连续训练</span>
                  <span>{wrongCount} 题待复习</span>
                </div>
              </Link>
            </div>
          </section>

          {recentRecords.length > 0 && (
            <section className="shrink-0 rounded-[16px] border border-kb-border bg-white px-4 py-2.5">
              <div className="grid gap-2.5 md:grid-cols-[160px_repeat(2,minmax(0,1fr))] md:items-center">
                <div>
                  <h2 className="text-[14px] font-semibold text-kb-heading">最近完成</h2>
                  <p className="mt-0.5 text-[12px] text-kb-muted">训练结果已计入掌握度</p>
                </div>
                {recentRecords.slice(0, 2).map((record) => (
                  <Link
                    key={record.id}
                    to="/training/records"
                    className="group flex min-h-11 items-center gap-3 rounded-[12px] bg-[#f7fafb] px-3 transition hover:bg-primary-soft/35"
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full",
                        record.accuracy >= 80
                          ? "bg-success-soft text-success"
                          : "bg-remind-soft text-remind-foreground",
                      )}
                    >
                      {record.accuracy >= 80 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[13px] text-kb-heading">
                        {record.title}
                      </strong>
                      <span className="text-[11px] text-kb-muted">
                        {record.completedAt} · {record.questionCount} 题
                      </span>
                    </span>
                    <strong className="text-[14px] text-kb-heading">{record.accuracy}%</strong>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </PageShell>
  );
}
