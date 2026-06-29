import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Star, Pencil, RefreshCw, Download, Info, AlertTriangle, AlertOctagon,
  BookOpen, FileText, MessagesSquare, Send, ChevronLeft, ChevronRight,
  Sparkles, Bot, ArrowLeftRight, ListChecks, ShieldAlert, Activity,
  Workflow, CheckCircle2, XCircle, History, ChevronDown, Hexagon,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { ScenarioBreadcrumb, scenarioResultBlockClass, scenarioResultInnerBlockClass, ScenarioSectionHeader } from "@/components/scenario/parts";

export const Route = createFileRoute("/scenario/sootblow/result/$id")({
  component: SootblowResult,
  head: () => ({ meta: [{ title: "深度调峰低负荷吹灰风险分析辅助 · 涉网运行 AI 智能训练平台" }] }),
});

// ============= 数据 =============
const TAGS = [
  { label: "机组容量", value: "600MW" },
  { label: "锅炉类型", value: "W型锅炉" },
  { label: "当前负荷", value: "30%~40%" },
  { label: "任务类型", value: "低负荷吹灰" },
];
const FOCUS_RISKS = ["炉膛负压", "结焦/垮灰", "火检信号", "SCR入口烟温", "炉膛压力保护"];

const SCOPE_ITEMS: { kind: "apply" | "notApply"; text: string }[] = [
  { kind: "apply", text: "机组处于低负荷或深度调峰运行状态。" },
  {
    kind: "apply",
    text: "锅炉计划执行吹灰,或吹灰过程中需关注炉膛负压、火检、积灰结焦等参数变化。",
  },
  { kind: "apply", text: "运行人员需要学习低负荷稳燃边界、吹灰扰动影响和异常复核框架。" },
  {
    kind: "notApply",
    text: "不用于判断本厂机组最低稳燃负荷边界,须以本厂深调试验报告、运行规程为准。",
  },
];

const CHAIN_NODES: { text: string; tone?: "warn" | "danger" }[] = [
  { text: "深度调峰低负荷" },
  { text: "燃料/风量减少,炉膛温度下降,着火稳定性减弱", tone: "warn" },
  { text: "燃烧稳定裕度降低", tone: "warn" },
  { text: "吹灰扰动 + 受热面积灰/结焦变化", tone: "warn" },
  { text: "烟气流动与炉膛负压波动加剧", tone: "warn" },
  { text: "火检信号波动 / 氧量异常 / 燃烧恶化", tone: "danger" },
  { text: "锅炉燃烧不稳定或保护动作风险上升", tone: "danger" },
];

const CHECKLIST = [
  { no: 1, name: "当前负荷与深调吹灰边界核查", desc: "核查机组是否处于本厂深调试验认定的低负荷区间,并确认当前负荷率满足吹灰操作边界与稳燃要求", refs: ["依据-03"] },
  { no: 2, name: "燃烧状态与炉膛参数持续监视", desc: "重点监视火检信号、炉膛负压/炉膛压力、氧量变化及燃烧器运行状态是否持续稳定", refs: ["依据-05"] },
  { no: 3, name: "制粉系统运行方式与参数检查", desc: "检查磨煤机组合方式、一次风量/风压、煤粉细度及石子煤排放是否符合深调运行要求", refs: ["依据-06", "依据-11"] },
  { no: 4, name: "吹灰条件与积灰结焦风险评估", desc: "评估受热面积灰与结焦严重程度,判断吹灰操作是否会造成明显燃烧扰动或负压波动", refs: ["依据-13", "依据-17"] },
  { no: 5, name: "风烟系统调节能力与运行裕度", desc: "核查引风机、送风机、一次风机运行参数及调节裕度能否支撑低负荷吹灰扰动", refs: ["依据-18"] },
  { no: 6, name: "环保参数与SCR入口烟温监视", desc: "关注SCR入口烟温、NOx、氨逃逸及空预器阻力/堵塞趋势是否在深调允许范围", refs: ["依据-07", "依据-15", "依据-16"] },
  { no: 7, name: "保护逻辑投运与MFT状态确认", desc: "确认MFT、炉膛压力保护及火检相关逻辑投运正常,保护信号无异常闭锁或误动", refs: ["依据-08", "依据-09"] },
];

const RISK_FORBID_ITEMS = [
  {
    tag: "高风险",
    tone: "high" as const,
    title: "低负荷稳燃裕度下降",
    desc: "负荷降低使炉温、着火区温度下降,危及着火稳定性,甚至造成灭火,吹灰前应重点评估稳燃裕度。",
    refs: ["依据-10"],
  },
  {
    tag: "高风险",
    tone: "high" as const,
    title: "吹灰扰动叠加燃烧不稳",
    desc: "吹灰与排污、打焦同属干扰工况,深调过程抗干扰能力差,易引发火检波动与负压异常。",
    refs: ["依据-01", "依据-11"],
  },
  {
    tag: "易错点",
    tone: "warn" as const,
    title: "炉膛负压/火检边界判断",
    desc: "低负荷下炉内负压波动加剧,易将短时扰动误判为可继续吹灰,应结合导则边界综合判定。",
    refs: ["依据-05", "依据-14"],
  },
  {
    tag: "禁止项",
    tone: "forbid" as const,
    title: "火检异常时继续推进吹灰",
    desc: "火检持续异常、炉膛负压/压力明显波动时,严禁按常规节奏继续吹灰或扩大吹灰范围。",
    refs: ["依据-01", "依据-05"],
  },
  {
    tag: "禁止项",
    tone: "forbid" as const,
    title: "未核查燃烧稳定即盲目吹灰",
    desc: "未确认燃烧稳定、火检与炉膛负压正常时,不得盲目扩大吹灰范围或连续推进吹灰操作。",
    refs: ["依据-04", "依据-05"],
  },
];

const STOP_RULES = [
  "操作时出现吹灰设备卡涩、风烟系统调节异常或炉膛参数明显波动等设备异常",
  "监控系统报警、保护动作信号、设备异常声响或火检/氧量突变等异常征象",
  "发现操作票错误、吹灰步骤与现场实际运行方式不符或深调边界判断存疑",
];

const REPORT_TARGETS = [
  {
    title: "立即向值班调度员汇报:",
    content: "操作名称、执行进度、异常现象、设备状态、已采取措施",
  },
  {
    title: "同时向站内负责人汇报:",
    content: "现场情况、人员状态、设备受损情况初步判断",
  },
];

type Evidence = {
  id: string; type: string; title: string; doc: string; section: string;
  excerpt: string; standardNo: string; publishDate: string; pageCurrent: number; pageTotal: number;
};

const EVIDENCES: Evidence[] = [
  { id: "依据-01", type: "导则", title: "吹灰属于干扰工况", doc: "DLT+2993—2025燃煤发电机组深度调峰能力评估试验导则.pdf", section: "§6.2.7", excerpt: "试验期间不进行排污、吹灰、打焦等干扰试验工况的操作。", standardNo: "DL/T 2993—2025", publishDate: "2025-03-01", pageCurrent: 12, pageTotal: 86 },
  { id: "依据-02", type: "导则", title: "深调低负荷稳定运行要求", doc: "DLT+2927—2025+火力发电机组调频调峰动态特性测试技术导则.pdf", section: "§3 目的段", excerpt: "保持电力系统频率稳定;深度调峰要求火电机组能够在低负荷稳定运行。", standardNo: "DL/T 2927—2025", publishDate: "2025-02-15", pageCurrent: 4, pageTotal: 72 },
  { id: "依据-03", type: "导则", title: "试验前主要测点检查", doc: "DL_T+2497—2022+燃煤机组锅炉深度调峰能力评估试验导则.pdf", section: "§4.2.3", excerpt: "试验前,应检查锅炉燃烧器火检、一次风速、运行氧量、排烟温度、炉膛压力等主要测点。", standardNo: "DL/T 2497—2022", publishDate: "2022-09-01", pageCurrent: 9, pageTotal: 64 },
  { id: "依据-04", type: "导则", title: "试验期间禁止吹灰", doc: "DL_T+2497—2022+燃煤机组锅炉深度调峰能力评估试验导则.pdf", section: "§4.2.6", excerpt: "试验期间不允许进行排污、吹灰、打焦等干扰试验工况的操作。", standardNo: "DL/T 2497—2022", publishDate: "2022-09-01", pageCurrent: 10, pageTotal: 64 },
  { id: "依据-05", type: "导则", title: "燃烧稳定性判定", doc: "DLT+2993—2025燃煤发电机组深度调峰能力评估试验导则.pdf", section: "§7.1.4.2", excerpt: "非启停磨组或吹灰等扰动工况下,锅炉炉膛负压波动不大于±300Pa;投运磨煤机无任一火检开关量为0,或火检模拟量低于50%且持续超过5s。", standardNo: "DL/T 2993—2025", publishDate: "2025-03-01", pageCurrent: 21, pageTotal: 86 },
  { id: "依据-06", type: "导则", title: "制粉系统与空预器", doc: "DLT+2993—2025燃煤发电机组深度调峰能力评估试验导则.pdf", section: "§7.1.4.3", excerpt: "制粉系统运行参数正常;空预器烟气侧阻力在合理范围内,不宜超过额定值的 1.5 倍。", standardNo: "DL/T 2993—2025", publishDate: "2025-03-01", pageCurrent: 22, pageTotal: 86 },
  { id: "依据-07", type: "导则", title: "SCR 连续投入条件", doc: "DLT+2993—2025燃煤发电机组深度调峰能力评估试验导则.pdf", section: "§7.1.4.5", excerpt: "脱硝入口烟温在保护退出温度范围内;脱硝出口 NOx 等参数满足设计要求。", standardNo: "DL/T 2993—2025", publishDate: "2025-03-01", pageCurrent: 24, pageTotal: 86 },
  { id: "依据-08", type: "导则", title: "MFT 保护评估", doc: "DLT+2993—2025燃煤发电机组深度调峰能力评估试验导则.pdf", section: "§7.1.5.2", excerpt: "在深度调峰运行区间,应针对锅炉主燃料跳闸 MFT 系统、ETS 系统及重要辅机保护的合理性进行评估。", standardNo: "DL/T 2993—2025", publishDate: "2025-03-01", pageCurrent: 27, pageTotal: 86 },
  { id: "依据-09", type: "导则", title: "深调边界判定", doc: "DL_T+2497—2022+燃煤机组锅炉深度调峰能力评估试验导则.pdf", section: "§5.3.7", excerpt: "火检异常或炉膛负压波动幅度大于300Pa且持续时间超过5s,可作为深调边界判定参考。", standardNo: "DL/T 2497—2022", publishDate: "2022-09-01", pageCurrent: 18, pageTotal: 64 },
  { id: "依据-10", type: "技术分析", title: "低负荷着火稳定性机理", doc: "火电厂燃煤锅炉低负荷稳燃技术分析.docx", section: "§110", excerpt: "运行时锅炉负荷降低,炉温降低,着火区温度也降低,低到一定程度时,就将危及着火稳定性,甚至造成灭火。", standardNo: "内部技术分析", publishDate: "2023-08-20", pageCurrent: 11, pageTotal: 32 },
  { id: "依据-11", type: "技术分析", title: "深调低负荷燃烧特性", doc: "630 MW机组W型锅炉深度调峰过程燃烧恶化分析及稳燃措施.docx", section: "§14", excerpt: "锅炉深度调峰过程中,抗干扰能力差;低负荷下煤粉着火困难、着火点后移,将使燃烧稳定性下降。", standardNo: "内部技术分析", publishDate: "2024-01-12", pageCurrent: 3, pageTotal: 28 },
  { id: "依据-12", type: "技术分析", title: "燃烧恶化典型特征", doc: "630 MW机组W型锅炉深度调峰过程燃烧恶化分析及稳燃措施.docx", section: "§34", excerpt: "局部燃烧恶化,伴随氧量突升、主汽压下降等,运行人员发现异常及时采取投油稳燃操作尤为重要。", standardNo: "内部技术分析", publishDate: "2024-01-12", pageCurrent: 7, pageTotal: 28 },
  { id: "依据-13", type: "技术分析", title: "低负荷积灰与吹灰", doc: "1050MW超超临界锅炉屏式过热器超温分析及故障解决.docx", section: "§33、§49", excerpt: "低负荷烟气量较少时,烟气流速下降致使水平烟道底部积灰;受热面结焦会影响传热,良好的吹灰效果可改善受热面状态。", standardNo: "内部技术分析", publishDate: "2023-11-04", pageCurrent: 9, pageTotal: 24 },
  { id: "依据-14", type: "技术分析", title: "低负荷负压波动与燃烧不稳定", doc: "燃煤机组锅炉深度调峰性能计算分析.pdf", section: "§88", excerpt: "炉内负压波动加剧,容易发生燃烧不稳定。", standardNo: "内部技术分析", publishDate: "2023-06-18", pageCurrent: 18, pageTotal: 45 },
  { id: "依据-15", type: "技术分析", title: "低负荷环保连锁风险", doc: "火电厂深度调峰对锅炉运行的影响.pdf", section: "§107-122", excerpt: "脱硝入口烟温常低于300℃,氨逃逸量增多,容易造成空预器堵塞。", standardNo: "内部技术分析", publishDate: "2023-04-09", pageCurrent: 23, pageTotal: 52 },
  { id: "依据-16", type: "管理规范", title: "深调 SCR 低温应对", doc: "T+JSREA+05—2023+火电机组深度调峰运行管理规范.pdf", section: "§5.1 a)", excerpt: "深度调峰运行时若脱硝装置入口烟气温度达不到催化剂最低允许工作温度,可进行烟气旁路改造,提升烟温。", standardNo: "T/JSREA 05—2023", publishDate: "2023-07-01", pageCurrent: 16, pageTotal: 38 },
  { id: "依据-17", type: "管理规范", title: "积灰区域吹灰改造", doc: "T+JSREA+05—2023+火电机组深度调峰运行管理规范.pdf", section: "§4.2 e)", excerpt: "对于二次风箱处易积灰的锅炉,应在积灰严重区域增设吹灰设备或进行相关改造。", standardNo: "T/JSREA 05—2023", publishDate: "2023-07-01", pageCurrent: 12, pageTotal: 38 },
  { id: "依据-18", type: "管理规范", title: "炉膛负压调节与风机改造", doc: "T+JSREA+05—2023+火电机组深度调峰运行管理规范.pdf", section: "§4.2 i)", excerpt: "对于不能满足风量、炉膛负压等参数调节要求的风机,应进行变频、叶轮换型等技术改造。", standardNo: "T/JSREA 05—2023", publishDate: "2023-07-01", pageCurrent: 13, pageTotal: 38 },
  { id: "依据-19", type: "管理规范", title: "低负荷火检优化", doc: "T+JSREA+05—2023+火电机组深度调峰运行管理规范.pdf", section: "§4.2 d)", excerpt: "对锅炉火检进行优化改造,确保低负荷时火检能准确指示炉内燃烧情况。", standardNo: "T/JSREA 05—2023", publishDate: "2023-07-01", pageCurrent: 12, pageTotal: 38 },
];

const HISTORY_CASE: Evidence = {
  id: "案例-01", type: "历史案例", title: "低负荷吹灰垮灰导致炉膛负压低锅炉灭火事件",
  doc: "低负荷吹灰垮灰导致炉膛负压低锅炉灭火事件调查报告.docx", section: "事件经过 / 原因分析 / 教训",
  excerpt: "机组约 360MW 低负荷下进行炉膛吹灰,吹灰过程中炉膛负压大幅波动,折焰角区域吹灰时火焰电视变暗、MFT 动作。大量垮灰致炉膛上部灭火、烟气量骤减,炉膛压力低三值保护动作。",
  standardNo: "厂内事件调查报告", publishDate: "2022-10-12", pageCurrent: 5, pageTotal: 18,
};

// ============= 小组件 =============
function RefChip({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  return (
    <button
      onClick={() => onPick(id)}
      className="ml-1 inline-flex items-center rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15"
    >
      {id}
    </button>
  );
}

function HeaderActions({ onFavorite }: { onFavorite: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/scenario/peak" className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted">
        <Pencil className="h-3.5 w-3.5" /> 修改条件
      </Link>
      <button onClick={() => toast.success("已基于当前条件重新生成")} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted">
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

function SafetyBar() {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft/60 px-4 py-3 text-[12.5px] leading-6 text-foreground/85">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div>
        <span className="font-semibold text-foreground">安全边界提示:</span>
        本结果用于运行学习、场景复盘和依据查阅,不接入实时生产数据,不构成正式调度命令、操作票、事故定性结论或现场处置许可。涉及实际运行调整、保护投退、定值变更、设备退出等事项,应按现行制度履行审批和人工确认。
      </div>
    </div>
  );
}

function ScopeCard() {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <ScenarioSectionHeader
        icon={<Info className="h-4 w-4 text-primary" />}
        iconWrapClassName="bg-primary/10"
        title="适用场景说明"
      />
      <p className="mb-3 pl-[calc(1.75rem+0.625rem)] text-[12.5px] text-muted-foreground">
        本次识别的场景为:深度调峰低负荷运行下的锅炉吹灰风险分析。
      </p>
      <ul className="space-y-2.5 pl-[calc(1.75rem+0.625rem)]">
        {SCOPE_ITEMS.map((item, i) => (
          <li
            key={i}
            className={`flex gap-2.5 text-[13px] leading-6 ${
              item.kind === "apply" ? "text-foreground/90" : "text-[#C47A00]"
            }`}
          >
            <span className="flex h-6 w-4 shrink-0 items-center justify-center">
              {item.kind === "apply" ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-[#F5A623]" />
              )}
            </span>
            <span className="min-w-0 flex-1">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChainCard() {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <ScenarioSectionHeader
        icon={<Workflow className="h-4 w-4 text-primary" />}
        iconWrapClassName="bg-primary/10"
        title="风险链路识别"
      />
      <div className="overflow-x-auto rounded-[14px] border border-[#EEEFF2] bg-muted/30 p-4">
        <ol className="flex min-w-max items-center gap-1">
          {CHAIN_NODES.map((n, i) => (
            <li key={i} className="flex items-center">
              <div
                className={`w-[132px] shrink-0 rounded-lg border px-2.5 py-2 text-center text-[11.5px] leading-5 ${
                  n.tone === "danger"
                    ? "border-destructive/30 bg-destructive/[0.06] text-foreground"
                    : n.tone === "warn"
                      ? "border-warning/30 bg-warning-soft/40 text-foreground"
                      : "border-[#EEEFF2] bg-card text-foreground"
                }`}
              >
                {n.text}
              </div>
              {i < CHAIN_NODES.length - 1 && (
                <ChevronRight className="mx-0.5 h-4 w-4 shrink-0 text-muted-foreground/45" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ChecklistCard({ onPick }: { onPick: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <ScenarioSectionHeader
        icon={<ListChecks className="h-4 w-4 text-primary" />}
        iconWrapClassName="bg-primary/10"
        title="关键核查清单"
      />
      <ol className="space-y-2">
        {CHECKLIST.map((c) => (
          <li key={c.no} className={`${scenarioResultInnerBlockClass} flex items-center gap-3 p-3`}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[12.5px] font-semibold text-primary-foreground">
              {c.no}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">{c.name}</div>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground" title={c.desc}>
                {c.desc}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1">
              {c.refs.map((r) => (
                <RefChip key={r} id={r} onPick={onPick} />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RiskForbidCard({ onPick }: { onPick: (id: string) => void }) {
  const toneClass = {
    high: "border-destructive/25 bg-[#FFF5F5]",
    warn: "border-warning/30 bg-[#FFFBF0]",
    forbid: "border-[#DDE3EA] bg-[#F7F8FA]",
  };
  const tagClass = {
    high: "border-destructive/40 bg-destructive/10 text-destructive",
    warn: "border-warning/50 bg-warning-soft text-warning-foreground",
    forbid: "border-[#B0BEC5] bg-[#ECEFF1] text-[#546E7A]",
  };

  return (
    <section className={`${scenarioResultBlockClass} flex h-full min-h-[360px] flex-col p-5`}>
      <ScenarioSectionHeader
        icon={<AlertOctagon className="h-4 w-4 text-[#E53935]" />}
        iconWrapClassName="bg-[#FEECEC]"
        title="风险点与禁止项"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <ul className="space-y-2">
          {RISK_FORBID_ITEMS.map((item, i) => (
            <li key={i} className={`rounded-[14px] border p-3 ${toneClass[item.tone]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tagClass[item.tone]}`}>
                    {item.tag}
                  </span>
                  <div className="min-w-0 text-[13px] font-semibold text-foreground">{item.title}</div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {item.refs.map((id) => (
                    <RefChip key={id} id={id} onPick={onPick} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{item.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StopAndReportCard() {
  return (
    <section className={`${scenarioResultBlockClass} flex h-full min-h-[360px] flex-col p-5`}>
      <ScenarioSectionHeader
        icon={<Hexagon className="h-4 w-4 text-foreground" />}
        iconWrapClassName="bg-muted"
        title="异常停止与汇报提示"
      />
      <div className="space-y-4">
        <div>
          <div className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            遇以下情况应立即停止操作
          </div>
          <ul className="space-y-2">
            {STOP_RULES.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-6 text-foreground/90">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[14px] border border-[#EEEFF2] bg-[#F7F8FA] p-4">
          <div className="mb-3 text-[13px] font-semibold text-foreground">汇报对象与要点</div>
          <div className="space-y-3">
            {REPORT_TARGETS.map((item) => (
              <div key={item.title}>
                <div className="text-[12.5px] font-semibold text-foreground">{item.title}</div>
                <p className="mt-1 text-[12.5px] leading-6 text-muted-foreground">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HistoryCard({ onPick }: { onPick: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <ScenarioSectionHeader
        icon={<History className="h-4 w-4 text-[#2F80ED]" />}
        iconWrapClassName="bg-[#E8F1FD]"
        title="历史案例参考"
      />
      <p className="mb-3 pl-[calc(1.75rem+0.625rem)] text-[11.5px] leading-5 text-muted-foreground">
        以下为知识库中的他厂历史事件,用于培训复盘与风险联想,不构成对本厂的负荷边界、吹灰方案或处置指令。
      </p>
      <div className={`${scenarioResultInnerBlockClass} p-4`}>
        <div className="text-[13.5px] font-semibold text-foreground">{HISTORY_CASE.title}</div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">来源:{HISTORY_CASE.doc}</div>
        <dl className="mt-3 space-y-2 text-[12.5px] leading-6 text-foreground/85">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-medium">事件背景</dt>
            <dd>机组约 360MW 低负荷下进行炉膛吹灰。</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-medium">典型过程</dt>
            <dd>吹灰中炉膛负压大幅波动;折焰角区域吹灰时火焰电视变暗、MFT 动作。</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-medium">直接原因</dt>
            <dd>大量垮灰致炉膛上部灭火、烟气量骤减,炉膛压力低三值保护动作。</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-medium">管理教训</dt>
            <dd>吹灰负荷边界管理不足、异常后未充分评估仍继续吹灰、经验主义。</dd>
          </div>
        </dl>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onPick(HISTORY_CASE.id)}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
          >
            查看案例原文 <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </section>
  );
}

function EvidenceCard({ activeId, onPick }: { activeId?: string; onPick: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? EVIDENCES : EVIDENCES.slice(0, 4);

  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <ScenarioSectionHeader
        icon={<BookOpen className="h-4 w-4 text-primary" />}
        iconWrapClassName="bg-primary/10"
        title="原文依据"
        className="mb-1"
      />
      <p className="mb-4 pl-[calc(1.75rem+0.625rem)] text-[12px] text-muted-foreground">
        点击正文中的依据标签可定位到对应条目,并在右侧查看原文引用。
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {visible.map((e) => {
          const active = e.id === activeId;
          return (
            <div
              key={e.id}
              id={`ev-${e.id}`}
              className={`rounded-[14px] border p-3.5 transition-colors ${
                active ? "border-primary bg-primary-soft/40" : "border-[#EEEFF2] bg-background hover:border-primary/40"
              }`}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">{e.id}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{e.type}</span>
                <FileText className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-[12.5px] font-semibold">{e.title}</div>
              <p className="mt-1 line-clamp-2 text-[11.5px] leading-5 text-muted-foreground">
                {e.doc} · {e.section}
              </p>
              <button
                onClick={() => onPick(e.id)}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
              >
                查看依据 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
      {EVIDENCES.length > 4 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#EEEFF2] bg-background px-4 py-2 text-[12.5px] text-foreground/85 hover:bg-muted"
          >
            {expanded ? "收起依据" : `展开全部 ${EVIDENCES.length} 条依据`}
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
    </section>
  );
}

// ============= 右侧栏 =============
function ChatPanel() {
  const QUICK = ["查看依据 依据-05", "深调边界如何判定?", "异常后应如何汇报?"];
  const [input, setInput] = useState("");
  const [followups, setFollowups] = useState<{ q: string; a: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const send = (text: string) => {
    if (!text.trim()) return;
    setFollowups((arr) => [...arr, { q: text, a: `针对「${text}」的培训参考:请结合左侧风险链路、关键核查清单与原文依据综合理解,实际处置以本厂规程及值长指令为准。` }]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };
  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto px-4 py-4">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-[12.5px] leading-5 text-primary-foreground">
            机组处于深度调峰低负荷状态,当前负荷约 30%~40%,计划开展锅炉吹灰。请生成低负荷吹灰风险分析辅助,重点关注炉膛负压、结焦/垮灰、火检信号、SCR入口烟温和炉膛压力保护。
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Bot className="h-3.5 w-3.5" /></span>
          <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-muted/30 px-3 py-2.5">
            <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">正在思考</div>
            <ol className="space-y-1 text-[11.5px] leading-5 text-foreground/85">
              <li>1.解析场景需求:识别为深度调峰低负荷下的锅炉吹灰风险分析场景。</li>
              <li>2.抽取关键参数:600MW、W型锅炉、30%~40% 负荷、低负荷吹灰任务。</li>
              <li>3.检索知识库:匹配深度调峰、低负荷稳燃、吹灰扰动、炉膛负压、火检、SCR烟温等相关资料。</li>
              <li>4.识别风险链路:分析燃烧裕度、吹灰扰动、积灰结焦、负压波动与火检异常的关联。</li>
              <li>5.生成核查清单:整理 7 项关键核查项。</li>
              <li>6.关联原文依据:匹配规程、导则、技术分析和历史案例。</li>
            </ol>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Bot className="h-3.5 w-3.5" /></span>
          <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2.5">
            <div className="mb-1.5 text-[12px] font-medium">已为您生成低负荷吹灰风险分析辅助</div>
            <ul className="space-y-1 text-[11.5px] leading-5 text-foreground/85">
              <li>✅ 已完成深度调峰低负荷吹灰风险链路分析</li>
              <li>📋 已生成 7 项关键核查清单</li>
              <li>⚠️ 已识别低负荷稳燃、吹灰扰动、炉膛负压、火检、SCR烟温等重点风险</li>
              <li>📚 已关联 19 条主依据和 1 个历史案例</li>
              <li>💬 可继续追问某一风险点、核查项或查看对应原文</li>
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
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-[12.5px] leading-5 text-primary-foreground">{f.q}</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Sparkles className="h-3.5 w-3.5" /></span>
              <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2.5 text-[12px] leading-5 text-foreground/90">{f.a}</div>
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
            <div className="min-w-0 flex-1 text-[12.5px] font-semibold text-foreground">{evidence.doc}</div>
          </div>
          <div className="mt-2 flex items-start gap-2 text-[12px] text-foreground/80">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F5A623]" />
            <span>{evidence.section} · {evidence.title}</span>
          </div>
          <div className="mt-2 flex items-start gap-2 text-[12px] text-muted-foreground">
            <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>关联卡片:风险链路 / 关键核查清单 / 风险点 / 异常停止与汇报</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-muted/40 px-3 py-4">
        <div className="mx-auto rounded-md border border-border bg-white px-7 py-9 shadow-sm">
          <div className="mb-6 flex items-center justify-between text-[10.5px] text-slate-500">
            <span>{evidence.doc}</span>
            <span>{evidence.pageCurrent}</span>
          </div>
          <h4 className="mb-4 text-[14.5px] font-bold text-foreground">{evidence.section} {evidence.title}</h4>
          <div className="whitespace-pre-line rounded-sm bg-[#FFF1B8] px-2.5 py-2.5 text-[12.5px] leading-[1.7] text-foreground">
            {evidence.excerpt}
          </div>
          <p className="mt-3 text-[12px] leading-[1.8] text-foreground/85">
            以上摘录用于培训学习与依据查阅,实际运行执行口径请以本厂运行规程、深调试验报告和值长指令为准。
          </p>
          <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-3 text-[10.5px] text-slate-500">
            <span>{evidence.standardNo}</span>
            <span>发布时间:{evidence.publishDate}</span>
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

function RightSidebar({
  mode, setMode, evidence,
}: { mode: "chat" | "source"; setMode: (m: "chat" | "source") => void; evidence?: Evidence }) {
  return (
    <aside className={`sticky top-20 flex h-[calc(100vh-7rem)] shrink-0 flex-col overflow-hidden ${scenarioResultBlockClass} transition-[width] duration-200 ${mode === "source" ? "w-[560px]" : "w-[380px]"}`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {mode === "chat" ? <MessagesSquare className="h-4 w-4 text-primary" /> : <BookOpen className="h-4 w-4 text-primary" />}
          <h3 className="text-[14px] font-semibold tracking-tight">{mode === "chat" ? "会话" : "原文引用"}</h3>
        </div>
        <button
          onClick={() => setMode(mode === "chat" ? "source" : "chat")}
          className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary-soft/40 hover:text-primary"
          title={mode === "chat" ? "切换到原文引用" : "切换回会话"}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {mode === "chat" || !evidence ? <ChatPanel /> : <SourcePanel evidence={evidence} />}
    </aside>
  );
}

// ============= 主页面 =============
function SootblowResult() {
  const [mode, setMode] = useState<"chat" | "source">("chat");
  const [evId, setEvId] = useState<string | undefined>(undefined);

  const pickEvidence = (id: string) => {
    setEvId(id);
    setMode("source");
    setTimeout(() => document.getElementById(`ev-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };
  const activeEvidence = useMemo(
    () => (evId === HISTORY_CASE.id ? HISTORY_CASE : EVIDENCES.find((e) => e.id === evId)),
    [evId],
  );

  const onFavorite = () => toast.success("已收藏当前低负荷吹灰风险分析辅助");

  return (
    <PageShell>
      <ScenarioBreadcrumb
        items={[
          { label: "场景训练", to: "/scenario" },
          { label: "深度调峰场景", to: "/scenario/peak" },
          { label: "低负荷吹灰风险分析辅助" },
        ]}
      />

      {/* 顶部概览 */}
      <div className={`mt-3 ${scenarioResultBlockClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold tracking-tight">深度调峰低负荷吹灰风险分析辅助</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">生成时间:2026-06-22 10:30:00</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TAGS.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11.5px]">
                  <span className="text-muted-foreground">{t.label}:</span>
                  <span className="font-medium text-foreground">{t.value}</span>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11.5px] text-muted-foreground">关注风险:</span>
              {FOCUS_RISKS.map((r) => (
                <span key={r} className="rounded-md border border-destructive/25 bg-destructive/[0.06] px-2 py-0.5 text-[11px] font-medium text-destructive">
                  {r}
                </span>
              ))}
            </div>
          </div>
          <HeaderActions onFavorite={onFavorite} />
        </div>
      </div>

      <SafetyBar />

      {/* 主体 */}
      <div className="mt-4 flex gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <ScopeCard />
          <ChainCard />
          <ChecklistCard onPick={pickEvidence} />
          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            <RiskForbidCard onPick={pickEvidence} />
            <StopAndReportCard />
          </div>
          <HistoryCard onPick={pickEvidence} />
          <EvidenceCard activeId={evId} onPick={pickEvidence} />
        </div>
        <RightSidebar mode={mode} setMode={setMode} evidence={activeEvidence} />
      </div>
    </PageShell>
  );
}
