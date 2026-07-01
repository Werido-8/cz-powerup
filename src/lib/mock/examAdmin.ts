// Mock data for the exam administration (考试管理) page.

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
  position: string;
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
}

export const EXAM_STATS = [
  { key: "pending", label: "待审核题目", value: "23", hint: "AI 生成 17 · 人工 6", tone: "warning" as const },
  { key: "bank", label: "题库总量", value: "1,842", hint: "本月新增 86", tone: "primary" as const },
  { key: "issued", label: "已下发试卷", value: "37", hint: "进行中 9", tone: "primary" as const },
  { key: "finish", label: "答题完成率", value: "82%", hint: "近 30 天", tone: "success" as const },
  { key: "correct", label: "平均正确率", value: "76%", hint: "全部试卷", tone: "success" as const },
  { key: "time", label: "平均用时", value: "26 分", hint: "单卷均值", tone: "primary" as const },
];

export const REVIEW_QUESTIONS: ReviewQuestion[] = [
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

export const BANK_QUESTIONS: BankQuestion[] = [
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

export const PAPERS: Paper[] = [
  {
    id: "p1",
    name: "AGC / 两细则取证复习考试",
    goal: "取证复习",
    category: "调频调压",
    questionCount: 20,
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

export const PAPER_CATEGORIES = Array.from(new Set(PAPERS.map((p) => p.category))).sort();

export const ASSIGN_RECORDS: AssignRecord[] = [
  { id: "a1", user: "李工", team: "运行一班", position: "值班员", status: "已提交", score: 88, correctRate: 88, duration: 24, submittedAt: "2026-06-12 10:24", rule: "每人独立卷面" },
  { id: "a2", user: "王工", team: "运行一班", position: "值班长", status: "已提交", score: 76, correctRate: 76, duration: 28, submittedAt: "2026-06-12 11:02", rule: "每人独立卷面" },
  { id: "a3", user: "赵工", team: "运行二班", position: "值班员", status: "进行中", score: null, correctRate: null, duration: null, submittedAt: null, rule: "每人独立卷面" },
  { id: "a4", user: "孙工", team: "运行二班", position: "副值", status: "未开始", score: null, correctRate: null, duration: null, submittedAt: null, rule: "每人独立卷面" },
  { id: "a5", user: "周工", team: "运行三班", position: "值班员", status: "已提交", score: 64, correctRate: 64, duration: 30, submittedAt: "2026-06-13 09:15", rule: "题目+选项乱序" },
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
    { no: 1, stem: "AGC 控制方式下机组响应速率不满足要求的考核方式?", type: "单选题" as QuestionType, difficulty: "中" as Difficulty },
    { no: 2, stem: "一次调频死区设置过大的影响?", type: "判断题" as QuestionType, difficulty: "易" as Difficulty },
    { no: 3, stem: "结合调差率分析机组频繁动作原因。", type: "案例分析题" as QuestionType, difficulty: "难" as Difficulty },
    { no: 4, stem: "两细则中对调峰考核的计分规则?", type: "单选题" as QuestionType, difficulty: "中" as Difficulty },
    { no: 5, stem: "AGC 与一次调频协调配合的要点有哪些?", type: "多选题" as QuestionType, difficulty: "中" as Difficulty },
  ],
};

export const PERSONNEL = [
  { id: "u1", user: "李工", team: "运行一班", position: "值班员" },
  { id: "u2", user: "王工", team: "运行一班", position: "值班长" },
  { id: "u3", user: "赵工", team: "运行二班", position: "值班员" },
  { id: "u4", user: "孙工", team: "运行二班", position: "副值" },
  { id: "u5", user: "周工", team: "运行三班", position: "值班员" },
  { id: "u6", user: "吴工", team: "运行三班", position: "值班长" },
  { id: "u7", user: "郑工", team: "检修班", position: "继保员" },
  { id: "u8", user: "钱工", team: "检修班", position: "检修员" },
];

// ---------- Bank category navigation ----------
export const BANK_CATEGORIES = [
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

export const EDITOR_GROUPS: EditorGroup[] = [
  {
    type: "单选题",
    perScore: 2,
    questions: [
      { id: "e1", stem: "AGC 投入后机组出力与调度指令偏差持续超 ±3% 应优先采取?", knowledge: "AGC / 两细则", difficulty: "中", source: "AGC 控制器 SOP v2024.06", score: 2 },
      { id: "e2", stem: "一次调频的负荷响应应在频率越限后多少秒内开始?", knowledge: "一次调频", difficulty: "中", source: "两细则考核知识点汇编 v2024.05", score: 2 },
      { id: "e3", stem: "AGC 控制方式下机组响应速率不满足要求的考核方式?", knowledge: "AGC / 两细则", difficulty: "中", source: "AGC 控制器 SOP v2024.06", score: 2 },
    ],
  },
  {
    type: "多选题",
    perScore: 3,
    questions: [
      { id: "e4", stem: "下列关于安控装置联动配合的描述,正确的有哪些?", knowledge: "安控配合", difficulty: "中", source: "安控装置运行规程 v2023.09", score: 3 },
      { id: "e5", stem: "主变停役前必须确认的安全措施包括哪些?", knowledge: "主变停役", difficulty: "难", source: "厂站运行规程(华东 A 厂) v2024.07", score: 3 },
    ],
  },
  {
    type: "判断题",
    perScore: 1,
    questions: [
      { id: "e6", stem: "一次调频死区设置过大会导致机组在小扰动下不动作。", knowledge: "一次调频", difficulty: "易", source: "两细则考核知识点汇编 v2024.05", score: 1 },
      { id: "e7", stem: "差动保护属于主保护,具备绝对选择性。", knowledge: "差动保护", difficulty: "易", source: "差动保护误动复盘案例库 v2023.11", score: 1 },
    ],
  },
  {
    type: "填空题",
    perScore: 2,
    questions: [
      { id: "e8", stem: "一次调频的转速不等率一般整定为 ____%。", knowledge: "一次调频", difficulty: "中", source: "两细则考核知识点汇编 v2024.05", score: 2 },
    ],
  },
  {
    type: "简答题",
    perScore: 5,
    questions: [
      { id: "e9", stem: "安控装置切机切负荷动作后,运行人员的汇报与处理流程是什么?", knowledge: "安控配合", difficulty: "中", source: "安控装置运行规程 v2023.09", score: 5 },
    ],
  },
];

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
    { no: 1, stem: "AGC 投入后机组出力与调度指令偏差持续超过 ±3% 应优先采取?", type: "单选题", correctAnswer: "B. 检查 AGC 通道及测点,必要时切至手动", userAnswer: "B. 检查 AGC 通道及测点,必要时切至手动", isCorrect: true, analysis: "偏差持续超限应先排查通道与测点,避免盲目调整出力。", evidence: "AGC 控制器 SOP v2024.06 · 第 4.2 节", wrongTags: [] },
    { no: 2, stem: "一次调频的负荷响应应在频率越限后多少秒内开始?", type: "单选题", correctAnswer: "A. 3 秒内", userAnswer: "A. 3 秒内", isCorrect: true, analysis: "一次调频要求快速响应,应在 3 秒内开始动作。", evidence: "两细则考核知识点汇编 v2024.05 · 第 2.1 节", wrongTags: [] },
    { no: 3, stem: "主变停役前必须确认的安全措施包括哪些?", type: "多选题", correctAnswer: "ABD", userAnswer: "ABD", isCorrect: true, analysis: "安全措施完整。", evidence: "厂站运行规程(华东 A 厂) v2024.07 · 第 6.3 节", wrongTags: [] },
  ],
  a2: [
    { no: 1, stem: "AGC 投入后机组出力与调度指令偏差持续超过 ±3% 应优先采取?", type: "单选题", correctAnswer: "B. 检查 AGC 通道及测点,必要时切至手动", userAnswer: "A. 立即手动大幅调整出力以消除偏差", isCorrect: false, analysis: "不应盲目调整出力,应先排查通道与测点。", evidence: "AGC 控制器 SOP v2024.06 · 第 4.2 节", wrongTags: ["AGC / 两细则", "异常处置"] },
    { no: 2, stem: "一次调频的负荷响应应在频率越限后多少秒内开始?", type: "单选题", correctAnswer: "A. 3 秒内", userAnswer: "A. 3 秒内", isCorrect: true, analysis: "一次调频要求快速响应。", evidence: "两细则考核知识点汇编 v2024.05 · 第 2.1 节", wrongTags: [] },
    { no: 3, stem: "主变停役前必须确认的安全措施包括哪些?", type: "多选题", correctAnswer: "ABD", userAnswer: "AB", isCorrect: false, analysis: "漏选 D(验明无电压并装设接地线)。", evidence: "厂站运行规程(华东 A 厂) v2024.07 · 第 6.3 节", wrongTags: ["主变停役", "安全措施"] },
  ],
  a5: [
    { no: 1, stem: "AGC 投入后机组出力与调度指令偏差持续超过 ±3% 应优先采取?", type: "单选题", correctAnswer: "B. 检查 AGC 通道及测点,必要时切至手动", userAnswer: "C. 退出一次调频功能", isCorrect: false, analysis: "退出一次调频与偏差处置无关。", evidence: "AGC 控制器 SOP v2024.06 · 第 4.2 节", wrongTags: ["AGC / 两细则"] },
    { no: 2, stem: "一次调频的负荷响应应在频率越限后多少秒内开始?", type: "单选题", correctAnswer: "A. 3 秒内", userAnswer: "C. 15 秒内", isCorrect: false, analysis: "应在 3 秒内开始动作。", evidence: "两细则考核知识点汇编 v2024.05 · 第 2.1 节", wrongTags: ["一次调频", "响应时序"] },
    { no: 3, stem: "主变停役前必须确认的安全措施包括哪些?", type: "多选题", correctAnswer: "ABD", userAnswer: "ABD", isCorrect: true, analysis: "安全措施完整。", evidence: "厂站运行规程(华东 A 厂) v2024.07 · 第 6.3 节", wrongTags: [] },
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
  summary:
    "这套试卷适合取证复习,但 AGC 考点占比偏高,多选题偏少,建议补充 AVC 和一次调频题目。",
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
  position: string;
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
    position: "值班员",
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
    position: "值班长",
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
    position: "值班员",
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
    position: "副值",
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
    position: "值班员",
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
    analysis: "主变停役需断开断路器、拉开隔离开关并验明无电压后装设接地线;投入备自投与停役流程无关。",
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
  { name: "题干清晰度", level: "建议优化", note: "题干中“响应慢”表述偏口语,建议明确为“AGC 响应速率不满足考核要求”。" },
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
  { paper: "AGC / 两细则取证复习考试", usedAt: "2026-06-10", assigned: 5, avgCorrect: 71, lastUsed: "2026-06-12" },
  { paper: "新员工基础日常自测", usedAt: "2026-05-28", assigned: 56, avgCorrect: 78, lastUsed: "2026-06-01" },
  { paper: "调频调压阶段测评", usedAt: "2026-05-15", assigned: 18, avgCorrect: 69, lastUsed: "2026-05-18" },
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

export const REVIEW_DETAILS: Record<string, ReviewQuestionDetail> = {
  rq1: {
    options: [
      { key: "A", text: "立即手动调整出力,使其匹配调度指令" },
      { key: "B", text: "检查 AGC 控制器状态,确认是否退出 AGC 控制" },
      { key: "C", text: "等待 AGC 自动调整恢复" },
      { key: "D", text: "立即通知运行值长后再处理" },
    ],
    answer: "B",
    analysis: "持续偏差超过 ±3% 应优先确认 AGC 控制器状态,必要时退出 AGC 改手动,避免被两细则考核扣分。",
    genReason: "基于 AGC 控制器 SOP v2024.06 第 4.2 节关于 AGC 响应偏差处理流程生成,考点为偏差超限时的优先处理动作。",
    evidences: [
      { kind: "主依据", source: "AGC 控制器 SOP v2024.06", location: "第 4.2 节 / P.18", excerpt: "AGC 控制下,实际出力与调度指令偏差持续超过 ±3% 时,应优先检查控制器状态,必要时退出 AGC 改手动控制。" },
      { kind: "补充依据", source: "两细则考核知识点汇编 v2024.05", location: "第 2.1 章 / P.7", excerpt: "AGC 响应偏差长期不达标将按两细则进行考核扣分。" },
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
      { kind: "主依据", source: "两细则考核知识点汇编 v2024.05", location: "第 3.4 节 / P.22", excerpt: "一次调频死区应严格按照规程设置,过大死区将造成机组在频率小幅波动时不参与调频。" },
      { kind: "相似案例依据", source: "某厂一次调频考核扣分复盘 2025Q1", location: "案例 3", excerpt: "因死区设置不当,机组多次未参与一次调频,被两细则考核扣分。" },
    ],
  },
  rq3: {
    analysis: "应先断开断路器,确认无电流后再操作中性点接地刀闸,顺序错误可能造成接地刀闸带负荷拉弧。",
    genReason: "基于厂站运行规程典型误操作案例生成,考查停役操作顺序与风险识别。",
    scoringPoints: [
      "指出误操作风险:带负荷拉接地刀闸造成弧光短路",
      "给出正确顺序:先断开断路器 → 验明无电 → 拉开隔离开关 → 合上接地刀闸",
      "提出补救措施和上报要求",
    ],
    evidences: [
      { kind: "主依据", source: "厂站运行规程(华东 A 厂) v2024.07", location: "第 6.3 节", excerpt: "主变停役应严格按断路器 → 隔离开关 → 接地刀闸顺序操作。" },
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
      { kind: "主依据", source: "安控装置运行规程 v2023.09", location: "第 5 章", excerpt: "安控装置联动需考虑运行方式、冗余通道并通过试验验证。" },
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
      { kind: "主依据", source: "差动保护误动复盘案例库 v2023.11", location: "处置时限章节", excerpt: "故障母线应在 3 分钟内完成隔离。" },
      { kind: "补充依据", source: "厂站运行规程", location: "保护动作章节", excerpt: "母差跳闸后应迅速隔离故障设备。" },
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
    { id: "bq1", stem: "AGC 控制方式下,机组响应调度指令的速率不满足要求会被两细则如何考核?", type: "单选题", knowledge: "AGC / 两细则", difficulty: "中", source: "AGC 控制器 SOP v2024.06", similarity: 82, status: "启用", usedCount: 28, correctRate: 71 },
    { id: "bq6", stem: "AGC 投自动后,机组实际出力偏离调度指令的允许范围是多少?", type: "单选题", knowledge: "AGC / 两细则", difficulty: "中", source: "AGC 控制器 SOP v2024.06", similarity: 76, status: "启用", usedCount: 19, correctRate: 68 },
  ],
  rq2: [
    { id: "bq2", stem: "一次调频死区设置不当对机组参与电网调频有何影响?", type: "单选题", knowledge: "一次调频", difficulty: "易", source: "两细则考核知识点汇编 v2024.05", similarity: 88, status: "启用", usedCount: 41, correctRate: 64 },
    { id: "bq7", stem: "一次调频未动作的常见原因不包括下列哪项?", type: "单选题", knowledge: "一次调频", difficulty: "中", source: "两细则考核知识点汇编 v2024.05", similarity: 71, status: "启用", usedCount: 22, correctRate: 70 },
  ],
  rq3: [],
  rq4: [],
  rq5: [
    { id: "bq8", stem: "母差保护动作后,运行人员的首要任务是什么?", type: "单选题", knowledge: "差动保护", difficulty: "中", source: "差动保护误动复盘案例库 v2023.11", similarity: 74, status: "启用", usedCount: 12, correctRate: 66 },
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
