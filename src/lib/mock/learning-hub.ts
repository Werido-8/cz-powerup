// Enriched mock data for 知识学习 / 题库训练 / 个人沉淀 pages.
import type { LearnStatus } from "./data";

export type PracticeSource =
  | "智能问答生成"
  | "知识学习推荐"
  | "知识学习生成"
  | "错题本";

export type RecommendedPractice = {
  id: string;
  title: string;
  reason: string;
  count: number;
  mastery: number;
  tags: string[];
  source: PracticeSource;
  progress: number;
  filter: string;
};

export type QuizSet = {
  id: string;
  title: string;
  source: string;
  questionCount: number;
  status: "未开始" | "进行中" | "已完成";
  accuracy?: number;
  relatedChat?: string;
  relatedMsgId?: string;
  relatedConvId?: string;
  createdAt: string;
  filter: string;
  questionIds?: string[];
};

export type PracticeRecord = {
  id: string;
  title: string;
  source: string;
  completedAt: string;
  questionCount: number;
  accuracy: number;
  wrongCount: number;
  duration: string;
  filter: string;
};

export type RecentMaterial = {
  docId: string;
  typeLabel: "规程" | "SOP" | "案例" | "通知";
  topicTitle: string;
  updatedAt: string;
  status: LearnStatus;
};

/** 最近更新：专题与资料混合动态 */
export type RecentUpdateKind = "topic_new" | "topic_updated" | "doc_new" | "doc_version";

export type RecentUpdateItem = {
  id: string;
  kind: RecentUpdateKind;
  title: string;
  summary?: string;
  topicId?: string;
  topicTitle?: string;
  docId?: string;
  typeLabel?: RecentMaterial["typeLabel"];
  source?: string;
  updatedAt: string;
};

export const RECENT_UPDATE_KIND_LABEL: Record<RecentUpdateKind, string> = {
  topic_new: "新增专题",
  topic_updated: "专题更新",
  doc_new: "新增资料",
  doc_version: "版本更新",
};

export type WrongQuestionDetail = {
  qid: string;
  stem: string;
  typeLabel: string;
  knowledge: string;
  // errorReason: string;
  sourceQuiz: string;
  lastWrongAt: string;
  reviewCount: number;
};

export type EnrichedTopic = {
  id: string;
  title: string;
  desc: string;
  roleTags: string[];
  docCount: number;
  questionCount: number;
  scenarioCount: number;
  scenarioLabel?: string;
  progress: number;
  updatedAt: string;
};

export type ContinueLearning = {
  topicId: string;
  topicTitle: string;
  lastDocId: string;
  lastDocTitle: string;
  progress: number;
};

export type LearningStats = {
  learnedTopics: number;
  readDocs: number;
  completedCards: number;
  todaySuggestions: number;
};

export type LearningActivity = {
  id: string;
  text: string;
};

export type FavoriteMeta = {
  docId: string;
  source: string;
  topicTitle: string;
};

export type NoteMeta = {
  id: string;
  title: string;
  summary: string;
  relatedDocTitle?: string;
  relatedDocId?: string;
  tags: string[];
  createdAt: string;
};

export type ChatFavorite = {
  id: string;
  question: string;
  summary: string;
  source: string;
  createdAt: string;
  tags: string[];
};

export const TRAINING_OVERVIEW = {
  weeklyAnswers: 48,
  accuracy: 76,
  wrongToReview: 6,
  quizSetCount: 4,
  streakDays: 7,
  todayPlan: {
    title: "AGC 与两细则专项",
    duration: "12 分钟",
    count: 5,
    filter: "AGC",
  },
};

export const FEATURE_CARDS = [
  {
    id: "practice",
    title: "专项练习",
    desc: "按知识点、岗位能力和场景进行定向强化。",
    to: "/training/practice" as const,
    stats: [
      { label: "专题", value: "12 个" },
      { label: "最近练习", value: "AGC 与两细则" },
    ],
    action: "进入专项",
  },
  {
    id: "exam",
    title: "我的考试",
    desc: "培训负责人下发的正式试卷，限时答题。",
    to: "/training/exam" as const,
    stats: [
      { label: "已完成", value: "3 次" },
      { label: "最近得分", value: "82 分" },
      { label: "推荐试卷", value: "运行基础卷" },
    ],
    action: "进入考试",
  },
  {
    id: "wrong",
    title: "错题本",
    desc: "自动汇总错题，支持错因分析和重复练习。",
    to: "/training/wrong" as const,
    stats: [
      { label: "待复习", value: "6 题" },
      { label: "高频错因", value: "保护动作逻辑" },
      { label: "今日建议", value: "复习 5 题" },
    ],
    action: "查看错题",
  },
  // 本期暂不开放：智能生成题单
  // {
  //   id: "quizsets",
  //   title: "智能生成题单",
  //   desc: "由智能问答、知识学习和场景练习生成的专项题单。",
  //   to: "/assets" as const,
  //   search: { tab: "quizsets" },
  //   stats: [
  //     { label: "已生成", value: "4 份" },
  //     { label: "未完成", value: "2 份" },
  //     { label: "最近生成", value: "AGC 考核依据专项" },
  //   ],
  //   action: "查看题单",
  // },
];

export const RECOMMENDED_PRACTICES: RecommendedPractice[] = [
  {
    id: "rp1",
    title: "AGC 与两细则专项",
    reason: "来自智能问答生成题单，近 7 日 AGC 相关正确率偏低",
    count: 12,
    mastery: 38,
    tags: ["AGC", "两细则", "辅助服务"],
    source: "智能问答生成",
    progress: 38,
    filter: "AGC",
  },
  {
    id: "rp2",
    title: "一次调频与 AVC 协调",
    reason: "智能问答中一次调频、AVC 越限类问题检索频次较高",
    count: 10,
    mastery: 42,
    tags: ["一次调频", "AVC", "无功考核"],
    source: "智能问答生成",
    progress: 42,
    filter: "一次调频,AVC",
  },
  {
    id: "rp3",
    title: "差动保护复盘",
    reason: "错题本中保护动作判断类题目重复错误",
    count: 8,
    mastery: 30,
    tags: ["继电保护", "母差保护", "复盘"],
    source: "错题本",
    progress: 30,
    filter: "差动保护",
  },
  // {
  //   id: "rp4",
  //   title: "直流接地排查专项",
  //   reason: "错题本中直流系统拉路排查类题目近一周重复出错",
  //   count: 6,
  //   mastery: 25,
  //   tags: ["直流接地", "拉路法", "绝缘监测"],
  //   source: "错题本",
  //   progress: 25,
  //   filter: "直流接地",
  // },
];

export const PRACTICE_RECORDS: PracticeRecord[] = [
  {
    id: "pr1",
    title: "AGC 考核依据专项练习",
    source: "专题练习",
    completedAt: "今天 14:30",
    questionCount: 5,
    accuracy: 80,
    wrongCount: 1,
    duration: "6 分钟",
    filter: "AGC",
  },
  {
    id: "pr3",
    title: "差动保护复盘练习",
    source: "错题本",
    completedAt: "昨天 10:05",
    questionCount: 6,
    accuracy: 67,
    wrongCount: 2,
    duration: "9 分钟",
    filter: "差动保护",
  },
  {
    id: "pr4",
    title: "运行基础模拟卷",
    source: "自主考试",
    completedAt: "3 天前",
    questionCount: 20,
    accuracy: 82,
    wrongCount: 4,
    duration: "28 分钟",
    filter: "",
  },
  {
    id: "pr5",
    title: "一次调频与 AVC 专项",
    source: "专项练习",
    completedAt: "3 天前",
    questionCount: 10,
    accuracy: 70,
    wrongCount: 3,
    duration: "12 分钟",
    filter: "一次调频",
  },
  {
    id: "pr6",
    title: "母线差动保护原理练习",
    source: "错题本",
    completedAt: "4 天前",
    questionCount: 8,
    accuracy: 75,
    wrongCount: 2,
    duration: "11 分钟",
    filter: "母差保护",
  },
  {
    id: "pr7",
    title: "两细则辅助服务复习",
    source: "错题本",
    completedAt: "5 天前",
    questionCount: 12,
    accuracy: 83,
    wrongCount: 2,
    duration: "15 分钟",
    filter: "两细则",
  },
  {
    id: "pr8",
    title: "直流接地排查专项",
    source: "错题本",
    completedAt: "6 天前",
    questionCount: 6,
    accuracy: 67,
    wrongCount: 2,
    duration: "8 分钟",
    filter: "直流接地",
  },
  {
    id: "pr9",
    title: "AGC 调节死区参数练习",
    source: "知识学习生成",
    completedAt: "一周前",
    questionCount: 9,
    accuracy: 78,
    wrongCount: 2,
    duration: "10 分钟",
    filter: "AGC",
  },
  {
    id: "pr10",
    title: "继电保护动作逻辑复盘",
    source: "错题本",
    completedAt: "一周前",
    questionCount: 7,
    accuracy: 86,
    wrongCount: 1,
    duration: "9 分钟",
    filter: "继电保护",
  },
];

/** 首页与记录页暂不展示的来源（智能问答生成等暂缓能力） */
const HIDDEN_PRACTICE_SOURCES = new Set(["智能问答生成"]);

export function getVisiblePracticeRecords(records: PracticeRecord[] = PRACTICE_RECORDS) {
  return records.filter((r) => !HIDDEN_PRACTICE_SOURCES.has(r.source));
}

export const QUIZ_SETS: QuizSet[] = [
  {
    id: "qs1",
    title: "AGC 考核依据专项练习",
    source: "智能问答生成",
    questionCount: 5,
    status: "已完成",
    accuracy: 80,
    relatedChat: "AGC 考核主要依据哪些文件？",
    relatedMsgId: "msg-c-agc-1",
    relatedConvId: "c-agc",
    createdAt: "今天 14:18",
    filter: "AGC",
    questionIds: ["q1", "q3", "q4", "q8", "q12"],
  },
  // {
  //   id: "qs2",
  //   title: "主变停送电确认项专项练习",
  //   source: "知识学习生成",
  //   questionCount: 8,
  //   status: "未开始",
  //   createdAt: "昨天 09:40",
  //   filter: "主变停役",
  // },
  // {
  //   id: "qs3",
  //   title: "差动保护动作复盘题单",
  //   source: "错题本生成",
  //   questionCount: 6,
  //   status: "进行中",
  //   createdAt: "2 天前",
  //   filter: "差动保护",
  // },
  {
    id: "qs4",
    title: "两细则常见知识点速练",
    source: "智能问答生成",
    questionCount: 10,
    status: "未开始",
    relatedChat: "两细则考核常见扣分点有哪些？",
    createdAt: "3 天前",
    filter: "AGC",
    questionIds: ["q1", "q2", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12"],
  },
];

export const CONTINUE_LEARNING: ContinueLearning = {
  topicId: "t-agc",
  topicTitle: "AGC / 两细则专项",
  lastDocId: "d1",
  lastDocTitle: "AGC 考核指标与响应时间",
  progress: 35,
};

export const LEARNING_STATS: LearningStats = {
  learnedTopics: 4,
  readDocs: 18,
  completedCards: 42,
  todaySuggestions: 2,
};

export const ENRICHED_TOPICS: EnrichedTopic[] = [
  {
    id: "t-newbie",
    title: "新员工入门包",
    desc: "面向首次上岗人员，覆盖值班、巡检与基础异常处理流程。",
    roleTags: ["运行"],
    docCount: 10,
    questionCount: 82,
    scenarioCount: 3,
    progress: 45,
    updatedAt: "2024-09-12",
  },
  {
    id: "t-op",
    title: "典型操作专题",
    desc: "主变停送电、母线倒闸、线路停役等典型操作标准化要点。",
    roleTags: ["运行", "典型操作"],
    docCount: 16,
    questionCount: 218,
    scenarioCount: 6,
    progress: 60,
    updatedAt: "2024-08-20",
  },
  {
    id: "t-fault",
    title: "故障复盘专题",
    desc: "差动、距离、零序等保护动作后的复盘思路与典型案例。",
    roleTags: ["继保", "故障处置"],
    docCount: 8,
    questionCount: 114,
    scenarioCount: 5,
    scenarioLabel: "案例",
    progress: 25,
    updatedAt: "2024-07-15",
  },
  {
    id: "t-agc",
    title: "AGC / 两细则专项",
    desc: "AGC 性能指标、两细则考核条款与厂站执行要点。",
    roleTags: ["涉网", "调度"],
    docCount: 15,
    questionCount: 136,
    scenarioCount: 8,
    scenarioLabel: "问答",
    progress: 35,
    updatedAt: "2024-09-12",
  },
  {
    id: "t-chem",
    title: "化学水处理专题",
    desc: "凝结水、补给水与循环水水质指标控制及异常处置。",
    roleTags: ["化学", "运行"],
    docCount: 12,
    questionCount: 96,
    scenarioCount: 4,
    progress: 18,
    updatedAt: "2024-08-28",
  },
  {
    id: "t-boiler",
    title: "锅炉运行基础",
    desc: "燃烧调整、汽温汽压控制与典型异常工况处理。",
    roleTags: ["锅炉", "运行"],
    docCount: 14,
    questionCount: 124,
    scenarioCount: 5,
    progress: 52,
    updatedAt: "2024-08-05",
  },
  {
    id: "t-relay",
    title: "继电保护专项强化",
    desc: "主保护、后备保护配置原则与定值核对要点。",
    roleTags: ["继保", "涉网"],
    docCount: 11,
    questionCount: 108,
    scenarioCount: 6,
    progress: 12,
    updatedAt: "2024-07-22",
  },
  {
    id: "t-dispatch",
    title: "调度纪律与合规",
    desc: "调度命令执行、信息汇报与涉网安全合规要求。",
    roleTags: ["调度", "涉网"],
    docCount: 9,
    questionCount: 72,
    scenarioCount: 3,
    progress: 0,
    updatedAt: "2024-09-01",
  },
  {
    id: "t-safety",
    title: "安全生产与两票",
    desc: "工作票、操作票办理流程与现场安全措施落实。",
    roleTags: ["运行", "典型操作"],
    docCount: 13,
    questionCount: 88,
    scenarioCount: 4,
    progress: 68,
    updatedAt: "2024-08-15",
  },
  {
    id: "t-inspect",
    title: "设备巡检规范",
    desc: "日常巡检路线、记录要点与缺陷上报闭环。",
    roleTags: ["运行", "检修"],
    docCount: 10,
    questionCount: 64,
    scenarioCount: 2,
    progress: 40,
    updatedAt: "2024-07-30",
  },
  {
    id: "t-net",
    title: "涉网稳定性专题",
    desc: "一次调频、PSS 与涉网性能试验相关知识点。",
    roleTags: ["涉网", "调度"],
    docCount: 12,
    questionCount: 102,
    scenarioCount: 5,
    progress: 22,
    updatedAt: "2024-09-05",
  },
  {
    id: "t-meter",
    title: "电能计量与关口",
    desc: "关口表计、互感器误差与电量结算核对流程。",
    roleTags: ["电气", "运行"],
    docCount: 7,
    questionCount: 56,
    scenarioCount: 2,
    progress: 8,
    updatedAt: "2024-06-18",
  },
  {
    id: "t-turbine",
    title: "汽机专业基础",
    desc: "汽轮机启停、振动监测与真空系统运行要点。",
    roleTags: ["汽机", "运行"],
    docCount: 11,
    questionCount: 92,
    scenarioCount: 4,
    progress: 30,
    updatedAt: "2024-08-10",
  },
];

export const RECENT_MATERIALS: RecentMaterial[] = [
  {
    docId: "d1",
    typeLabel: "规程",
    topicTitle: "AGC / 两细则专项",
    updatedAt: "2026-06-30",
    status: "未学",
  },
  {
    docId: "d3",
    typeLabel: "案例",
    topicTitle: "故障复盘专题",
    updatedAt: "2026-06-30",
    status: "未学",
  },
  {
    docId: "d11",
    typeLabel: "通知",
    topicTitle: "AGC / 两细则专项",
    updatedAt: "2026-06-30",
    status: "学习中",
  },
  {
    docId: "d10",
    typeLabel: "规程",
    topicTitle: "故障复盘专题",
    updatedAt: "2026-06-30",
    status: "未学",
  },
];

export const RECENT_UPDATES: RecentUpdateItem[] = [
  {
    id: "ru-1",
    kind: "topic_new",
    title: "涉网稳定性专题",
    summary: "新增一次调频、PSS 与涉网性能试验相关知识点",
    topicId: "t-net",
    updatedAt: "2026-07-02",
  },
  {
    id: "ru-2",
    kind: "topic_updated",
    title: "AGC / 两细则专项",
    summary: "补充 3 份规程资料、修订 12 道关联题目",
    topicId: "t-agc",
    updatedAt: "2026-07-01",
  },
  {
    id: "ru-3",
    kind: "doc_new",
    title: "《并网发电厂辅助服务管理实施细则》AGC 考核条款解读",
    summary: "新增至 AGC / 两细则专项",
    docId: "d1",
    topicId: "t-agc",
    topicTitle: "AGC / 两细则专项",
    typeLabel: "规程",
    source: "行业标准",
    updatedAt: "2026-06-30",
  },
  {
    id: "ru-4",
    kind: "doc_version",
    title: "500kV 主变停役标准化操作程序 v3.2",
    summary: "修订停役前核对项与调度联络话术",
    docId: "d2",
    topicId: "t-op",
    topicTitle: "典型操作专题",
    typeLabel: "规程",
    source: "厂站 SOP",
    updatedAt: "2026-06-30",
  },
  {
    id: "ru-5",
    kind: "doc_new",
    title: "220kV 线路保护动作复盘案例",
    summary: "新增至故障复盘专题",
    docId: "d3",
    topicId: "t-fault",
    topicTitle: "故障复盘专题",
    typeLabel: "案例",
    source: "典型案例",
    updatedAt: "2026-06-29",
  },
  {
    id: "ru-6",
    kind: "topic_updated",
    title: "典型操作专题",
    summary: "更新母线倒闸操作资料与场景练习",
    topicId: "t-op",
    updatedAt: "2026-06-28",
  },
  {
    id: "ru-7",
    kind: "topic_new",
    title: "化学水处理专题",
    summary: "凝结水、补给水与循环水指标控制要点",
    topicId: "t-chem",
    updatedAt: "2026-06-27",
  },
  {
    id: "ru-8",
    kind: "doc_version",
    title: "两细则考核知识点汇编 v2024.06",
    summary: "同步最新考核条款与释义",
    docId: "d8",
    topicId: "t-agc",
    topicTitle: "AGC / 两细则专项",
    typeLabel: "规程",
    source: "培训汇编",
    updatedAt: "2026-06-26",
  },
  {
    id: "ru-9",
    kind: "doc_new",
    title: "省调关于迎峰度夏涉网安全检查的通知",
    summary: "新增至 AGC / 两细则专项",
    docId: "d11",
    topicId: "t-agc",
    topicTitle: "AGC / 两细则专项",
    typeLabel: "通知",
    source: "调度通知",
    updatedAt: "2026-06-25",
  },
  {
    id: "ru-10",
    kind: "doc_version",
    title: "继电保护定值单核对规范",
    summary: "更新定值变更审批与现场核对流程",
    docId: "d10",
    topicId: "t-fault",
    topicTitle: "故障复盘专题",
    typeLabel: "规程",
    source: "厂站制度",
    updatedAt: "2026-06-24",
  },
];

export const LEARNING_ACTIVITIES: LearningActivity[] = [
  { id: "la1", text: "今天阅读 2 份资料" },
  { id: "la2", text: "完成 5 道题" },
  { id: "la4", text: "生成 1 份智能题单" },
  { id: "la5", text: "AGC 专题进度提升 8%" },
];

export const FAVORITE_META: FavoriteMeta[] = [
  { docId: "d1", source: "智能问答依据", topicTitle: "两细则 / 考核" },
  { docId: "d2", source: "资料学习", topicTitle: "典型操作" },
  { docId: "d8", source: "知识学习", topicTitle: "AGC / 两细则专项" },
];

export const NOTE_META: NoteMeta[] = [
  {
    id: "n-seed-1",
    title: "AGC 考核指标笔记",
    summary: "AGC 考核主要关注调节速率、调节精度和响应时间……",
    relatedDocId: "d1",
    relatedDocTitle: "《并网发电厂辅助服务管理实施细则》",
    tags: ["AGC", "两细则"],
    createdAt: "2024-09-12",
  },
  {
    id: "n-seed-2",
    title: "主变停役前置核对清单",
    summary: "负荷转移、保护连接片、中性点接地刀闸、调度命令与操作票一致性……",
    relatedDocId: "d2",
    relatedDocTitle: "500kV 主变停役标准化操作程序 v3.2",
    tags: ["主变", "典型操作"],
    createdAt: "2024-08-21",
  },
  {
    id: "n-seed-3",
    title: "差动保护复盘四步法",
    summary: "TA 极性 → 二次回路 → 定值 → 一次设备状态，按序核查避免遗漏。",
    relatedDocId: "d10",
    relatedDocTitle: "差动保护动作复盘:核查思路与典型场景",
    tags: ["继电保护", "复盘"],
    createdAt: "2024-07-08",
  },
];

export const WRONG_QUESTION_DETAILS: WrongQuestionDetail[] = [
  {
    qid: "q1",
    stem: "AGC 考核中通常重点关注的指标不包括哪一项？",
    typeLabel: "单选",
    knowledge: "AGC 考核指标",
    // errorReason: "概念混淆",
    sourceQuiz: "AGC 考核依据专项练习",
    lastWrongAt: "今天",
    reviewCount: 1,
  },
  {
    qid: "q4",
    stem: "主变停役前必须完成的前置核对不包括？",
    typeLabel: "单选",
    knowledge: "典型操作",
    // errorReason: "流程遗漏",
    sourceQuiz: "主变停送电确认项专项",
    lastWrongAt: "2 天前",
    reviewCount: 2,
  },
  {
    qid: "q9",
    stem: "差动保护动作后复盘应优先核查？",
    typeLabel: "单选",
    knowledge: "继电保护",
    // errorReason: "保护动作逻辑",
    sourceQuiz: "差动保护复盘练习",
    lastWrongAt: "昨天",
    reviewCount: 1,
  },
  {
    qid: "q17",
    stem: "AVC 投自动后电压越限，值班员首先应？",
    typeLabel: "单选",
    knowledge: "AVC 控制",
    // errorReason: "处置顺序错误",
    sourceQuiz: "AGC 考核依据专项练习",
    lastWrongAt: "今天",
    reviewCount: 0,
  },
];

export const CHAT_FAVORITES: ChatFavorite[] = [
  {
    id: "cf1",
    question: "AGC 考核主要依据哪些文件？",
    summary: "依据《并网发电厂辅助服务管理实施细则》及区域两细则补充条款……",
    source: "智能问答",
    createdAt: "今天 14:10",
    tags: ["AGC", "两细则"],
  },
  {
    id: "cf2",
    question: "主变停役前保护连接片如何核对？",
    summary: "重点核查差动、后备保护、瓦斯及失灵联跳压板投退状态……",
    source: "智能问答",
    createdAt: "昨天 11:30",
    tags: ["主变", "保护"],
  },
];

export const GROWTH_REMINDER = {
  wrongToday: 5,
  recentQuizSet: "AGC 考核依据专项练习",
  weakPoints: ["保护动作逻辑", "AGC 死区参数"],
};

export const PERSONAL_OVERVIEW = {
  favorites: 3,
  notes: 3,
  quizSets: 4,
  wrongToReview: 6,
  recentPractice: 8,
};

/** 单篇资料近 7 日阅读洞察（用于全部资料热度面板与卡片） */
export type DocReadInsight = {
  docId: string;
  readers7d: number;
  reads7d: number;
  /** 较上周阅读人次变化百分比 */
  trendDelta: number;
  /** 近 7 日每日阅读人次（从 6 天前到今天） */
  dailyReads: [number, number, number, number, number, number, number];
  rank: number;
};

/** 平台级阅读热力：近 14 天每日总阅读人次 */
export type PlatformReadHeatmapDay = {
  label: string;
  reads: number;
};

/** 近 7 天 × 4 时段阅读强度（0–4），时段：晨 6–12 / 午 12–18 / 晚 18–22 / 夜 22–6 */
export type PlatformReadHeatmap = {
  days: PlatformReadHeatmapDay[];
  timeSlots: readonly ["晨", "午", "晚", "夜"];
  hourlyGrid: number[][];
};

export const PLATFORM_READ_HEATMAP: PlatformReadHeatmap = {
  days: [
    { label: "6/17", reads: 42 },
    { label: "6/18", reads: 58 },
    { label: "6/19", reads: 51 },
    { label: "6/20", reads: 73 },
    { label: "6/21", reads: 68 },
    { label: "6/22", reads: 45 },
    { label: "6/23", reads: 62 },
    { label: "6/24", reads: 88 },
    { label: "6/25", reads: 95 },
    { label: "6/26", reads: 79 },
    { label: "6/27", reads: 54 },
    { label: "6/28", reads: 71 },
    { label: "6/29", reads: 103 },
    { label: "6/30", reads: 86 },
  ],
  timeSlots: ["晨", "午", "晚", "夜"],
  hourlyGrid: [
    [2, 3, 2, 1],
    [3, 4, 3, 2],
    [2, 3, 4, 2],
    [3, 4, 3, 1],
    [4, 3, 2, 2],
    [2, 2, 3, 3],
    [3, 4, 4, 2],
  ],
};

export const DOC_READ_INSIGHTS: DocReadInsight[] = [
  { docId: "d1", readers7d: 48, reads7d: 132, trendDelta: 18, dailyReads: [12, 18, 22, 15, 28, 25, 32], rank: 1 },
  { docId: "d2", readers7d: 41, reads7d: 98, trendDelta: 12, dailyReads: [10, 14, 16, 12, 18, 15, 22], rank: 2 },
  { docId: "d6", readers7d: 36, reads7d: 87, trendDelta: 24, dailyReads: [8, 10, 14, 11, 16, 13, 20], rank: 3 },
  { docId: "d5", readers7d: 29, reads7d: 71, trendDelta: -5, dailyReads: [12, 11, 9, 10, 8, 11, 10], rank: 4 },
  { docId: "d10", readers7d: 27, reads7d: 64, trendDelta: 8, dailyReads: [7, 9, 8, 10, 9, 11, 12], rank: 5 },
  { docId: "d3", readers7d: 22, reads7d: 55, trendDelta: 3, dailyReads: [6, 8, 7, 9, 8, 7, 10], rank: 6 },
  { docId: "d4", readers7d: 19, reads7d: 48, trendDelta: -2, dailyReads: [7, 6, 8, 7, 6, 7, 7], rank: 7 },
  { docId: "d7", readers7d: 18, reads7d: 42, trendDelta: 6, dailyReads: [5, 6, 7, 5, 6, 7, 6], rank: 8 },
  { docId: "d8", readers7d: 16, reads7d: 38, trendDelta: 0, dailyReads: [5, 5, 6, 5, 5, 6, 6], rank: 9 },
  { docId: "d9", readers7d: 15, reads7d: 35, trendDelta: -8, dailyReads: [6, 5, 4, 5, 5, 5, 5], rank: 10 },
  { docId: "d11", readers7d: 14, reads7d: 32, trendDelta: 4, dailyReads: [4, 5, 4, 5, 4, 5, 5], rank: 11 },
  { docId: "d12", readers7d: 13, reads7d: 30, trendDelta: 2, dailyReads: [4, 4, 5, 4, 4, 4, 5], rank: 12 },
  { docId: "d13", readers7d: 12, reads7d: 28, trendDelta: -3, dailyReads: [5, 4, 3, 4, 4, 4, 4], rank: 13 },
  { docId: "d14", readers7d: 11, reads7d: 26, trendDelta: 1, dailyReads: [3, 4, 4, 3, 4, 4, 4], rank: 14 },
  { docId: "d15", readers7d: 10, reads7d: 24, trendDelta: 5, dailyReads: [3, 3, 4, 3, 3, 4, 4], rank: 15 },
  { docId: "d16", readers7d: 9, reads7d: 22, trendDelta: -1, dailyReads: [3, 3, 3, 3, 3, 3, 3], rank: 16 },
  { docId: "d17", readers7d: 8, reads7d: 19, trendDelta: 0, dailyReads: [2, 3, 3, 2, 3, 3, 3], rank: 17 },
  { docId: "d18", readers7d: 7, reads7d: 16, trendDelta: -4, dailyReads: [3, 2, 2, 3, 2, 2, 2], rank: 18 },
  { docId: "d19", readers7d: 6, reads7d: 14, trendDelta: 2, dailyReads: [2, 2, 2, 2, 2, 2, 2], rank: 19 },
  { docId: "d20", readers7d: 5, reads7d: 12, trendDelta: -6, dailyReads: [2, 2, 1, 2, 1, 2, 2], rank: 20 },
  { docId: "d21", readers7d: 4, reads7d: 10, trendDelta: 0, dailyReads: [1, 2, 1, 2, 1, 1, 2], rank: 21 },
  { docId: "d22", readers7d: 3, reads7d: 8, trendDelta: 1, dailyReads: [1, 1, 1, 1, 1, 1, 1], rank: 22 },
  { docId: "d23", readers7d: 2, reads7d: 6, trendDelta: -2, dailyReads: [1, 1, 0, 1, 1, 1, 1], rank: 23 },
  { docId: "d24", readers7d: 1, reads7d: 3, trendDelta: 0, dailyReads: [0, 1, 0, 1, 0, 0, 1], rank: 24 },
];

export const DOC_READ_INSIGHTS_BY_ID: Record<string, DocReadInsight> = Object.fromEntries(
  DOC_READ_INSIGHTS.map((item) => [item.docId, item]),
);

export const TOP_READING_DOCS = DOC_READ_INSIGHTS.slice(0, 5);
