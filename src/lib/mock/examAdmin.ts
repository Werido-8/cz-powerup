// Mock data for the exam administration (考试管理) page.

import { buildExamPaper100Groups, EXAM_PAPER_100_COUNT } from "./exam-paper-100";
import { buildExamRoster } from "./examRoster";

export type QuestionType = "单选题" | "多选题" | "判断题" | "填空题" | "案例分析题" | "简答题";
export type Difficulty = "易" | "中" | "难";

export interface ReviewQuestion {
  id: string;
  stem: string;
  type: QuestionType;
  knowledge: string;
  difficulty: Difficulty;
  source: string;
  similarRisk: "无" | "低" | "中" | "高";
  origin: "AI 生成" | "人工录入";
  status: "待审核" | "退回修改" | "已入库" | "已合并" | "已退回";
}

export interface BankQuestion {
  id: string;
  stem: string;
  type: QuestionType;
  knowledge: string;
  difficulty: Difficulty;
  source: string;
  usedCount: number;
  lastUsed: string;
  correctRate: number;
  status: "启用" | "禁用";
}

export type ExamGoal = "取证复习" | "复证巩固" | "岗位达标" | "阶段测评" | "日常自测";
export type PaperSource = "手动创建" | "智能组卷" | "历史试卷复制";

export interface Paper {
  id: string;
  name: string;
  goal: ExamGoal;
  category: string;
  questionCount: number;
  duration: number; // minutes
  createdAt: string;
  source: PaperSource;
  assigned: number; // 去重后的下发人数
  assignTimes: number; // 累计下发记录数
  finished: number; // 按每人最新一次记录统计的完成人数
  /** 平均正确率：每人最新一次答卷中，答对题数 / 总题数 × 100%，再取平均；更适合判断掌握情况 */
  avgCorrect: number;
  /** 平均分：每人最新一次答卷的实际得分平均值；更适合传统考试结果参考 */
  avgScore: number;
  avgDuration: number; // minutes
  status: "草稿" | "已下发" | "已结束";
}

export interface AssignRecord {
  id: string;
  user: string;
  team: string;
  specialty: string;
  status: "未开始" | "进行中" | "已提交";
  score: number | null;
  correctRate: number | null;
  duration: number | null;
  submittedAt: string | null;
  rule: "标准卷" | "题目乱序" | "题目+选项乱序" | "每人独立卷面";
}

export interface AnswerDetailItem {
  no: number;
  stem: string;
  type: QuestionType;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  analysis: string;
  evidence: string;
  wrongTags: string[];
  options?: { key: string; text: string }[];
}

export const EXAM_STATS = [
  {
    key: "pending",
    label: "待审核题目",
    value: "23",
    hint: "AI 生成 17 · 人工 6",
    tone: "warning" as const,
  },
  { key: "bank", label: "题库总量", value: "1,842", hint: "本月新增 86", tone: "primary" as const },
  { key: "issued", label: "已下发试卷", value: "37", hint: "进行中 9", tone: "primary" as const },
  { key: "finish", label: "答题完成率", value: "82%", hint: "近 30 天", tone: "success" as const },
  { key: "correct", label: "平均正确率", value: "76%", hint: "全部试卷", tone: "success" as const },
  { key: "time", label: "平均用时", value: "26 分", hint: "单卷均值", tone: "primary" as const },
];

/** 题库管理页专用概览（题库资产维护视角，不含考试结果类指标） */
export const BANK_OVERVIEW_STATS: ExamStatItem[] = [
  {
    key: "pending",
    label: "待审核题目",
    value: "23",
    hint: "待审核队列",
    detail: "AI 生成 17 · 人工 6",
    tone: "warning",
  },
  {
    key: "bank",
    label: "题库总量",
    value: "1,842",
    hint: "正式题库资产",
    detail: "本月新增 86",
    tone: "primary",
  },
  {
    key: "active",
    label: "启用题目",
    value: "1,568",
    hint: "当前可用题目",
    detail: "禁用 274",
    tone: "primary",
  },
  {
    key: "optimize",
    label: "待优化题目",
    value: "36",
    hint: "建议优化处理",
    detail: "低正确率 21 · 长期未用 15",
    tone: "warning",
  },
];

export type ExamStatItem = {
  key: string;
  label: string;
  value: string;
  /** 数值下方说明 */
  hint?: string;
  /** 底部分隔线内补充说明 */
  detail?: string;
  tone: "warning" | "primary" | "success";
};

/** 考试管理页专用概览（不含题库审核类指标） */
export function buildExamAdminStats(papers: Paper[]): ExamStatItem[] {
  const draftCount = papers.filter((p) => p.status === "草稿").length;
  const issuedCount = papers.filter((p) => p.status === "已下发").length;
  const endedCount = papers.filter((p) => p.status === "已结束").length;
  const totalAssigned = papers.reduce((s, p) => s + p.assigned, 0);
  const totalFinished = papers.reduce((s, p) => s + p.finished, 0);
  const finishRate = totalAssigned > 0 ? Math.round((totalFinished / totalAssigned) * 100) : 0;

  const withMetrics = papers.filter((p) => p.assigned > 0 && p.avgCorrect > 0);
  const avgCorrect =
    withMetrics.length > 0
      ? Math.round(withMetrics.reduce((s, p) => s + p.avgCorrect, 0) / withMetrics.length)
      : 0;

  return [
    {
      key: "papers",
      label: "试卷总数",
      value: String(papers.length),
      hint: "全部试卷",
      detail: `草稿 ${draftCount} · 已结束 ${endedCount}`,
      tone: "primary",
    },
    {
      key: "issued",
      label: "已下发试卷",
      value: String(issuedCount),
      hint: "正在进行的考试",
      detail: `进行中 ${issuedCount}`,
      tone: "primary",
    },
    {
      key: "assigned",
      label: "累计参考人次",
      value: totalAssigned.toLocaleString("zh-CN"),
      hint: "下发覆盖人次",
      detail: `已完成 ${totalFinished.toLocaleString("zh-CN")} 人次`,
      tone: "primary",
    },
    {
      key: "finish",
      label: "答题完成率",
      value: `${finishRate}%`,
      hint: "参考完成比例",
      detail: "全部已下发",
      tone: "success",
    },
    {
      key: "correct",
      label: "平均正确率",
      value: `${avgCorrect}%`,
      hint: "全部试卷均值",
      detail: "含已结束与进行中",
      tone: "success",
    },
  ];
}

const REVIEW_QUESTION_SEEDS: ReviewQuestion[] = [
  {
    id: "rq1",
    stem: "AGC 投入运行后,机组实际出力与调度指令偏差持续超过 ±3% 时,应优先采取下列哪项处理?",
    type: "单选题",
    knowledge: "AGC / 两细则",
    difficulty: "中",
    source: "AGC 控制器 SOP v2024.06",
    similarRisk: "中",
    origin: "AI 生成",
    status: "待审核",
  },
  {
    id: "rq2",
    stem: "一次调频死区设置过大,会导致机组在小扰动下不动作。(判断)",
    type: "判断题",
    knowledge: "一次调频",
    difficulty: "易",
    source: "两细则考核知识点汇编 v2024.05",
    similarRisk: "高",
    origin: "AI 生成",
    status: "待审核",
  },
  {
    id: "rq3",
    stem: "某 220kV 主变停役操作中,误将中性点接地刀闸先于断路器拉开,试分析风险并给出正确操作顺序。",
    type: "案例分析题",
    knowledge: "主变停役",
    difficulty: "难",
    source: "厂站运行规程(华东 A 厂) v2024.07",
    similarRisk: "低",
    origin: "人工录入",
    status: "待审核",
  },
  {
    id: "rq4",
    stem: "下列关于安控装置联动配合的描述,正确的有哪些?",
    type: "多选题",
    knowledge: "安控配合",
    difficulty: "中",
    source: "安控装置运行规程 v2023.09",
    similarRisk: "无",
    origin: "AI 生成",
    status: "待审核",
  },
  {
    id: "rq5",
    stem: "母线差动保护动作后,运行人员应在多长时间内完成对故障母线的隔离?",
    type: "单选题",
    knowledge: "差动保护",
    difficulty: "中",
    source: "差动保护误动复盘案例库 v2023.11",
    similarRisk: "中",
    origin: "AI 生成",
    status: "待审核",
  },
];

const ADDITIONAL_REVIEW_QUESTIONS = [
  [
    "AVC 投入闭环控制前，应核对哪些母线电压与无功边界条件？",
    "多选题",
    "AVC 控制",
    "中",
    "AVC 控制策略说明 v2024.03",
    "AI 生成",
  ],
  [
    "一次调频动作后，运行人员应重点监视哪些机组参数？",
    "多选题",
    "一次调频",
    "中",
    "一次调频运行导则 v2024.02",
    "人工录入",
  ],
  [
    "AGC 指令长时间不刷新时，应如何判断调度链路是否异常？",
    "案例分析题",
    "AGC 异常处置",
    "难",
    "AGC 异常处置卡 v2024.06",
    "AI 生成",
  ],
  [
    "主变并列运行前必须满足哪些基本条件？",
    "多选题",
    "主变并列",
    "中",
    "厂站运行规程 v2024.07",
    "AI 生成",
  ],
  [
    "保护装置检修压板退出后，可以不登记直接恢复运行。(判断)",
    "判断题",
    "继电保护",
    "易",
    "继电保护现场管理细则 v2024.01",
    "人工录入",
  ],
  [
    "母线电压越上限时，AVC 的首选调节对象应遵循什么原则？",
    "单选题",
    "AVC 控制",
    "中",
    "AVC 控制策略说明 v2024.03",
    "AI 生成",
  ],
  [
    "一次调频贡献电量的考核统计周期如何确定？",
    "单选题",
    "一次调频 / 两细则",
    "难",
    "两个细则考核知识点汇编 v2024.05",
    "AI 生成",
  ],
  [
    "发生直流系统接地告警后，查找接地点时有哪些操作禁忌？",
    "多选题",
    "直流系统",
    "中",
    "直流系统异常处置规程 v2023.12",
    "人工录入",
  ],
  [
    "发电机失磁保护动作后，值班人员应按什么顺序开展检查？",
    "案例分析题",
    "发电机保护",
    "难",
    "发电机保护事故案例 v2023.10",
    "AI 生成",
  ],
  [
    "倒闸操作票执行中发现设备名称与现场不一致，应如何处置？",
    "单选题",
    "倒闸操作",
    "易",
    "倒闸操作管理制度 v2024.04",
    "人工录入",
  ],
  [
    "AGC 可用率下降时，应区分哪些设备侧与通信侧原因？",
    "多选题",
    "AGC 可用率",
    "中",
    "AGC 控制器 SOP v2024.06",
    "AI 生成",
  ],
  [
    "厂用电快切装置闭锁后，运行人员应立即强制启动切换。(判断)",
    "判断题",
    "厂用电快切",
    "中",
    "厂用电系统运行规程 v2024.02",
    "AI 生成",
  ],
  [
    "发生线路重合闸拒动时，现场检查应优先确认哪些信号？",
    "多选题",
    "重合闸",
    "中",
    "线路保护异常处置卡 v2024.01",
    "AI 生成",
  ],
  [
    "机组无功出力达到限制值后，AVC 仍持续增磁可能带来什么风险？",
    "案例分析题",
    "AVC 限值",
    "难",
    "AVC 控制策略说明 v2024.03",
    "AI 生成",
  ],
  [
    "执行接地线装设操作前，应完成哪些验电与闭锁确认？",
    "多选题",
    "安全操作",
    "易",
    "电业安全工作规程 v2024.01",
    "人工录入",
  ],
  [
    "一次调频退出期间，运行日志至少应记录哪些信息？",
    "多选题",
    "一次调频",
    "易",
    "一次调频运行导则 v2024.02",
    "AI 生成",
  ],
  [
    "保护动作报告中的启动量、动作量与出口量分别说明什么？",
    "简答题",
    "继电保护",
    "难",
    "继电保护分析手册 v2023.11",
    "AI 生成",
  ],
  [
    "新员工首次独立巡检前，需要完成哪些授权与能力确认？",
    "多选题",
    "新员工基础",
    "易",
    "运行岗位培训管理办法 v2024.05",
    "人工录入",
  ],
] satisfies Array<
  readonly [string, QuestionType, string, Difficulty, string, ReviewQuestion["origin"]]
>;

export const REVIEW_QUESTIONS: ReviewQuestion[] = [
  ...REVIEW_QUESTION_SEEDS,
  ...ADDITIONAL_REVIEW_QUESTIONS.map(
    ([stem, type, knowledge, difficulty, source, origin], index): ReviewQuestion => ({
      id: `rq${index + REVIEW_QUESTION_SEEDS.length + 1}`,
      stem,
      type,
      knowledge,
      difficulty,
      source,
      similarRisk: index % 7 === 0 ? "高" : index % 3 === 0 ? "中" : "低",
      origin,
      status: "待审核",
    }),
  ),
];

const BASE_BANK_QUESTIONS: BankQuestion[] = [
  {
    id: "bq1",
    stem: "AGC 控制方式下,机组响应调度指令的速率不满足要求会被两细则如何考核?",
    type: "单选题",
    knowledge: "AGC / 两细则",
    difficulty: "中",
    source: "AGC 控制器 SOP v2024.06",
    usedCount: 28,
    lastUsed: "2026-06-12",
    correctRate: 71,
    status: "启用",
  },
  {
    id: "bq2",
    stem: "一次调频的负荷响应应在频率越限后多少秒内开始?",
    type: "单选题",
    knowledge: "一次调频",
    difficulty: "中",
    source: "两细则考核知识点汇编 v2024.05",
    usedCount: 41,
    lastUsed: "2026-06-15",
    correctRate: 64,
    status: "启用",
  },
  {
    id: "bq3",
    stem: "主变停役前必须确认的安全措施包括哪些?",
    type: "多选题",
    knowledge: "主变停役",
    difficulty: "难",
    source: "厂站运行规程(华东 A 厂) v2024.07",
    usedCount: 16,
    lastUsed: "2026-06-08",
    correctRate: 58,
    status: "启用",
  },
  {
    id: "bq4",
    stem: "差动保护属于主保护,具备绝对选择性。(判断)",
    type: "判断题",
    knowledge: "差动保护",
    difficulty: "易",
    source: "差动保护误动复盘案例库 v2023.11",
    usedCount: 55,
    lastUsed: "2026-06-16",
    correctRate: 83,
    status: "启用",
  },
  {
    id: "bq5",
    stem: "结合一次调频死区与调差率,分析机组频繁动作的可能原因。",
    type: "案例分析题",
    knowledge: "一次调频",
    difficulty: "难",
    source: "两细则考核知识点汇编 v2024.05",
    usedCount: 9,
    lastUsed: "2026-05-30",
    correctRate: 49,
    status: "禁用",
  },
  {
    id: "bq6",
    stem: "安控装置切机切负荷动作后,运行人员的汇报与处理流程是什么?",
    type: "简答题",
    knowledge: "安控配合",
    difficulty: "中",
    source: "安控装置运行规程 v2023.09",
    usedCount: 22,
    lastUsed: "2026-06-11",
    correctRate: 67,
    status: "启用",
  },
];

type BankQuestionSeed = Omit<BankQuestion, "id"> & {
  options?: { key: string; text: string }[];
  answer: string;
  analysis: string;
  section?: string;
};

const ADDITIONAL_BANK_SEEDS: BankQuestionSeed[] = [
  {
    stem: "AGC 投入后机组出力与调度指令偏差持续超过 ±3% 时,应优先采取哪项措施?",
    type: "单选题",
    knowledge: "AGC / 两细则",
    difficulty: "中",
    source: "AGC 控制器 SOP v2024.06",
    usedCount: 33,
    lastUsed: "2026-06-14",
    correctRate: 69,
    status: "启用",
    options: [
      { key: "A", text: "立即大幅手动调整出力" },
      { key: "B", text: "检查 AGC 通道及测点,必要时切至手动" },
      { key: "C", text: "直接退出一次调频" },
      { key: "D", text: "等待下一调度周期自动恢复" },
    ],
    answer: "B",
    analysis: "偏差持续超限应先排查通道与测点,必要时切手动,避免盲目大幅调出力。",
    section: "AGC 控制器 SOP v2024.06 · 第 4.2 节",
  },
  {
    stem: "下列哪些属于两细则中 AGC 性能评价的核心指标?",
    type: "多选题",
    knowledge: "AGC / 两细则",
    difficulty: "中",
    source: "两细则考核知识点汇编 v2024.05",
    usedCount: 27,
    lastUsed: "2026-06-13",
    correctRate: 62,
    status: "启用",
    options: [
      { key: "A", text: "调节速率" },
      { key: "B", text: "调节精度" },
      { key: "C", text: "响应时间" },
      { key: "D", text: "线损率" },
    ],
    answer: "ABC",
    analysis: "AGC 考核三项指标为调节速率、调节精度与响应时间。",
  },
  {
    stem: "AGC 死区越大越有利于通过调节精度考核。(判断)",
    type: "判断题",
    knowledge: "AGC / 两细则",
    difficulty: "易",
    source: "AGC 控制器 SOP v2024.06",
    usedCount: 38,
    lastUsed: "2026-06-10",
    correctRate: 78,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "F",
    analysis: "死区过大虽减少动作,但不利于精准跟踪与考核,变更须经调度同意。",
  },
  {
    stem: "AVC 投自动后发生电压越限,值班员应在多长时间内完成报警确认?",
    type: "单选题",
    knowledge: "AVC",
    difficulty: "中",
    source: "AVC 电压无功控制运行导则 v2024.03",
    usedCount: 19,
    lastUsed: "2026-06-09",
    correctRate: 73,
    status: "启用",
    options: [
      { key: "A", text: "1 分钟内" },
      { key: "B", text: "10 分钟内" },
      { key: "C", text: "1 小时内" },
      { key: "D", text: "下班前即可" },
    ],
    answer: "A",
    analysis: "应在 1 分钟内确认报警类别并具备手动接管能力。",
  },
  {
    stem: "AVC 与 AGC 发生协调闭锁时,值班员应先确认什么?",
    type: "单选题",
    knowledge: "AVC",
    difficulty: "难",
    source: "AVC 电压无功控制运行导则 v2024.03",
    usedCount: 14,
    lastUsed: "2026-06-07",
    correctRate: 55,
    status: "启用",
    options: [
      { key: "A", text: "闭锁原因码,必要时切手动维持关键指标" },
      { key: "B", text: "直接加大无功指令" },
      { key: "C", text: "立即退出全部保护" },
      { key: "D", text: "无需处理等待自动解锁" },
    ],
    answer: "A",
    analysis: "应先确认闭锁原因,必要时切手动,解锁前复核限幅与目标。",
  },
  {
    stem: "下列关于 AVC 投运的说法正确的有哪些?",
    type: "多选题",
    knowledge: "AVC",
    difficulty: "中",
    source: "AVC 电压无功控制运行导则 v2024.03",
    usedCount: 21,
    lastUsed: "2026-06-05",
    correctRate: 66,
    status: "启用",
    options: [
      { key: "A", text: "投运前应核对电压目标与限幅" },
      { key: "B", text: "可在电压异常时强行保持自动" },
      { key: "C", text: "闭锁后应及时汇报并记录" },
      { key: "D", text: "与 AGC 协调策略需按规程执行" },
    ],
    answer: "ACD",
    analysis: "异常时应具备切手动能力,不可强行保持自动。",
  },
  {
    stem: "AVC 退出自动后无需在运行日志中记录原因。(判断)",
    type: "判断题",
    knowledge: "AVC",
    difficulty: "易",
    source: "厂站运行规程(华东 A 厂) v2024.07",
    usedCount: 30,
    lastUsed: "2026-06-04",
    correctRate: 81,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "F",
    analysis: "退出自动属重要方式变更,须记录原因、时间与操作人。",
  },
  {
    stem: "一次调频死区设置过大,会导致机组在小扰动下不动作。(判断)",
    type: "判断题",
    knowledge: "一次调频",
    difficulty: "易",
    source: "两细则考核知识点汇编 v2024.05",
    usedCount: 47,
    lastUsed: "2026-06-15",
    correctRate: 86,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "T",
    analysis: "死区过大时小扰动无法触发一次调频动作。",
  },
  {
    stem: "一次调频的转速不等率一般整定为多少?",
    type: "单选题",
    knowledge: "一次调频",
    difficulty: "中",
    source: "一次调频试验与运维导则 v2024.02",
    usedCount: 25,
    lastUsed: "2026-06-12",
    correctRate: 70,
    status: "启用",
    options: [
      { key: "A", text: "1%~2%" },
      { key: "B", text: "4%~5%" },
      { key: "C", text: "8%~10%" },
      { key: "D", text: "15% 以上" },
    ],
    answer: "B",
    analysis: "常规机组一次调频转速不等率多整定在 4%~5%。",
  },
  {
    stem: "一次调频试验结束后,试验记录应在多长时间内提交?",
    type: "单选题",
    knowledge: "一次调频",
    difficulty: "易",
    source: "一次调频试验与运维导则 v2024.02",
    usedCount: 18,
    lastUsed: "2026-06-08",
    correctRate: 77,
    status: "启用",
    options: [
      { key: "A", text: "24 小时内" },
      { key: "B", text: "一周内" },
      { key: "C", text: "月底汇总即可" },
      { key: "D", text: "无需提交" },
    ],
    answer: "A",
    analysis: "试验后 24 小时内应整理记录、曲线与结论并提交审核。",
  },
  {
    stem: "影响一次调频可用率考核的因素通常包括哪些?",
    type: "多选题",
    knowledge: "一次调频",
    difficulty: "中",
    source: "两细则考核知识点汇编 v2024.05",
    usedCount: 23,
    lastUsed: "2026-06-06",
    correctRate: 61,
    status: "启用",
    options: [
      { key: "A", text: "装置投退状态" },
      { key: "B", text: "测频通道质量" },
      { key: "C", text: "死区与限幅整定" },
      { key: "D", text: "当日天气情况" },
    ],
    answer: "ABC",
    analysis: "可用率与投运状态、测频质量及参数整定密切相关。",
  },
  {
    stem: "500kV 主变停役操作中,拉开刀闸前应确认断路器已断开且无负荷。(判断)",
    type: "判断题",
    knowledge: "主变停役",
    difficulty: "易",
    source: "500kV 主变停役标准化操作程序 v3.2",
    usedCount: 36,
    lastUsed: "2026-06-14",
    correctRate: 88,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "T",
    analysis: "严禁带负荷拉合刀闸,拉开前必须确认断路器已断开。",
  },
  {
    stem: "母线倒闸必须坚持先合后拉,严禁带负荷拉合刀闸。(判断)",
    type: "判断题",
    knowledge: "典型操作",
    difficulty: "易",
    source: "厂站运行规程(华东 A 厂) v2024.07",
    usedCount: 44,
    lastUsed: "2026-06-13",
    correctRate: 91,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "T",
    analysis: "应先建立可靠并联路径再断开原路径。",
  },
  {
    stem: "有载分接开关检修后送电前,升降档试验应至少完成几个完整循环?",
    type: "单选题",
    knowledge: "典型操作",
    difficulty: "中",
    source: "主变压器检修导则 v2023.12",
    usedCount: 12,
    lastUsed: "2026-06-02",
    correctRate: 63,
    status: "启用",
    options: [
      { key: "A", text: "不少于两个完整循环" },
      { key: "B", text: "点动一次即可" },
      { key: "C", text: "送电后再试验" },
      { key: "D", text: "无需试验" },
    ],
    answer: "A",
    analysis: "验收要求在检修电源下完成不少于两个完整循环。",
  },
  {
    stem: "220kV 线路停役前必须核对的二次功能通常包括哪些?",
    type: "多选题",
    knowledge: "典型操作",
    difficulty: "中",
    source: "厂站运行规程(华东 A 厂) v2024.07",
    usedCount: 20,
    lastUsed: "2026-06-01",
    correctRate: 68,
    status: "启用",
    options: [
      { key: "A", text: "重合闸退出确认" },
      { key: "B", text: "备自投状态核对" },
      { key: "C", text: "保护定值区核对" },
      { key: "D", text: "取消全部特巡安排" },
    ],
    answer: "ABC",
    analysis: "停役前须确认重合闸、备自投与保护定值区等二次功能。",
  },
  {
    stem: "母差保护误动复盘中,现场应优先核查的二次原因是?",
    type: "单选题",
    knowledge: "差动保护",
    difficulty: "难",
    source: "差动保护误动复盘案例库 v2023.11",
    usedCount: 17,
    lastUsed: "2026-05-28",
    correctRate: 54,
    status: "启用",
    options: [
      { key: "A", text: "TA 极性与二次回路绝缘" },
      { key: "B", text: "主变油温是否超限" },
      { key: "C", text: "AGC 死区是否过大" },
      { key: "D", text: "环保设施是否投运" },
    ],
    answer: "A",
    analysis: "母差误动复盘应先核对 TA 极性、二次回路与定值。",
  },
  {
    stem: "差动保护动作后推荐的四步核查顺序是?",
    type: "单选题",
    knowledge: "差动保护",
    difficulty: "中",
    source: "差动保护误动复盘案例库 v2023.11",
    usedCount: 24,
    lastUsed: "2026-06-11",
    correctRate: 67,
    status: "启用",
    options: [
      { key: "A", text: "TA 极性 → 二次回路 → 定值 → 一次设备" },
      { key: "B", text: "一次设备 → 定值 → TA → 二次回路" },
      { key: "C", text: "定值 → 一次设备 → 二次回路 → TA" },
      { key: "D", text: "二次回路 → 一次设备 → 定值 → TA" },
    ],
    answer: "A",
    analysis: "推荐按 TA 极性、二次回路、定值、一次设备四步缩小范围。",
  },
  {
    stem: "母线倒闸误送电事故的直接原因通常包括哪些?",
    type: "多选题",
    knowledge: "历史案例",
    difficulty: "难",
    source: "母线倒闸误送电事故复盘报告 v2024.01",
    usedCount: 11,
    lastUsed: "2026-05-26",
    correctRate: 52,
    status: "启用",
    options: [
      { key: "A", text: "母联三相位置未核对到位" },
      { key: "B", text: "操作票漏写状态核对步骤" },
      { key: "C", text: "监护流于形式" },
      { key: "D", text: "AGC 死区设置过大" },
    ],
    answer: "ABC",
    analysis: "该案例定位为位置核对缺失、票面漏项与监护失效。",
  },
  {
    stem: "备自投误动导致全站失电的关键教训是?",
    type: "单选题",
    knowledge: "故障处置",
    difficulty: "难",
    source: "备自投误动失电案例库 v2023.08",
    usedCount: 15,
    lastUsed: "2026-05-22",
    correctRate: 57,
    status: "启用",
    options: [
      { key: "A", text: "检修前应退出备自投并核对一次方式与二次功能" },
      { key: "B", text: "检修期间可保留全部备自投功能" },
      { key: "C", text: "只需核对一次设备,无需核对二次功能" },
      { key: "D", text: "方式变更后口头通知即可" },
    ],
    answer: "A",
    analysis: "涉及方式变更必须执行一次方式、二次功能与调度令三联核对。",
  },
  {
    stem: "直流接地查找应遵循哪些原则?",
    type: "多选题",
    knowledge: "故障处置",
    difficulty: "中",
    source: "直流系统运行维护规程 v2024.04",
    usedCount: 26,
    lastUsed: "2026-06-09",
    correctRate: 65,
    status: "启用",
    options: [
      { key: "A", text: "先信号回路后控制回路" },
      { key: "B", text: "先备用后运行" },
      { key: "C", text: "每次拉路前后记录绝缘监测值" },
      { key: "D", text: "重要控制回路可擅自拉路" },
    ],
    answer: "ABC",
    analysis: "拉路法须先次要后重要,重要控制回路拉路须经值长批准。",
  },
  {
    stem: "GIS 气室 SF6 压力降至报警值后,下列做法正确的是?",
    type: "单选题",
    knowledge: "故障处置",
    difficulty: "中",
    source: "GIS 设备运行维护规程 v2023.10",
    usedCount: 13,
    lastUsed: "2026-06-03",
    correctRate: 72,
    status: "启用",
    options: [
      { key: "A", text: "立即汇报,查明泄漏点前不得盲目带压补气" },
      { key: "B", text: "直接带压补气至正常值" },
      { key: "C", text: "无需汇报,继续观察即可" },
      { key: "D", text: "立即强行操作相关开关" },
    ],
    answer: "A",
    analysis: "降至报警值应立即汇报并加强监视,查明泄漏点前不得盲目补气。",
  },
  {
    stem: "新员工交接班「四清」包括人员、设备、运行方式与异常事项。(判断)",
    type: "判断题",
    knowledge: "新员工基础",
    difficulty: "易",
    source: "运行岗位培训管理办法 v2024.05",
    usedCount: 52,
    lastUsed: "2026-06-16",
    correctRate: 90,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "T",
    analysis: "交接班须完成人员、设备、运行方式、异常事项的全面核对。",
  },
  {
    stem: "新员工首次独立巡检前,需要完成哪些授权与能力确认?",
    type: "多选题",
    knowledge: "新员工基础",
    difficulty: "中",
    source: "运行岗位培训管理办法 v2024.05",
    usedCount: 29,
    lastUsed: "2026-06-12",
    correctRate: 74,
    status: "启用",
    options: [
      { key: "A", text: "导师签字确认" },
      { key: "B", text: "岗位应知应会考核合格" },
      { key: "C", text: "值长授权" },
      { key: "D", text: "自行口头声明即可独立上岗" },
    ],
    answer: "ABC",
    analysis: "独立巡检前须完成培训考核、导师确认与值长授权。",
  },
  {
    stem: "两票三制中,操作人与监护人可以是同一人。(判断)",
    type: "判断题",
    knowledge: "新员工基础",
    difficulty: "易",
    source: "电力安全工作规程(发电厂和变电站电气部分)",
    usedCount: 48,
    lastUsed: "2026-06-15",
    correctRate: 93,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "F",
    analysis: "操作人与监护人必须分开,严禁单人操作重要电气设备。",
  },
  {
    stem: "厂站运行规程与通用规程冲突时,本站应如何执行?",
    type: "单选题",
    knowledge: "规程制度",
    difficulty: "中",
    source: "厂站运行规程(华东 A 厂) v2024.07",
    usedCount: 22,
    lastUsed: "2026-06-10",
    correctRate: 69,
    status: "启用",
    options: [
      { key: "A", text: "优先执行经批准的厂站资料" },
      { key: "B", text: "一律执行通用规程" },
      { key: "C", text: "由个人自行决定" },
      { key: "D", text: "暂停所有操作直至新规程印发" },
    ],
    answer: "A",
    analysis: "厂站资料优先适用,冲突时应请示值长并按批准口径执行。",
  },
  {
    stem: "继电保护定期检验宜尽可能安排在什么期间进行?",
    type: "单选题",
    knowledge: "规程制度",
    difficulty: "易",
    source: "继电保护及安全自动装置检验规程",
    usedCount: 31,
    lastUsed: "2026-06-08",
    correctRate: 80,
    status: "启用",
    options: [
      { key: "A", text: "一次设备停电检修期间" },
      { key: "B", text: "高峰负荷时段" },
      { key: "C", text: "AGC 试验当天" },
      { key: "D", text: "交接班过程中" },
    ],
    answer: "A",
    analysis: "定期检验宜尽可能在一次设备停电检修期间进行。",
  },
  {
    stem: "继电保护定值单现场执行前必须完成双人核对。(判断)",
    type: "判断题",
    knowledge: "规程制度",
    difficulty: "易",
    source: "继电保护及安全自动装置检验规程",
    usedCount: 40,
    lastUsed: "2026-06-14",
    correctRate: 89,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "T",
    analysis: "定值单须双人核对、审批生效后方可执行。",
  },
  {
    stem: "迎峰度夏期间主变温升接近限值时,值班员应优先采取哪项措施?",
    type: "单选题",
    knowledge: "规程制度",
    difficulty: "中",
    source: "迎峰度夏保供电专项方案 v2025",
    usedCount: 16,
    lastUsed: "2026-06-07",
    correctRate: 71,
    status: "启用",
    options: [
      { key: "A", text: "立即拉开主变" },
      { key: "B", text: "汇报值长,检查冷却装置并视情况调整负荷" },
      { key: "C", text: "等待自然降温" },
      { key: "D", text: "退出全部保护" },
    ],
    answer: "B",
    analysis: "应先汇报并检查冷却系统,必要时调整负荷,不可盲目停运。",
  },
  {
    stem: "迎峰度冬期间厂站应重点落实哪些工作?",
    type: "多选题",
    knowledge: "规程制度",
    difficulty: "中",
    source: "迎峰度冬保供电专项方案 v2025",
    usedCount: 18,
    lastUsed: "2026-05-30",
    correctRate: 75,
    status: "启用",
    options: [
      { key: "A", text: "防寒防冻检查" },
      { key: "B", text: "线路覆冰监测" },
      { key: "C", text: "备用电源与柴油发电机带载试验" },
      { key: "D", text: "取消全部特巡" },
    ],
    answer: "ABC",
    analysis: "度冬重点为防寒防冻、覆冰监测与备用电源可靠性。",
  },
  {
    stem: "结合某次母差误动事故,说明二次回路核查的关键步骤与记录要求。",
    type: "案例分析题",
    knowledge: "历史案例",
    difficulty: "难",
    source: "差动保护误动复盘案例库 v2023.11",
    usedCount: 8,
    lastUsed: "2026-05-18",
    correctRate: 46,
    status: "启用",
    answer: "按极性、回路、定值、一次设备顺序核查并留存记录。",
    analysis: "案例要求形成可复核的核查链与影像签字记录。",
  },
  {
    stem: "高峰时段励磁限制频繁动作导致无功不足,常见根因是?",
    type: "单选题",
    knowledge: "历史案例",
    difficulty: "难",
    source: "励磁限制动作案例复盘 v2024.02",
    usedCount: 10,
    lastUsed: "2026-05-20",
    correctRate: 51,
    status: "启用",
    options: [
      { key: "A", text: "AVR 限制曲线与电网电压水平不匹配" },
      { key: "B", text: "操作票未签字" },
      { key: "C", text: "直流系统一点接地" },
      { key: "D", text: "SF6 压力偏低" },
    ],
    answer: "A",
    analysis: "案例根因为 AVR 限制按冬季参数整定,未随季节校核。",
  },
  {
    stem: "机组深调时环保设施运行窗口变窄,应提前与环保专工沟通并监视污染物浓度趋势。(判断)",
    type: "判断题",
    knowledge: "规程制度",
    difficulty: "易",
    source: "深度调峰运行管控规定 v2024.06",
    usedCount: 14,
    lastUsed: "2026-06-05",
    correctRate: 84,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "T",
    analysis: "深调烟气量、烟温变化大,需协同监视脱硝、除尘、脱硫参数。",
  },
  {
    stem: "简述 AGC 退出运行后值班员应完成的汇报、记录与恢复确认要点。",
    type: "简答题",
    knowledge: "AGC / 两细则",
    difficulty: "中",
    source: "AGC 控制器 SOP v2024.06",
    usedCount: 19,
    lastUsed: "2026-06-11",
    correctRate: 66,
    status: "启用",
    answer: "汇报调度、记录原因时间、确认手动跟踪正常后再投自动。",
    analysis: "退出 AGC 须闭环汇报与记录,恢复前复核通道与测点。",
  },
  {
    stem: "PSS 投入后机组阻尼不足时,应优先核对哪些项目?",
    type: "多选题",
    knowledge: "故障处置",
    difficulty: "难",
    source: "励磁系统与 PSS 运维导则 v2023.07",
    usedCount: 7,
    lastUsed: "2026-05-15",
    correctRate: 48,
    status: "禁用",
    options: [
      { key: "A", text: "PSS 投退状态与参数区" },
      { key: "B", text: "机组运行工况与负荷点" },
      { key: "C", text: "相关测点质量" },
      { key: "D", text: "直接加大 AGC 死区" },
    ],
    answer: "ABC",
    analysis: "应核对 PSS 状态、工况与测点,不可盲目改 AGC 死区。",
  },
  {
    stem: "黑启动过程中厂用电恢复的优先顺序应遵循经批准的黑启动预案。(判断)",
    type: "判断题",
    knowledge: "故障处置",
    difficulty: "易",
    source: "黑启动预案与应急处置手册 v2024.01",
    usedCount: 12,
    lastUsed: "2026-05-25",
    correctRate: 85,
    status: "启用",
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "T",
    analysis: "黑启动须严格按批准预案执行厂用电与机组恢复顺序。",
  },
  {
    stem: "新员工基础:巡检发现设备异响时应如何处置?",
    type: "单选题",
    knowledge: "新员工基础",
    difficulty: "易",
    source: "运行岗位培训管理办法 v2024.05",
    usedCount: 35,
    lastUsed: "2026-06-13",
    correctRate: 82,
    status: "启用",
    options: [
      { key: "A", text: "立即汇报值长并保持安全距离观察" },
      { key: "B", text: "自行打开设备盖板检查" },
      { key: "C", text: "忽略并继续巡检路线" },
      { key: "D", text: "直接停电处理" },
    ],
    answer: "A",
    analysis: "发现异常应立即汇报,不得擅自拆检或盲目停电。",
  },
];

const BUILT_ADDITIONAL_BANK = ADDITIONAL_BANK_SEEDS.map((seed, index) => {
  const id = `bq${index + 7}`;
  const { options, answer, analysis, section, ...question } = seed;
  return {
    id,
    question: { id, ...question },
    detail: {
      options,
      answer,
      analysis,
      section: section ?? `${question.source} · 相关章节`,
    },
  };
});

export const BANK_QUESTIONS: BankQuestion[] = [
  ...BASE_BANK_QUESTIONS,
  ...BUILT_ADDITIONAL_BANK.map(({ question }) => question),
];

export const PAPERS: Paper[] = [
  {
    id: "p1",
    name: "AGC / 两细则取证复习考试",
    goal: "取证复习",
    category: "调频调压",
    questionCount: EXAM_PAPER_100_COUNT,
    duration: 30,
    createdAt: "2026-06-10",
    source: "智能组卷",
    assigned: 10,
    assignTimes: 12,
    finished: 10,
    avgCorrect: 72,
    avgScore: 74,
    avgDuration: 25,
    status: "已下发",
  },
  {
    id: "p2",
    name: "主变停送电典型操作岗位达标卷",
    goal: "岗位达标",
    category: "倒闸操作",
    questionCount: 25,
    duration: 40,
    createdAt: "2026-06-06",
    source: "手动创建",
    assigned: 25,
    assignTimes: 32,
    finished: 15,
    avgCorrect: 84,
    avgScore: 86,
    avgDuration: 33,
    status: "已下发",
  },
  {
    id: "p3",
    name: "差动保护复盘阶段测评",
    goal: "阶段测评",
    category: "继电保护",
    questionCount: 15,
    duration: 25,
    createdAt: "2026-06-14",
    source: "历史试卷复制",
    assigned: 0,
    assignTimes: 0,
    finished: 0,
    avgCorrect: 0,
    avgScore: 0,
    avgDuration: 0,
    status: "草稿",
  },
  {
    id: "p4",
    name: "新员工基础日常自测",
    goal: "日常自测",
    category: "厂站规程",
    questionCount: 30,
    duration: 45,
    createdAt: "2026-05-28",
    source: "智能组卷",
    assigned: 56,
    assignTimes: 70,
    finished: 56,
    avgCorrect: 81,
    avgScore: 84,
    avgDuration: 38,
    status: "已结束",
  },
  {
    id: "p5",
    name: "一次调频复证巩固卷",
    goal: "复证巩固",
    category: "调频调压",
    questionCount: 18,
    duration: 30,
    createdAt: "2026-06-12",
    source: "智能组卷",
    assigned: 12,
    assignTimes: 15,
    finished: 6,
    avgCorrect: 91,
    avgScore: 93,
    avgDuration: 26,
    status: "已下发",
  },
  {
    id: "p6",
    name: "AVC 电压无功自动控制专项考试",
    goal: "岗位达标",
    category: "AVC 控制",
    questionCount: 22,
    duration: 35,
    createdAt: "2026-06-11",
    source: "手动创建",
    assigned: 18,
    assignTimes: 22,
    finished: 14,
    avgCorrect: 58,
    avgScore: 61,
    avgDuration: 31,
    status: "已下发",
  },
  {
    id: "p7",
    name: "PSS 励磁系统原理与应用测评",
    goal: "阶段测评",
    category: "励磁系统",
    questionCount: 16,
    duration: 25,
    createdAt: "2026-06-09",
    source: "历史试卷复制",
    assigned: 0,
    assignTimes: 0,
    finished: 0,
    avgCorrect: 0,
    avgScore: 0,
    avgDuration: 0,
    status: "草稿",
  },
  {
    id: "p8",
    name: "一次调频两细则取证模拟卷",
    goal: "取证复习",
    category: "调频调压",
    questionCount: 20,
    duration: 30,
    createdAt: "2026-06-08",
    source: "智能组卷",
    assigned: 24,
    assignTimes: 28,
    finished: 19,
    avgCorrect: 52,
    avgScore: 55,
    avgDuration: 28,
    status: "已下发",
  },
  {
    id: "p9",
    name: "继电保护基础理论综合测评",
    goal: "日常自测",
    category: "继电保护",
    questionCount: 28,
    duration: 40,
    createdAt: "2026-06-07",
    source: "手动创建",
    assigned: 42,
    assignTimes: 48,
    finished: 38,
    avgCorrect: 83,
    avgScore: 85,
    avgDuration: 35,
    status: "已结束",
  },
  {
    id: "p10",
    name: "黑启动与电网应急处置专项卷",
    goal: "岗位达标",
    category: "应急处置",
    questionCount: 18,
    duration: 30,
    createdAt: "2026-06-05",
    source: "智能组卷",
    assigned: 25,
    assignTimes: 28,
    finished: 10,
    avgCorrect: 76,
    avgScore: 78,
    avgDuration: 29,
    status: "已下发",
  },
  {
    id: "p11",
    name: "电网调度规程复证巩固考试",
    goal: "复证巩固",
    category: "调度规程",
    questionCount: 24,
    duration: 35,
    createdAt: "2026-06-04",
    source: "历史试卷复制",
    assigned: 20,
    assignTimes: 24,
    finished: 18,
    avgCorrect: 65,
    avgScore: 68,
    avgDuration: 32,
    status: "已下发",
  },
  {
    id: "p12",
    name: "新能源并网运行管理阶段测评",
    goal: "阶段测评",
    category: "新能源",
    questionCount: 20,
    duration: 30,
    createdAt: "2026-06-03",
    source: "智能组卷",
    assigned: 0,
    assignTimes: 0,
    finished: 0,
    avgCorrect: 0,
    avgScore: 0,
    avgDuration: 0,
    status: "草稿",
  },
  {
    id: "p13",
    name: "厂用电系统典型操作达标卷",
    goal: "岗位达标",
    category: "倒闸操作",
    questionCount: 15,
    duration: 20,
    createdAt: "2026-06-02",
    source: "手动创建",
    assigned: 35,
    assignTimes: 40,
    finished: 32,
    avgCorrect: 88,
    avgScore: 90,
    avgDuration: 18,
    status: "已结束",
  },
  {
    id: "p14",
    name: "两票三制与现场安全日常测评",
    goal: "日常自测",
    category: "安全规程",
    questionCount: 25,
    duration: 30,
    createdAt: "2026-06-01",
    source: "智能组卷",
    assigned: 48,
    assignTimes: 52,
    finished: 45,
    avgCorrect: 86,
    avgScore: 88,
    avgDuration: 27,
    status: "已结束",
  },
  {
    id: "p15",
    name: "AGC 进阶调控取证复习卷",
    goal: "取证复习",
    category: "调频调压",
    questionCount: 22,
    duration: 35,
    createdAt: "2026-05-30",
    source: "历史试卷复制",
    assigned: 8,
    assignTimes: 10,
    finished: 7,
    avgCorrect: 88,
    avgScore: 90,
    avgDuration: 33,
    status: "已下发",
  },
  {
    id: "p16",
    name: "主变压器检修复证巩固测评",
    goal: "复证巩固",
    category: "设备检修",
    questionCount: 19,
    duration: 28,
    createdAt: "2026-05-28",
    source: "手动创建",
    assigned: 0,
    assignTimes: 0,
    finished: 0,
    avgCorrect: 0,
    avgScore: 0,
    avgDuration: 0,
    status: "草稿",
  },
];

export const EXAM_ADMIN_STATS = buildExamAdminStats(PAPERS);

export const PAPER_CATEGORIES = Array.from(new Set(PAPERS.map((p) => p.category))).sort();

export const ASSIGN_RECORDS: AssignRecord[] = [
  {
    id: "a1",
    user: "李工",
    team: "运行一班",
    specialty: "运行专业",
    status: "已提交",
    score: 88,
    correctRate: 88,
    duration: 24,
    submittedAt: "2026-06-12 10:24",
    rule: "每人独立卷面",
  },
  {
    id: "a2",
    user: "王工",
    team: "运行一班",
    specialty: "运行专业",
    status: "已提交",
    score: 76,
    correctRate: 76,
    duration: 28,
    submittedAt: "2026-06-12 11:02",
    rule: "每人独立卷面",
  },
  {
    id: "a3",
    user: "赵工",
    team: "运行二班",
    specialty: "运行专业",
    status: "进行中",
    score: null,
    correctRate: null,
    duration: null,
    submittedAt: null,
    rule: "每人独立卷面",
  },
  {
    id: "a4",
    user: "孙工",
    team: "运行二班",
    specialty: "运行专业",
    status: "未开始",
    score: null,
    correctRate: null,
    duration: null,
    submittedAt: null,
    rule: "每人独立卷面",
  },
  {
    id: "a5",
    user: "周工",
    team: "运行三班",
    specialty: "运行专业",
    status: "已提交",
    score: 64,
    correctRate: 64,
    duration: 30,
    submittedAt: "2026-06-13 09:15",
    rule: "题目+选项乱序",
  },
];

export const ANSWER_DETAIL: AnswerDetailItem[] = [
  {
    no: 1,
    stem: "AGC 投入后机组出力与调度指令偏差持续超过 ±3% 应优先采取?",
    type: "单选题",
    correctAnswer: "B. 检查 AGC 通道及测点,必要时切至手动",
    userAnswer: "B. 检查 AGC 通道及测点,必要时切至手动",
    isCorrect: true,
    analysis: "偏差持续超限应先排查通道与测点,避免盲目调整出力。",
    evidence: "AGC 控制器 SOP v2024.06 · 第 4.2 节",
    wrongTags: [],
  },
  {
    no: 2,
    stem: "一次调频的负荷响应应在频率越限后多少秒内开始?",
    type: "单选题",
    correctAnswer: "A. 3 秒内",
    userAnswer: "C. 15 秒内",
    isCorrect: false,
    analysis: "一次调频要求快速响应,应在频率越限后 3 秒内开始动作。",
    evidence: "两细则考核知识点汇编 v2024.05 · 第 2.1 节",
    wrongTags: ["一次调频", "响应时序"],
  },
  {
    no: 3,
    stem: "主变停役前必须确认的安全措施包括哪些?",
    type: "多选题",
    correctAnswer: "ABD",
    userAnswer: "AB",
    isCorrect: false,
    analysis: "漏选 D(验明无电压并装设接地线),安全措施不完整。",
    evidence: "厂站运行规程(华东 A 厂) v2024.07 · 第 6.3 节",
    wrongTags: ["主变停役", "安全措施"],
  },
];

/** 从答卷项解析用户/正确答案的选项 key 集合 */
export function parseAnswerKeys(answer: string, type: QuestionType): Set<string> {
  if (!answer || answer === "未作答") return new Set();
  if (type === "多选题") {
    return new Set(
      answer
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .split("")
        .filter(Boolean),
    );
  }
  if (type === "判断题") {
    if (/^T|正确/.test(answer)) return new Set(["T"]);
    if (/^F|错误/.test(answer)) return new Set(["F"]);
  }
  const m = answer.trim().match(/^([A-Z])/i);
  return m ? new Set([m[1].toUpperCase()]) : new Set();
}

/** 获取答卷题目的选项列表（优先 item.options，其次 PAPER_PREVIEW） */
export function getAnswerQuestionOptions(
  item: AnswerDetailItem,
): { key: string; text: string }[] | undefined {
  if (item.options?.length) return item.options;
  for (const section of PAPER_PREVIEW) {
    const q = section.questions.find((q) => q.no === item.no);
    if (q?.options?.length) return q.options;
  }
  return undefined;
}

export const GEN_PREVIEW = {
  knowledgeCoverage: [
    { name: "AGC / 两细则", count: 8 },
    { name: "一次调频", count: 6 },
    { name: "调压无功", count: 4 },
    { name: "安控配合", count: 2 },
  ],
  typeRatio: [
    { name: "单选题", count: 10 },
    { name: "多选题", count: 4 },
    { name: "判断题", count: 4 },
    { name: "案例分析题", count: 2 },
  ],
  difficulty: [
    { name: "易", count: 5 },
    { name: "中", count: 11 },
    { name: "难", count: 4 },
  ],
  dupRisk: "低",
  questions: [
    {
      no: 1,
      stem: "AGC 控制方式下机组响应速率不满足要求的考核方式?",
      type: "单选题" as QuestionType,
      difficulty: "中" as Difficulty,
    },
    {
      no: 2,
      stem: "一次调频死区设置过大的影响?",
      type: "判断题" as QuestionType,
      difficulty: "易" as Difficulty,
    },
    {
      no: 3,
      stem: "结合调差率分析机组频繁动作原因。",
      type: "案例分析题" as QuestionType,
      difficulty: "难" as Difficulty,
    },
    {
      no: 4,
      stem: "两细则中对调峰考核的计分规则?",
      type: "单选题" as QuestionType,
      difficulty: "中" as Difficulty,
    },
    {
      no: 5,
      stem: "AGC 与一次调频协调配合的要点有哪些?",
      type: "多选题" as QuestionType,
      difficulty: "中" as Difficulty,
    },
  ],
};

export const PERSONNEL = [
  { id: "u1", user: "李工", team: "运行一班", specialty: "运行专业" },
  { id: "u2", user: "王工", team: "运行一班", specialty: "运行专业" },
  { id: "u3", user: "赵工", team: "运行二班", specialty: "运行专业" },
  { id: "u4", user: "孙工", team: "运行二班", specialty: "运行专业" },
  { id: "u5", user: "周工", team: "运行三班", specialty: "运行专业" },
  { id: "u6", user: "吴工", team: "运行三班", specialty: "运行专业" },
  { id: "u7", user: "郑工", team: "检修班", specialty: "继电保护" },
  { id: "u8", user: "钱工", team: "检修班", specialty: "电气专业" },
];

// ---------- Bank category navigation ----------
export type BankCategory = {
  key: string;
  name: string;
  count: number;
};

export const BANK_CATEGORIES: BankCategory[] = [
  { key: "all", name: "全部题目", count: 1842 },
  { key: "agc", name: "AGC/两细则", count: 128 },
  { key: "avc", name: "AVC", count: 72 },
  { key: "pf", name: "一次调频", count: 86 },
  { key: "op", name: "典型操作", count: 64 },
  { key: "fault", name: "故障处置", count: 95 },
  { key: "newbie", name: "新员工基础", count: 156 },
  { key: "reg", name: "规程制度", count: 88 },
  { key: "case", name: "历史案例", count: 53 },
];

// ---------- Paper editor ----------
export interface EditorQuestion {
  id: string;
  stem: string;
  knowledge: string;
  difficulty: Difficulty;
  source: string;
  score: number;
  options?: { key: string; text: string }[];
  answer?: string;
  blankCount?: number;
  /** 由 AI 组卷生成的题目标记，用于在编辑器中展示"AI 生成"标签 */
  isAIGenerated?: true;
}

export const PAPER_QUESTION_TYPES: QuestionType[] = [
  "单选题",
  "多选题",
  "判断题",
  "填空题",
  "简答题",
];

export const TYPE_PER_SCORE: Record<QuestionType, number> = {
  单选题: 2,
  多选题: 3,
  判断题: 1,
  填空题: 2,
  简答题: 5,
  案例分析题: 8,
};

export function defaultOptionsForType(
  type: QuestionType,
): { key: string; text: string }[] | undefined {
  if (type === "判断题") {
    return [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ];
  }
  return undefined;
}

export function editorQuestionFromBank(bank: BankQuestion, score: number): EditorQuestion {
  const detail = BANK_DETAILS[bank.id];
  const options = detail?.options ?? defaultOptionsForType(bank.type);
  return {
    id: bank.id,
    stem: bank.stem,
    knowledge: bank.knowledge,
    difficulty: bank.difficulty,
    source: bank.source,
    score,
    options,
    answer: detail?.answer,
    blankCount: bank.type === "填空题" ? Math.max(1, options?.length ?? 1) : undefined,
  };
}

export function createMockAiAppendQuestions(
  type: QuestionType,
  context: { knowledge: string; difficulty: Difficulty },
  score: number,
  existingIds: string[],
  count = 3,
): EditorQuestion[] {
  const isAlreadyUsed = (bankId: string) =>
    existingIds.some((id) => id === bankId || id.endsWith(`-${bankId}`));
  const candidates = BANK_QUESTIONS.filter(
    (question) =>
      question.type === type && question.status === "启用" && !isAlreadyUsed(question.id),
  ).sort((a, b) => {
    const relevance = (question: BankQuestion) =>
      Number(question.knowledge.includes(context.knowledge)) * 2 +
      Number(question.difficulty === context.difficulty);
    return relevance(b) - relevance(a);
  });

  return candidates.slice(0, count).map((question, index) => ({
    ...editorQuestionFromBank(question, score),
    id: `mock-ai-${existingIds.length + index + 1}-${question.id}`,
    knowledge: context.knowledge || question.knowledge,
    difficulty: context.difficulty,
    isAIGenerated: true,
  }));
}

export interface EditorGroup {
  type: QuestionType;
  perScore: number;
  questions: EditorQuestion[];
}

export const EMPTY_EDITOR_GROUPS: EditorGroup[] = [
  { type: "单选题", perScore: 2, questions: [] },
  { type: "多选题", perScore: 3, questions: [] },
  { type: "判断题", perScore: 1, questions: [] },
  { type: "填空题", perScore: 2, questions: [] },
  { type: "简答题", perScore: 5, questions: [] },
];

export const EDITOR_GROUPS: EditorGroup[] = buildExamPaper100Groups() as EditorGroup[];

// ---------- AI swap candidates ----------
export interface SwapCandidate {
  id: string;
  stem: string;
  reason: string;
  knowledge: string;
  difficulty: Difficulty;
  similarity: number;
  source: string;
}

export const SWAP_CANDIDATES: SwapCandidate[] = [
  {
    id: "s1",
    stem: "AGC 通道异常导致出力偏差超限时,正确的处置顺序是?",
    reason: "同知识点、难度提升一档,更贴近取证考试风格",
    knowledge: "AGC / 两细则",
    difficulty: "难",
    similarity: 82,
    source: "AGC 控制器 SOP v2024.06 · 第 4.2 节",
  },
  {
    id: "s2",
    stem: "两细则中对 AGC 调节速率不达标的考核计分规则是?",
    reason: "同知识点、避免重复考同一公式",
    knowledge: "AGC / 两细则",
    difficulty: "中",
    similarity: 68,
    source: "两细则考核知识点汇编 v2024.05 · 第 3.4 节",
  },
  {
    id: "s3",
    stem: "AGC 与一次调频协调配合不当可能引发的后果是?",
    reason: "拓展同知识点关联场景,难度适中",
    knowledge: "AGC / 两细则",
    difficulty: "中",
    similarity: 61,
    source: "AGC 控制器 SOP v2024.06 · 第 5.1 节",
  },
];

// ---------- Shuffle / anti-cheat presets ----------
export type ShuffleRule = "标准卷" | "题目乱序" | "题目+选项乱序" | "每人独立卷面";

// ---------- Full paper preview (what employees see) ----------
export interface PreviewQuestion {
  no: number;
  type: QuestionType;
  stem: string;
  score: number;
  options?: { key: string; text: string }[];
  blanks?: number; // number of fill-in blanks
}

export interface PreviewSection {
  type: QuestionType;
  perScore: number;
  questions: PreviewQuestion[];
}

export const PAPER_PREVIEW: PreviewSection[] = [
  {
    type: "单选题",
    perScore: 2,
    questions: [
      {
        no: 1,
        type: "单选题",
        stem: "AGC 投入运行后,机组实际出力与调度指令偏差持续超过 ±3% 时,应优先采取下列哪项处理?",
        score: 2,
        options: [
          { key: "A", text: "立即手动大幅调整出力以消除偏差" },
          { key: "B", text: "检查 AGC 通道及测点,必要时切至手动" },
          { key: "C", text: "退出一次调频功能" },
          { key: "D", text: "申请停机检查" },
        ],
      },
      {
        no: 2,
        type: "单选题",
        stem: "一次调频的负荷响应应在频率越限后多少秒内开始?",
        score: 2,
        options: [
          { key: "A", text: "3 秒内" },
          { key: "B", text: "8 秒内" },
          { key: "C", text: "15 秒内" },
          { key: "D", text: "30 秒内" },
        ],
      },
    ],
  },
  {
    type: "多选题",
    perScore: 3,
    questions: [
      {
        no: 3,
        type: "多选题",
        stem: "主变停役前必须确认的安全措施包括哪些?",
        score: 3,
        options: [
          { key: "A", text: "断开各侧断路器并确认" },
          { key: "B", text: "拉开各侧隔离开关" },
          { key: "C", text: "投入备用电源自投" },
          { key: "D", text: "验明无电压并装设接地线" },
        ],
      },
    ],
  },
  {
    type: "判断题",
    perScore: 1,
    questions: [
      {
        no: 4,
        type: "判断题",
        stem: "一次调频死区设置过大,会导致机组在小扰动下不动作。",
        score: 1,
        options: [
          { key: "T", text: "正确" },
          { key: "F", text: "错误" },
        ],
      },
    ],
  },
  {
    type: "填空题",
    perScore: 2,
    questions: [
      {
        no: 5,
        type: "填空题",
        stem: "一次调频的转速不等率一般整定为 ____%。",
        score: 2,
        blanks: 1,
      },
    ],
  },
  {
    type: "简答题",
    perScore: 5,
    questions: [
      {
        no: 6,
        type: "简答题",
        stem: "安控装置切机切负荷动作后,运行人员的汇报与处理流程是什么?",
        score: 5,
      },
    ],
  },
];

// ---------- Per-person answer details (for records drawer) ----------
export const PERSON_ANSWERS: Record<string, AnswerDetailItem[]> = {
  a1: [
    {
      no: 1,
      stem: "AGC 投入后机组出力与调度指令偏差持续超过 ±3% 应优先采取?",
      type: "单选题",
      correctAnswer: "B. 检查 AGC 通道及测点,必要时切至手动",
      userAnswer: "B. 检查 AGC 通道及测点,必要时切至手动",
      isCorrect: true,
      analysis: "偏差持续超限应先排查通道与测点,避免盲目调整出力。",
      evidence: "AGC 控制器 SOP v2024.06 · 第 4.2 节",
      wrongTags: [],
    },
    {
      no: 2,
      stem: "一次调频的负荷响应应在频率越限后多少秒内开始?",
      type: "单选题",
      correctAnswer: "A. 3 秒内",
      userAnswer: "A. 3 秒内",
      isCorrect: true,
      analysis: "一次调频要求快速响应,应在 3 秒内开始动作。",
      evidence: "两细则考核知识点汇编 v2024.05 · 第 2.1 节",
      wrongTags: [],
    },
    {
      no: 3,
      stem: "主变停役前必须确认的安全措施包括哪些?",
      type: "多选题",
      correctAnswer: "ABD",
      userAnswer: "ABD",
      isCorrect: true,
      analysis: "安全措施完整。",
      evidence: "厂站运行规程(华东 A 厂) v2024.07 · 第 6.3 节",
      wrongTags: [],
    },
  ],
  a2: [
    {
      no: 1,
      stem: "AGC 投入后机组出力与调度指令偏差持续超过 ±3% 应优先采取?",
      type: "单选题",
      correctAnswer: "B. 检查 AGC 通道及测点,必要时切至手动",
      userAnswer: "A. 立即手动大幅调整出力以消除偏差",
      isCorrect: false,
      analysis: "不应盲目调整出力,应先排查通道与测点。",
      evidence: "AGC 控制器 SOP v2024.06 · 第 4.2 节",
      wrongTags: ["AGC / 两细则", "异常处置"],
    },
    {
      no: 2,
      stem: "一次调频的负荷响应应在频率越限后多少秒内开始?",
      type: "单选题",
      correctAnswer: "A. 3 秒内",
      userAnswer: "A. 3 秒内",
      isCorrect: true,
      analysis: "一次调频要求快速响应。",
      evidence: "两细则考核知识点汇编 v2024.05 · 第 2.1 节",
      wrongTags: [],
    },
    {
      no: 3,
      stem: "主变停役前必须确认的安全措施包括哪些?",
      type: "多选题",
      correctAnswer: "ABD",
      userAnswer: "AB",
      isCorrect: false,
      analysis: "漏选 D(验明无电压并装设接地线)。",
      evidence: "厂站运行规程(华东 A 厂) v2024.07 · 第 6.3 节",
      wrongTags: ["主变停役", "安全措施"],
    },
  ],
  a5: [
    {
      no: 1,
      stem: "AGC 投入后机组出力与调度指令偏差持续超过 ±3% 应优先采取?",
      type: "单选题",
      correctAnswer: "B. 检查 AGC 通道及测点,必要时切至手动",
      userAnswer: "C. 退出一次调频功能",
      isCorrect: false,
      analysis: "退出一次调频与偏差处置无关。",
      evidence: "AGC 控制器 SOP v2024.06 · 第 4.2 节",
      wrongTags: ["AGC / 两细则"],
    },
    {
      no: 2,
      stem: "一次调频的负荷响应应在频率越限后多少秒内开始?",
      type: "单选题",
      correctAnswer: "A. 3 秒内",
      userAnswer: "C. 15 秒内",
      isCorrect: false,
      analysis: "应在 3 秒内开始动作。",
      evidence: "两细则考核知识点汇编 v2024.05 · 第 2.1 节",
      wrongTags: ["一次调频", "响应时序"],
    },
    {
      no: 3,
      stem: "主变停役前必须确认的安全措施包括哪些?",
      type: "多选题",
      correctAnswer: "ABD",
      userAnswer: "ABD",
      isCorrect: true,
      analysis: "安全措施完整。",
      evidence: "厂站运行规程(华东 A 厂) v2024.07 · 第 6.3 节",
      wrongTags: [],
    },
  ],
};

// ---------- Smart optimize diagnosis ----------
export interface KnowledgeDiag {
  name: string;
  ratio: number; // percent
  level: "偏高" | "偏低" | "合理";
}
export interface TypeDiag {
  name: QuestionType;
  count: number;
  ratio: number;
}
export interface DiffDiag {
  name: string;
  count: number;
}
export interface OptimizeSuggestion {
  id: string;
  kind: "替换题目" | "补充题目" | "删除题目" | "调整顺序" | "调整分值";
  target: string;
  reason: string;
  recommend: string;
  source: string;
  candidateLabel: string;
}

export const OPTIMIZE = {
  score: 78,
  summary: "这套试卷适合取证复习,但 AGC 考点占比偏高,多选题偏少,建议补充 AVC 和一次调频题目。",
  knowledge: [
    { name: "AGC / 两细则", ratio: 45, level: "偏高" },
    { name: "AVC", ratio: 5, level: "偏低" },
    { name: "一次调频", ratio: 15, level: "偏低" },
    { name: "典型操作", ratio: 20, level: "合理" },
    { name: "故障处置", ratio: 15, level: "合理" },
  ] as KnowledgeDiag[],
  types: [
    { name: "单选题", count: 10, ratio: 50 },
    { name: "多选题", count: 2, ratio: 10 },
    { name: "判断题", count: 4, ratio: 20 },
    { name: "填空题", count: 2, ratio: 10 },
    { name: "简答题", count: 2, ratio: 10 },
  ] as TypeDiag[],
  typeNote: "多选题偏少,题型结构略单一,建议适当增加多选题区分度。",
  difficulty: [
    { name: "基础", count: 9 },
    { name: "中等", count: 8 },
    { name: "提高", count: 3 },
  ] as DiffDiag[],
  diffNote: "基础题占比偏高,岗位达标卷区分度略显不足。",
  dupGroups: 2,
  dupNote: "疑似重复题组 2 组,涉及第 4 题与第 9 题、第 7 题与第 12 题。",
  suggestions: [
    {
      id: "o1",
      kind: "替换题目",
      target: "第 4 题",
      reason: "与第 9 题均考察 AGC 响应指标,考点重复。",
      recommend: "换为 AVC 投自动后电压越限处理流程题。",
      source: "AVC 运行规程 v2024.03 · 第 3.2 节",
      candidateLabel: "查看候选题",
    },
    {
      id: "o2",
      kind: "补充题目",
      target: "新增 1 道一次调频多选题",
      reason: "当前一次调频覆盖不足,题型也以单选为主。",
      recommend: "补充 1 道一次调频死区与调差率配合的多选题。",
      source: "两细则考核知识点汇编 v2024.05 · 第 2.3 节",
      candidateLabel: "查看候选题",
    },
    {
      id: "o3",
      kind: "删除题目",
      target: "减少 2 道基础单选题",
      reason: "基础题占比偏高,岗位达标卷区分度不足。",
      recommend: "删除第 2、第 6 题等较基础的单选题。",
      source: "—",
      candidateLabel: "查看题目",
    },
  ] as OptimizeSuggestion[],
};

// ---------- Per-person multi-issue records (一卷多次下发归档) ----------
export type RecordStatus = "未开始" | "进行中" | "已提交" | "已过期";
export type IssueReason = "首次下发" | "复测" | "补考" | "复证训练" | "阶段复习";

export interface PersonExamRecord {
  id: string;
  status: RecordStatus;
  reason: IssueReason;
  score: number | null;
  correctRate: number | null;
  duration: number | null; // minutes
  assignedAt: string;
  submittedAt: string | null;
  rule: ShuffleRule;
  answers: AnswerDetailItem[]; // empty if not submitted
}

export interface PersonAggregate {
  id: string;
  user: string;
  team: string;
  specialty: string;
  // records sorted newest first; [0] is the latest issue
  records: PersonExamRecord[];
}

export const RECORD_STATUS_OPTIONS: ("全部" | RecordStatus)[] = [
  "全部",
  "未开始",
  "进行中",
  "已提交",
  "已过期",
];

export const TEAM_OPTIONS = ["全部", "运行一班", "运行二班", "运行三班", "检修班"];

export const HISTORY_OPTIONS = ["全部", "有历史", "无历史"] as const;

export const PERSON_AGGREGATES: PersonAggregate[] = [
  {
    id: "u1",
    user: "李工",
    team: "运行一班",
    specialty: "运行专业",
    records: [
      {
        id: "u1-r2",
        status: "已提交",
        reason: "复测",
        score: 88,
        correctRate: 88,
        duration: 24,
        assignedAt: "2026-06-12 08:30",
        submittedAt: "2026-06-12 10:24",
        rule: "每人独立卷面",
        answers: PERSON_ANSWERS.a1,
      },
      {
        id: "u1-r1",
        status: "已提交",
        reason: "首次下发",
        score: 72,
        correctRate: 72,
        duration: 29,
        assignedAt: "2026-06-05 09:00",
        submittedAt: "2026-06-05 11:10",
        rule: "题目+选项乱序",
        answers: PERSON_ANSWERS.a2,
      },
    ],
  },
  {
    id: "u2",
    user: "王工",
    team: "运行一班",
    specialty: "运行专业",
    records: [
      {
        id: "u2-r1",
        status: "已提交",
        reason: "首次下发",
        score: 76,
        correctRate: 76,
        duration: 28,
        assignedAt: "2026-06-12 08:30",
        submittedAt: "2026-06-12 11:02",
        rule: "每人独立卷面",
        answers: PERSON_ANSWERS.a2,
      },
    ],
  },
  {
    id: "u3",
    user: "赵工",
    team: "运行二班",
    specialty: "运行专业",
    records: [
      {
        id: "u3-r2",
        status: "进行中",
        reason: "复测",
        score: null,
        correctRate: null,
        duration: null,
        assignedAt: "2026-06-15 09:00",
        submittedAt: null,
        rule: "每人独立卷面",
        answers: [],
      },
      {
        id: "u3-r1",
        status: "已提交",
        reason: "首次下发",
        score: 60,
        correctRate: 60,
        duration: 30,
        assignedAt: "2026-06-08 09:00",
        submittedAt: "2026-06-08 11:25",
        rule: "题目乱序",
        answers: PERSON_ANSWERS.a5,
      },
    ],
  },
  {
    id: "u4",
    user: "孙工",
    team: "运行二班",
    specialty: "运行专业",
    records: [
      {
        id: "u4-r1",
        status: "未开始",
        reason: "首次下发",
        score: null,
        correctRate: null,
        duration: null,
        assignedAt: "2026-06-15 09:00",
        submittedAt: null,
        rule: "每人独立卷面",
        answers: [],
      },
    ],
  },
  {
    id: "u5",
    user: "周工",
    team: "运行三班",
    specialty: "运行专业",
    records: [
      {
        id: "u5-r3",
        status: "已提交",
        reason: "补考",
        score: 64,
        correctRate: 64,
        duration: 30,
        assignedAt: "2026-06-13 08:00",
        submittedAt: "2026-06-13 09:15",
        rule: "题目+选项乱序",
        answers: PERSON_ANSWERS.a5,
      },
      {
        id: "u5-r2",
        status: "已过期",
        reason: "复测",
        score: null,
        correctRate: null,
        duration: null,
        assignedAt: "2026-06-09 08:00",
        submittedAt: null,
        rule: "题目乱序",
        answers: [],
      },
      {
        id: "u5-r1",
        status: "已提交",
        reason: "首次下发",
        score: 55,
        correctRate: 55,
        duration: 33,
        assignedAt: "2026-06-02 08:00",
        submittedAt: "2026-06-02 09:40",
        rule: "标准卷",
        answers: PERSON_ANSWERS.a2,
      },
    ],
  },
];

export function aggregateStats(people: PersonAggregate[]) {
  const peopleCount = people.length;
  const totalTimes = people.reduce((s, p) => s + p.records.length, 0);
  const latest = people.map((p) => p.records[0]);
  const finished = latest.filter((r) => r.status === "已提交").length;
  return { peopleCount, totalTimes, finished };
}

/** 各试卷关联的答题人员（mock） */
export const PAPER_AGGREGATE_IDS: Record<string, string[]> = {
  p1: ["u1", "u2", "u3", "u4", "u5"],
  p2: ["u4", "u5"],
  p4: ["u1", "u2", "u5"],
  p5: ["u3", "u4", "u5"],
  p7: ["u1", "u2", "u3"],
  p8: ["u4", "u5"],
  p9: ["u1", "u3"],
  p10: ["u2", "u4"],
  p11: ["u5"],
  p12: ["u1", "u2", "u3", "u4"],
  p13: ["u5"],
  p14: ["u1", "u2"],
  p15: ["u1", "u2"],
  p16: ["u3", "u4", "u5"],
};

export function getAggregatesForPaper(paperId: string): PersonAggregate[] {
  const paper = PAPERS.find((item) => item.id === paperId);
  if (paper && paper.assigned > 0) {
    return buildExamRoster(paperId, paper);
  }
  const ids = PAPER_AGGREGATE_IDS[paperId];
  if (!ids) return [];
  return PERSON_AGGREGATES.filter((a) => ids.includes(a.id));
}

export const PAPER_QUESTION_GROUPS: Record<string, EditorGroup[]> = {
  p1: EDITOR_GROUPS,
  p2: EDITOR_GROUPS,
  p4: EDITOR_GROUPS,
  p5: EDITOR_GROUPS,
};

export function getPaperQuestionGroups(paperId: string): EditorGroup[] {
  const stored = PAPER_QUESTION_GROUPS[paperId];
  if (stored) return structuredClone(stored);
  return structuredClone(EDITOR_GROUPS);
}

export const PAPER_DRAFT_KEY = "exam-paper-draft-v1";

/** 供 AI 组卷预览题挂载学员可见选项 */
export function syntheticPreviewQuestion(
  stem: string,
  type: QuestionType,
  difficulty: Difficulty,
  id: string,
  score: number,
): EditorQuestion {
  const template = Object.values(BANK_DETAILS).find((d) => d.options?.length)?.options;
  const options =
    type === "判断题"
      ? defaultOptionsForType("判断题")
      : type === "单选题" || type === "多选题"
        ? (template ?? [
            { key: "A", text: "选项 A" },
            { key: "B", text: "选项 B" },
            { key: "C", text: "选项 C" },
            { key: "D", text: "选项 D" },
          ])
        : undefined;
  return {
    id,
    stem,
    knowledge: "AGC / 两细则",
    difficulty,
    source: "AI 组卷",
    score,
    options,
    blankCount: type === "填空题" ? 1 : undefined,
  };
}

// ---------- Bank question rich details (for 查看详情 / 编辑) ----------
export interface BankOption {
  key: string;
  text: string;
}

export interface BankDetail {
  options?: BankOption[];
  answer: string;
  analysis: string;
  section: string; // 来源章节 / 依据位置
}

export const BANK_DETAILS: Record<string, BankDetail> = {
  bq1: {
    options: [
      { key: "A", text: "不纳入考核,仅作记录" },
      { key: "B", text: "按调节速率不达标扣减两细则补偿费用" },
      { key: "C", text: "直接判定机组退出 AGC" },
      { key: "D", text: "由调度口头警告,无经济考核" },
    ],
    answer: "B",
    analysis:
      "两细则对 AGC 调节速率设有考核指标,响应速率不满足要求会按相应规则扣减调频补偿,严重时影响机组调频里程收益。",
    section: "AGC 控制器 SOP v2024.06 · 第 4.2 节 调节性能考核",
  },
  bq2: {
    options: [
      { key: "A", text: "3 秒内" },
      { key: "B", text: "8 秒内" },
      { key: "C", text: "15 秒内" },
      { key: "D", text: "30 秒内" },
    ],
    answer: "A",
    analysis: "一次调频要求快速响应,频率越限后应在 3 秒内开始动作,以抑制频率波动。",
    section: "两细则考核知识点汇编 v2024.05 · 第 2.1 节 一次调频响应时序",
  },
  bq3: {
    options: [
      { key: "A", text: "断开各侧断路器并确认" },
      { key: "B", text: "拉开各侧隔离开关" },
      { key: "C", text: "投入备用电源自投" },
      { key: "D", text: "验明无电压并装设接地线" },
    ],
    answer: "ABD",
    analysis:
      "主变停役需断开断路器、拉开隔离开关并验明无电压后装设接地线;投入备自投与停役流程无关。",
    section: "厂站运行规程(华东 A 厂) v2024.07 · 第 6.3 节 主变停役操作",
  },
  bq4: {
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    answer: "T",
    analysis: "差动保护为主保护,在保护范围内具备绝对选择性,无需与其他保护配合延时。",
    section: "差动保护误动复盘案例库 v2023.11 · 概述",
  },
  bq5: {
    answer: "需结合一次调频死区与调差率综合分析,见解析。",
    analysis:
      "死区过小或调差率整定不当会使机组在小扰动下频繁动作,应核对死区、调差率与频率测点质量,必要时优化整定值。",
    section: "两细则考核知识点汇编 v2024.05 · 第 2.3 节 死区与调差率配合",
  },
  bq6: {
    answer: "按汇报-确认-处理-记录流程执行,见解析。",
    analysis:
      "安控切机切负荷动作后,应立即向调度汇报动作情况,确认装置动作正确性,按规程恢复系统,并做好记录与复盘。",
    section: "安控装置运行规程 v2023.09 · 第 5.4 节 动作后处理",
  },
  ...Object.fromEntries(BUILT_ADDITIONAL_BANK.map(({ id, detail }) => [id, detail])),
};

export const DISABLE_REASONS = ["表述不清", "答案争议", "重复题", "过时资料", "其他"] as const;

export const REWRITE_GOALS = [
  "提高清晰度",
  "增强干扰项",
  "降低难度",
  "提高难度",
  "改为取证考试风格",
  "改为案例分析题",
  "补充资料依据",
  "优化解析",
] as const;

export interface RewriteDiag {
  name: string;
  level: "通过" | "建议优化" | "风险较高";
  note: string;
}

export const REWRITE_DIAGS: RewriteDiag[] = [
  {
    name: "题干清晰度",
    level: "建议优化",
    note: "题干中“响应慢”表述偏口语,建议明确为“AGC 响应速率不满足考核要求”。",
  },
  { name: "选项干扰度", level: "建议优化", note: "B、C 选项区分度不足,建议增强干扰项的迷惑性。" },
  { name: "答案唯一性", level: "通过", note: "正确答案唯一,无歧义。" },
  { name: "解析完整度", level: "建议优化", note: "当前解析未说明依据来源,建议补充资料章节。" },
  { name: "知识点匹配", level: "通过", note: "题目与所属知识点匹配良好。" },
  // { name: "相似题风险", level: "建议优化", note: "题库中存在 1 道相似度 86% 的题目,建议差异化处理。" },
  { name: "历史正确率", level: "风险较高", note: "正确率 49%,可能题目偏难或表述不清,建议核对。" },
];

export interface RewriteCandidate {
  id: string;
  title: string;
  stem: string;
  options?: BankOption[];
  answer: string;
  analysis: string;
  // diffChange: string;
  reason: string;
  source: string;
}

export const REWRITE_CANDIDATES: RewriteCandidate[] = [
  {
    id: "rw-a",
    title: "版本 A",
    stem: "AGC 控制方式下,机组 AGC 响应速率不满足两细则考核要求时,将被如何考核?",
    options: [
      { key: "A", text: "不纳入考核,仅作记录" },
      { key: "B", text: "按调节速率不达标扣减两细则调频补偿费用" },
      { key: "C", text: "立即判定机组退出 AGC 并停机" },
      { key: "D", text: "仅由调度口头警告,无经济考核" },
    ],
    answer: "B",
    analysis:
      "两细则对 AGC 调节速率设有量化考核指标,响应速率不达标会按规则扣减调频补偿费用。依据见 AGC 控制器 SOP 第 4.2 节。",
    // diffChange: "难度不变(中)",
    reason: "明确口语化表述,增强选项区分度,补充解析依据来源。",
    source: "AGC 控制器 SOP v2024.06 · 第 4.2 节",
  },
  {
    id: "rw-b",
    title: "版本 B",
    stem: "依据两细则,机组 AGC 调节速率连续不达标时,对其调频补偿的影响是?",
    options: [
      { key: "A", text: "补偿费用不受影响" },
      { key: "B", text: "按考核规则扣减相应调频补偿" },
      { key: "C", text: "补偿费用翻倍计算" },
      { key: "D", text: "仅影响里程统计,不影响补偿" },
    ],
    answer: "B",
    analysis: "取证考试侧重规则理解,本题强调考核与补偿的对应关系,依据两细则考核计分规则。",
    // diffChange: "难度略升(中→中偏难)",
    reason: "贴近取证考试出题风格,聚焦规则要点。",
    source: "两细则考核知识点汇编 v2024.05 · 第 3.4 节",
  },
  // {
  //   id: "rw-c",
  //   title: "版本 C",
  //   stem: "AGC 响应速率不满足要求,会对机组的两细则考核产生什么影响?",
  //   options: [
  //     { key: "A", text: "无影响" },
  //     { key: "B", text: "会被扣减调频补偿" },
  //     { key: "C", text: "增加补偿" },
  //     { key: "D", text: "立即停机" },
  //   ],
  //   answer: "B",
  //   analysis: "响应速率不达标会被扣减调频补偿,这是两细则考核的基本要求。",
  //   // diffChange: "难度下降(中→易)",
  //   reason: "简化题干与选项,适合基础巩固。",
  //   source: "AGC 控制器 SOP v2024.06 · 第 4.2 节",
  // },
];

export interface SimilarBankQuestion {
  id: string;
  stem: string;
  knowledge: string;
  type: QuestionType;
  difficulty: Difficulty;
  similarity: number;
  source: string;
  status: "启用" | "禁用";
}

export const SIMILAR_QUESTIONS: SimilarBankQuestion[] = [
  {
    id: "sim1",
    stem: "AGC 调节速率不达标时,两细则的考核方式是什么?",
    knowledge: "AGC / 两细则",
    type: "单选题",
    difficulty: "中",
    similarity: 86,
    source: "两细则考核知识点汇编 v2024.05",
    status: "启用",
  },
  {
    id: "sim2",
    stem: "机组 AGC 响应速率不满足要求,会被扣减哪类费用?",
    knowledge: "AGC / 两细则",
    type: "单选题",
    difficulty: "中",
    similarity: 73,
    source: "AGC 控制器 SOP v2024.06",
    status: "启用",
  },
  {
    id: "sim3",
    stem: "下列关于 AGC 调节性能考核的描述,正确的是?",
    knowledge: "AGC / 两细则",
    type: "单选题",
    difficulty: "易",
    similarity: 61,
    source: "AGC 控制器 SOP v2024.06",
    status: "禁用",
  },
];

export interface BankUsageRecord {
  paper: string;
  usedAt: string;
  assigned: number;
  avgCorrect: number;
  lastUsed: string;
}

export const BANK_USAGE: BankUsageRecord[] = [
  {
    paper: "AGC / 两细则取证复习考试",
    usedAt: "2026-06-10",
    assigned: 5,
    avgCorrect: 71,
    lastUsed: "2026-06-12",
  },
  {
    paper: "新员工基础日常自测",
    usedAt: "2026-05-28",
    assigned: 56,
    avgCorrect: 78,
    lastUsed: "2026-06-01",
  },
  {
    paper: "调频调压阶段测评",
    usedAt: "2026-05-15",
    assigned: 18,
    avgCorrect: 69,
    lastUsed: "2026-05-18",
  },
];

// Draft papers available for 加入试卷
export const DRAFT_PAPERS = PAPERS.filter((p) => p.status === "草稿");

// ---------- Review module: details, evidences, similar questions ----------
export interface ReviewEvidence {
  kind: "主依据" | "补充依据" | "相似案例依据";
  source: string;
  location: string; // 章节 / 页码 / 条款
  excerpt: string;
}

export interface ReviewQuestionDetail {
  options?: { key: string; text: string }[];
  answer?: string;
  analysis: string;
  genReason: string; // 题目生成依据说明
  scoringPoints?: string[]; // 简答 / 案例分析评分要点
  evidences: ReviewEvidence[];
  note?: string;
}

export type ReviewAuditAction =
  | "提交审核"
  | "保存并通过"
  | "驳回"
  | "退回修改"
  | "重新提交"
  | "合并处理";

export interface ReviewAuditRecord {
  id: string;
  action: ReviewAuditAction;
  operator: string;
  time: string;
  comment?: string;
  statusAfter: ReviewQuestion["status"];
}

export const REVIEW_AUDIT_LOGS: Record<string, ReviewAuditRecord[]> = {
  rq1: [],
  rq2: [],
  rq3: [],
  rq4: [
    {
      id: "al-rq4-1",
      action: "提交审核",
      operator: "李工",
      time: "2026-06-28 09:12",
      statusAfter: "待审核",
    },
    {
      id: "al-rq4-2",
      action: "驳回",
      operator: "王审核",
      time: "2026-06-28 14:30",
      comment: "选项 B 表述存在歧义,需重写。",
      statusAfter: "已退回",
    },
    {
      id: "al-rq4-3",
      action: "重新提交",
      operator: "李工",
      time: "2026-06-29 10:05",
      comment: "已修订选项 B 表述并补充解析。",
      statusAfter: "待审核",
    },
  ],
  rq5: [
    {
      id: "al-rq5-1",
      action: "提交审核",
      operator: "张工",
      time: "2026-06-30 08:40",
      statusAfter: "待审核",
    },
  ],
};

export const REVIEW_DETAILS: Record<string, ReviewQuestionDetail> = {
  rq1: {
    options: [
      { key: "A", text: "立即手动调整出力,使其匹配调度指令" },
      { key: "B", text: "检查 AGC 控制器状态,确认是否退出 AGC 控制" },
      { key: "C", text: "等待 AGC 自动调整恢复" },
      { key: "D", text: "立即通知运行值长后再处理" },
    ],
    answer: "B",
    analysis:
      "持续偏差超过 ±3% 应优先确认 AGC 控制器状态,必要时退出 AGC 改手动,避免被两细则考核扣分。",
    genReason:
      "基于 AGC 控制器 SOP v2024.06 第 4.2 节关于 AGC 响应偏差处理流程生成,考点为偏差超限时的优先处理动作。",
    evidences: [
      {
        kind: "主依据",
        source: "AGC 控制器 SOP v2024.06",
        location: "第 4.2 节 / P.18",
        excerpt:
          "AGC 控制下,实际出力与调度指令偏差持续超过 ±3% 时,应优先检查控制器状态,必要时退出 AGC 改手动控制。",
      },
      {
        kind: "补充依据",
        source: "两细则考核知识点汇编 v2024.05",
        location: "第 2.1 章 / P.7",
        excerpt: "AGC 响应偏差长期不达标将按两细则进行考核扣分。",
      },
    ],
  },
  rq2: {
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" },
    ],
    answer: "A",
    analysis: "一次调频死区设置过大会导致小幅频率波动时机组不动作,影响电网频率支撑能力。",
    genReason: "基于两细则考核知识点汇编中关于一次调频死区参数与动作灵敏度的关系生成。",
    evidences: [
      {
        kind: "主依据",
        source: "两细则考核知识点汇编 v2024.05",
        location: "第 3.4 节 / P.22",
        excerpt: "一次调频死区应严格按照规程设置,过大死区将造成机组在频率小幅波动时不参与调频。",
      },
      {
        kind: "相似案例依据",
        source: "某厂一次调频考核扣分复盘 2025Q1",
        location: "案例 3",
        excerpt: "因死区设置不当,机组多次未参与一次调频,被两细则考核扣分。",
      },
    ],
  },
  rq3: {
    analysis:
      "应先断开断路器,确认无电流后再操作中性点接地刀闸,顺序错误可能造成接地刀闸带负荷拉弧。",
    genReason: "基于厂站运行规程典型误操作案例生成,考查停役操作顺序与风险识别。",
    scoringPoints: [
      "指出误操作风险:带负荷拉接地刀闸造成弧光短路",
      "给出正确顺序:先断开断路器 → 验明无电 → 拉开隔离开关 → 合上接地刀闸",
      "提出补救措施和上报要求",
    ],
    evidences: [
      {
        kind: "主依据",
        source: "厂站运行规程(华东 A 厂) v2024.07",
        location: "第 6.3 节",
        excerpt: "主变停役应严格按断路器 → 隔离开关 → 接地刀闸顺序操作。",
      },
    ],
  },
  rq4: {
    options: [
      { key: "A", text: "安控装置联动应根据系统运行方式动态调整" },
      { key: "B", text: "安控装置可与故障录波器独立运行无需配合" },
      { key: "C", text: "联动配合需通过现场试验验证" },
      { key: "D", text: "联动信号应有冗余通道" },
    ],
    answer: "A,C,D",
    analysis: "B 错误,安控装置联动需与录波、保护等装置协同配合。",
    genReason: "基于安控装置运行规程关于联动配合要求生成。",
    evidences: [
      {
        kind: "主依据",
        source: "安控装置运行规程 v2023.09",
        location: "第 5 章",
        excerpt: "安控装置联动需考虑运行方式、冗余通道并通过试验验证。",
      },
    ],
    note: "退回原因:选项 B 表述存在歧义,需重写。",
  },
  rq5: {
    options: [
      { key: "A", text: "30 秒内" },
      { key: "B", text: "1 分钟内" },
      { key: "C", text: "3 分钟内" },
      { key: "D", text: "5 分钟内" },
    ],
    answer: "C",
    analysis: "母差动作后应在 3 分钟内完成对故障母线的隔离,防止事故扩大。",
    genReason: "基于差动保护误动复盘案例库典型处置时限要求生成。",
    evidences: [
      {
        kind: "主依据",
        source: "差动保护误动复盘案例库 v2023.11",
        location: "处置时限章节",
        excerpt: "故障母线应在 3 分钟内完成隔离。",
      },
      {
        kind: "补充依据",
        source: "厂站运行规程",
        location: "保护动作章节",
        excerpt: "母差跳闸后应迅速隔离故障设备。",
      },
    ],
  },
};

export interface ReviewSimilarItem {
  id: string;
  stem: string;
  type: QuestionType;
  knowledge: string;
  difficulty: Difficulty;
  source: string;
  similarity: number; // 0-100
  status: "启用" | "禁用";
  usedCount: number;
  correctRate: number;
}

export const REVIEW_SIMILAR: Record<string, ReviewSimilarItem[]> = {
  rq1: [
    {
      id: "bq1",
      stem: "AGC 控制方式下,机组响应调度指令的速率不满足要求会被两细则如何考核?",
      type: "单选题",
      knowledge: "AGC / 两细则",
      difficulty: "中",
      source: "AGC 控制器 SOP v2024.06",
      similarity: 82,
      status: "启用",
      usedCount: 28,
      correctRate: 71,
    },
    {
      id: "bq6",
      stem: "AGC 投自动后,机组实际出力偏离调度指令的允许范围是多少?",
      type: "单选题",
      knowledge: "AGC / 两细则",
      difficulty: "中",
      source: "AGC 控制器 SOP v2024.06",
      similarity: 76,
      status: "启用",
      usedCount: 19,
      correctRate: 68,
    },
  ],
  rq2: [
    {
      id: "bq2",
      stem: "一次调频死区设置不当对机组参与电网调频有何影响?",
      type: "单选题",
      knowledge: "一次调频",
      difficulty: "易",
      source: "两细则考核知识点汇编 v2024.05",
      similarity: 88,
      status: "启用",
      usedCount: 41,
      correctRate: 64,
    },
    {
      id: "bq7",
      stem: "一次调频未动作的常见原因不包括下列哪项?",
      type: "单选题",
      knowledge: "一次调频",
      difficulty: "中",
      source: "两细则考核知识点汇编 v2024.05",
      similarity: 71,
      status: "启用",
      usedCount: 22,
      correctRate: 70,
    },
  ],
  rq3: [],
  rq4: [],
  rq5: [
    {
      id: "bq8",
      stem: "母差保护动作后,运行人员的首要任务是什么?",
      type: "单选题",
      knowledge: "差动保护",
      difficulty: "中",
      source: "差动保护误动复盘案例库 v2023.11",
      similarity: 74,
      status: "启用",
      usedCount: 12,
      correctRate: 66,
    },
  ],
};

export const RETURN_REASONS = [
  "题干表述不清",
  "答案不唯一",
  "解析不完整",
  "依据不足",
  "难度不匹配",
  "与已有题目重复",
  "其他",
];
