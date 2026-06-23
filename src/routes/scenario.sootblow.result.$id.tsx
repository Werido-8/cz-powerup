import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Star, Pencil, RefreshCw, Download, Info, AlertTriangle, AlertOctagon,
  BookOpen, FileText, MessagesSquare, Send, ChevronLeft, ChevronRight,
  Sparkles, Bot, ArrowLeftRight, ListChecks, ShieldAlert, Activity,
  Workflow, CheckCircle2, XCircle, History, ChevronDown, Search,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { ScenarioBreadcrumb, scenarioResultBlockClass } from "@/components/scenario/parts";

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

const SCOPE_APPLY = [
  "机组处于低负荷或深度调峰运行状态。",
  "锅炉计划执行吹灰,或吹灰过程中需关注炉膛负压、火检、积灰结焦等参数变化。",
  "运行人员需要学习低负荷稳燃边界、吹灰扰动影响和异常复核框架。",
];
const SCOPE_NOT_APPLY = [
  "不用于直接生成现场操作票。",
  "不用于替代值长事故处理指令。",
  "不用于判断本厂机组最低稳燃负荷边界,须以本厂深调试验报告、运行规程为准。",
  "不将其他电厂历史案例直接套用于本厂。",
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

const CHAIN_TABLE = [
  { name: "低负荷燃烧裕度下降", desc: "负荷降低使炉温、着火区温度下降,危及着火稳定性,甚至造成灭火", ref: "依据-10" },
  { name: "低负荷抗扰能力差", desc: "深调过程中煤粉着火困难、着火点后移,燃烧稳定性下降", ref: "依据-11" },
  { name: "积灰与吹灰扰动", desc: "低负荷烟气流速下降致水平烟道底部积灰;受热面结焦影响传热,吹灰可改善受热面状态", ref: "依据-13" },
  { name: "炉膛负压波动加剧", desc: "低负荷工况下炉内负压波动加剧,易发生燃烧不稳定", ref: "依据-14" },
  { name: "判定参考边界", desc: "非启停磨组或吹灰等扰动工况下,炉膛负压波动不大于 ±300Pa;火检异常判定见关键核查清单", ref: "依据-05" },
];

const CHECKLIST = [
  { no: 1, name: "当前负荷", desc: "是否处于本厂深调试验认定的低负荷区间;是否满足本厂吹灰负荷边界", refs: ["依据-03"] },
  { no: 2, name: "燃烧状态", desc: "火检、炉膛负压/炉膛压力、氧量、燃烧器运行是否稳定", refs: ["依据-05"] },
  { no: 3, name: "制粉系统", desc: "磨煤机组合、一次风量/风压、煤粉细度、石子煤排放", refs: ["依据-06", "依据-11"] },
  { no: 4, name: "吹灰条件", desc: "是否存在积灰、结焦严重区域;吹灰是否会造成明显扰动", refs: ["依据-13", "依据-17"] },
  { no: 5, name: "风烟系统", desc: "引风机、送风机、一次风机参数及调节能力", refs: ["依据-18"] },
  { no: 6, name: "环保参数", desc: "SCR入口烟温、NOx、氨逃逸、空预器阻力/堵塞", refs: ["依据-07", "依据-15", "依据-16"] },
  { no: 7, name: "保护状态", desc: "MFT、炉膛压力保护、火检相关逻辑", refs: ["依据-08", "依据-09"] },
];

const CHECK_REF = [
  { name: "炉膛负压", desc: "非启停磨组或吹灰等扰动工况下,波动不大于 ±300Pa。", ref: "依据-05" },
  { name: "火检", desc: "投运磨煤机无任一火检开关量为 0,或火检模拟量低于 50% 且持续超过 5s。", ref: "依据-05" },
  { name: "深调边界参考", desc: "炉膛负压波动幅度大于 300Pa 且持续时间超过 5s,可作为最小技术出力调峰运行判定参考。", ref: "依据-09" },
  { name: "SCR烟温", desc: "脱硝入口烟温应在保护退出温度范围内;出口 NOx 满足设计要求。", ref: "依据-07" },
  { name: "综合判定", desc: "应从煤质、制粉系统参数、炉膛烟温、炉膛负压和火检参数综合分析。", ref: "依据-05" },
];

const RISKS = [
  { level: "高", title: "低负荷稳燃裕度下降", desc: "负荷降低使炉温、着火区温度下降,危及着火稳定性,甚至造成灭火。", refs: ["依据-10"] },
  { level: "高", title: "吹灰扰动叠加燃烧不稳", desc: "吹灰与排污、打焦同属干扰工况;深调过程抗干扰能力差。", refs: ["依据-01", "依据-11"] },
  { level: "高", title: "炉膛负压/压力异常", desc: "低负荷下炉内负压波动加剧;吹灰扰动下应重点监视负压。", refs: ["依据-05", "依据-14"] },
  { level: "中", title: "积灰结焦变化", desc: "低负荷烟气流速下降致积灰;煤质偏离时结焦严重风险上升。", refs: ["依据-13"] },
  { level: "中", title: "SCR入口烟温偏低", desc: "低负荷下入口烟温常低于 300℃,催化剂活性及脱硝效率下降。", refs: ["依据-15", "依据-16"] },
  { level: "中", title: "空预器堵塞/氨逃逸", desc: "低负荷下喷氨量难精确控制,氨逃逸增多,易造成空预器堵塞。", refs: ["依据-15"] },
];

const FORBIDS = [
  { type: "严禁", desc: "未确认燃烧稳定、火检与炉膛负压正常时,盲目扩大吹灰范围或连续推进。", refs: ["依据-01", "依据-04", "依据-05"] },
  { type: "严禁", desc: "火检持续异常、炉膛负压/压力明显波动时,仍按常规节奏继续吹灰。", refs: ["依据-05"] },
  { type: "慎用", desc: "低负荷下大幅调整风粉配比但不跟踪火检、氧量、炉膛负压。", refs: ["依据-12"] },
  { type: "慎用", desc: "仅凭经验判断积灰/垮灰风险,不结合本厂深调试验数据与当前趋势。", refs: ["依据-03"] },
];

const STOP_RULES = [
  { desc: "炉膛负压/炉膛压力波动超出本厂控制要求,或接近保护动作趋势。", refs: ["依据-05", "依据-09"] },
  { desc: "火检开关量为 0,或模拟量低于 50% 持续超过 5s。", refs: ["依据-05"] },
  { desc: "氧量突升、主汽压异常下降等燃烧恶化征象。", refs: ["依据-12"] },
  { desc: "吹灰过程中受热面参数、风烟系统、环保参数明显偏离深调试验边界。", refs: ["依据-07", "依据-15"] },
  { desc: "MFT、炉膛压力保护、重要辅机保护出现异常信号。", refs: ["依据-08"] },
];

const REPORT_ITEMS = [
  { name: "当前负荷与深调状态", point: "负荷率、是否处于本厂深调区间", refs: ["依据-02"] },
  { name: "吹灰计划与执行情况", point: "开始时间、区域、当前进度", refs: ["依据-01"] },
  { name: "炉膛负压/压力、火检、氧量", point: "是否超出导则参考边界", refs: ["依据-05"] },
  { name: "制粉与风烟系统", point: "磨煤机组合、一次风/引送风参数", refs: ["依据-11", "依据-18"] },
  { name: "环保参数", point: "SCR入口烟温、NOx、氨逃逸、空预器差压", refs: ["依据-07", "依据-15"] },
  { name: "已采取措施", point: "已暂停/调整/增投稳燃等,按本厂规程表述", refs: ["依据-12"] },
];

const TRIAL_TIPS = [
  { desc: "深调能力评估试验期间不应进行吹灰等干扰操作。", refs: ["依据-01", "依据-04"] },
  { desc: "深调运行应综合核查煤质、制粉系统参数、炉膛烟温、炉膛负压和火检参数。", refs: ["依据-05"] },
  { desc: "低负荷时火检应能准确指示炉内燃烧情况,必要时通过改造优化火检可靠性。", refs: ["依据-19"] },
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

const RAG_RESULTS = [
  { rank: 1, doc: "DLT+2993—2025燃煤发电机组深度调峰能力评估试验导则.pdf", hit: "§6.2.7、§7.1.4.2、§7.1.4.5", score: 0.92 },
  { rank: 2, doc: "DL_T+2497—2022+燃煤机组锅炉深度调峰能力评估试验导则.pdf", hit: "§4.2.3、§4.2.6、§5.3.7", score: 0.89 },
  { rank: 3, doc: "T+JSREA+05—2023+火电机组深度调峰运行管理规范.pdf", hit: "§4.2、§5.1", score: 0.86 },
  { rank: 4, doc: "火电厂燃煤锅炉低负荷稳燃技术分析.docx", hit: "§110", score: 0.84 },
  { rank: 5, doc: "630 MW机组W型锅炉深度调峰过程燃烧恶化分析及稳燃措施.docx", hit: "§14、§34", score: 0.82 },
];

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
      <header className="mb-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">适用场景说明</h3>
      </header>
      <p className="mb-3 text-[12.5px] text-muted-foreground">本次识别的场景为:深度调峰低负荷运行下的锅炉吹灰风险分析。</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-primary/20 bg-primary-soft/30 p-3.5">
          <div className="mb-2 text-[12.5px] font-semibold text-primary">适用场景</div>
          <ul className="space-y-1.5 text-[12.5px] leading-6 text-foreground/85">
            {SCOPE_APPLY.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-warning/30 bg-warning-soft/40 p-3.5">
          <div className="mb-2 text-[12.5px] font-semibold text-warning-foreground">不适用范围</div>
          <ul className="space-y-1.5 text-[12.5px] leading-6 text-foreground/85">
            {SCOPE_NOT_APPLY.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ChainCard({ onPick }: { onPick: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <Workflow className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">风险链路识别</h3>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* 链路 */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <ol className="space-y-1.5">
            {CHAIN_NODES.map((n, i) => (
              <li key={i} className="flex flex-col items-center">
                <div
                  className={`w-full rounded-md border px-3 py-2 text-center text-[12.5px] leading-5 ${
                    n.tone === "danger"
                      ? "border-destructive/30 bg-destructive/[0.06] text-foreground"
                      : n.tone === "warn"
                      ? "border-warning/30 bg-warning-soft/40 text-foreground"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {n.text}
                </div>
                {i < CHAIN_NODES.length - 1 && (
                  <div className="my-0.5 h-4 w-px border-l border-dashed border-muted-foreground/40" />
                )}
              </li>
            ))}
          </ol>
        </div>
        {/* 风险摘要 */}
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/[0.04] p-4">
          <div>
            <div className="text-[12px] text-muted-foreground">综合风险</div>
            <div className="mt-1 inline-flex items-center rounded-md bg-destructive/15 px-2.5 py-0.5 text-[13px] font-semibold text-destructive">高</div>
          </div>
          <div>
            <div className="text-[12px] text-muted-foreground">主要触发因素</div>
            <div className="mt-1 text-[12.5px] leading-5 text-foreground/90">
              低负荷稳燃裕度不足 + 吹灰扰动 + 积灰结焦 + 负压/火检异常
            </div>
          </div>
          <div className="rounded-md bg-card/60 p-2.5 text-[11.5px] leading-5 text-muted-foreground">
            风险等级需结合本厂深调试验边界、当前煤质与设备状态综合判断,本卡片为学习预判,不作实时定级。
          </div>
        </div>
      </div>

      {/* 链路节点支撑 */}
      <div className="mt-4 rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-2 text-[12.5px] font-semibold">链路节点与原文支撑</div>
        <ul className="divide-y divide-border">
          {CHAIN_TABLE.map((r, i) => (
            <li key={i} className="grid grid-cols-[160px_1fr_auto] items-start gap-4 px-4 py-2.5 text-[12.5px]">
              <span className="font-medium text-foreground">{r.name}</span>
              <span className="text-muted-foreground leading-5">{r.desc}</span>
              <RefChip id={r.ref} onPick={onPick} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ChecklistCard({ onPick }: { onPick: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">关键核查清单</h3>
      </header>
      <ol className="space-y-2">
        {CHECKLIST.map((c) => (
          <li key={c.no} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[12.5px] font-semibold text-primary-foreground">{c.no}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">{c.name}</div>
              <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">{c.desc}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-start gap-1">
              {c.refs.map((r) => <RefChip key={r} id={r} onPick={onPick} />)}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-lg border border-[#2F80ED]/25 bg-[#2F80ED]/[0.05] p-4">
        <div className="mb-2 flex items-center gap-2 text-[12.5px] font-semibold text-[#2F80ED]">
          <Info className="h-3.5 w-3.5" /> 核查判定参考(学习口径)
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {CHECK_REF.map((r, i) => (
            <div key={i} className="rounded-md border border-border bg-card p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium">{r.name}</span>
                <RefChip id={r.ref} onPick={onPick} />
              </div>
              <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RiskAndForbidCard({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 风险点 */}
      <section className={`${scenarioResultBlockClass} p-5`}>
        <header className="mb-3 flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-destructive" />
          <h3 className="text-[15px] font-semibold tracking-tight">风险点</h3>
        </header>
        <ul className="space-y-2">
          {RISKS.map((r, i) => {
            const high = r.level === "高";
            return (
              <li key={i} className={`rounded-lg border p-3 ${high ? "border-destructive/25 bg-destructive/[0.05]" : "border-warning/30 bg-warning-soft/35"}`}>
                <div className="flex items-start gap-2">
                  <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${high ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-warning/50 bg-warning-soft text-warning-foreground"}`}>
                    {r.level}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{r.title}</div>
                    <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{r.desc}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.refs.map((id) => <RefChip key={id} id={id} onPick={onPick} />)}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      {/* 慎用 / 禁止项 */}
      <section className={`${scenarioResultBlockClass} p-5`}>
        <header className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning-foreground" />
          <h3 className="text-[15px] font-semibold tracking-tight">慎用 / 禁止项</h3>
        </header>
        <ul className="space-y-2">
          {FORBIDS.map((f, i) => {
            const strict = f.type === "严禁";
            return (
              <li key={i} className={`rounded-lg border p-3 ${strict ? "border-destructive/30 bg-destructive/[0.05]" : "border-warning/30 bg-warning-soft/40"}`}>
                <div className="flex items-start gap-2">
                  <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${strict ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-warning/50 bg-warning-soft text-warning-foreground"}`}>
                    {f.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-5 text-foreground/90">{f.desc}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {f.refs.map((id) => <RefChip key={id} id={id} onPick={onPick} />)}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-[11.5px] leading-5 text-muted-foreground">
          措辞原则:出现上述信号时,应核查、应汇报、应按本厂规程和值长指令处理;本卡片不下"必须停吹灰"类硬性命令。
        </p>
      </section>
    </div>
  );
}

function StopAndReportCard({ onPick }: { onPick: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="text-[15px] font-semibold tracking-tight">异常停止与汇报提示</h3>
      </header>

      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/25 bg-destructive/[0.04] p-4">
          <div className="mb-2 text-[12.5px] font-semibold text-destructive">遇以下情况应停止当前分析辅助并立即上报</div>
          <ol className="space-y-1.5 text-[12.5px] leading-5">
            {STOP_RULES.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                <span className="flex-1 text-foreground/90">{s.desc}</span>
                <span className="flex shrink-0 gap-1">{s.refs.map((r) => <RefChip key={r} id={r} onPick={onPick} />)}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-lg border border-border bg-background">
          <div className="border-b border-border px-4 py-2 text-[12.5px] font-semibold">立即向值长汇报</div>
          <ul className="divide-y divide-border">
            {REPORT_ITEMS.map((r, i) => (
              <li key={i} className="grid grid-cols-[200px_1fr_auto] items-start gap-4 px-4 py-2 text-[12.5px]">
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground leading-5">{r.point}</span>
                <span className="flex flex-wrap gap-1">{r.refs.map((id) => <RefChip key={id} id={id} onPick={onPick} />)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-[#2F80ED]/25 bg-[#2F80ED]/[0.05] p-4">
          <div className="mb-2 flex items-center gap-2 text-[12.5px] font-semibold text-[#2F80ED]">
            <Info className="h-3.5 w-3.5" /> 深调试验管理提示(学习口径,非现场命令)
          </div>
          <ol className="space-y-1.5 text-[12.5px] leading-5">
            {TRIAL_TIPS.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#2F80ED]/15 text-[10px] font-semibold text-[#2F80ED]">{i + 1}</span>
                <span className="flex-1 text-foreground/90">{t.desc}</span>
                <span className="flex shrink-0 gap-1">{t.refs.map((id) => <RefChip key={id} id={id} onPick={onPick} />)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function EvidenceCard({ activeId, onPick }: { activeId?: string; onPick: (id: string) => void }) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-1 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">原文依据</h3>
      </header>
      <p className="mb-4 text-[12px] text-muted-foreground">点击正文中的依据标签可定位到对应条目,并在右侧查看原文引用。</p>
      <div className="grid gap-3 md:grid-cols-2">
        {EVIDENCES.map((e) => {
          const active = e.id === activeId;
          return (
            <div key={e.id} id={`ev-${e.id}`} className={`rounded-lg border p-3.5 transition-colors ${active ? "border-primary bg-primary-soft/40" : "border-border bg-background hover:border-primary/40"}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">{e.id}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{e.type}</span>
                <FileText className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-[12.5px] font-semibold">{e.title}</div>
              <p className="mt-1 line-clamp-2 text-[11.5px] leading-5 text-muted-foreground">{e.doc} · {e.section}</p>
              <button onClick={() => onPick(e.id)} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
                查看依据 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 历史案例 */}
      <div className="mt-5 rounded-lg border border-[#2F80ED]/25 bg-[#2F80ED]/[0.04] p-4">
        <div className="mb-2 flex items-center gap-2">
          <History className="h-4 w-4 text-[#2F80ED]" />
          <h4 className="text-[13.5px] font-semibold">历史案例参考</h4>
        </div>
        <p className="mb-3 text-[11.5px] leading-5 text-muted-foreground">
          以下为知识库中的他厂历史事件,用于培训复盘与风险联想,不构成对本厂的负荷边界、吹灰方案或处置指令。本厂应以本站运行规程、深调试验报告和值长指令为准。
        </p>
        <div className="rounded-md border border-border bg-card p-3.5">
          <div className="text-[13px] font-semibold">{HISTORY_CASE.title}</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">来源:{HISTORY_CASE.doc}</div>
          <dl className="mt-2 space-y-1 text-[12px] leading-5 text-foreground/85">
            <div className="flex gap-2"><dt className="w-20 shrink-0 font-medium">事件背景</dt><dd>机组约 360MW 低负荷下进行炉膛吹灰。</dd></div>
            <div className="flex gap-2"><dt className="w-20 shrink-0 font-medium">典型过程</dt><dd>吹灰中炉膛负压大幅波动;折焰角区域吹灰时火焰电视变暗、MFT 动作。</dd></div>
            <div className="flex gap-2"><dt className="w-20 shrink-0 font-medium">直接原因</dt><dd>大量垮灰致炉膛上部灭火、烟气量骤减,炉膛压力低三值保护动作。</dd></div>
            <div className="flex gap-2"><dt className="w-20 shrink-0 font-medium">机理补充</dt><dd>MFT 因垮灰致炉膛负压低,非燃烧器区域着火不良;上部垮灰对火检影响小。</dd></div>
            <div className="flex gap-2"><dt className="w-20 shrink-0 font-medium">管理教训</dt><dd>吹灰负荷边界管理不足、异常后未充分评估仍继续吹灰、经验主义。</dd></div>
            <div className="flex gap-2"><dt className="w-20 shrink-0 font-medium">改进方向</dt><dd>修订吹灰方案、强化异常汇报、低负荷吹灰前稳燃准备。</dd></div>
          </dl>
          <div className="mt-2 flex justify-end">
            <button onClick={() => onPick(HISTORY_CASE.id)} className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
              查看案例原文 <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RagCard() {
  const [open, setOpen] = useState(false);
  return (
    <section className={`${scenarioResultBlockClass}`}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-3 text-left">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <h3 className="text-[14px] font-semibold tracking-tight">知识检索记录</h3>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">RAG · {RAG_RESULTS.length} 条主命中</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-border px-5 py-4">
          <div>
            <div className="mb-2 text-[12px] text-muted-foreground">
              检索 Query:<span className="ml-1 text-foreground">深度调峰 低负荷 吹灰 积灰 结焦 炉膛负压 火检 SCR烟温 稳燃 MFT</span>
            </div>
            <div className="rounded-md border border-border">
              <div className="grid grid-cols-[40px_1fr_220px_60px] gap-3 border-b border-border bg-muted/40 px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground">
                <span>排名</span><span>文档</span><span>命中片段</span><span className="text-right">相关度</span>
              </div>
              {RAG_RESULTS.map((r) => (
                <div key={r.rank} className="grid grid-cols-[40px_1fr_220px_60px] gap-3 border-b border-border px-3 py-2 text-[12px] last:border-b-0">
                  <span className="text-muted-foreground">#{r.rank}</span>
                  <span className="truncate" title={r.doc}>{r.doc}</span>
                  <span className="text-muted-foreground">{r.hit}</span>
                  <span className="text-right font-medium text-primary">{r.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[12px] text-muted-foreground">历史案例检索</div>
            <div className="rounded-md border border-[#2F80ED]/25 bg-[#2F80ED]/[0.05] px-3 py-2 text-[12px]">
              <div className="font-medium">{HISTORY_CASE.doc}</div>
              <div className="mt-0.5 text-muted-foreground">用途:培训复盘 · 风险联想 · 相关度 <span className="text-primary">0.95</span></div>
            </div>
          </div>
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
          <ChainCard onPick={pickEvidence} />
          <ChecklistCard onPick={pickEvidence} />
          <RiskAndForbidCard onPick={pickEvidence} />
          <StopAndReportCard onPick={pickEvidence} />
          <EvidenceCard activeId={evId} onPick={pickEvidence} />
          <RagCard />
        </div>
        <RightSidebar mode={mode} setMode={setMode} evidence={activeEvidence} />
      </div>
    </PageShell>
  );
}
