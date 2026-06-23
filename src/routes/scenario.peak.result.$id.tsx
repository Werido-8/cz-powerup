import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Star, Pencil, RefreshCw, Download, Info, AlertTriangle, AlertOctagon,
  BookOpen, FileText, MessagesSquare, Send, ChevronLeft, ChevronRight,
  Sparkles, Bot, ArrowLeftRight, ListChecks, Activity, Flame, Gauge,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { ScenarioBreadcrumb, scenarioResultBlockClass } from "@/components/scenario/parts";

export const Route = createFileRoute("/scenario/peak/result/$id")({
  component: PeakResult,
  head: () => ({ meta: [{ title: "深度调峰辅助结果 · 涉网运行能力智能支撑平台" }] }),
});

const TAGS = [
  { label: "机组容量", value: "660MW" },
  { label: "锅炉类型", value: "超超临界" },
  { label: "当前负荷", value: "30%~40%额定负荷" },
  { label: "调峰任务", value: "低负荷稳燃" },
];

const SCOPE = [
  "本次识别的调峰场景为 660MW 超超临界机组在 30%~40% 额定负荷下的低负荷稳燃任务",
  "不适用范围:循环流化床锅炉、机组启停过程及AGC受阻状态下的稳燃判断不适用",
  "本内容为深调辅助参考,不替代正式调度指令、运行规程和现场操作票,所有操作必须遵守现场规程并得到值班负责人许可。",
];

const STAGE = {
  title: "当前调峰阶段:低负荷稳燃监视与边界控制",
  goal: "在不投油的前提下维持锅炉稳定燃烧,守住环保排放和受热面温度边界。",
  prio: "1.稳定磨煤机出力组合; 2.监视炉膛负压与火检信号; 3.关注 SCR 入口烟温与 NOx 排放。",
  forbid: "本阶段禁止在火检信号波动或炉膛负压剧烈摆动期间进行吹灰或快速变负荷操作。",
};

const JUDGE_STEPS = [
  {
    no: 1, title: "判断当前稳燃裕度",
    desc: "结合负荷率、磨组合方式、油枪投退状态,综合判断当前稳燃裕度是否充足。",
    risk: "仅看负荷率不结合燃烧状态,可能误判稳燃能力,导致深调失稳",
    refId: "G01-003",
  },
  {
    no: 2, title: "核查火检与炉膛负压一致性",
    desc: "对照火检强度、火检失去、炉膛负压波动是否同步出现异常,识别局部熄火风险。",
    risk: "忽略火检与负压的耦合波动,可能错失熄火预警窗口",
    refId: "B07-012",
  },
  {
    no: 3, title: "评估环保系统边界",
    desc: "校核 SCR 入口烟温是否低于喷氨投运下限,以及 NOx、氨逃逸是否接近告警阈值。",
    risk: "低负荷下烟温下降使 SCR 失去喷氨条件,易出现 NOx 超限",
    refId: "G03-015",
  },
];

const HANDLING_STEPS = [
  { no: 1, title: "稳定燃烧工况", desc: "根据火检强度合理调整磨煤机出力与一次风量,必要时投油枪助燃,保持燃烧稳定。" },
  { no: 2, title: "加强参数监视与分析", desc: "重点监视主汽温度、再热汽温、炉膛负压、SCR 入口烟温与排放参数,关注趋势变化。" },
  { no: 3, title: "做好快速变负荷预案", desc: "提前确认 AGC 状态、煤种特性和磨组合预案,具备在调度指令下安全升降负荷的条件。" },
];

const RISKS = [
  { level: "high", title: "防止低负荷熄火", desc: "稳燃裕度不足时易发生局部熄火乃至 MFT,影响电网安全" },
  { level: "high", title: "守住环保边界", desc: "SCR 喷氨投运受烟温限制,低负荷下 NOx、氨逃逸易超标" },
  { level: "special", title: "深调吹灰风险", desc: "深调期间吹灰易引起炉膛负压剧烈波动和燃烧扰动,需谨慎安排" },
] as const;

const HISTORY = {
  title: "2024-12-18 某 660MW 机组 30% 负荷稳燃异常案例",
  past: "机组进入 30% 负荷段后,A、B 磨切换过程中出现火检强度下降、炉膛负压剧烈波动,运行人员未及时投油,导致部分火检失去,最终触发MFT。",
  lesson: "深调进入 30% 负荷段必须严格执行油枪助燃和磨组合预案,严禁在火检异常时继续推进负荷下行。",
};

type Evidence = {
  id: string; type: string; doc: string; summary: string;
  fileName: string; chapter: string; related: string;
  pageCurrent: number; pageTotal: number; paperTitle: string;
  highlightedText: string; bodyParagraphs: string[];
  standardNo: string; publishDate: string;
};

const EVIDENCES: Evidence[] = [
  {
    id: "G01-003", type: "规程制度", doc: "《火力发电机组深度调峰运行导则》第3.2.1条",
    summary: "深度调峰运行时应保证锅炉燃烧稳定,稳燃裕度不足时应及时投油助燃。",
    fileName: "火力发电机组深度调峰运行导则", chapter: "第3章 / 低负荷稳燃 / 3.2.1 稳燃判据",
    related: "关联卡片:核心判断思路 步骤1",
    pageCurrent: 18, pageTotal: 96,
    paperTitle: "3.2.1 稳燃判据",
    highlightedText: "进入深度调峰区段后,应综合负荷率、火检强度、磨煤机组合方式与煤质特性判断稳燃裕度,裕度不足时应及时投入油枪助燃。",
    bodyParagraphs: [
      "3.2.2 油枪投退应按照规程要求逐支投入,投运后应监视火检与油压稳定。",
      "3.2.3 严禁在火检波动或燃烧不稳定状态下进行降负荷操作。",
    ],
    standardNo: "DL/T 1872-2018", publishDate: "2018-12-01",
  },
  {
    id: "B07-012", type: "运行规程", doc: "《超超临界机组运行规程》第6.4.2条",
    summary: "低负荷工况下应加强对火检、炉膛负压与受热面温度的监视。",
    fileName: "超超临界机组运行规程", chapter: "第6章 / 低负荷运行 / 6.4.2 重点监视项",
    related: "关联卡片:核心判断思路 步骤2",
    pageCurrent: 64, pageTotal: 220,
    paperTitle: "6.4.2 低负荷工况重点监视项",
    highlightedText: "低负荷工况运行时,应重点监视火检强度、炉膛负压、主再热汽温及受热面壁温的变化趋势,出现异常应及时调整或申请退出深调。",
    bodyParagraphs: [
      "6.4.3 火检强度连续下降并伴随炉膛负压大幅摆动时,应立即投入油枪并暂缓降负荷。",
    ],
    standardNo: "Q/HD 1023-2020", publishDate: "2020-07-15",
  },
  {
    id: "G03-015", type: "环保规程", doc: "《燃煤电厂 SCR 脱硝系统运行规程》第4.3.2条",
    summary: "SCR 系统应在烟温高于喷氨最低投运温度的条件下投运。",
    fileName: "燃煤电厂 SCR 脱硝系统运行规程", chapter: "第4章 / 喷氨控制 / 4.3.2 投运温度",
    related: "关联卡片:核心判断思路 步骤3",
    pageCurrent: 27, pageTotal: 140,
    paperTitle: "4.3.2 喷氨投运温度",
    highlightedText: "SCR 入口烟温低于喷氨最低投运温度时,应立即停止喷氨,严禁低温喷氨以避免硫酸氢铵堵塞催化剂。",
    bodyParagraphs: [
      "4.3.3 深度调峰期间应提前预判烟温变化,合理控制磨组合方式以维持 SCR 投运温度。",
    ],
    standardNo: "DL/T 296-2018", publishDate: "2018-05-01",
  },
  {
    id: "P02-008", type: "保护配置", doc: "《锅炉MFT保护配置与整定》第5.1条",
    summary: "MFT 保护应在炉膛全火检失去或炉膛压力越限时可靠动作。",
    fileName: "锅炉MFT保护配置与整定", chapter: "第5章 / MFT动作判据 / 5.1 全火检失去",
    related: "关联卡片:风险点 防止低负荷熄火",
    pageCurrent: 31, pageTotal: 88,
    paperTitle: "5.1 全火检失去判据",
    highlightedText: "炉膛全火检失去或炉膛压力越限时,MFT 保护应可靠动作,跳开所有进入锅炉的燃料,防止事故扩大。",
    bodyParagraphs: [
      "5.2 油枪火检与煤层火检应分别参与判据,避免单一信号导致误动。",
    ],
    standardNo: "DL/T 5428-2009", publishDate: "2009-12-01",
  },
];

function HeaderActions({ onFavorite }: { onFavorite: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/scenario/peak" className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted">
        <Pencil className="h-3.5 w-3.5" /> 修改条件
      </Link>
      <button onClick={() => toast.success("已基于当前条件重新生成深调辅助")} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted">
        <RefreshCw className="h-3.5 w-3.5" /> 重新生成
      </button>
      <button onClick={onFavorite} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary-soft/60 px-3 py-1.5 text-[12.5px] font-medium text-primary hover:bg-primary-soft">
        <Star className="h-3.5 w-3.5 fill-primary" /> 收藏
      </button>
      <button onClick={() => toast.message("已导出为 PDF(占位)")} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">
        <Download className="h-3.5 w-3.5" /> 导出
      </button>
    </div>
  );
}

function ScopeCard() {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-[#2F80ED]" />
        <h3 className="text-[15px] font-semibold tracking-tight">适用场景说明</h3>
      </header>
      <ul className="space-y-2 text-[13px] leading-6">
        {SCOPE.map((t, i) => (
          <li key={i} className="flex items-start gap-2">
            {i === 0 ? <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> :
             i === 1 ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" /> :
             <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2F80ED]" />}
            <span className="text-foreground/90">{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StageCard() {
  return (
    <section className="rounded-lg border border-warning/40 bg-warning-soft/40 p-5">
      <header className="mb-3 flex items-center gap-2">
        <Flame className="h-4 w-4 text-warning-foreground" />
        <h3 className="text-[15px] font-semibold tracking-tight text-warning-foreground">{STAGE.title}</h3>
      </header>
      <dl className="space-y-2 text-[12.5px] leading-6">
        <div className="flex gap-3"><dt className="w-16 shrink-0 font-medium">阶段目标:</dt><dd className="text-foreground/85">{STAGE.goal}</dd></div>
        <div className="flex gap-3"><dt className="w-16 shrink-0 font-medium">优先事项:</dt><dd className="text-foreground/85">{STAGE.prio}</dd></div>
        <div className="flex gap-3"><dt className="w-16 shrink-0 font-medium">禁止动作:</dt><dd className="text-foreground/85">{STAGE.forbid}</dd></div>
      </dl>
    </section>
  );
}

function JudgeCard({ onPickEvidence }: { onPickEvidence: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-1 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">核心判断思路</h3>
      </header>
      <p className="mb-3 text-[12px] text-muted-foreground">应优先判断稳燃裕度、火检与炉膛负压一致性、环保边界,避免低负荷下出现燃烧失稳或环保超标。</p>
      <ol className="space-y-2.5">
        {JUDGE_STEPS.map((s) => (
          <li key={s.no} className="rounded-lg border border-border bg-background p-3.5">
            <div className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[12.5px] font-semibold text-primary-foreground">{s.no}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{s.title}</div>
                <p className="mt-1 text-[12.5px] leading-6 text-muted-foreground">{s.desc}</p>
                <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-5 text-destructive/90">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>误判风险:{s.risk}</span>
                </p>
              </div>
              <button onClick={() => onPickEvidence(s.refId)} className="ml-2 inline-flex shrink-0 items-center gap-1 self-start rounded-md border border-primary/30 bg-primary-soft/60 px-2 py-1 text-[11.5px] font-medium text-primary hover:bg-primary-soft" title="查看依据原文">
                依据:{s.refId}<FileText className="h-3 w-3" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HandlingCard() {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-warning-foreground" />
        <h3 className="text-[15px] font-semibold tracking-tight">参考处置思路</h3>
      </header>
      <ol className="space-y-2">
        {HANDLING_STEPS.map((s) => (
          <li key={s.no} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-start gap-2">
              <span className="inline-flex shrink-0 items-center rounded bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">步骤{s.no}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">{s.title}</div>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RiskCard() {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 text-destructive" />
        <h3 className="text-[15px] font-semibold tracking-tight">风险点与注意事项</h3>
      </header>
      <ul className="space-y-2">
        {RISKS.map((r, i) => {
          const isSpecial = r.level === "special";
          return (
            <li key={i} className={`rounded-lg border p-3 ${isSpecial ? "border-warning/40 bg-warning-soft/40" : "border-destructive/25 bg-destructive/[0.04]"}`}>
              <div className="flex items-start gap-2">
                <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${isSpecial ? "border-warning/50 bg-warning-soft text-warning-foreground" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                  {isSpecial ? "特殊情况" : "高风险"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">{r.title}</div>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HistoryCard({ onPickEvidence }: { onPickEvidence: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#2F80ED]" />
        <h3 className="text-[15px] font-semibold tracking-tight">历史案例参考</h3>
      </header>
      <div className="rounded-lg border border-[#2F80ED]/30 bg-[#2F80ED]/[0.04] p-4">
        <div className="text-[13.5px] font-semibold">{HISTORY.title}</div>
        <div className="mt-2 text-[12.5px] leading-6">
          <div className="font-medium">事件经过:</div>
          <p className="text-muted-foreground">{HISTORY.past}</p>
          <div className="mt-2 font-medium">经验教训:</div>
          <p className="text-muted-foreground">{HISTORY.lesson}</p>
        </div>
        <div className="mt-2 flex justify-end">
          <button onClick={() => onPickEvidence("P02-008")} className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
            查看详情 <ChevronRight className="h-3 w-3" />
          </button>
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
      <p className="mb-4 text-[12px] text-muted-foreground">点击正文中的依据标签可定位到对应条目</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {EVIDENCES.map((e) => {
          const active = e.id === activeId;
          return (
            <div key={e.id} id={`ev-${e.id}`} className={`rounded-lg border p-4 transition-colors ${active ? "border-primary bg-primary-soft/40" : "border-border bg-background hover:border-primary/40"}`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">{e.id}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{e.type}</span>
                <FileText className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-[13px] font-semibold">{e.doc}</div>
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{e.summary}</p>
              <button onClick={() => onPick(e.id)} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
                查看全文 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChatPanel() {
  const QUICK = ["最低稳燃负荷怎么判定?", "SCR 投运温度卡在多少?", "查看依据 P02-008"];
  const [input, setInput] = useState("");
  const [followups, setFollowups] = useState<{ q: string; a: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const send = (text: string) => {
    if (!text.trim()) return;
    setFollowups((arr) => [...arr, { q: text, a: `针对「${text}」的培训参考:请结合左侧核心判断思路与原文依据综合理解,实际运行以现场规程和调度命令为准。` }]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };
  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto px-4 py-4">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-[12.5px] leading-5 text-primary-foreground">
            660MW 超超临界机组目前负荷在 35% 附近运行,计划继续向下深调到 30%,请生成低负荷稳燃的辅助方案。
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Bot className="h-3.5 w-3.5" /></span>
          <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-muted/30 px-3 py-2.5">
            <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">正在思考</div>
            <ol className="space-y-1 text-[11.5px] leading-5 text-foreground/85">
              <li>1.解析场景特征:660MW 超超临界机组进入深度调峰低负荷段</li>
              <li>2.抽取关键参数:负荷率、磨组合、火检、炉膛负压、SCR 入口烟温</li>
              <li>3.检索知识库:匹配《深度调峰运行导则》《SCR 运行规程》</li>
              <li>4.分析风险:稳燃裕度、熄火风险、环保边界</li>
              <li>5.生成辅助建议:给出稳燃判据、监视要点、变负荷预案</li>
              <li>6.关联依据:匹配相关规程条款与历史案例</li>
            </ol>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Bot className="h-3.5 w-3.5" /></span>
          <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2.5">
            <div className="mb-1.5 text-[12px] font-medium">已为您生成深调辅助方案</div>
            <ul className="space-y-1 text-[11.5px] leading-5 text-foreground/85">
              <li>✅ 已完成 660MW 机组低负荷稳燃辅助方案生成</li>
              <li>📋 已识别 3 项核心判断思路与 3 项处置步骤</li>
              <li>⚠️ 已识别 3 项风险点</li>
              <li>📚 关联 4 份规程依据,可在下方原文依据区查看</li>
            </ul>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="h-7 w-7 shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)} className="rounded-md border border-border bg-background px-2 py-1 text-[11.5px] text-foreground/85 hover:border-primary/40 hover:bg-primary-soft/40">{q}</button>
            ))}
          </div>
        </div>
        {followups.map((f, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end"><div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-[12.5px] leading-5 text-primary-foreground">{f.q}</div></div>
            <div className="flex items-start gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Sparkles className="h-3.5 w-3.5" /></span>
              <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2.5 text-[12px] leading-5">{f.a}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border bg-background/60 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder="输入问题继续追问.."
            className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
          <button onClick={() => send(input)} className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

function SourcePanel({ evidence }: { evidence: Evidence }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-card px-5 py-4">
        <div className="rounded-md bg-[#F7F9FA] p-4">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#2F80ED]" />
            <div className="min-w-0 flex-1 text-[12.5px] font-semibold">{evidence.fileName}</div>
          </div>
          <div className="mt-2 flex items-start gap-2 text-[12px] text-foreground/80">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F5A623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>{evidence.chapter}</span>
          </div>
          <div className="mt-2 flex items-start gap-2 text-[12px] text-foreground/80">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>{evidence.related}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-muted/40 px-3 py-4">
        <div className="mx-auto rounded-md border border-border bg-white px-7 py-9 shadow-sm">
          <div className="mb-6 flex items-center justify-between text-[10.5px] text-slate-500">
            <span>{evidence.fileName}</span><span>{evidence.pageCurrent}</span>
          </div>
          <h4 className="mb-4 text-[14.5px] font-bold">{evidence.paperTitle}</h4>
          <div className="whitespace-pre-line rounded-sm bg-[#FFF1B8] px-2.5 py-2.5 text-[12.5px] leading-[1.7]">{evidence.highlightedText}</div>
          {evidence.bodyParagraphs.map((p, i) => (
            <p key={i} className="mt-3 whitespace-pre-line text-[12px] leading-[1.8] text-foreground/85">{p}</p>
          ))}
          <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-3 text-[10.5px] text-slate-500">
            <span>{evidence.standardNo}</span><span>发布时间:{evidence.publishDate}</span>
          </div>
        </div>
        <div className="mx-auto mt-3 flex items-center justify-center gap-2 text-[11.5px] text-muted-foreground">
          <button className="grid h-6 w-6 place-items-center rounded-md border border-border bg-background hover:bg-muted"><ChevronLeft className="h-3 w-3" /></button>
          <span>第</span>
          <span className="rounded border border-border bg-background px-2 py-0.5 text-foreground">{evidence.pageCurrent}</span>
          <span>页 / 共 {evidence.pageTotal} 页</span>
          <button className="grid h-6 w-6 place-items-center rounded-md border border-border bg-background hover:bg-muted"><ChevronRight className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
}

function RightSidebar({ mode, setMode, evidence }: { mode: "chat" | "source"; setMode: (m: "chat" | "source") => void; evidence?: Evidence }) {
  return (
    <aside className={`sticky top-20 flex h-[calc(100vh-7rem)] shrink-0 flex-col overflow-hidden ${scenarioResultBlockClass} transition-[width] duration-200 ${mode === "source" ? "w-[560px]" : "w-[380px]"}`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {mode === "chat" ? <MessagesSquare className="h-4 w-4 text-primary" /> : <BookOpen className="h-4 w-4 text-primary" />}
          <h3 className="text-[14px] font-semibold tracking-tight">{mode === "chat" ? "会话" : "原文引用"}</h3>
        </div>
        <button onClick={() => setMode(mode === "chat" ? "source" : "chat")} className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary-soft/40 hover:text-primary" aria-label={mode === "chat" ? "切换到原文引用" : "切换回会话"} title={mode === "chat" ? "切换到原文引用" : "切换回会话"}>
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {mode === "chat" || !evidence ? <ChatPanel /> : <SourcePanel evidence={evidence} />}
    </aside>
  );
}

function PeakResult() {
  const [mode, setMode] = useState<"chat" | "source">("chat");
  const [evId, setEvId] = useState<string | undefined>(undefined);
  const pickEvidence = (id: string) => {
    setEvId(id);
    setMode("source");
    setTimeout(() => document.getElementById(`ev-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };
  const activeEvidence = useMemo(() => EVIDENCES.find((e) => e.id === evId), [evId]);
  const onFavorite = () => toast.success("已收藏当前深调辅助结果");

  return (
    <PageShell>
      <ScenarioBreadcrumb
        items={[
          { label: "场景训练", to: "/scenario" },
          { label: "深度调峰业务辅助", to: "/scenario/peak" },
          { label: "深调辅助结果" },
        ]}
      />

      <div className={`mt-3 ${scenarioResultBlockClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold tracking-tight">660MW 超超临界机组低负荷稳燃深调辅助</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">生成时间:2026-04-05 09:12:08</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TAGS.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11.5px]">
                  <span className="text-muted-foreground">{t.label}:</span>
                  <span className="font-medium text-foreground">{t.value}</span>
                </span>
              ))}
            </div>
          </div>
          <HeaderActions onFavorite={onFavorite} />
        </div>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <ScopeCard />
          <StageCard />
          <JudgeCard onPickEvidence={pickEvidence} />
          <div className="grid gap-4 lg:grid-cols-2">
            <HandlingCard />
            <RiskCard />
          </div>
          <HistoryCard onPickEvidence={pickEvidence} />
          <EvidenceListCard activeId={evId} onPick={pickEvidence} />
        </div>
        <RightSidebar mode={mode} setMode={setMode} evidence={activeEvidence} />
      </div>
    </PageShell>
  );
}
