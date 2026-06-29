// Enriched mock data for 知识学习 / 题库训练 / 个人沉淀 pages.
import type { LearnStatus } from "./data";

export type PracticeSource =
  | "智能问答生成"
  | "知识学习推荐"
  | "知识学习生成"
  | "错题本"
  | "推荐路径";

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
    title: "模拟考试",
    desc: "限时答题，贴近考评场景。",
    to: "/training/exam" as const,
    stats: [
      { label: "已完成", value: "3 次" },
      { label: "最近得分", value: "82 分" },
      { label: "推荐试卷", value: "运行基础模拟卷" },
    ],
    action: "开始模拟",
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
  {
    id: "quizsets",
    title: "智能生成题单",
    desc: "由智能问答、知识学习和场景练习生成的专项题单。",
    to: "/assets" as const,
    search: { tab: "quizsets" },
    stats: [
      { label: "已生成", value: "4 份" },
      { label: "未完成", value: "2 份" },
      { label: "最近生成", value: "AGC 考核依据专项" },
    ],
    action: "查看题单",
  },
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
    filter: "一次调频",
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
    source: "智能问答生成",
    completedAt: "今天 14:30",
    questionCount: 5,
    accuracy: 80,
    wrongCount: 1,
    duration: "6 分钟",
    filter: "AGC",
  },
  // {
  //   id: "pr2",
  //   title: "主变停送电确认项专项",
  //   source: "知识学习生成",
  //   completedAt: "昨天 16:20",
  //   questionCount: 8,
  //   accuracy: 75,
  //   wrongCount: 2,
  //   duration: "11 分钟",
  //   filter: "主变停役",
  // },
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
    source: "模拟考试",
    completedAt: "3 天前",
    questionCount: 20,
    accuracy: 82,
    wrongCount: 4,
    duration: "28 分钟",
    filter: "",
  },
];

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
];

export const RECENT_MATERIALS: RecentMaterial[] = [
  {
    docId: "d1",
    typeLabel: "规程",
    topicTitle: "AGC / 两细则专项",
    updatedAt: "2026-06-30",
    status: "未学",
  },
  // {
  //   docId: "d2",
  //   typeLabel: "SOP",
  //   topicTitle: "典型操作专题",
  //   updatedAt: "2026-06-30",
  //   status: "学习中",
  // },
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

export const LEARNING_ACTIVITIES: LearningActivity[] = [
  { id: "la1", text: "今天阅读 2 份资料" },
  { id: "la2", text: "完成 5 道题" },
  { id: "la3", text: "收藏 1 条依据" },
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
