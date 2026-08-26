import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDot,
  ClipboardCheck,
  FileText,
  History,
  Info,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import { PageShell } from "@/components/workbench/PageShell";
import { RECOMMENDED_PRACTICES, TRAINING_OVERVIEW } from "@/lib/mock/learning-hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/index copy")({
  component: TrainingHome,
  head: () => ({ meta: [{ title: "训练中心 · 涉网运行能力智能提升平台" }] }),
});

const overviewItems = [
  {
    label: "本周完成题数",
    value: TRAINING_OVERVIEW.weeklyAnswers,
    unit: "题",
    detail: "较上周 +12",
    trending: true,
  },
  {
    label: "正确率",
    value: `${TRAINING_OVERVIEW.accuracy}%`,
    detail: "较上周 +6%",
    trending: true,
  },
  {
    label: "连续训练天数",
    value: TRAINING_OVERVIEW.streakDays,
    unit: "天",
    detail: "较上月 +2 天",
    trending: true,
  },
  { label: "待训练项", value: 12, unit: "项", detail: "其中错题 28 题", trending: false },
] as const;

const trainingTools = [
  {
    title: "专项练习",
    description: "按知识点即时练习，强化薄弱点",
    to: "/training/practice" as const,
    icon: Target,
    tone: "teal",
  },
  {
    title: "AI 自主组卷",
    description: "描述需求，快速生成个性化试卷",
    to: "/training/custom-exam" as const,
    icon: Sparkles,
    tone: "blue",
  },
  {
    title: "正式考试",
    description: "查看单位下发的正式考试",
    to: "/training/exam" as const,
    icon: ClipboardCheck,
    tone: "slate",
  },
  {
    title: "错题本",
    description: "集中复习未掌握题目",
    to: "/training/wrong" as const,
    icon: FileText,
    tone: "amber",
  },
] as const;

const weakAccuracies = [58, 62, 61] as const;

const recentItems = [
  { title: "AGC 控制器死区参数练习", category: "AGC", count: 10, accuracy: 80, time: "今天 10:32" },
  {
    title: "运行基础知识强化训练",
    category: "运行基础",
    count: 15,
    accuracy: 73,
    time: "今天 09:18",
  },
  {
    title: "差动保护动作判据专项练习",
    category: "继电保护",
    count: 10,
    accuracy: 60,
    time: "昨天 16:45",
  },
  {
    title: "辅助服务管理实施细则练习",
    category: "辅助服务",
    count: 8,
    accuracy: 88,
    time: "昨天 14:22",
  },
  { title: "AGC 与两细则综合练习", category: "AGC", count: 5, accuracy: 100, time: "06-01 20:15" },
] as const;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2";

function SectionTitle({
  icon: Icon,
  children,
  tone = "teal",
}: {
  icon: typeof BarChart3;
  children: ReactNode;
  tone?: "teal" | "amber";
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 2xl:gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center 2xl:h-6 2xl:w-6",
          tone === "teal" ? "text-[#1994a3]" : "text-[#df7a26]",
        )}
      >
        <Icon className="h-4 w-4 2xl:h-6 2xl:w-6" strokeWidth={1.8} />
      </span>
      <h2 className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-[#17343c] 2xl:text-[20px]">
        {children}
      </h2>
    </div>
  );
}

function TrainingHome() {
  return (
    <PageShell compact mainClassName="!bg-[#f6fafb] !px-2 !py-1.5 2xl:!px-3 2xl:!py-2.5">
      <div className="grid min-h-full gap-3 overflow-y-auto min-[900px]:grid-rows-[210px_166px_152px] min-[900px]:content-start 2xl:grid-rows-[314px_248px_227px] 2xl:gap-[18px]">
        <section className="grid min-h-0 gap-3 min-[900px]:grid-cols-[minmax(0,1.86fr)_minmax(250px,1fr)_minmax(250px,.98fr)] 2xl:gap-[18px]">
          <article className="flex min-h-[210px] min-w-0 flex-col rounded-[9px] border border-[#d5e6e9] bg-white px-3 pb-5 pt-2.5 shadow-[0_3px_12px_rgba(35,86,96,0.035)] 2xl:min-h-[314px] 2xl:rounded-[14px] 2xl:px-[18px] 2xl:pb-[30px] 2xl:pt-[15px]">
            <SectionTitle icon={BarChart3}>训练总览</SectionTitle>
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4 2xl:mt-3 2xl:gap-[15px]">
              {overviewItems.map((item) => (
                <div
                  key={item.label}
                  className="min-w-0 rounded-[8px] border border-[#e0ecee] bg-[linear-gradient(145deg,#ffffff_0%,#f8fbfc_100%)] px-3 py-2.5 2xl:rounded-[12px] 2xl:px-[18px] 2xl:py-[15px]"
                >
                  <div className="truncate text-[11.5px] text-[#526b73] 2xl:text-[17px]">
                    {item.label}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1 tabular-nums">
                    <strong className="text-[22px] font-semibold leading-none tracking-[-0.02em] text-[#17313a] 2xl:text-[33px]">
                      {item.value}
                    </strong>
                    {item.unit && (
                      <span className="text-[11px] text-[#60757c] 2xl:text-[16px]">
                        {item.unit}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1 whitespace-nowrap text-[10.5px] text-[#71858b] 2xl:mt-3 2xl:gap-1.5 2xl:text-[16px]">
                    <span>{item.detail}</span>
                    {item.trending && <span className="font-semibold text-[#f05e63]">↑</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-3">
              <Link
                to="/training/practice"
                className={cn(
                  "inline-flex min-h-9 items-center justify-center gap-2 rounded-[6px] bg-[linear-gradient(135deg,#31a9b7,#138e9d)] px-5 text-[11.5px] font-semibold text-white shadow-[0_7px_16px_rgba(24,148,162,.16)] transition-colors hover:bg-[#168998] active:bg-[#107c89] 2xl:min-h-[54px] 2xl:gap-3 2xl:rounded-[9px] 2xl:px-[30px] 2xl:text-[17px]",
                  focusRing,
                )}
              >
                <Play className="h-3.5 w-3.5 fill-current 2xl:h-5 2xl:w-5" aria-hidden="true" />
                开始专项练习
              </Link>
              <Link
                to="/training/custom-exam"
                className={cn(
                  "inline-flex min-h-9 items-center justify-center gap-2 rounded-[6px] border border-[#50b4c0] bg-white px-4 text-[11.5px] font-semibold text-[#158b9a] transition-colors hover:bg-[#f0fafb] active:bg-[#e7f5f7] 2xl:min-h-[54px] 2xl:gap-3 2xl:rounded-[9px] 2xl:px-6 2xl:text-[17px]",
                  focusRing,
                )}
              >
                <Bot className="h-4 w-4 2xl:h-6 2xl:w-6" aria-hidden="true" />
                AI 自主组卷
              </Link>
            </div>
          </article>

          <article className="flex min-h-[210px] min-w-0 flex-col rounded-[9px] border border-[#d5e6e9] bg-white p-3.5 shadow-[0_3px_12px_rgba(35,86,96,0.035)] 2xl:min-h-[314px] 2xl:rounded-[14px] 2xl:p-[21px]">
            <h2 className="text-[13.5px] font-semibold text-[#17343c] 2xl:text-[20px]">训练工具</h2>
            <nav
              className="mt-1.5 grid min-h-0 flex-1 grid-rows-4 2xl:mt-2"
              aria-label="训练功能入口"
            >
              {trainingTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.title}
                    to={tool.to}
                    className={cn(
                      "group grid min-h-[38px] grid-cols-[34px_minmax(0,1fr)_20px] items-center gap-2 rounded-[8px] transition-colors hover:bg-[#f3f9fa] 2xl:min-h-[57px] 2xl:grid-cols-[51px_minmax(0,1fr)_30px] 2xl:gap-3 2xl:rounded-[12px]",
                      focusRing,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-[8px] 2xl:h-[42px] 2xl:w-[42px] 2xl:rounded-[12px]",
                        tool.tone === "teal" && "bg-[#e4f5f7] text-[#2097a5]",
                        tool.tone === "blue" && "bg-[#e9f2fb] text-[#4d80ad]",
                        tool.tone === "slate" && "bg-[#edf2f4] text-[#627982]",
                        tool.tone === "amber" && "bg-[#fff2e5] text-[#c16a1d]",
                      )}
                    >
                      <Icon className="h-4 w-4 2xl:h-6 2xl:w-6" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-[12.5px] font-semibold text-[#203b43] 2xl:text-[18px]">
                        {tool.title}
                      </strong>
                      <span className="mt-0.5 block truncate text-[10.5px] text-[#7a8d93] 2xl:text-[15px]">
                        {tool.description}
                      </span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-[#57747d] transition-transform group-hover:translate-x-0.5 2xl:h-6 2xl:w-6"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </nav>
          </article>

          <article className="flex min-h-[210px] min-w-0 flex-col overflow-hidden rounded-[9px] border border-[#d5e6e9] bg-white shadow-[0_3px_12px_rgba(35,86,96,0.035)] 2xl:min-h-[314px] 2xl:rounded-[14px]">
            <div className="flex items-center justify-between px-3.5 py-2 2xl:px-[21px] 2xl:py-3">
              <h2 className="text-[13.5px] font-semibold text-[#17343c] 2xl:text-[20px]">
                训练提醒
              </h2>
              <span
                aria-hidden="true"
                className="grid h-6 w-6 place-items-center rounded-full bg-[#edf6f8] text-[#4d6870] 2xl:h-9 2xl:w-9"
              >
                <Bell className="h-3.5 w-3.5 2xl:h-5 2xl:w-5" />
              </span>
            </div>
            <div className="mx-3.5 flex min-h-0 flex-1 flex-col rounded-[9px] border border-[#e5eef0] bg-[linear-gradient(145deg,#fbfdfe,#f6fafb)] p-3 2xl:mx-[21px] 2xl:rounded-[14px] 2xl:p-[18px]">
              <span className="w-fit rounded-[5px] bg-[#e8f2ff] px-2 py-0.5 text-[10.5px] font-medium text-[#538bc2] 2xl:rounded-[8px] 2xl:px-3 2xl:py-1 2xl:text-[15px]">
                待参加考试
              </span>
              <h3 className="mt-2 truncate text-[12.5px] font-semibold text-[#284049] 2xl:mt-3 2xl:text-[18px]">
                AGC 控制器死区参数考试
              </h3>
              <div className="mt-1.5 space-y-0.5 text-[10.5px] leading-4 text-[#667d84] 2xl:mt-2 2xl:text-[15px] 2xl:leading-6">
                <p>考试时间：2024-06-05（周三）14:00</p>
                <p>时长：90 分钟 · 题量：60 题</p>
              </div>
              <Link
                to="/training/exam"
                className={cn(
                  "mt-auto inline-flex min-h-6 items-center justify-center rounded-[5px] border border-[#55b7c3] bg-white text-[10.5px] font-semibold text-[#148c9b] transition-colors hover:bg-[#edf9fa] active:bg-[#e4f4f6] 2xl:min-h-9 2xl:rounded-[8px] 2xl:text-[15px]",
                  focusRing,
                )}
              >
                去参加考试
              </Link>
            </div>
            <Link
              to="/training/exam"
              className={cn(
                "flex min-h-8 items-center gap-1.5 border-t border-[#e4edef] px-3.5 text-[10px] font-medium text-[#2096a5] transition-colors hover:bg-[#f4fafb] 2xl:min-h-12 2xl:gap-2 2xl:px-[21px] 2xl:text-[15px]",
                focusRing,
              )}
            >
              查看全部提醒（3）
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </article>
        </section>

        <section className="grid min-h-0 gap-3 min-[900px]:grid-cols-[minmax(0,2.07fr)_minmax(300px,1fr)] 2xl:gap-[18px]">
          <article className="flex min-h-[166px] min-w-0 flex-col rounded-[9px] border border-[#d5e6e9] bg-white px-3 pb-2 pt-3 shadow-[0_3px_12px_rgba(35,86,96,0.03)] 2xl:min-h-[248px] 2xl:rounded-[14px] 2xl:px-[18px] 2xl:pb-3 2xl:pt-[18px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <SectionTitle icon={CircleAlert} tone="amber">
                  薄弱点强化
                </SectionTitle>
                <span className="hidden truncate text-[10.5px] text-[#7b8e94] sm:block 2xl:text-[15px]">
                  基于你的学习数据，优先强化以下薄弱知识点
                </span>
              </div>
              <Link
                to="/training/practice"
                className={cn(
                  "inline-flex min-h-5 items-center gap-1 text-[10.5px] font-medium text-[#2294a2] hover:text-[#117e8a] 2xl:min-h-[30px] 2xl:gap-1.5 2xl:text-[15px]",
                  focusRing,
                )}
              >
                查看全部知识点
                <ChevronRight className="h-3.5 w-3.5 2xl:h-5 2xl:w-5" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-1.5 grid min-h-0 flex-1 gap-2.5 md:grid-cols-3 2xl:mt-2.5 2xl:gap-[15px]">
              {RECOMMENDED_PRACTICES.slice(0, 3).map((item, index) => (
                <Link
                  key={item.id}
                  to="/training/practice"
                  search={{ filters: item.filter }}
                  className={cn(
                    "group relative flex min-h-[118px] min-w-0 flex-col overflow-hidden rounded-[8px] border border-[#dce9eb] bg-[linear-gradient(145deg,#ffffff,#f8fbfc)] transition-colors hover:border-[#74c1ca] min-[900px]:min-h-0 2xl:rounded-[12px]",
                    focusRing,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-4 -top-5 h-14 w-14 rounded-full border-[10px] border-[#4daeb9]/[0.055]"
                  />
                  <div className="relative min-h-0 flex-1 px-3 pt-0.5 2xl:px-[18px] 2xl:pt-1">
                    <span className="inline-flex rounded-[5px] border border-[#e5edef] bg-[#f7fafb] px-1.5 py-px text-[9px] leading-3 text-[#698087] 2xl:rounded-[8px] 2xl:px-2.5 2xl:py-0.5 2xl:text-[13px] 2xl:leading-4">
                      专项
                    </span>
                    <h3 className="mt-1 truncate text-[12px] font-semibold leading-4 text-[#29434b] 2xl:mt-1.5 2xl:text-[18px] 2xl:leading-6">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-[9.5px] leading-4 text-[#72878d] 2xl:mt-1 2xl:text-[14px] 2xl:leading-5">
                      {item.reason}
                    </p>
                    <div className="mt-2 flex min-w-0 items-center gap-1 pb-1 2xl:mt-3 2xl:gap-1.5 2xl:pb-1.5">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="max-w-[76px] shrink-0 truncate rounded-[4px] bg-[#eff5f6] px-1.5 py-0.5 text-[9px] text-[#627a82] 2xl:max-w-[114px] 2xl:rounded-[6px] 2xl:px-2.5 2xl:py-1 2xl:text-[13px]"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="ml-auto shrink-0 whitespace-nowrap text-[9.5px] text-[#73878d] 2xl:text-[14px]">
                        正确率{" "}
                        <strong className="font-semibold text-[#f06c5f]">
                          {weakAccuracies[index]}%
                        </strong>
                      </span>
                    </div>
                  </div>
                  <span className="relative flex h-5 shrink-0 items-center justify-center gap-1 bg-[linear-gradient(90deg,#279eac,#15909f)] text-[9px] font-medium text-white transition-colors group-hover:bg-[#138896] 2xl:h-[30px] 2xl:gap-1.5 2xl:text-[13px]">
                    去练习
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </article>

          <Link
            to="/training/growth"
            className={cn(
              "group flex min-h-[166px] min-w-0 flex-col rounded-[9px] border border-[#d5e6e9] bg-white px-3 pb-2 pt-2 shadow-[0_3px_12px_rgba(35,86,96,0.03)] transition-colors hover:border-[#8bcbd2] 2xl:min-h-[248px] 2xl:rounded-[14px] 2xl:px-[18px] 2xl:pb-3 2xl:pt-3",
              focusRing,
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[13.5px] font-semibold text-[#17343c] 2xl:text-[20px]">
                  本周训练反馈
                </h2>
                <Info className="h-3.5 w-3.5 text-[#789096] 2xl:h-5 2xl:w-5" aria-hidden="true" />
              </div>
              <span className="text-[10.5px] font-medium text-[#2495a3] 2xl:text-[15px]">
                查看详情
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 2xl:mt-[18px] 2xl:gap-6">
              <div className="min-w-0">
                <div className="flex items-end gap-2 tabular-nums">
                  <strong className="text-[27px] font-semibold leading-none text-[#1692a1] 2xl:text-[40px]">
                    {TRAINING_OVERVIEW.accuracy}%
                  </strong>
                  <span className="pb-0.5 text-[10.5px] text-[#61787f] 2xl:text-[15px]">
                    正确率
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-[#71868c] 2xl:mt-3 2xl:text-[15px]">
                  较上周 <span className="font-semibold text-[#f05e63]">+6% ↑</span>
                </p>
              </div>
              <div
                className="flex h-7 shrink-0 items-end gap-1.5 2xl:h-[42px] 2xl:gap-2"
                aria-label="本周正确率上升趋势"
              >
                {[34, 48, 41, 66, 56, 83, 69].map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className={cn(
                      "w-1.5 rounded-t-[3px] 2xl:w-2.5 2xl:rounded-t-[5px]",
                      index === 5 ? "bg-[#1d9eac]" : "bg-[#ccebed]",
                    )}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-auto grid grid-cols-3 divide-x divide-[#e5edef] border-t border-[#edf2f3] pt-3 text-center 2xl:pt-[18px]">
              {(
                [
                  [48, "完成题数"],
                  [7, "连续训练"],
                  [28, "待复习错题"],
                ] as const
              ).map(([value, label]) => (
                <div key={label} className="px-2">
                  <div className="tabular-nums">
                    <strong className="text-[17px] font-semibold text-[#243d45] 2xl:text-[25px]">
                      {value}
                    </strong>
                    <span className="ml-1 text-[9px] text-[#72878d] 2xl:text-[13px]">
                      {label === "连续训练" ? "天" : "题"}
                    </span>
                  </div>
                  <div className="mt-1 text-[9.5px] text-[#758a90] 2xl:mt-1.5 2xl:text-[14px]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </Link>
        </section>

        <section className="min-h-[152px] overflow-hidden rounded-[9px] border border-[#d5e6e9] bg-white shadow-[0_3px_12px_rgba(35,86,96,0.03)] 2xl:min-h-[227px] 2xl:rounded-[14px]">
          <div className="flex h-[35px] items-center justify-between border-b border-[#e7eff1] px-3.5 2xl:h-[53px] 2xl:px-[21px]">
            <SectionTitle icon={History}>最近完成</SectionTitle>
            <Link
              to="/training/records"
              className={cn(
                "inline-flex min-h-8 items-center gap-1 text-[10.5px] font-medium text-[#2294a2] hover:text-[#117e8a] 2xl:min-h-12 2xl:gap-1.5 2xl:text-[15px]",
                focusRing,
              )}
            >
              查看全部
              <ChevronRight className="h-3.5 w-3.5 2xl:h-5 2xl:w-5" aria-hidden="true" />
            </Link>
          </div>
          <div className="divide-y divide-[#eaf0f1]">
            {recentItems.map((item) => {
              const isStrong = item.accuracy >= 70;
              return (
                <Link
                  key={item.title}
                  to="/training/records"
                  className={cn(
                    "group grid min-h-[23px] grid-cols-[22px_minmax(160px,1.7fr)_minmax(76px,.55fr)_52px_minmax(88px,.66fr)_84px] items-center gap-2 px-3.5 text-[10px] transition-colors hover:bg-[#f5fafb] max-[720px]:grid-cols-[22px_minmax(0,1fr)_52px_76px] 2xl:min-h-[34px] 2xl:grid-cols-[33px_minmax(240px,1.7fr)_minmax(114px,.55fr)_78px_minmax(132px,.66fr)_126px] 2xl:gap-3 2xl:px-[21px] 2xl:text-[15px]",
                    focusRing,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid h-4.5 w-4.5 place-items-center rounded-full 2xl:h-7 2xl:w-7",
                      isStrong ? "bg-[#eaf8f3] text-[#35a984]" : "bg-[#fff3e7] text-[#d68431]",
                    )}
                  >
                    {isStrong ? (
                      <CheckCircle2 className="h-3 w-3 2xl:h-4.5 2xl:w-4.5" />
                    ) : (
                      <CircleDot className="h-3 w-3 2xl:h-4.5 2xl:w-4.5" />
                    )}
                  </span>
                  <strong className="truncate font-medium text-[#2d464e]">{item.title}</strong>
                  <span className="w-fit rounded-[4px] bg-[#eff4f5] px-1.5 py-0.5 text-[9px] text-[#70848a] max-[720px]:hidden 2xl:rounded-[6px] 2xl:px-2.5 2xl:py-1 2xl:text-[13px]">
                    {item.category}
                  </span>
                  <span className="text-[#627980]">{item.count} 题</span>
                  <span className="text-[#637a81] max-[720px]:hidden">
                    正确率{" "}
                    <strong className={isStrong ? "text-[#2aa37e]" : "text-[#e17c27]"}>
                      {item.accuracy}%
                    </strong>
                  </span>
                  <span className="text-right text-[#7c8e93]">{item.time}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
