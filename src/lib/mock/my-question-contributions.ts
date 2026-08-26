import { DOCS } from "./data";

/** 员工从资料学习页解析、编辑并提交审核的题目贡献 */

export type ContributionStatus = "草稿" | "待审核" | "已退回" | "已入库";

export type ContributionAuditAction =
  | "AI 解析生成"
  | "提交审核"
  | "驳回"
  | "重新提交"
  | "审核通过";

export interface ContributionAuditRecord {
  id: string;
  action: ContributionAuditAction;
  operator: string;
  time: string;
  comment?: string;
  statusAfter: ContributionStatus;
}

export interface QuestionContribution {
  id: string;
  docId: string;
  stem: string;
  type: "单选题" | "多选题" | "判断题" | "简答题";
  knowledgePoints: string[];
  status: ContributionStatus;
  submittedAt?: string;
  updatedAt: string;
  options?: { key: string; text: string }[];
  answer?: string;
  analysis?: string;
  rejectComment?: string;
}

const HANDCRAFTED_CONTRIBUTIONS: QuestionContribution[] = [
  {
    id: "mc-d1-1",
    docId: "d1",
    stem: "AGC 投入运行后,机组实际出力与调度指令偏差持续超过 ±3% 时,应优先采取下列哪项处理?",
    type: "单选题",
    knowledgePoints: ["AGC", "两细则"],
    status: "待审核",
    submittedAt: "2026-07-01 09:20",
    updatedAt: "2026-07-01 09:20",
    options: [
      { key: "A", text: "立即手动调整出力,使其匹配调度指令" },
      { key: "B", text: "检查 AGC 控制器状态,确认是否退出 AGC 控制" },
      { key: "C", text: "等待 AGC 自动调整恢复" },
      { key: "D", text: "立即通知运行值长后再处理" },
    ],
    answer: "B",
    analysis: "持续偏差超过 ±3% 应优先确认 AGC 控制器状态,必要时退出 AGC 改手动。",
  },
  {
    id: "mc-d2-1",
    docId: "d2",
    stem: "500kV 主变停役前,下列哪项核对不属于必须项?",
    type: "单选题",
    knowledgePoints: ["主变停役", "典型操作"],
    status: "已退回",
    submittedAt: "2026-06-28 14:10",
    updatedAt: "2026-06-28 16:45",
    rejectComment: "题干表述有歧义,「不属于必须项」与资料原文考点不一致,请改为正向提问并核对选项依据。",
    options: [
      { key: "A", text: "负荷转移情况" },
      { key: "B", text: "保护连接片位置" },
      { key: "C", text: "厂用电切换方案" },
      { key: "D", text: "调度命令与操作票一致性" },
    ],
    answer: "C",
    analysis: "停役前核对项以规程第 1 章为准,厂用电切换属于后续步骤而非停役前必须核对项。",
  },
  {
    id: "mc-d6-1",
    docId: "d6",
    stem: "下列关于 AGC 控制器死区设置的说法,正确的有哪些?",
    type: "多选题",
    knowledgePoints: ["AGC", "死区"],
    status: "已退回",
    submittedAt: "2026-06-29 11:30",
    updatedAt: "2026-06-30 09:15",
    rejectComment: "选项 B 表述存在歧义,需重写;解析需补充资料页码依据。",
    options: [
      { key: "A", text: "死区建议设置 ≤1MW" },
      { key: "B", text: "死区越大越有利于考核" },
      { key: "C", text: "变更前须经调度同意" },
      { key: "D", text: "死区与速率限制无关" },
    ],
    answer: "A,C",
    analysis: "资料第 1 节明确死区推荐 ≤1MW,参数变更须经调度同意。",
  },
  {
    id: "mc-d1-2",
    docId: "d1",
    stem: "两细则中 AGC 考核的三项核心指标不包括下列哪一项?",
    type: "单选题",
    knowledgePoints: ["AGC", "两细则"],
    status: "已入库",
    submittedAt: "2026-06-15 10:00",
    updatedAt: "2026-06-18 15:20",
    options: [
      { key: "A", text: "调节速率" },
      { key: "B", text: "调节精度" },
      { key: "C", text: "响应时间" },
      { key: "D", text: "无功补偿容量" },
    ],
    answer: "D",
    analysis: "AGC 考核三项指标为调节速率、调节精度、响应时间。",
  },
  {
    id: "mc-d1-3",
    docId: "d1",
    stem: "厂站侧执行 AGC 时，下列哪项做法符合两细则要求?",
    type: "单选题",
    knowledgePoints: ["AGC", "厂站执行"],
    status: "已入库",
    submittedAt: "2026-06-20 09:40",
    updatedAt: "2026-06-22 11:05",
    options: [
      { key: "A", text: "指令突变时先切手动，确认后再投自动" },
      { key: "B", text: "收到调度指令后可暂不跟踪，待班后统一调整" },
      { key: "C", text: "为减少考核可自行放大死区而不报调度" },
      { key: "D", text: "AGC 退出后无需在运行日志中记录原因" },
    ],
    answer: "A",
    analysis: "指令异常或突变时应先切手动核实，确认正常后再投自动，并做好记录与汇报。",
  },
  {
    id: "mc-d1-4",
    docId: "d1",
    stem: "下列哪些措施有助于降低 AGC 调节精度考核风险?",
    type: "多选题",
    knowledgePoints: ["AGC", "调节精度"],
    status: "已入库",
    submittedAt: "2026-06-21 15:20",
    updatedAt: "2026-06-23 10:30",
    options: [
      { key: "A", text: "定期核对测点与控制器参数一致性" },
      { key: "B", text: "指令跟踪异常时及时切手动并汇报" },
      { key: "C", text: "擅自关闭精度越限报警以减少打扰" },
      { key: "D", text: "试验或检修后复核死区与速率限制" },
    ],
    answer: "A,B,D",
    analysis: "测点与参数核对、异常切手动汇报、以及试验后复核死区与速率，均可降低精度考核风险；关闭报警不符合要求。",
  },
  {
    id: "mc-d2-draft",
    docId: "d2",
    stem: "主变停役操作中,拉开刀闸前应确认哪些条件?(草稿)",
    type: "简答题",
    knowledgePoints: ["主变停役"],
    status: "草稿",
    updatedAt: "2026-07-02 16:00",
    analysis: "应确认断路器已断开、无负荷、保护已退出等。",
  },
];

const HANDCRAFTED_AUDIT_LOGS: Record<string, ContributionAuditRecord[]> = {
  "mc-d1-1": [
    { id: "ca-1", action: "AI 解析生成", operator: "系统", time: "2026-07-01 09:05", statusAfter: "草稿" },
    { id: "ca-2", action: "提交审核", operator: "当前用户", time: "2026-07-01 09:20", statusAfter: "待审核" },
  ],
  "mc-d2-1": [
    { id: "ca-3", action: "AI 解析生成", operator: "系统", time: "2026-06-28 13:50", statusAfter: "草稿" },
    { id: "ca-4", action: "提交审核", operator: "当前用户", time: "2026-06-28 14:10", statusAfter: "待审核" },
    {
      id: "ca-5",
      action: "驳回",
      operator: "王审核",
      time: "2026-06-28 16:45",
      comment: "题干表述有歧义,「不属于必须项」与资料原文考点不一致,请改为正向提问并核对选项依据。",
      statusAfter: "已退回",
    },
  ],
  "mc-d6-1": [
    { id: "ca-6", action: "AI 解析生成", operator: "系统", time: "2026-06-29 11:10", statusAfter: "草稿" },
    { id: "ca-7", action: "提交审核", operator: "当前用户", time: "2026-06-29 11:30", statusAfter: "待审核" },
    {
      id: "ca-8",
      action: "驳回",
      operator: "王审核",
      time: "2026-06-30 09:15",
      comment: "选项 B 表述存在歧义,需重写;解析需补充资料页码依据。",
      statusAfter: "已退回",
    },
  ],
  "mc-d1-2": [
    { id: "ca-9", action: "提交审核", operator: "当前用户", time: "2026-06-15 10:00", statusAfter: "待审核" },
    { id: "ca-10", action: "审核通过", operator: "王审核", time: "2026-06-18 15:20", statusAfter: "已入库" },
  ],
  "mc-d1-3": [
    { id: "ca-12", action: "AI 解析生成", operator: "系统", time: "2026-06-20 09:20", statusAfter: "草稿" },
    { id: "ca-13", action: "提交审核", operator: "当前用户", time: "2026-06-20 09:40", statusAfter: "待审核" },
    { id: "ca-14", action: "审核通过", operator: "王审核", time: "2026-06-22 11:05", statusAfter: "已入库" },
  ],
  "mc-d1-4": [
    { id: "ca-15", action: "AI 解析生成", operator: "系统", time: "2026-06-21 15:00", statusAfter: "草稿" },
    { id: "ca-16", action: "提交审核", operator: "当前用户", time: "2026-06-21 15:20", statusAfter: "待审核" },
    { id: "ca-17", action: "审核通过", operator: "王审核", time: "2026-06-23 10:30", statusAfter: "已入库" },
  ],
  "mc-d2-draft": [
    { id: "ca-11", action: "AI 解析生成", operator: "系统", time: "2026-07-02 16:00", statusAfter: "草稿" },
  ],
};

type ContributionSeed = {
  stem: string;
  type: QuestionContribution["type"];
  options?: { key: string; text: string }[];
  answer?: string;
  analysis?: string;
};

const DOC_CONTRIBUTION_SEEDS: Record<string, ContributionSeed> = {
  d3: {
    stem: "母差保护误动复盘中，现场应优先核查的二次原因是?",
    type: "单选题",
    options: [
      { key: "A", text: "TA 极性与二次回路绝缘" },
      { key: "B", text: "主变油温是否超限" },
      { key: "C", text: "AGC 死区是否过大" },
      { key: "D", text: "环保设施是否投运" },
    ],
    answer: "A",
    analysis: "母差误动复盘应先核对 TA 极性、二次回路与定值，再查一次设备。",
  },
  d4: {
    stem: "厂站运行规程与通用规程冲突时，本站应如何执行?",
    type: "判断题",
    answer: "优先执行经批准的厂站资料，通用规程用于补充未覆盖场景。",
    analysis: "厂站资料优先适用，冲突时应请示值长并按批准口径执行。",
  },
  d5: {
    stem: "继电保护定期检验宜尽可能安排在什么期间进行?",
    type: "单选题",
    options: [
      { key: "A", text: "一次设备停电检修期间" },
      { key: "B", text: "高峰负荷时段" },
      { key: "C", text: "AGC 试验当天" },
      { key: "D", text: "交接班过程中" },
    ],
    answer: "A",
    analysis: "定期检验宜尽可能在一次设备停电检修期间进行。",
  },
  d7: {
    stem: "迎峰度夏期间主变温升接近限值时，值班员应优先采取哪项措施?",
    type: "单选题",
    options: [
      { key: "A", text: "立即拉开主变" },
      { key: "B", text: "汇报值长，检查冷却装置并视情况调整负荷" },
      { key: "C", text: "等待自然降温" },
      { key: "D", text: "退出全部保护" },
    ],
    answer: "B",
    analysis: "应先汇报并检查冷却系统，必要时调整负荷，不可盲目停运。",
  },
  d8: {
    stem: "两细则中 AGC 性能评价通常由哪些指标构成?",
    type: "多选题",
    options: [
      { key: "A", text: "调节速率" },
      { key: "B", text: "调节精度" },
      { key: "C", text: "响应时间" },
      { key: "D", text: "线损率" },
    ],
    answer: "A,B,C",
    analysis: "AGC 考核三项指标为调节速率、调节精度与响应时间。",
  },
  d9: {
    stem: "新员工交接班「四清」包括人员、设备、运行方式与异常事项。",
    type: "判断题",
    answer: "正确",
    analysis: "交接班须完成人员、设备、运行方式、异常事项的全面核对。",
  },
  d10: {
    stem: "差动保护动作后推荐的四步核查顺序是?",
    type: "单选题",
    options: [
      { key: "A", text: "TA 极性 → 二次回路 → 定值 → 一次设备" },
      { key: "B", text: "一次设备 → 定值 → TA → 二次回路" },
      { key: "C", text: "定值 → 一次设备 → 二次回路 → TA" },
      { key: "D", text: "二次回路 → 一次设备 → 定值 → TA" },
    ],
    answer: "A",
    analysis: "推荐按 TA 极性、二次回路、定值、一次设备四步缩小范围。",
  },
  d11: {
    stem: "AVC 投自动后发生电压越限，值班员应在多长时间内完成报警确认?",
    type: "单选题",
    options: [
      { key: "A", text: "1 分钟内" },
      { key: "B", text: "10 分钟内" },
      { key: "C", text: "1 小时内" },
      { key: "D", text: "下班前即可" },
    ],
    answer: "A",
    analysis: "资料要求值班员应在 1 分钟内确认报警类别并具备手动接管能力。",
  },
  d12: {
    stem: "母线倒闸误送电事故的直接原因通常包括哪些?",
    type: "多选题",
    options: [
      { key: "A", text: "母联三相位置未核对到位" },
      { key: "B", text: "操作票漏写状态核对步骤" },
      { key: "C", text: "监护流于形式" },
      { key: "D", text: "AGC 死区设置过大" },
    ],
    answer: "A,B,C",
    analysis: "该案例定位为位置核对缺失、票面漏项与监护失效，与 AGC 无关。",
  },
  d13: {
    stem: "220kV 线路停役前必须核对的二次功能包括重合闸与备自投。",
    type: "判断题",
    answer: "正确",
    analysis: "停役前须确认重合闸已退出，并核对备自投、保护定值区及两侧开关位置。",
  },
  d14: {
    stem: "GIS 气室 SF6 压力降至报警值后，下列做法正确的是?",
    type: "单选题",
    options: [
      { key: "A", text: "立即汇报，查明泄漏点前不得盲目带压补气" },
      { key: "B", text: "直接带压补气至正常值" },
      { key: "C", text: "无需汇报，继续观察即可" },
      { key: "D", text: "立即强行操作相关开关" },
    ],
    answer: "A",
    analysis: "降至报警值应立即汇报并加强监视，查明泄漏点前不得盲目补气。",
  },
  d15: {
    stem: "继电保护定值单现场执行前必须完成双人核对。",
    type: "判断题",
    answer: "正确",
    analysis: "定值单须双人核对、审批生效后方可执行，并留存影像与签字记录。",
  },
  d16: {
    stem: "高峰时段励磁限制频繁动作导致无功不足，常见根因是?",
    type: "单选题",
    options: [
      { key: "A", text: "AVR 限制曲线与电网电压水平不匹配" },
      { key: "B", text: "操作票未签字" },
      { key: "C", text: "直流系统一点接地" },
      { key: "D", text: "SF6 压力偏低" },
    ],
    answer: "A",
    analysis: "案例根因为 AVR 的 V/Hz 与过励限制按冬季参数整定，未随季节校核。",
  },
  d17: {
    stem: "一次调频试验结束后，试验记录应在多长时间内提交?",
    type: "单选题",
    options: [
      { key: "A", text: "24 小时内" },
      { key: "B", text: "一周内" },
      { key: "C", text: "月底汇总即可" },
      { key: "D", text: "无需提交" },
    ],
    answer: "A",
    analysis: "厂家 SOP 要求试验后 24 小时内整理记录、曲线与结论并提交审核。",
  },
  d18: {
    stem: "迎峰度冬期间厂站应重点落实哪些工作?",
    type: "多选题",
    options: [
      { key: "A", text: "防寒防冻检查" },
      { key: "B", text: "线路覆冰监测" },
      { key: "C", text: "备用电源与柴油发电机带载试验" },
      { key: "D", text: "取消全部特巡" },
    ],
    answer: "A,B,C",
    analysis: "度冬重点为防寒防冻、覆冰监测与备用电源可靠性，特巡应加强而非取消。",
  },
  d19: {
    stem: "母线倒闸必须坚持先合后拉，严禁带负荷拉合刀闸。",
    type: "判断题",
    answer: "正确",
    analysis: "应先建立可靠并联路径再断开原路径，严禁带负荷拉合刀闸。",
  },
  d20: {
    stem: "有载分接开关检修后送电前，升降档试验应至少完成几个完整循环?",
    type: "单选题",
    options: [
      { key: "A", text: "不少于两个完整循环" },
      { key: "B", text: "点动一次即可" },
      { key: "C", text: "送电后再试验" },
      { key: "D", text: "无需试验" },
    ],
    answer: "A",
    analysis: "验收要求在检修电源下完成不少于两个完整循环，合格后方可送电。",
  },
  d21: {
    stem: "直流接地查找应遵循的原则包括哪些?",
    type: "多选题",
    options: [
      { key: "A", text: "先信号回路后控制回路" },
      { key: "B", text: "先备用后运行" },
      { key: "C", text: "每次拉路前后记录绝缘监测值" },
      { key: "D", text: "重要控制回路可擅自拉路" },
    ],
    answer: "A,B,C",
    analysis: "拉路法须先次要后重要，重要控制回路拉路须经值长批准。",
  },
  d22: {
    stem: "机组深调时环保设施运行窗口变窄，应提前与环保专工沟通并监视污染物浓度趋势。",
    type: "判断题",
    answer: "正确",
    analysis: "深调烟气量、烟温变化大，需协同监视脱硝、除尘、脱硫参数防止超标。",
  },
  d23: {
    stem: "备自投误动导致全站失电的关键教训是?",
    type: "单选题",
    options: [
      { key: "A", text: "检修前应退出备自投并核对一次方式与二次功能" },
      { key: "B", text: "检修期间可保留全部备自投功能" },
      { key: "C", text: "只需核对一次设备，无需核对二次功能" },
      { key: "D", text: "方式变更后可口头通知即可" },
    ],
    answer: "A",
    analysis: "涉及方式变更必须执行一次方式、二次功能与调度令三联核对。",
  },
  d24: {
    stem: "AVC 与 AGC 发生协调闭锁时，值班员应先确认什么?",
    type: "单选题",
    options: [
      { key: "A", text: "闭锁原因码，必要时切手动维持关键指标" },
      { key: "B", text: "直接加大无功指令" },
      { key: "C", text: "立即退出全部保护" },
      { key: "D", text: "无需处理等待自动解锁" },
    ],
    answer: "A",
    analysis: "应先确认闭锁原因，必要时切手动，解锁前复核限幅与目标，防止反复闭锁。",
  },
};

const STATUS_CYCLE: ContributionStatus[] = ["待审核", "已入库", "草稿", "已退回"];

function buildFallbackContribution(
  doc: (typeof DOCS)[number],
  index: number,
): QuestionContribution {
  const status = STATUS_CYCLE[index % STATUS_CYCLE.length];
  const seed = DOC_CONTRIBUTION_SEEDS[doc.id];
  const type = seed?.type ?? "单选题";
  const item: QuestionContribution = {
    id: `mc-${doc.id}-1`,
    docId: doc.id,
    stem: seed?.stem ?? `根据《${doc.title}》的要求，下列说法正确的是?`,
    type,
    knowledgePoints: doc.highlight.slice(0, 2),
    status,
    updatedAt: "2026-07-02 10:20",
    options: seed?.options,
    answer: seed?.answer,
    analysis: seed?.analysis,
  };
  if (status !== "草稿") item.submittedAt = "2026-07-01 14:10";
  if (status === "已退回") {
    item.rejectComment = "请对照资料原文核对选项表述与解析依据。";
  }
  return item;
}

function buildFallbackAuditLogs(item: QuestionContribution): ContributionAuditRecord[] {
  const logs: ContributionAuditRecord[] = [
    {
      id: `${item.id}-ca-1`,
      action: "AI 解析生成",
      operator: "系统",
      time: "2026-07-01 09:40",
      statusAfter: "草稿",
    },
  ];
  if (item.status === "草稿") return logs;
  logs.push({
    id: `${item.id}-ca-2`,
    action: "提交审核",
    operator: "当前用户",
    time: item.submittedAt ?? "2026-07-01 14:10",
    statusAfter: "待审核",
  });
  if (item.status === "已退回") {
    logs.push({
      id: `${item.id}-ca-3`,
      action: "驳回",
      operator: "王审核",
      time: item.updatedAt,
      comment: item.rejectComment,
      statusAfter: "已退回",
    });
  }
  if (item.status === "已入库") {
    logs.push({
      id: `${item.id}-ca-3`,
      action: "审核通过",
      operator: "王审核",
      time: item.updatedAt,
      statusAfter: "已入库",
    });
  }
  return logs;
}

const coveredDocIds = new Set(HANDCRAFTED_CONTRIBUTIONS.map((item) => item.docId));
const FALLBACK_CONTRIBUTIONS = DOCS.filter((doc) => !coveredDocIds.has(doc.id)).map(
  (doc, index) => buildFallbackContribution(doc, index),
);

export const QUESTION_CONTRIBUTIONS: QuestionContribution[] = [
  ...HANDCRAFTED_CONTRIBUTIONS,
  ...FALLBACK_CONTRIBUTIONS,
];

export const CONTRIBUTION_AUDIT_LOGS: Record<string, ContributionAuditRecord[]> = {
  ...HANDCRAFTED_AUDIT_LOGS,
  ...Object.fromEntries(
    FALLBACK_CONTRIBUTIONS.map((item) => [item.id, buildFallbackAuditLogs(item)]),
  ),
};

export function getContributionsByDoc(docId: string): QuestionContribution[] {
  return QUESTION_CONTRIBUTIONS.filter((c) => c.docId === docId);
}

export function getReturnedContributionCount(): number {
  return QUESTION_CONTRIBUTIONS.filter((c) => c.status === "已退回").length;
}

export function getReturnedCountByDoc(docId: string): number {
  return QUESTION_CONTRIBUTIONS.filter((c) => c.docId === docId && c.status === "已退回").length;
}

export function getDocIdsWithReturnedContributions(): string[] {
  return [...new Set(QUESTION_CONTRIBUTIONS.filter((c) => c.status === "已退回").map((c) => c.docId))];
}

export const CONTRIBUTION_STATUS_LABEL: Record<ContributionStatus, string> = {
  草稿: "草稿",
  待审核: "待审核",
  已退回: "已退回",
  已入库: "已入库",
};

export const CONTRIBUTION_STATUS_STYLE: Record<ContributionStatus, string> = {
  草稿: "bg-muted text-muted-foreground",
  待审核: "bg-primary-soft text-primary",
  已退回: "bg-destructive/10 text-destructive",
  已入库: "bg-success-soft text-success",
};
