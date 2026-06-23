import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Star,
  Pencil,
  RefreshCw,
  Download,
  Info,
  AlertTriangle,
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
  ListChecks,
  Wrench,
  History,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { ScenarioBreadcrumb } from "@/components/scenario/parts";
import { getScenario, type ScenarioTemplate } from "@/lib/mock/scenario";
import { useMockStore } from "@/lib/mock/store";

export const Route = createFileRoute("/scenario/fault/result/$id")({
  loader: ({ params }) => {
    const s = getScenario(params.id);
    if (!s || s.kind !== "fault") throw notFound();
    return { scenario: s };
  },
  component: FaultResult,
  notFoundComponent: () => (
    <PageShell>
      <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
        未找到该故障处置场景
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
  head: () => ({ meta: [{ title: "故障处置辅助结果 · 涉网运行能力智能支撑平台" }] }),
});

// ---- mock content per spec ----
const TAGS = [
  { label: "故障对象", value: "5032开关B相CT" },
  { label: "当前现象", value: "爆炸着火联跳" },
  { label: "当前状态", value: "三侧开关已跳闸" },
];

const SCOPE = [
  { kind: "red", text: "本次识别的故障场景为500kV #1主变及配套开关本体异常告警,含CT爆炸着火与失灵保护联跳" },
  { kind: "orange", text: "不适用范围:其他设备实例(如T062开关、安兰II线等)或非本体异常类故障(如线路故障、直流闭锁)不适用" },
  { kind: "blue", text: "本内容为处置辅助参考,不替代正式调度指令、事故处理预案和现场作业许可,所有操作必须遵守现场规程并得到值班负责人许可。" },
] as const;

const JUDGE_STEPS = [
  {
    no: 1,
    title: "先核对保护动作与开关状态",
    desc: "优先确认5032开关B相CT爆炸着火是否触发了差动或过流保护,以及5012开关失灵保护动作是否由其联跳引发,需核对保护录波与开关位置信号是否一致。",
    risk: "避免将单一CT异常误判为整台主变故障,或误认为是线路故障导致的失灵动作",
    refId: "P01-023",
  },
  {
    no: 2,
    title: "判断故障点是否在CT本体或连接部位",
    desc: "根据现场巡视发现CT顶部爆炸着火,应重点判断故障是否局限于CT本体或其绝缘结构,而非主变内部故障。",
    risk: "误将CT外部故障归因于主变内部绝缘击穿,导致错误隔离范围",
    refId: "B05-009",
  },
  {
    no: 3,
    title: "确认失灵保护动作逻辑是否正确",
    desc: "需确认5012开关失灵保护动作是否因5032开关未正确跳闸而触发,或是因其他原因误动。",
    risk: "误认为失灵保护动作是主因,而忽略CT爆炸为初始故障点",
    refId: "P02-017",
  },
];

const HANDLING_STEPS = [
  { no: 1, title: "立即执行紧急隔离", desc: "确认#1主变各侧开关均已分闸,将故障设备转为冷备用状态,防止事故扩大。" },
  { no: 2, title: "开展现场设备检查与气体检测", desc: "对5032开关B相CT进行红外测温、绝缘检测及气体成分分析,判断是否发生内部放电或绝缘击穿。" },
  { no: 3, title: "评估是否具备复役条件", desc: "若确认故障仅限于CT本体且无其他损伤,可考虑更换CT后恢复运行;若存在内部绝缘缺陷,则需进一步检修。" },
];

const RISKS = [
  { level: "high", title: "防止误判故障范围扩大", desc: "CT爆炸着火可能被误认为主变内部故障,导致错误隔离范围扩大" },
  { level: "high", title: "忽略气体成分检测的重要性", desc: "未对故障设备进行气体成分分析,可能导致潜在内部放电或绝缘缺陷被遗漏" },
  { level: "special", title: "失灵保护动作可能引发误判", desc: "5012开关失灵保护动作可能由5032开关未跳闸或保护拒动引起,需排查逻辑链" },
] as const;

type Evidence = {
  id: string;
  type: string;
  doc: string;
  summary: string;
  fileName: string;
  chapter: string;
  related: string;
  pageCurrent: number;
  pageTotal: number;
  paperTitle: string;
  highlightedText: string;
  bodyParagraphs: string[];
  standardNo: string;
  publishDate: string;
};

const EVIDENCES: Evidence[] = [
  {
    id: "G01-003", type: "规程制度",
    doc: "《重特大事故处置原则与案例分析》第4.3.2条",
    summary: "变压器停役前,应确认负荷已全部转移,备用变压器容量满足运行要求。",
    fileName: "重特大事故处置原则与案例分析",
    chapter: "第7章节 案例分析",
    related: "关联卡片:历史案例",
    pageCurrent: 27, pageTotal: 186,
    paperTitle: "二、2019-06-02 芜湖站 1000 千伏 T062 开关 B 相合闸电阻气室故障",
    highlightedText:
      "1、故障简况\n2019年6月2日19:28:22,淮芜Ⅱ线B相故障跳闸,芜湖站1000kV Ⅱ母线故障跳闸,淮芜Ⅱ线两套主保护动作,芜湖站1000kVⅡ母两套母差保护动作,T062开关三跳,T061开关B相跳闸重合不成功三跳,故障测距距离芜湖站0.1299公里(线路全长336.6公里)。现场检查判断为芜湖T062开关合闸电阻气室故障,将T062开关隔离后,淮芜Ⅱ线、芜湖1000kV Ⅱ母线恢复运行。",
    bodyParagraphs: [
      "2、故障前运行方式\n淮沪特高压系统全接线方式运行,其中泰州至东吴双线未投产,吉泉直流未投产,如图7-36所示,皖电东送1000kV机组7机运行,总上网出力380万千瓦,淮芜Ⅰ线、淮芜Ⅱ线双线故障前潮流304万千瓦。",
      "3、故障经过\n19:28:22 淮芜Ⅱ线B相故障,芜湖站1000kVⅡ母线故障跳闸,1379毫秒后芜湖站T061开关B相重合于故障,1472毫秒后T061开关三相跳开。",
      "19:29 网调紧急发令调减淮沪特高压送端机组,控制淮盱Ⅰ线+淮盱Ⅱ线+淮芜Ⅰ线潮流小于300万千瓦。",
    ],
    standardNo: "Q/GDW 1799.1-2013", publishDate: "2013-11-13",
  },
  {
    id: "G02-007", type: "规程制度",
    doc: "《电气操作导则》第4.2.3条",
    summary: "电气操作前,应核对设备实际位置、名称、编号与操作票一致。",
    fileName: "电气操作导则", chapter: "第4章 / 操作前准备 / 4.2.3 设备核对",
    related: "关联卡片:核心判断思路 步骤1",
    pageCurrent: 27, pageTotal: 186,
    paperTitle: "4.2.3 设备核对",
    highlightedText: "电气操作前,操作人员应核对设备实际位置、名称、编号与操作票完全一致,并对照系统接线图复查操作顺序,严禁凭记忆操作。",
    bodyParagraphs: [
      "4.2.4 操作人员应熟悉操作目的与方法,在执行操作前应进行模拟预演,确认操作步骤正确无误。",
      "4.2.5 操作过程中应严格执行唱票、复诵、监护制度,出现疑问立即停止操作并向调度汇报。",
    ],
    standardNo: "Q/GDW 1799.1-2013", publishDate: "2013-11-13",
  },
  {
    id: "B07-012", type: "保护安控资料",
    doc: "《500kV变电站保护整定运行规程》第6.2.4条",
    summary: "单台主变运行时,主变保护定值应调整为单台运行模式,确保故障时正确动作。",
    fileName: "500kV变电站保护整定运行规程", chapter: "第6章 / 主变保护 / 6.2.4 单台运行定值",
    related: "关联卡片:核心判断思路 步骤3",
    pageCurrent: 42, pageTotal: 128,
    paperTitle: "6.2.4 单台运行定值",
    highlightedText: "当变电站内仅单台主变运行时,主变差动、后备保护定值应切换至单台运行模式,后备保护时间级差宜整定为 0.3s,确保故障时保护正确动作。",
    bodyParagraphs: [
      "6.2.5 单台运行期间应加强对主变及保护装置的运行监视,定期巡视保护信号与压板状态。",
    ],
    standardNo: "Q/GDW 10422-2017", publishDate: "2017-07-20",
  },
  {
    id: "G03-015", type: "规程制度",
    doc: "《调度管理规程》第5.3.6条",
    summary: "操作许可制下,现场应在得到调度许可后,按照现场规程执行操作。",
    fileName: "调度管理规程", chapter: "第5章 / 操作许可 / 5.3.6 现场执行",
    related: "关联卡片:原文依据卡片",
    pageCurrent: 55, pageTotal: 142,
    paperTitle: "5.3.6 现场执行",
    highlightedText: "采用操作许可制时,现场操作负责人应在得到值班调度员的操作许可后,严格按照现场运行规程执行操作。",
    bodyParagraphs: [
      "5.3.7 操作过程中应保持与调度的实时联系,异常情况及时报告。",
    ],
    standardNo: "Q/GDW 1799.2-2013", publishDate: "2013-11-13",
  },
  {
    id: "P01-023", type: "保护原理",
    doc: "《500kV变压器差动保护原理与配置》",
    summary: "差动保护与失灵保护的联跳逻辑、动作判据。",
    fileName: "500kV变压器差动保护原理与配置", chapter: "第3章 / 失灵保护联跳逻辑",
    related: "关联卡片:核心判断思路 步骤1",
    pageCurrent: 35, pageTotal: 96,
    paperTitle: "3.4 失灵保护联跳逻辑",
    highlightedText: "失灵保护动作后,应通过启动失灵开入触发相邻开关跳闸,需校核保护录波与开关位置信号一致,避免因CT异常导致误判。",
    bodyParagraphs: [
      "3.5 主变保护应正确区分内部故障与外部故障,避免CT本体异常被错误归因。",
    ],
    standardNo: "DL/T 684-2012", publishDate: "2012-09-01",
  },
  {
    id: "B05-009", type: "保护安控资料",
    doc: "《电流互感器运行与故障处理》",
    summary: "CT本体故障(爆炸/着火)的现场判断与隔离原则。",
    fileName: "电流互感器运行与故障处理", chapter: "第5章 / CT本体故障处置",
    related: "关联卡片:核心判断思路 步骤2",
    pageCurrent: 19, pageTotal: 84,
    paperTitle: "5.2 CT本体爆炸/着火处置",
    highlightedText: "CT顶部爆炸或着火时,应判定为CT本体故障,隔离范围限定于该CT及其所在间隔,不应扩大到主设备本体。",
    bodyParagraphs: [
      "5.3 处置过程中应同步进行气体成分检测,排除SF6气室缺陷可能。",
    ],
    standardNo: "DL/T 866-2015", publishDate: "2015-06-01",
  },
  {
    id: "P02-017", type: "保护原理",
    doc: "《断路器失灵保护配置与整定》",
    summary: "失灵保护误动/拒动判别逻辑。",
    fileName: "断路器失灵保护配置与整定", chapter: "第4章 / 失灵保护误动判别",
    related: "关联卡片:核心判断思路 步骤3",
    pageCurrent: 22, pageTotal: 78,
    paperTitle: "4.3 失灵保护误动判别",
    highlightedText: "应通过开关位置信号、电流判据和延时配合,排查失灵保护是否因开关拒动、保护误动或回路异常引起。",
    bodyParagraphs: [
      "4.4 失灵动作后应及时调阅录波,核对启动失灵开入、出口跳闸时序。",
    ],
    standardNo: "DL/T 559-2018", publishDate: "2018-04-01",
  },
];

// ---- sub components ----
function HeaderActions({ onFavorite }: { onFavorite: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to="/scenario/fault"
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted"
      >
        <Pencil className="h-3.5 w-3.5" /> 修改条件
      </Link>
      <button
        onClick={() => toast.success("已基于当前条件重新生成处置辅助")}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted"
      >
        <RefreshCw className="h-3.5 w-3.5" /> 重新生成
      </button>
      <button
        onClick={onFavorite}
        className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary-soft/60 px-3 py-1.5 text-[12.5px] font-medium text-primary hover:bg-primary-soft"
      >
        <Star className="h-3.5 w-3.5 fill-primary" /> 收藏
      </button>
      <button
        onClick={() => toast.message("已导出为 PDF(占位)")}
        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Download className="h-3.5 w-3.5" /> 导出
      </button>
    </div>
  );
}

function ScopeCard() {
  const colorMap = {
    red: { dot: "bg-destructive", icon: <AlertTriangle className="h-4 w-4 text-destructive" /> },
    orange: { dot: "bg-warning", icon: <AlertTriangle className="h-4 w-4 text-warning-foreground" /> },
    blue: { dot: "bg-[#2F80ED]", icon: <Info className="h-4 w-4 text-[#2F80ED]" /> },
  };
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <header className="mb-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-destructive" />
        <h3 className="text-[15px] font-semibold tracking-tight">适用场景说明</h3>
      </header>
      <ul className="space-y-2">
        {SCOPE.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-6">
            {colorMap[it.kind].icon}
            <span className="text-foreground/90">{it.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StageCard() {
  return (
    <section className="rounded-lg border border-destructive/30 bg-destructive/[0.05] p-5">
      <header className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <h3 className="text-[15px] font-semibold tracking-tight text-destructive">
          当前处置阶段:紧急隔离与安全控制
        </h3>
      </header>
      <dl className="space-y-2 text-[12.5px] leading-6">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 font-medium text-foreground">阶段目标:</dt>
          <dd className="text-foreground/85">立即控制人身与设备风险,防止事故扩大,确保现场安全。</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 font-medium text-foreground">优先事项:</dt>
          <dd className="text-foreground/85">
            1.确认#1主变各侧开关已全部分闸; 2.检查CT爆炸着火点及周边设备有无进一步损坏或火灾蔓延迹象; 3.确保现场人员安全,防止触电与爆炸风险
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 font-medium text-foreground">禁止动作:</dt>
          <dd className="text-foreground/85">本阶段禁止未经确认直接试送电或靠近故障点进行非必要操作</dd>
        </div>
      </dl>
    </section>
  );
}

function JudgeCard({ onPickEvidence }: { onPickEvidence: (id: string) => void }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <header className="mb-1 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">核心判断思路</h3>
      </header>
      <p className="mb-3 text-[12px] text-muted-foreground">
        应优先确认故障点位置、保护动作逻辑与开关状态一致性,避免误判为线路故障或误操作导致的跳闸。
      </p>
      <ol className="space-y-2.5">
        {JUDGE_STEPS.map((s) => (
          <li key={s.no} className="rounded-lg border border-border bg-background p-3.5">
            <div className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[12.5px] font-semibold text-primary-foreground">
                {s.no}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-foreground">{s.title}</div>
                <p className="mt-1 text-[12.5px] leading-6 text-muted-foreground">{s.desc}</p>
                <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-5 text-destructive/90">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>误判风险:{s.risk}</span>
                </p>
              </div>
              <button
                onClick={() => onPickEvidence(s.refId)}
                className="ml-2 inline-flex shrink-0 items-center gap-1 self-start rounded-md border border-primary/30 bg-primary-soft/60 px-2 py-1 text-[11.5px] font-medium text-primary hover:bg-primary-soft"
                title="查看依据原文"
              >
                依据:{s.refId}
                <FileText className="h-3 w-3" />
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
    <section className="rounded-lg border border-border bg-card p-5">
      <header className="mb-3 flex items-center gap-2">
        <Wrench className="h-4 w-4 text-warning-foreground" />
        <h3 className="text-[15px] font-semibold tracking-tight">参考处置思路</h3>
      </header>
      <ol className="space-y-2">
        {HANDLING_STEPS.map((s) => (
          <li key={s.no} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-start gap-2">
              <span className="inline-flex shrink-0 items-center rounded bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                步骤{s.no}
              </span>
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
    <section className="rounded-lg border border-border bg-card p-5">
      <header className="mb-3 flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 text-destructive" />
        <h3 className="text-[15px] font-semibold tracking-tight">风险点与注意事项</h3>
      </header>
      <ul className="space-y-2">
        {RISKS.map((r, i) => {
          const isSpecial = r.level === "special";
          return (
            <li
              key={i}
              className={`rounded-lg border p-3 ${
                isSpecial ? "border-warning/40 bg-warning-soft/40" : "border-destructive/25 bg-destructive/[0.04]"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                    isSpecial
                      ? "border-warning/50 bg-warning-soft text-warning-foreground"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                  }`}
                >
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
    <section className="rounded-lg border border-border bg-card p-5">
      <header className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-[#2F80ED]" />
        <h3 className="text-[15px] font-semibold tracking-tight">历史案例参考</h3>
      </header>
      <div className="rounded-lg border border-[#2F80ED]/30 bg-[#2F80ED]/[0.04] p-4">
        <div className="text-[13.5px] font-semibold text-foreground">
          2019-06-02 芜湖站1000千伏T062开关B相合闸电阻气室故障
        </div>
        <div className="mt-2 text-[12.5px] leading-6 text-foreground/85">
          <div className="font-medium text-foreground">故障经过:</div>
          <p className="text-muted-foreground">
            设备类型均为高压开关(T062开关与5032开关),故障现象均包含内部爆炸、着火、气体成分严重超标,且引发保护动作与联跳,T062开关合闸电阻气室因制造缺陷导致内部放电,引发高温烧蚀与漏气
          </p>
          <div className="mt-2 font-medium text-foreground">经验教训:</div>
          <p className="text-muted-foreground">
            必须对爆炸着火设备开展气体成分检测,避免误判为外部故障;应优先隔离故障点而非整台主变
          </p>
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => onPickEvidence("G01-003")}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
          >
            查看详情 <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </section>
  );
}

function EvidenceListCard({ activeId, onPick }: { activeId?: string; onPick: (id: string) => void }) {
  const FOUR = EVIDENCES.slice(0, 4);
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <header className="mb-1 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-[15px] font-semibold tracking-tight">原文依据</h3>
      </header>
      <p className="mb-4 text-[12px] text-muted-foreground">点击正文中的依据标签可定位到对应条目</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {FOUR.map((e) => {
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

// ---- right panels ----
function ChatPanel() {
  const QUICK = ["查看依据 P01-023", "失灵保护怎么判别误动?", "复役条件还需要核对什么?"];
  const [input, setInput] = useState("");
  const [followups, setFollowups] = useState<{ q: string; a: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const send = (text: string) => {
    if (!text.trim()) return;
    setFollowups((arr) => [
      ...arr,
      { q: text, a: `针对「${text}」的培训参考:请结合左侧核心判断思路与原文依据综合理解,实际处置以现场调度命令为准。` },
    ]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };
  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto px-4 py-4">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-[12.5px] leading-5 text-primary-foreground">
            500kV #1主变配套开关本体异常,现场看到5032开关B相CT顶部爆炸着火,随后5012开关失灵保护动作,联跳#1主变各侧开关。请生成故障处置辅助要点,当前主变各侧开关已分闸
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Bot className="h-3.5 w-3.5" /></span>
          <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-muted/30 px-3 py-2.5">
            <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">正在思考</div>
            <ol className="space-y-1 text-[11.5px] leading-5 text-foreground/85">
              <li>1.解析故障特征:识别到500kV #1主变配套开关发生CT爆炸着火与失灵保护联跳,判断为高优先级严重故障</li>
              <li>2.抽取场景标签要素:锁定故障对象、异常现象与设备状态,明确当前为主变相关开关故障场景</li>
              <li>3.检索知识库:正在匹配《故障处理典型方案》</li>
              <li>4.分析处置逻辑:结合保护动作、开关状态与现场巡视信息,判断故障点</li>
              <li>5.生成处置辅助建议:给出先隔离、再检查、后评估恢复条件的分阶段处置思路与关注重点</li>
              <li>6.关联依据:匹配相关规程条款和典型操作票依据</li>
            </ol>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Bot className="h-3.5 w-3.5" /></span>
          <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2.5">
            <div className="mb-1.5 text-[12px] font-medium text-foreground">已为您生成故障处置辅助方案</div>
            <ul className="space-y-1 text-[11.5px] leading-5 text-foreground/85">
              <li>✅ 已完成500kV #1主变配套开关故障处置辅助方案生成</li>
              <li>📋 已包含紧急隔离与现场安全控制的关键检查项</li>
              <li>⚠️ 已识别3项风险点</li>
              <li>📚 关联4份规程依据,可在下方原文依据区查看</li>
            </ul>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="h-7 w-7 shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)} className="rounded-md border border-border bg-background px-2 py-1 text-[11.5px] text-foreground/85 hover:border-primary/40 hover:bg-primary-soft/40">
                {q}
              </button>
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
      {/* 来源信息卡片 */}
      <div className="border-b border-border bg-card px-5 py-4">
        <div className="rounded-md bg-[#F7F9FA] p-4">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#2F80ED]" />
            <div className="min-w-0 flex-1 text-[12.5px] font-semibold text-foreground">{evidence.fileName}</div>
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

      {/* PDF 纸张 */}
      <div className="flex-1 overflow-auto bg-muted/40 px-3 py-4">
        <div className="mx-auto rounded-md border border-border bg-white px-7 py-9 shadow-sm">
          <div className="mb-6 flex items-center justify-between text-[10.5px] text-slate-500">
            <span>{evidence.fileName}</span>
            <span>{evidence.pageCurrent}</span>
          </div>
          <h4 className="mb-4 text-[14.5px] font-bold text-foreground">{evidence.paperTitle}</h4>
          <div className="whitespace-pre-line rounded-sm bg-[#FFF1B8] px-2.5 py-2.5 text-[12.5px] leading-[1.7] text-foreground">
            {evidence.highlightedText}
          </div>
          {evidence.bodyParagraphs.map((p, i) => (
            <p key={i} className="mt-3 whitespace-pre-line text-[12px] leading-[1.8] text-foreground/85">{p}</p>
          ))}
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
    <aside className={`sticky top-20 flex h-[calc(100vh-7rem)] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card transition-[width] duration-200 ${mode === "source" ? "w-[560px]" : "w-[380px]"}`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {mode === "chat" ? <MessagesSquare className="h-4 w-4 text-primary" /> : <BookOpen className="h-4 w-4 text-primary" />}
          <h3 className="text-[14px] font-semibold tracking-tight">{mode === "chat" ? "会话" : "原文引用"}</h3>
        </div>
        <button
          onClick={() => setMode(mode === "chat" ? "source" : "chat")}
          className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary-soft/40 hover:text-primary"
          aria-label={mode === "chat" ? "切换到原文引用" : "切换回会话"}
          title={mode === "chat" ? "切换到原文引用" : "切换回会话"}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {mode === "chat" || !evidence ? <ChatPanel /> : <SourcePanel evidence={evidence} />}
    </aside>
  );
}

// ---- main ----
function FaultResult() {
  const { scenario } = Route.useLoaderData() as { scenario: ScenarioTemplate };
  const { saveScenarioFavorite, pushRecentScenario } = useMockStore();
  
  const [mode, setMode] = useState<"chat" | "source">("chat");
  const [evId, setEvId] = useState<string | undefined>(undefined);

  useEffect(() => { pushRecentScenario(scenario.id); }, [scenario.id, pushRecentScenario]);

  const pickEvidence = (id: string) => {
    setEvId(id);
    setMode("source");
    setTimeout(() => document.getElementById(`ev-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };
  const activeEvidence = useMemo(() => EVIDENCES.find((e) => e.id === evId), [evId]);

  const onFavorite = () => {
    saveScenarioFavorite({ scenarioId: scenario.id, title: scenario.title, kind: "fault" });
    toast.success("已收藏当前故障处置结果");
  };




  return (
    <PageShell>
      <ScenarioBreadcrumb
        items={[
          { label: "场景训练", to: "/scenario" },
          { label: "故障处置复盘", to: "/scenario/fault" },
          { label: "处置辅助结果" },
        ]}
      />

      <div className="mt-3 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold tracking-tight">500kV #1主变配套开关 CT 爆炸着火并联跳故障处置辅助</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">生成时间:2026-04-01 17:40:31</p>
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
