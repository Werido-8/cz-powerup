import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  ClipboardList,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Award,
  ChevronRight,
  ChevronLeft,
  Search,
  History,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  FileText,
  FileSearch,
  Calendar,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { PageHeader, listActionClass, PillSelect } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/exam")({
  component: ExamPage,
  head: () => ({ meta: [{ title: "我的考试 · 题库训练" }] }),
});

type ExamGoal = "取证复习" | "复证巩固" | "岗位达标" | "阶段测评" | "日常自测";
type ExamStatus = "未开始" | "已提交";

interface PastAttempt {
  resultId: string;
  assignedAt: string;
  submittedAt: string | null;
  status: ExamStatus;
  score: number | null;
}

interface EmployeePaper {
  id: string;
  title: string;
  count: number;
  limit: number;
  weight: string;
  level: "易" | "中" | "难";
  goal: ExamGoal;
  status: ExamStatus;
  assignedAt: string;
  latestResultId?: string;
  history: PastAttempt[];
}

const PAPERS: EmployeePaper[] = [
  {
    id: "AGC-取证复习卷",
    title: "AGC / 两细则取证复习考试",
    count: 20,
    limit: 30,
    weight: "AGC",
    level: "中",
    goal: "取证复习",
    status: "未开始",
    assignedAt: "2026-06-15",
    history: [
      {
        resultId: "exam-AGC-20260605",
        assignedAt: "2026-06-05",
        submittedAt: "2026-06-05 11:10",
        status: "已提交",
        score: 72,
      },
      {
        resultId: "exam-AGC-20260528",
        assignedAt: "2026-05-28",
        submittedAt: "2026-05-28 10:02",
        status: "已提交",
        score: 65,
      },
    ],
  },
  {
    id: "主变停送电-岗位达标卷",
    title: "主变停送电典型操作岗位达标卷",
    count: 25,
    limit: 40,
    weight: "操作",
    level: "难",
    goal: "岗位达标",
    status: "未开始",
    assignedAt: "2026-06-14",
    history: [],
  },
  {
    id: "差动保护-阶段测评卷",
    title: "差动保护复盘阶段测评",
    count: 15,
    limit: 25,
    weight: "继保",
    level: "难",
    goal: "阶段测评",
    status: "未开始",
    assignedAt: "2026-06-16",
    history: [],
  },
  {
    id: "复证巩固-调频卷",
    title: "一次调频复证巩固卷",
    count: 18,
    limit: 30,
    weight: "调频",
    level: "中",
    goal: "复证巩固",
    status: "已提交",
    assignedAt: "2026-06-10",
    latestResultId: "exam-复证巩固-20260601",
    history: [
      {
        resultId: "exam-复证巩固-20260601",
        assignedAt: "2026-06-01",
        submittedAt: "2026-06-01 09:30",
        status: "已提交",
        score: 80,
      },
      {
        resultId: "exam-复证巩固-20260510",
        assignedAt: "2026-05-10",
        submittedAt: "2026-05-10 14:20",
        status: "已提交",
        score: 70,
      },
    ],
  },
  {
    id: "新员工-日常自测卷",
    title: "新员工基础日常自测",
    count: 30,
    limit: 45,
    weight: "基础",
    level: "易",
    goal: "日常自测",
    status: "未开始",
    assignedAt: "2026-05-28",
    history: [],
  },
  {
    id: "AVC-电压控制卷",
    title: "AVC 电压无功自动控制专项考试",
    count: 22,
    limit: 35,
    weight: "AVC",
    level: "中",
    goal: "岗位达标",
    status: "未开始",
    assignedAt: "2026-06-12",
    history: [],
  },
  {
    id: "PSS-励磁系统卷",
    title: "PSS 励磁系统原理与应用测评",
    count: 16,
    limit: 25,
    weight: "励磁",
    level: "难",
    goal: "阶段测评",
    status: "已提交",
    assignedAt: "2026-06-08",
    latestResultId: "exam-PSS-20260608",
    history: [
      {
        resultId: "exam-PSS-20260608",
        assignedAt: "2026-06-08",
        submittedAt: "2026-06-08 15:40",
        status: "已提交",
        score: 85,
      },
    ],
  },
  {
    id: "一次调频-取证卷",
    title: "一次调频两细则取证模拟卷",
    count: 20,
    limit: 30,
    weight: "调频",
    level: "中",
    goal: "取证复习",
    status: "未开始",
    assignedAt: "2026-06-11",
    history: [],
  },
  {
    id: "继电保护-基础卷",
    title: "继电保护基础理论综合测评",
    count: 28,
    limit: 40,
    weight: "继保",
    level: "中",
    goal: "日常自测",
    status: "未开始",
    assignedAt: "2026-06-09",
    history: [],
  },
  {
    id: "黑启动-应急处置卷",
    title: "黑启动与电网应急处置专项卷",
    count: 18,
    limit: 30,
    weight: "应急",
    level: "难",
    goal: "岗位达标",
    status: "已提交",
    assignedAt: "2026-06-06",
    latestResultId: "exam-黑启动-20260606",
    history: [
      {
        resultId: "exam-黑启动-20260606",
        assignedAt: "2026-06-06",
        submittedAt: "2026-06-06 09:15",
        status: "已提交",
        score: 78,
      },
      {
        resultId: "exam-黑启动-20260520",
        assignedAt: "2026-05-20",
        submittedAt: "2026-05-20 14:30",
        status: "已提交",
        score: 68,
      },
    ],
  },
  {
    id: "调度规程-复证卷",
    title: "电网调度规程复证巩固考试",
    count: 24,
    limit: 35,
    weight: "调度",
    level: "中",
    goal: "复证巩固",
    status: "未开始",
    assignedAt: "2026-06-07",
    history: [],
  },
  {
    id: "新能源并网-阶段卷",
    title: "新能源并网运行管理阶段测评",
    count: 20,
    limit: 30,
    weight: "新能源",
    level: "难",
    goal: "阶段测评",
    status: "未开始",
    assignedAt: "2026-06-05",
    history: [],
  },
  {
    id: "厂用电-操作卷",
    title: "厂用电系统典型操作达标卷",
    count: 15,
    limit: 20,
    weight: "厂用电",
    level: "易",
    goal: "岗位达标",
    status: "已提交",
    assignedAt: "2026-06-03",
    latestResultId: "exam-厂用电-20260603",
    history: [
      {
        resultId: "exam-厂用电-20260603",
        assignedAt: "2026-06-03",
        submittedAt: "2026-06-03 16:20",
        status: "已提交",
        score: 92,
      },
    ],
  },
  {
    id: "两票三制-日常卷",
    title: "两票三制与现场安全日常测评",
    count: 25,
    limit: 30,
    weight: "安全",
    level: "易",
    goal: "日常自测",
    status: "未开始",
    assignedAt: "2026-06-02",
    history: [],
  },
  {
    id: "AGC-进阶取证卷",
    title: "AGC 进阶调控取证复习卷",
    count: 22,
    limit: 35,
    weight: "AGC",
    level: "难",
    goal: "取证复习",
    status: "未开始",
    assignedAt: "2026-06-01",
    history: [],
  },
  {
    id: "变压器检修-复证卷",
    title: "主变压器检修复证巩固测评",
    count: 19,
    limit: 28,
    weight: "检修",
    level: "中",
    goal: "复证巩固",
    status: "未开始",
    assignedAt: "2026-05-30",
    history: [],
  },
  {
    id: "无功补偿-阶段卷",
    title: "无功补偿与电压调节阶段测评",
    count: 17,
    limit: 25,
    weight: "AVC",
    level: "中",
    goal: "阶段测评",
    status: "未开始",
    assignedAt: "2026-05-27",
    history: [],
  },
  {
    id: "继电保护-取证卷",
    title: "继电保护取证复习模拟卷",
    count: 24,
    limit: 35,
    weight: "继保",
    level: "难",
    goal: "取证复习",
    status: "未开始",
    assignedAt: "2026-05-26",
    history: [],
  },
  {
    id: "运行规程-日常卷",
    title: "运行规程与两票三制日常自测",
    count: 20,
    limit: 30,
    weight: "规程",
    level: "易",
    goal: "日常自测",
    status: "已提交",
    assignedAt: "2026-05-25",
    latestResultId: "exam-规程-20260525",
    history: [
      {
        resultId: "exam-规程-20260525",
        assignedAt: "2026-05-25",
        submittedAt: "2026-05-25 16:40",
        status: "已提交",
        score: 86,
      },
    ],
  },
  {
    id: "新能源-岗位卷",
    title: "新能源并网运行岗位达标卷",
    count: 21,
    limit: 32,
    weight: "新能源",
    level: "中",
    goal: "岗位达标",
    status: "未开始",
    assignedAt: "2026-05-24",
    history: [],
  },
];

const GOALS: (ExamGoal | "全部")[] = ["全部", "取证复习", "复证巩固", "岗位达标", "阶段测评", "日常自测"];
const STATUSES: (ExamStatus | "全部")[] = ["全部", "未开始", "已提交"];

/** 左右栏固定高度（非 min-h），内容超出在内部滚动 */
const PANEL_H = "h-[560px] max-h-[560px] lg:h-[calc(100vh-15.5rem)] lg:max-h-[calc(100vh-15.5rem)]";

const selectClass =
  "h-8 rounded-md border border-border bg-card px-2 text-[12px] outline-none focus:border-primary/50";

function statusPill(s: ExamStatus) {
  return s === "已提交" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground";
}

function levelTone(l: EmployeePaper["level"]) {
  return l === "难" ? "text-destructive" : l === "中" ? "text-warning-foreground" : "text-success";
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="shrink-0 text-[11.5px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function ExamPage() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState(PAPERS[0].id);
  const [kw, setKw] = useState("");
  const [goal, setGoal] = useState<ExamGoal | "全部">("全部");
  const [status, setStatus] = useState<ExamStatus | "全部">("全部");
  const [from, setFrom] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return PAPERS.filter((p) => {
      if (kw && !p.title.includes(kw)) return false;
      if (goal !== "全部" && p.goal !== goal) return false;
      if (status !== "全部" && p.status !== status) return false;
      if (from && p.assignedAt < from) return false;
      return true;
    });
  }, [kw, goal, status, from]);

  const paper = PAPERS.find((p) => p.id === picked) ?? PAPERS[0];
  const bestScore = paper.history.reduce<number | null>((max, h) => {
    if (h.score == null) return max;
    return max == null ? h.score : Math.max(max, h.score);
  }, null);
  const latestResultId = paper.latestResultId ?? paper.history.find((h) => h.status === "已提交")?.resultId;

  const start = () => {
    navigate({
      to: "/training/session/$id",
      params: { id: `我的考试-${paper.id}` },
      search: { mode: "exam", filter: "", count: paper.count, limit: paper.limit },
    });
  };

  const hasFilter = kw || goal !== "全部" || status !== "全部" || from;

  return (
    <PageShell>
      <nav aria-label="页面导航" className="mb-2 flex items-center gap-1 text-[12px]">
        <Link
          to="/training"
          className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          题库训练
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/30" aria-hidden />
        <span className="text-foreground/70">我的考试</span>
      </nav>
      <PageHeader
        title="我的考试"
        subtitle="培训负责人下发的考试，默认展示待完成与最新下发。"
        size="md"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch">
        <section className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-card", PANEL_H)}>
          {/* filter toolbar */}
          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-border bg-muted/20 px-4 py-2.5">
            <div className="flex h-8 w-44 items-center gap-2 rounded-md border border-border bg-card px-2.5 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/15">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder="搜索试卷名称"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] leading-normal outline-none placeholder:text-muted-foreground"
              />
            </div>

            <PillSelect
              options={STATUSES.map((s) => ({ value: s, label: s }))}
              value={status}
              onChange={(v) => setStatus(v as ExamStatus | "全部")}
            />

            <FilterField label="考试目标">
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as ExamGoal | "全部")}
                className={cn(selectClass, "min-w-[96px]")}
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="下发时间">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={cn(selectClass, "w-[128px]")}
              />
            </FilterField>

            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  setKw("");
                  setGoal("全部");
                  setStatus("全部");
                  setFrom("");
                }}
                className="text-[11.5px] text-primary hover:underline"
              >
                重置
              </button>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            <div className="mb-3 shrink-0 text-[13px] font-semibold">我的考试 ({filtered.length})</div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              <div className="space-y-2">
              {filtered.length === 0 && (
                <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-[12px] text-muted-foreground">
                  没有符合条件的考试
                </div>
              )}
              {filtered.map((p) => {
                const active = p.id === picked;
                const open = expanded === p.id;
                return (
                  <div key={p.id}>
                    <button
                      type="button"
                      onClick={() => setPicked(p.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
                        active
                          ? "border-primary/50 bg-primary-soft/60"
                          : "border-border/80 bg-background hover:border-primary/30 hover:bg-muted/30",
                      )}
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13.5px] font-medium">{p.title}</span>
                          <span className={cn("rounded px-1.5 py-px text-[10px] font-medium", statusPill(p.status))}>
                            {p.status}
                          </span>
                        </div>
                        <ExamCardMeta goal={p.goal} count={p.count} limit={p.limit} assignedAt={p.assignedAt} />
                        {p.history.length > 0 && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpanded(open ? null : p.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                setExpanded(open ? null : p.id);
                              }
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 rounded border border-border/80 bg-card px-1.5 py-px text-[10.5px] text-primary hover:bg-muted"
                          >
                            <History className="h-3 w-3" />
                            历史作答 {p.history.length} 次
                            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                      <ChevronRight
                        className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground/60")}
                      />
                    </button>

                    {open && p.history.length > 0 && (
                      <div className="ml-12 mt-1 overflow-hidden rounded-md border border-border/80">
                        <table className="w-full text-[11.5px]">
                          <thead className="bg-muted/40 text-[10.5px] text-muted-foreground">
                            <tr>
                              <th className="px-2.5 py-1.5 text-left font-normal">下发时间</th>
                              <th className="px-2.5 py-1.5 text-left font-normal">提交时间</th>
                              <th className="px-2.5 py-1.5 text-left font-normal">分数</th>
                              <th className="px-2.5 py-1.5 text-right font-normal">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.history.map((h) => (
                              <tr key={h.resultId} className="border-t border-border/60">
                                <td className="px-2.5 py-1.5">{h.assignedAt}</td>
                                <td className="px-2.5 py-1.5">{h.submittedAt ?? "—"}</td>
                                <td className="px-2.5 py-1.5 font-medium tabular-nums">{h.score ?? "—"}</td>
                                <td className="px-2.5 py-1.5 text-right">
                                  {h.status === "已提交" && (
                                    <Link
                                      to="/training/result/$id"
                                      params={{ id: h.resultId }}
                                      onClick={(e) => e.stopPropagation()}
                                      className={listActionClass("textPrimary")}
                                    >
                                      <FileSearch className="h-3 w-3" />
                                      查看详情
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>

            <div className="mt-4 shrink-0 rounded-md border border-warning/25 bg-warning-soft/30 p-3.5">
              <div className="mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-warning-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                考试须知
              </div>
              <ul className="space-y-0.5 pl-4 text-[11.5px] leading-relaxed text-warning-foreground/85 [&>li]:list-disc">
                <li>试卷限时，超时自动提交；中途可暂停查看题号但计时不停。</li>
                <li>支持单选 / 多选 / 判断 / 简答四类题型，提交前可回看修改。</li>
                <li>本次结果仅作为培训自评，不替代正式上岗考核。</li>
              </ul>
            </div>
          </div>
        </section>

        <aside className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-card", PANEL_H)}>
          <div className="shrink-0 rounded-t-lg bg-gradient-to-br from-primary to-[oklch(0.5_0.13_205)] px-4 py-4 text-white">
            <div className="inline-flex items-center gap-1.5 text-[11px] opacity-90">
              <Award className="h-3.5 w-3.5" />
              试卷预览
            </div>
            <div className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug">{paper.title}</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <PreviewCell n={paper.count} l="题量" />
              <PreviewCell n={paper.limit} l="分钟" />
              <PreviewCell n={60} l="及格线" />
            </div>
          </div>

          <div className="shrink-0 border-b border-border/60 px-4 py-3.5">
            <div className="mb-2.5 text-[11px] font-medium text-muted-foreground">试卷信息</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[11.5px]">
              <MetaItem icon={Target} label="考试目标" value={paper.goal} />
              <MetaItem icon={BarChart3} label="难度" value={paper.level} valueClass={levelTone(paper.level)} />
              <MetaItem icon={FileText} label="知识权重" value={paper.weight} />
              <MetaItem icon={Clock} label="下发时间" value={paper.assignedAt} />
            </dl>
            {bestScore != null && (
              <div className="mt-3 flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-2">
                <span className="text-[11px] text-muted-foreground">历史最高分</span>
                <span className="text-[14px] font-semibold text-primary">{bestScore}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 border-b border-border/60 px-4 py-3.5">
            <div className="inline-flex items-center gap-1.5 text-[12px] font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              评分规则
            </div>
            <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-foreground/75">
              <li className="flex gap-1.5">
                <span className="shrink-0 text-muted-foreground">·</span>
                <span>单选 / 判断：对得满分，错得 0 分</span>
              </li>
              <li className="flex gap-1.5">
                <span className="shrink-0 text-muted-foreground">·</span>
                <span>多选：全对得分，漏选半分，错选 0 分</span>
              </li>
              <li className="flex gap-1.5">
                <span className="shrink-0 text-muted-foreground">·</span>
                <span>简答：按要点匹配率给分</span>
              </li>
            </ul>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
            <div className="mb-2 text-[11px] font-medium text-muted-foreground">题型构成</div>
            <div className="space-y-1.5">
              <TypeBar label="单选题" count={Math.round(paper.count * 0.45)} total={paper.count} />
              <TypeBar label="多选题" count={Math.round(paper.count * 0.2)} total={paper.count} />
              <TypeBar label="判断题" count={Math.round(paper.count * 0.2)} total={paper.count} />
              <TypeBar label="简答题" count={paper.count - Math.round(paper.count * 0.85)} total={paper.count} />
            </div>
          </div>

          <div className="mt-auto shrink-0 border-t border-border/60 p-4">
            {paper.status === "已提交" && latestResultId ? (
              <>
                <Link
                  to="/training/result/$id"
                  params={{ id: latestResultId }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <FileSearch className="h-3.5 w-3.5" />
                  查看作答详情
                </Link>
                <p className="mt-2 text-center text-[10.5px] text-muted-foreground">
                  含得分、逐题解析与薄弱知识点
                </p>
              </>
            ) : (
              <button
                type="button"
                onClick={start}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Clock className="h-3.5 w-3.5" />
                开始考试
              </button>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function ExamCardMeta({
  goal,
  count,
  limit,
  assignedAt,
}: {
  goal: string;
  count: number;
  limit: number;
  assignedAt: string;
}) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <span className="inline-flex items-center rounded border border-primary/15 bg-primary-soft/40 px-1.5 py-0.5 text-[10.5px] font-medium text-accent-foreground">
        {goal}
      </span>
      <MetaChip icon={ListChecks}>
        <span className="tabular-nums">{count}</span> 题
      </MetaChip>
      <MetaChip icon={Clock}>
        <span className="tabular-nums">{limit}</span> 分钟
      </MetaChip>
      <MetaChip icon={Calendar}>下发 {assignedAt}</MetaChip>
    </div>
  );
}

function MetaChip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-muted/35 px-1.5 py-0.5 text-[10.5px] leading-none text-muted-foreground">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground/55" aria-hidden />
      {children}
    </span>
  );
}

function PreviewCell({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-md bg-white/15 px-2 py-2.5 text-center backdrop-blur-sm">
      <div className="text-[20px] font-bold leading-none">{n}</div>
      <div className="mt-1 text-[10px] opacity-90">{l}</div>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/70" />
      <div className="min-w-0">
        <dt className="text-[10px] text-muted-foreground">{label}</dt>
        <dd className={cn("font-medium", valueClass)}>{value}</dd>
      </div>
    </div>
  );
}

function TypeBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[10.5px] text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-[10.5px] tabular-nums text-muted-foreground">{count} 题</span>
    </div>
  );
}
