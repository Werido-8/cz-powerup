import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ClipboardList,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Award,
  ChevronRight,
  Search,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";

export const Route = createFileRoute("/training/exam")({
  component: ExamPage,
  head: () => ({ meta: [{ title: "模拟考试 · 题库训练" }] }),
});

type ExamGoal = "取证复习" | "复证巩固" | "岗位达标" | "阶段测评" | "日常自测";
type ExamStatus = "未开始" | "进行中" | "已提交" | "已过期";

interface PastAttempt {
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
  isRetake: boolean;
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
    isRetake: true,
    history: [
      { assignedAt: "2026-06-05", submittedAt: "2026-06-05 11:10", status: "已提交", score: 72 },
      { assignedAt: "2026-05-28", submittedAt: "2026-05-28 10:02", status: "已提交", score: 65 },
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
    status: "进行中",
    assignedAt: "2026-06-14",
    isRetake: false,
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
    isRetake: false,
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
    isRetake: true,
    history: [
      { assignedAt: "2026-06-01", submittedAt: "2026-06-01 09:30", status: "已提交", score: 80 },
      { assignedAt: "2026-05-20", submittedAt: null, status: "已过期", score: null },
      { assignedAt: "2026-05-10", submittedAt: "2026-05-10 14:20", status: "已提交", score: 70 },
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
    status: "已过期",
    assignedAt: "2026-05-28",
    isRetake: false,
    history: [],
  },
];

const GOALS: (ExamGoal | "全部")[] = ["全部", "取证复习", "复证巩固", "岗位达标", "阶段测评", "日常自测"];
const STATUSES: (ExamStatus | "全部")[] = ["全部", "未开始", "进行中", "已提交", "已过期"];

function statusPill(s: ExamStatus) {
  return s === "已提交"
    ? "bg-success-soft text-success"
    : s === "进行中"
      ? "bg-warning-soft text-warning-foreground"
      : s === "已过期"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary-soft text-primary";
}

function ExamPage() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState(PAPERS[0].id);
  const [kw, setKw] = useState("");
  const [goal, setGoal] = useState<ExamGoal | "全部">("全部");
  const [status, setStatus] = useState<ExamStatus | "全部">("全部");
  const [retakeOnly, setRetakeOnly] = useState(false);
  const [from, setFrom] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return PAPERS.filter((p) => {
      if (kw && !p.title.includes(kw)) return false;
      if (goal !== "全部" && p.goal !== goal) return false;
      if (status !== "全部" && p.status !== status) return false;
      if (retakeOnly && !p.isRetake) return false;
      if (from && p.assignedAt < from) return false;
      return true;
    });
  }, [kw, goal, status, retakeOnly, from]);

  const paper = PAPERS.find((p) => p.id === picked) ?? PAPERS[0];

  const start = () => {
    navigate({
      to: "/training/session/$id",
      params: { id: `模拟考试-${paper.id}` },
      search: { mode: "exam", filter: "", count: paper.count, limit: paper.limit },
    });
  };

  return (
    <PageShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[12px] text-muted-foreground">题库训练 / 智能考试</div>
          <h1 className="mt-1 text-[24px] font-semibold tracking-tight">智能考试</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            培训负责人下发的考试 · 默认展示待完成与最新下发
          </p>
        </div>
        <Link
          to="/training"
          className="rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-muted"
        >
          返回训练首页
        </Link>
      </div>

      {/* filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="搜索试卷名称"
            className="h-9 w-48 rounded-lg border border-border bg-background pl-8 pr-3 text-[12.5px] outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value as ExamGoal | "全部")}
          className="h-9 rounded-lg border border-border bg-background px-2 text-[12.5px] outline-none focus:border-primary/50"
        >
          {GOALS.map((g) => (
            <option key={g} value={g}>{g === "全部" ? "考试目标:全部" : g}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ExamStatus | "全部")}
          className="h-9 rounded-lg border border-border bg-background px-2 text-[12.5px] outline-none focus:border-primary/50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "全部" ? "状态:全部" : s}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          下发时间起
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2 text-[12.5px] outline-none focus:border-primary/50"
          />
        </label>
        <button
          onClick={() => setRetakeOnly((v) => !v)}
          className={`h-9 rounded-lg border px-3 text-[12.5px] ${
            retakeOnly ? "border-primary bg-primary-soft text-primary" : "border-border bg-background hover:bg-muted"
          }`}
        >
          仅看补考/复测
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-semibold">我的考试 ({filtered.length})</div>
          </div>
          <div className="space-y-2.5">
            {filtered.length === 0 && (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-[12.5px] text-muted-foreground">
                没有符合条件的考试
              </div>
            )}
            {filtered.map((p) => {
              const active = p.id === picked;
              const open = expanded === p.id;
              return (
                <div key={p.id}>
                  <button
                    onClick={() => setPicked(p.id)}
                    className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all ${
                      active
                        ? "border-primary bg-primary-soft shadow-[var(--shadow-card)]"
                        : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40"
                    }`}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-semibold">{p.title}</span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] ${statusPill(p.status)}`}>{p.status}</span>
                        {p.isRetake && (
                          <span className="rounded-md bg-warning-soft px-1.5 py-0.5 text-[10.5px] text-warning-foreground">补考/复测</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                        <span>{p.goal}</span>
                        <span>·</span>
                        <span>{p.count} 题</span>
                        <span>·</span>
                        <span>{p.limit} 分钟</span>
                        <span>·</span>
                        <span>下发 {p.assignedAt}</span>
                      </div>
                      {p.history.length > 0 && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(open ? null : p.id);
                          }}
                          className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-primary hover:bg-muted"
                        >
                          <History className="h-3 w-3" /> 历史作答 {p.history.length} 次
                          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </span>
                      )}
                    </div>
                    <ChevronRight className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  </button>

                  {open && p.history.length > 0 && (
                    <div className="ml-14 mt-1.5 overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-[12px]">
                        <thead className="bg-muted/30 text-[11px] text-muted-foreground">
                          <tr>
                            <th className="px-3 py-1.5 text-left font-normal">下发时间</th>
                            <th className="px-3 py-1.5 text-left font-normal">提交时间</th>
                            <th className="px-3 py-1.5 text-left font-normal">状态</th>
                            <th className="px-3 py-1.5 text-left font-normal">分数</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.history.map((h, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="px-3 py-1.5">{h.assignedAt}</td>
                              <td className="px-3 py-1.5">{h.submittedAt ?? "—"}</td>
                              <td className="px-3 py-1.5">
                                <span className={`rounded px-1.5 py-0.5 text-[10.5px] ${statusPill(h.status)}`}>{h.status}</span>
                              </td>
                              <td className="px-3 py-1.5">{h.score ?? "—"}</td>
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

          <div className="mt-6 rounded-lg border border-warning/30 bg-warning-soft/40 p-4">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-warning-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" /> 考试须知
            </div>
            <ul className="space-y-1 pl-5 text-[12px] text-warning-foreground/90 [&>li]:list-disc">
              <li>试卷限时,超时自动提交。中途可暂停查看题号但计时不停。</li>
              <li>支持单选 / 多选 / 判断 / 简答四类题型,提交前可回看修改。</li>
              <li>本次结果仅作为培训自评,不替代正式上岗考核。</li>
            </ul>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-gradient-to-br from-primary to-[oklch(0.5_0.13_205)] p-5 text-white shadow-[var(--shadow-glow)]">
            <div className="inline-flex items-center gap-1.5 text-[12px] opacity-90">
              <Award className="h-3.5 w-3.5" /> 试卷预览
            </div>
            <div className="mt-2 text-[16px] font-semibold">{paper.title}</div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Cell n={paper.count} l="题量" />
              <Cell n={paper.limit} l="分钟" />
              <Cell n={60} l="及格线" />
            </div>
            <button
              onClick={start}
              className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-primary hover:bg-white/95"
            >
              <Clock className="h-3.5 w-3.5" /> 立即开始考试
            </button>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> 评分规则
            </div>
            <ul className="mt-2 space-y-1.5 text-[12px] text-foreground/80">
              <li>· 单选 / 判断:对得满分,错得 0 分</li>
              <li>· 多选:全对得分,漏选半分,错选 0 分</li>
              <li>· 简答:按要点匹配率给分</li>
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function Cell({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-lg bg-white/15 p-3 text-center backdrop-blur-sm">
      <div className="text-[22px] font-bold leading-none">{n}</div>
      <div className="mt-1 text-[10.5px] opacity-90">{l}</div>
    </div>
  );
}
