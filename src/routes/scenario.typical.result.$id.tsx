import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Star,
  Pencil,
  RefreshCw,
  Download,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ListChecks,
  Shield,
  AlertOctagon,
  BookOpen,
  FileText,
  MessagesSquare,
  Send,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bot,
  ArrowLeftRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { ScenarioBreadcrumb, scenarioResultBlockClass } from "@/components/scenario/parts";
import { getScenario, type ScenarioTemplate } from "@/lib/mock/scenario";
import { useMockStore } from "@/lib/mock/store";

export const Route = createFileRoute("/scenario/typical/result/$id")({
  loader: ({ params }) => {
    const s = getScenario(params.id);
    if (!s || s.kind !== "typical") throw notFound();
    return { scenario: s };
  },
  component: TypicalResult,
  notFoundComponent: () => (
    <PageShell>
      <div className={`${scenarioResultBlockClass} p-10 text-center text-muted-foreground`}>
        未找到该典型操作场景
      </div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        载入出错: {error.message}
      </div>
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "智能辅助结果 · 涉网运行能力智能支撑平台" }] }),
});

// ---------- Mock structured content following the design spec ----------

const CONDITIONS: { label: string; value: string }[] = [
  { label: "电压等级", value: "220kV" },
  { label: "设备类型", value: "主变" },
  { label: "设备实例", value: "#1主变" },
  { label: "任务类型", value: "停役" },
  { label: "接令模式", value: "单步" },
];

const SCOPE_ITEMS = [
  { ok: true, label: "本次识别的典型操作类别", value: "220kV 主变停役" },
  { ok: true, label: "适用设备", value: "XX 220kV 变电站 #1 主变(型号 SSZ11-180000/220)" },
  { ok: true, label: "适用运行方式", value: "正常运行方式下,#2 主变带全部负荷" },
  {
    ok: false,
    label: "不适用范围",
    value: "特殊运行方式下、新设备启动期间的停役操作需另行核查专项规定",
  },
];

type StepItem = { no: number; title: string; desc: string; refId: string };
const STEPS: StepItem[] = [
  {
    no: 1,
    title: "负荷转移",
    desc: "通过母线互联或负荷转供操作,将 #1 主变所带负荷全部转移至 #2 主变,过程中监控母线电压变化,控制电压偏差在 ±5% 以内。",
    refId: "P01-023",
  },
  {
    no: 2,
    title: "退出相关保护及自动装置",
    desc: "退出 #1 主变差动保护、后备保护、零序保护,退出 AVC 系统对主变控制功能,调整 #2 主变保护定值至单台运行模式。",
    refId: "B05-009",
  },
  {
    no: 3,
    title: "断开各侧开关",
    desc: "先断开低压侧开关,再断开中压侧开关,最后断开高压侧开关,每一步操作后确认三相电流为零,开关位置指示正确。",
    refId: "P02-017",
  },
  {
    no: 4,
    title: "拉开各侧闸刀",
    desc: `按照“先拉负荷侧闸刀,后拉电源侧闸刀”的顺序操作,每一步操作后确认闸刀位置指示正确、机械闭锁到位。`,
    refId: "G02-008",
  },
  {
    no: 5,
    title: "合接地闸刀",
    desc: `在 #1 主变各侧分别验明确无电压后,合上各侧接地闸刀,悬挂“禁止合闸 有人工作”标识牌。`,
    refId: "G02-011",
  },
];

type RiskLevel = "high" | "easy" | "forbid";
const RISKS: { level: RiskLevel; title: string; desc: string }[] = [
  {
    level: "high",
    title: "严禁在未确认负荷全部转移前断开主变各侧开关",
    desc: "操作前核对各侧电流指示,确认负荷为零后再进行下一步操作。",
  },
  {
    level: "high",
    title: "严禁带负荷拉合闸刀",
    desc: "操作闸刀前必须确认对应开关在分位,且三相电流为零。",
  },
  {
    level: "easy",
    title: "主变中性点接地方式调整",
    desc: "#1 主变停役后,立即检查 #2 主变中性点接地闸刀确在合位。",
  },
  {
    level: "forbid",
    title: "严禁在未退出主变保护的情况下拉开主变各侧闸刀",
    desc: "防止操作过电压引起保护误动,造成运行设备跳闸。",
  },
];

const STOP_CONDITIONS = [
  "操作时出现开关拒动、闸刀卡涩等设备异常",
  "监控系统报警、保护动作信号、设备异常声响",
  "发现操作票错误、操作步骤与现场实际不符",
];

const REPORT_TARGETS = [
  {
    title: "立即向值班调度员汇报:",
    desc: "操作名称、执行进度、异常现象、设备状态、已采取措施",
  },
  {
    title: "同时向站内负责人汇报:",
    desc: "现场情况、人员状态、设备受损情况初步判断",
  },
];

type Evidence = {
  id: string;
  type: string;
  doc: string;
  clause: string;
  summary: string;
  // 原文引用面板内容
  fileName: string;
  chapter: string;
  related: string;
  pageCurrent: number;
  pageTotal: number;
  highlightedText: string;
  standardNo: string;
  publishDate: string;
};

const EVIDENCES: Evidence[] = [
  {
    id: "G01-003",
    type: "规程制度",
    doc: "《电力变压器运行规程》第 4.3.2 条",
    clause: "第 4.3.2 条",
    summary: "变压器停役前,应确认负荷已全部转移,备用变压器容量满足运行要求。",
    fileName: "电力变压器运行规程",
    chapter: "第 4 章 / 停役与复役 / 4.3.2 停役前置条件",
    related: "关联卡片:关键步骤参考 第 1 步",
    pageCurrent: 18,
    pageTotal: 96,
    highlightedText:
      "变压器停役操作前,应确认负荷已全部转移至备用变压器,备用变压器容量、温升及保护配置应满足全部负荷运行要求,并征得调度许可。",
    standardNo: "Q/GDW 11352-2015",
    publishDate: "2015-09-30",
  },
  {
    id: "G02-007",
    type: "规程制度",
    doc: "《电气操作导则》第 4.2.3 条",
    clause: "第 4.2.3 条",
    summary: "电气操作前,应核对设备实际位置、名称、编号与操作票一致。",
    fileName: "电气操作导则",
    chapter: "第 4 章 / 操作前准备 / 4.2.3 设备核对",
    related: "关联卡片:关键步骤参考 第 3 步",
    pageCurrent: 27,
    pageTotal: 186,
    highlightedText:
      "电气操作前,操作人员应核对设备实际位置、名称、编号与操作票完全一致,并对照系统接线图复查操作顺序,严禁凭记忆操作。",
    standardNo: "Q/GDW 1799.1-2013",
    publishDate: "2013-11-13",
  },
  {
    id: "B07-012",
    type: "保护安控资料",
    doc: "《220kV 变电站保护整定运行规程》第 6.2.4 条",
    clause: "第 6.2.4 条",
    summary: "单台主变运行时,主变保护定值应调整为单台运行模式,确保故障时正确动作。",
    fileName: "220kV 变电站保护整定运行规程",
    chapter: "第 6 章 / 主变保护 / 6.2.4 单台运行定值",
    related: "关联卡片:关键步骤参考 第 2 步 · 风险点依据",
    pageCurrent: 42,
    pageTotal: 128,
    highlightedText:
      "当变电站内仅单台主变运行时,主变差动、后备保护定值应切换至单台运行模式,后备保护时间级差宜整定为 0.3s,确保故障时保护正确动作。",
    standardNo: "Q/GDW 10422-2017",
    publishDate: "2017-07-20",
  },
  {
    id: "G03-015",
    type: "规程制度",
    doc: "《调度管理规程》第 5.3.6 条",
    clause: "第 5.3.6 条",
    summary: "操作许可制下,现场应在得到调度许可后,按照现场规程执行操作。",
    fileName: "调度管理规程",
    chapter: "第 5 章 / 操作许可 / 5.3.6 现场执行",
    related: "关联卡片:原文依据卡片",
    pageCurrent: 55,
    pageTotal: 142,
    highlightedText:
      "采用操作许可制时,现场操作负责人应在得到值班调度员的操作许可后,严格按照现场运行规程执行操作,操作过程中应保持与调度的实时联系。",
    standardNo: "Q/GDW 1799.2-2013",
    publishDate: "2013-11-13",
  },
];

// ---------- Sub-components ----------

function HeaderActions({ onFavorite }: { onFavorite: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to="/scenario/typical"
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] text-foreground hover:bg-muted"
      >
        <Pencil className="h-3.5 w-3.5" /> 修改条件
      </Link>
      <button
        onClick={() => toast.success("已基于当前条件重新生成辅助方案")}
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] text-foreground hover:bg-muted"
      >
        <RefreshCw className="h-3.5 w-3.5" /> 重新生成
      </button>
      <button
        onClick={onFavorite}
        className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary-soft/60 px-3 py-1.5 text-[12.5px] font-medium text-primary hover:bg-primary-soft"
      >
        <Star className="h-3.5 w-3.5 fill-primary" /> 收藏
      </button>
      <button
        onClick={() => toast.message("已导出为 PDF(占位)")}
        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Download className="h-3.5 w-3.5" /> 导出
      </button>
    </div>
  );
}

function ScopeCard() {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">适用场景说明</h3>
      </header>
      <ul className="space-y-2">
        {SCOPE_ITEMS.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-6">
            {it.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
            )}
            <div>
              <span className="text-muted-foreground">{it.label}:</span>
              <span className="ml-1 text-foreground">{it.value}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StepsCard({ onPickEvidence }: { onPickEvidence: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-4 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">关键步骤提示</h3>
      </header>
      <ol className="space-y-2.5">
        {STEPS.map((s) => (
          <li
            key={s.no}
            className="group flex items-start gap-3 rounded-lg border border-border bg-background p-3.5 transition-colors hover:border-primary/40"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[12.5px] font-semibold text-primary-foreground shadow-sm">
              {s.no}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-foreground">{s.title}</div>
              <p className="mt-1 text-[12.5px] leading-6 text-muted-foreground">{s.desc}</p>
            </div>
            <button
              onClick={() => onPickEvidence(s.refId)}
              className="ml-2 inline-flex shrink-0 items-center gap-1 self-start rounded-md border border-primary/30 bg-primary-soft/60 px-2 py-1 text-[11.5px] font-medium text-primary hover:bg-primary-soft"
              title="查看依据原文"
            >
              依据:{s.refId}
              <FileText className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg: Record<RiskLevel, { label: string; cls: string }> = {
    high: {
      label: "高风险",
      cls: "bg-destructive/10 text-destructive border-destructive/30",
    },
    easy: {
      label: "易错点",
      cls: "bg-warning-soft text-warning-foreground border-warning/40",
    },
    forbid: {
      label: "禁止项",
      cls: "bg-muted text-foreground border-border",
    },
  };
  const c = cfg[level];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${c.cls}`}
    >
      {c.label}
    </span>
  );
}

function RiskCard() {
  const cardBg: Record<RiskLevel, string> = {
    high: "border-destructive/25 bg-destructive/[0.04]",
    easy: "border-warning/30 bg-warning-soft/40",
    forbid: "border-border bg-muted/30",
  };
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 text-destructive" />
        <h3 className="text-[15px] font-semibold tracking-tight">风险点与禁止项</h3>
      </header>
      <ul className="space-y-2">
        {RISKS.map((r, i) => (
          <li key={i} className={`rounded-lg border p-3 ${cardBg[r.level]}`}>
            <div className="flex items-start gap-2">
              <RiskBadge level={r.level} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-foreground">{r.title}</div>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{r.desc}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StopReportCard() {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-warning-foreground" />
        <h3 className="text-[15px] font-semibold tracking-tight">异常停止与汇报提示</h3>
      </header>
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-warning-foreground" />
            遇以下情况应立即停止操作
          </div>
          <ul className="space-y-1.5">
            {STOP_CONDITIONS.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-5">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/80" />
                <span className="text-foreground/90">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-2 text-[12.5px] font-medium text-foreground">汇报对象与要点</div>
          <ul className="space-y-1.5">
            {REPORT_TARGETS.map((t, i) => (
              <li key={i} className="text-[12px] leading-5">
                <div className="font-medium text-foreground">{t.title}</div>
                <div className="text-muted-foreground">{t.desc}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function EvidenceListCard({ activeId, onPick }: { activeId?: string; onPick: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-1 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">原文依据</h3>
      </header>
      <p className="mb-4 text-[12px] text-muted-foreground">
        点击正文中的依据标签,可联动定位到对应条目,并在右侧查看原文引用。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {EVIDENCES.map((e) => {
          const active = e.id === activeId;
          return (
            <div
              key={e.id}
              id={`ev-${e.id}`}
              className={`rounded-lg border p-4 transition-colors ${
                active ? "border-primary bg-primary-soft/40" : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                  {e.id}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{e.type}</span>
                <FileText className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-[13px] font-semibold text-foreground">{e.doc}</div>
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{e.summary}</p>
              <button
                onClick={() => onPick(e.id)}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
              >
                查看全文 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Right sidebar: chat (default) / source ----------

function ChatPanel({ scenarioTitle, onSwitchToSource }: { scenarioTitle: string; onSwitchToSource?: () => void }) {
  const QUICK = ["第 3 步为什么要先断低压侧?", "合接地闸刀前还要核对什么?", "带我看一下 G02-008 的原文依据"];
  const [input, setInput] = useState("");
  const [followups, setFollowups] = useState<{ q: string; a: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    if (!text.trim()) return;
    setFollowups((arr) => [
      ...arr,
      {
        q: text,
        a: `针对「${text}」的培训参考:可结合关键步骤与对应依据条文综合理解,执行前请校核监控系统实际状态。`,
      },
    ]);
    setInput("");
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto px-4 py-4">
        {/* user msg */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-[12.5px] leading-5 text-primary-foreground">
            帮我生成 {scenarioTitle} 的操作辅助方案
          </div>
        </div>

        {/* thinking card */}
        <div className="flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <Bot className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-muted/30 px-3 py-2.5">
            <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">正在思考</div>
            <ol className="space-y-1 text-[11.5px] leading-5 text-foreground/85">
              <li>1. 识别用户需求:需要生成 220kV 主变停役操作辅助方案</li>
              <li>2. 检索知识库:查找 220kV 主变停役相关的规程、典型操作票</li>
              <li>3. 匹配场景参数:电压等级 220kV、设备类型主变、任务类型停役</li>
              <li>4. 核对适用条件:确认设备型号、运行方式、保护配置等参数</li>
              <li>5. 生成操作步骤:按照规程要求梳理关键操作步骤和风险点</li>
              <li>6. 关联依据:匹配相关的规程条款和典型操作票依据</li>
            </ol>
          </div>
        </div>

        {/* result */}
        <div className="flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <Bot className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2.5">
            <div className="mb-1.5 text-[12px] font-medium text-foreground">已为您生成辅助方案</div>
            <ul className="space-y-1 text-[11.5px] leading-5 text-foreground/85">
              <li>✅ 已完成 220kV #1 主变停役操作辅助方案生成</li>
              <li>📋 包含 5 个关键操作步骤,4 项前置核对条件</li>
              <li>⚠️ 识别出 4 个高风险点和禁止项</li>
              <li>📚 关联 4 份规程依据,可在下方原文依据区查看</li>
            </ul>
          </div>
        </div>

        {/* quick follow-ups */}
        <div className="flex items-start gap-2">
          <span className="h-7 w-7 shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-md border border-border bg-background px-2 py-1 text-[11.5px] text-foreground/85 hover:border-primary/40 hover:bg-primary-soft/40"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* dynamic follow-up history */}
        {followups.map((f, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-[12.5px] leading-5 text-primary-foreground">
                {f.q}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2.5 text-[12px] leading-5 text-foreground/90">
                {f.a}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* input */}
      <div className="border-t border-border bg-background/60 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(input);
            }}
            placeholder="输入问题继续追问.."
            className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => send(input)}
            className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        {onSwitchToSource && (
          <p className="mt-2 text-center text-[10.5px] text-muted-foreground">点击左侧依据标签可切换到「原文引用」</p>
        )}
      </div>
    </>
  );
}

function SourcePanel({ evidence }: { evidence: Evidence }) {
  // chapter like "第 4 章 / 停役与复役 / 4.3.2 停役前置条件"
  const parts = evidence.chapter.split("/").map((s) => s.trim());
  const leafFull = parts[parts.length - 1] ?? evidence.chapter;
  // try to split leaf into "4.3.2" + "停役前置条件"
  const m = leafFull.match(/^([\d.]+)\s*(.*)$/);
  const leafNum = m?.[1] ?? "";
  const leafTitle = m?.[2] ?? leafFull;
  // parent section like "4.3" from "4.3.2"
  const parentNum = leafNum.split(".").slice(0, 2).join(".");
  const parentLabel = parts.length >= 2 ? parts[parts.length - 2] : "";
  return (
    <div className="flex h-full flex-col">
      {/* 来源信息卡片 */}
      <div className="border-b border-border bg-card px-5 py-4">
        <div className="rounded-md bg-[#F7F9FA] p-4 space-y-2">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#2F80ED]" />
            <div className="min-w-0 flex-1 text-[12.5px] font-semibold text-foreground">
              {evidence.fileName}
            </div>
          </div>
          <div className="flex items-start gap-2 text-[12px] text-foreground/80">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F5A623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>{evidence.chapter}</span>
          </div>
          <div className="flex items-start gap-2 text-[12px] text-foreground/80">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>{evidence.related}</span>
          </div>
        </div>
      </div>

      {/* PDF 预览区 */}
      <div className="flex-1 overflow-auto bg-muted/40 px-3 py-4">
        <div className="mx-auto rounded-md border border-border bg-white shadow-md">
          <div className="px-9 pt-9 pb-6">
            <div className="mb-6 flex items-center justify-between text-[10.5px] text-slate-500">
              <span>{evidence.fileName}</span>
              <span>{evidence.pageCurrent}</span>
            </div>

            {parentNum && parentLabel && (
              <h4 className="mb-3 text-[17px] font-bold text-foreground">
                {parentNum} {parentLabel}
              </h4>
            )}

            <h5 className="mt-2 text-[15px] font-semibold text-foreground leading-7">
              {leafNum} {leafTitle}
            </h5>

            <p className="mt-3 text-[12.5px] leading-[1.9] text-foreground/85">
              本条款为本规程的基本要求,适用范围、执行主体及配合环节应按相关章节执行,严禁违反规程要求开展操作。
            </p>

            <div className="mt-4 rounded-sm bg-[#FFF1B8] px-3 py-2.5 text-[13px] leading-[1.7] text-foreground">
              {evidence.highlightedText}
            </div>

            <p className="mt-4 text-[12.5px] leading-[1.9] text-foreground/85">
              操作人员(包括监护人)应了解操作目的和操作顺序。对指令有疑问时应向发令人询问清楚无误后执行。发令人、受令人、操作人员(包括监护人)均应具备相应资质。
            </p>

            {leafNum && (
              <>
                <h5 className="mt-6 text-[14px] font-semibold text-foreground leading-7">
                  {leafNum.replace(/(\d+)$/, (n) => String(Number(n) + 1))} 与本条相关的其他执行要求
                </h5>
                <p className="mt-2 text-[12.5px] leading-[1.9] text-foreground/85">
                  现场应结合监控系统实际状态、设备运行方式与调度命令综合判断,严格按照规程及现场运行细则执行,严禁简化操作步骤或越权操作。
                </p>
              </>
            )}

            <div className="mt-10 flex items-center justify-between border-t border-border/40 pt-3 text-[10.5px] text-slate-500">
              <span>{evidence.standardNo}</span>
              <span>发布时间:{evidence.publishDate}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-border/40 px-9 py-3 text-[11.5px] text-muted-foreground">
            <button className="grid h-6 w-6 place-items-center rounded-md border border-border bg-background hover:bg-muted">
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span>第</span>
            <span className="rounded border border-border bg-background px-2 py-0.5 text-foreground">{evidence.pageCurrent}</span>
            <span>页 / 共 {evidence.pageTotal} 页</span>
            <button className="grid h-6 w-6 place-items-center rounded-md border border-border bg-background hover:bg-muted">
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function RightSidebar({
  mode,
  setMode,
  scenarioTitle,
  evidence,
}: {
  mode: "chat" | "source";
  setMode: (m: "chat" | "source") => void;
  scenarioTitle: string;
  evidence?: Evidence;
}) {
  return (
    <aside
      className={`sticky top-20 flex h-[calc(100vh-7rem)] shrink-0 flex-col overflow-hidden ${scenarioResultBlockClass} transition-[width] duration-200 ${
        mode === "source" ? "w-[560px]" : "w-[380px]"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {mode === "chat" ? (
            <MessagesSquare className="h-4 w-4 text-primary" />
          ) : (
            <BookOpen className="h-4 w-4 text-primary" />
          )}
          <h3 className="text-[14px] font-semibold tracking-tight">{mode === "chat" ? "会话" : "原文引用"}</h3>
        </div>
        <button
          onClick={() => setMode(mode === "chat" ? "source" : "chat")}
          className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary-soft/40 hover:text-primary"
          title={mode === "chat" ? "切换到原文引用" : "切换回会话"}
          aria-label={mode === "chat" ? "切换到原文引用" : "切换回会话"}
        >
          {mode === "chat" ? <ArrowLeftRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
      {mode === "chat" ? (
        <ChatPanel scenarioTitle={scenarioTitle} />
      ) : (
        <SourcePanel evidence={evidence ?? EVIDENCES[0]} />
      )}
    </aside>
  );
}

// ---------- Main page ----------

function TypicalResult() {
  const { scenario } = Route.useLoaderData() as { scenario: ScenarioTemplate };
  const { saveScenarioFavorite, pushRecentScenario } = useMockStore();

  // Default to chat per spec
  const [mode, setMode] = useState<"chat" | "source">("chat");
  const [evId, setEvId] = useState<string | undefined>(undefined);
  

  useEffect(() => {
    pushRecentScenario(scenario.id);
  }, [scenario.id, pushRecentScenario]);

  const pickEvidence = (id: string) => {
    setEvId(id);
    
    setMode("source");
    // scroll the evidence card into view
    setTimeout(() => {
      document.getElementById(`ev-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const activeEvidence = useMemo(() => EVIDENCES.find((e) => e.id === evId), [evId]);

  const onFavorite = () => {
    saveScenarioFavorite({
      scenarioId: scenario.id,
      title: scenario.title,
      kind: "typical",
    });
    toast.success("已收藏当前场景结果");
  };

  return (
    <PageShell>
      <ScenarioBreadcrumb
        items={[
          { label: "场景训练", to: "/scenario" },
          { label: "典型操作训练", to: "/scenario/typical" },
          { label: "智能辅助结果" },
        ]}
      />

      {/* Title block */}
      <div className={`mt-3 ${scenarioResultBlockClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold tracking-tight text-foreground">220kV #1 主变停役典型操作辅助</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              生成时间:2026-03-31 11:30 ·
              系统根据所选设备、任务类型、参考场景和依据资料自动生成,仅用于培训学习与操作理解参考。
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CONDITIONS.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary-soft/50 px-2 py-0.5 text-[11.5px]"
                >
                  <span className="text-muted-foreground">{c.label}:</span>
                  <span className="font-medium text-primary">{c.value}</span>
                </span>
              ))}
            </div>
          </div>
          <HeaderActions onFavorite={onFavorite} />
        </div>
      </div>

      {/* Safety banner */}
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft/50 px-4 py-2.5 text-[12.5px] leading-5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
        <div>
          <span className="font-medium text-warning-foreground">安全边界提示:</span>
          <span className="ml-1 text-foreground/85">
            本系统结论仅用于培训学习与依据查阅,不构成正式调度命令、操作票或事故定性结论。执行前请务必校核监控系统实际状态。
          </span>
        </div>
      </div>

      {/* Two-column main body */}
      <div className="mt-4 flex gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <ScopeCard />
          <StepsCard onPickEvidence={pickEvidence} />

          <div className="grid gap-4 lg:grid-cols-2">
            <RiskCard />
            <StopReportCard />
          </div>

          <EvidenceListCard activeId={evId} onPick={pickEvidence} />
        </div>

        <RightSidebar
          mode={mode}
          setMode={setMode}
          scenarioTitle={scenario.title}
          evidence={activeEvidence}
        />
      </div>
    </PageShell>
  );
}
