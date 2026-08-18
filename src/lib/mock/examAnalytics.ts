import type { ExamScoreMode, ExamTaskStatus } from "@/lib/exam-admin/types";

export const EXAM_TEAMS = [
  { id: "team-1", name: "运行一班" },
  { id: "team-2", name: "运行二班" },
  { id: "team-3", name: "运行三班" },
  { id: "team-maint", name: "检修班" },
  { id: "unassigned", name: "未归属" },
];

export const EXAM_SPECIALTIES = [
  { id: "specialty-operation", name: "运行专业" },
  { id: "specialty-electrical", name: "电气专业" },
  { id: "specialty-relay", name: "继电保护" },
  { id: "specialty-grid", name: "涉网与调度" },
  { id: "specialty-safety", name: "安全管理" },
  { id: "unassigned", name: "未归属" },
];

export const EXAM_SERIES = [
  { id: "series-agc", name: "AGC 取证系列" },
  { id: "series-relay", name: "继电保护测评系列" },
  { id: "series-operation", name: "典型操作达标系列" },
];

export interface MockExamTaskMeta {
  status: ExamTaskStatus;
  startsAt: string | null;
  endsAt: string | null;
  scoreMode?: ExamScoreMode;
  totalScore?: number | null;
  teamIds: string[];
  specialtyIds: string[];
  passRate: number | null;
  creatorName: string;
  updatedAt: string;
}

export const EXAM_TASK_META: Record<string, MockExamTaskMeta> = {
  p1: {
    status: "ended",
    startsAt: "2026-06-10 09:00",
    endsAt: "2026-06-10 12:00",
    teamIds: ["team-1", "team-2"],
    specialtyIds: ["specialty-grid"],
    passRate: 70,
    creatorName: "培训管理员",
    updatedAt: "2026-06-10 15:20",
  },
  p2: {
    status: "inProgress",
    startsAt: "2026-06-16 08:30",
    endsAt: "2026-06-18 18:00",
    teamIds: ["team-1", "team-2", "team-3"],
    specialtyIds: ["specialty-operation", "specialty-electrical"],
    passRate: 73.3,
    creatorName: "刘教员",
    updatedAt: "2026-06-17 10:05",
  },
  p3: {
    status: "draft",
    startsAt: null,
    endsAt: null,
    scoreMode: "unscored",
    totalScore: null,
    teamIds: [],
    specialtyIds: ["specialty-relay"],
    passRate: null,
    creatorName: "刘教员",
    updatedAt: "2026-06-14 16:40",
  },
  p4: {
    status: "ended",
    startsAt: "2026-05-28 09:00",
    endsAt: "2026-05-30 18:00",
    teamIds: ["team-1", "team-2", "team-3", "unassigned"],
    specialtyIds: ["specialty-operation", "specialty-electrical", "unassigned"],
    passRate: 85.7,
    creatorName: "培训管理员",
    updatedAt: "2026-05-31 09:15",
  },
  p5: {
    status: "inProgress",
    startsAt: "2026-06-15 09:00",
    endsAt: "2026-06-20 18:00",
    teamIds: ["team-1", "team-2"],
    specialtyIds: ["specialty-grid"],
    passRate: 83.3,
    creatorName: "王教员",
    updatedAt: "2026-06-17 08:45",
  },
  p6: {
    status: "inProgress",
    startsAt: "2026-06-14 08:00",
    endsAt: "2026-06-19 18:00",
    teamIds: ["team-1", "team-2"],
    specialtyIds: ["specialty-grid", "specialty-electrical"],
    passRate: 50,
    creatorName: "王教员",
    updatedAt: "2026-06-17 11:10",
  },
  p7: {
    status: "draft",
    startsAt: null,
    endsAt: null,
    teamIds: [],
    specialtyIds: ["specialty-electrical"],
    passRate: null,
    creatorName: "陈教员",
    updatedAt: "2026-06-09 17:00",
  },
  p8: {
    status: "ended",
    startsAt: "2026-06-08 08:30",
    endsAt: "2026-06-09 18:00",
    teamIds: ["team-1", "team-2", "team-3"],
    specialtyIds: ["specialty-grid"],
    passRate: 52.6,
    creatorName: "培训管理员",
    updatedAt: "2026-06-10 09:30",
  },
  p9: {
    status: "ended",
    startsAt: "2026-06-07 09:00",
    endsAt: "2026-06-08 18:00",
    teamIds: ["team-1", "team-2", "team-maint"],
    specialtyIds: ["specialty-relay"],
    passRate: 84.2,
    creatorName: "陈教员",
    updatedAt: "2026-06-09 10:10",
  },
  p10: {
    status: "scheduled",
    startsAt: "2026-06-21 09:00",
    endsAt: "2026-06-22 18:00",
    scoreMode: "variable",
    totalScore: null,
    teamIds: ["team-1", "team-2"],
    specialtyIds: ["specialty-operation"],
    passRate: null,
    creatorName: "培训管理员",
    updatedAt: "2026-06-15 13:25",
  },
  p11: {
    status: "inProgress",
    startsAt: "2026-06-12 09:00",
    endsAt: "2026-06-18 18:00",
    teamIds: ["team-1", "team-2"],
    specialtyIds: ["specialty-grid"],
    passRate: 66.7,
    creatorName: "刘教员",
    updatedAt: "2026-06-17 15:10",
  },
  p12: {
    status: "draft",
    startsAt: null,
    endsAt: null,
    teamIds: [],
    specialtyIds: ["specialty-grid"],
    passRate: null,
    creatorName: "王教员",
    updatedAt: "2026-06-03 18:20",
  },
  p13: {
    status: "ended",
    startsAt: "2026-06-02 08:30",
    endsAt: "2026-06-03 18:00",
    teamIds: ["team-1", "team-2", "team-3"],
    specialtyIds: ["specialty-operation", "specialty-electrical"],
    passRate: 90.6,
    creatorName: "培训管理员",
    updatedAt: "2026-06-04 08:50",
  },
  p14: {
    status: "ended",
    startsAt: "2026-06-01 08:30",
    endsAt: "2026-06-02 18:00",
    scoreMode: "variable",
    totalScore: null,
    teamIds: ["team-1", "team-2", "team-3", "unassigned"],
    specialtyIds: ["specialty-safety", "unassigned"],
    passRate: 88.9,
    creatorName: "安全培训员",
    updatedAt: "2026-06-03 09:10",
  },
  p15: {
    status: "ended",
    startsAt: "2026-05-30 09:00",
    endsAt: "2026-05-30 12:00",
    teamIds: ["team-1", "team-2"],
    specialtyIds: ["specialty-grid"],
    passRate: 85.7,
    creatorName: "培训管理员",
    updatedAt: "2026-05-30 15:40",
  },
  p16: {
    status: "draft",
    startsAt: null,
    endsAt: null,
    teamIds: [],
    specialtyIds: ["specialty-electrical"],
    passRate: null,
    creatorName: "陈教员",
    updatedAt: "2026-05-28 16:15",
  },
};

export interface MockAnalyticsSegment {
  teamId: string;
  specialtyId: string;
  assignedCount: number;
  submittedCount: number;
  scoreTotal: number;
  passedCount: number;
}

export interface MockAnalyticsExamRun {
  id: string;
  name: string;
  endedAt: string;
  seriesId: string;
  normalizedToHundred: boolean;
  reviewed: boolean;
  segments: MockAnalyticsSegment[];
  comparison?: {
    previousExamId: string;
    sampleCount: number;
    previousAverageScore: number;
    currentAverageScore: number;
    previousPassRate: number;
    currentPassRate: number;
  };
}

export const MOCK_ANALYTICS_EXAMS: MockAnalyticsExamRun[] = [
  {
    id: "p4",
    name: "新员工基础日常自测",
    endedAt: "2026-05-30",
    seriesId: "series-operation",
    normalizedToHundred: true,
    reviewed: true,
    segments: [
      {
        teamId: "team-1",
        specialtyId: "specialty-operation",
        assignedCount: 16,
        submittedCount: 16,
        scoreTotal: 1392,
        passedCount: 15,
      },
      {
        teamId: "team-2",
        specialtyId: "specialty-operation",
        assignedCount: 15,
        submittedCount: 15,
        scoreTotal: 1245,
        passedCount: 13,
      },
      {
        teamId: "team-3",
        specialtyId: "specialty-electrical",
        assignedCount: 20,
        submittedCount: 20,
        scoreTotal: 1640,
        passedCount: 17,
      },
      {
        teamId: "unassigned",
        specialtyId: "unassigned",
        assignedCount: 5,
        submittedCount: 5,
        scoreTotal: 427,
        passedCount: 3,
      },
    ],
  },
  {
    id: "p15",
    name: "AGC 进阶调控取证复习卷",
    endedAt: "2026-05-30",
    seriesId: "series-agc",
    normalizedToHundred: true,
    reviewed: true,
    segments: [
      {
        teamId: "team-1",
        specialtyId: "specialty-grid",
        assignedCount: 4,
        submittedCount: 4,
        scoreTotal: 368,
        passedCount: 4,
      },
      {
        teamId: "team-2",
        specialtyId: "specialty-grid",
        assignedCount: 4,
        submittedCount: 3,
        scoreTotal: 262,
        passedCount: 2,
      },
    ],
  },
  {
    id: "p14",
    name: "两票三制与现场安全日常测评",
    endedAt: "2026-06-02",
    seriesId: "series-operation",
    normalizedToHundred: true,
    reviewed: true,
    segments: [
      {
        teamId: "team-1",
        specialtyId: "specialty-safety",
        assignedCount: 14,
        submittedCount: 14,
        scoreTotal: 1274,
        passedCount: 13,
      },
      {
        teamId: "team-2",
        specialtyId: "specialty-safety",
        assignedCount: 14,
        submittedCount: 13,
        scoreTotal: 1144,
        passedCount: 12,
      },
      {
        teamId: "team-3",
        specialtyId: "specialty-safety",
        assignedCount: 15,
        submittedCount: 14,
        scoreTotal: 1204,
        passedCount: 13,
      },
      {
        teamId: "unassigned",
        specialtyId: "unassigned",
        assignedCount: 5,
        submittedCount: 4,
        scoreTotal: 338,
        passedCount: 2,
      },
    ],
  },
  {
    id: "p13",
    name: "厂用电系统典型操作达标卷",
    endedAt: "2026-06-03",
    seriesId: "series-operation",
    normalizedToHundred: true,
    reviewed: true,
    segments: [
      {
        teamId: "team-1",
        specialtyId: "specialty-electrical",
        assignedCount: 12,
        submittedCount: 12,
        scoreTotal: 1104,
        passedCount: 12,
      },
      {
        teamId: "team-2",
        specialtyId: "specialty-electrical",
        assignedCount: 11,
        submittedCount: 10,
        scoreTotal: 882,
        passedCount: 9,
      },
      {
        teamId: "team-3",
        specialtyId: "specialty-operation",
        assignedCount: 12,
        submittedCount: 10,
        scoreTotal: 894,
        passedCount: 8,
      },
    ],
  },
  {
    id: "p9",
    name: "继电保护基础理论综合测评",
    endedAt: "2026-06-08",
    seriesId: "series-relay",
    normalizedToHundred: true,
    reviewed: true,
    segments: [
      {
        teamId: "team-1",
        specialtyId: "specialty-relay",
        assignedCount: 14,
        submittedCount: 13,
        scoreTotal: 1131,
        passedCount: 12,
      },
      {
        teamId: "team-2",
        specialtyId: "specialty-relay",
        assignedCount: 13,
        submittedCount: 12,
        scoreTotal: 996,
        passedCount: 10,
      },
      {
        teamId: "team-maint",
        specialtyId: "specialty-relay",
        assignedCount: 15,
        submittedCount: 13,
        scoreTotal: 1103,
        passedCount: 10,
      },
    ],
  },
  {
    id: "p8",
    name: "一次调频两细则取证模拟卷",
    endedAt: "2026-06-09",
    seriesId: "series-agc",
    normalizedToHundred: true,
    reviewed: true,
    segments: [
      {
        teamId: "team-1",
        specialtyId: "specialty-grid",
        assignedCount: 8,
        submittedCount: 7,
        scoreTotal: 420,
        passedCount: 4,
      },
      {
        teamId: "team-2",
        specialtyId: "specialty-grid",
        assignedCount: 8,
        submittedCount: 6,
        scoreTotal: 318,
        passedCount: 3,
      },
      {
        teamId: "team-3",
        specialtyId: "specialty-grid",
        assignedCount: 8,
        submittedCount: 6,
        scoreTotal: 307,
        passedCount: 3,
      },
    ],
  },
  {
    id: "p1",
    name: "AGC / 两细则取证复习考试",
    endedAt: "2026-06-10",
    seriesId: "series-agc",
    normalizedToHundred: true,
    reviewed: true,
    segments: [
      {
        teamId: "team-1",
        specialtyId: "specialty-grid",
        assignedCount: 5,
        submittedCount: 5,
        scoreTotal: 390,
        passedCount: 4,
      },
      {
        teamId: "team-2",
        specialtyId: "specialty-grid",
        assignedCount: 5,
        submittedCount: 5,
        scoreTotal: 350,
        passedCount: 3,
      },
    ],
    comparison: {
      previousExamId: "p8",
      sampleCount: 8,
      previousAverageScore: 62,
      currentAverageScore: 76,
      previousPassRate: 50,
      currentPassRate: 75,
    },
  },
  {
    id: "unreviewed-1",
    name: "调度规程阶段测评",
    endedAt: "2026-06-12",
    seriesId: "series-operation",
    normalizedToHundred: true,
    reviewed: false,
    segments: [
      {
        teamId: "team-1",
        specialtyId: "specialty-grid",
        assignedCount: 12,
        submittedCount: 10,
        scoreTotal: 0,
        passedCount: 0,
      },
    ],
  },
];

export interface MockWeaknessItem {
  id: string;
  examId: string;
  knowledgePoint: string;
  specialtyId: string;
  topicName: string;
  respondentCount: number;
  questionCount: number;
  errorRate: number;
  previousErrorRate: number | null;
}

export const MOCK_ANALYTICS_WEAKNESSES: MockWeaknessItem[] = [
  {
    id: "weak-1",
    examId: "p1",
    knowledgePoint: "AGC 响应时间判定",
    specialtyId: "specialty-grid",
    topicName: "AGC 与两细则",
    respondentCount: 10,
    questionCount: 4,
    errorRate: 42.5,
    previousErrorRate: 50,
  },
  {
    id: "weak-2",
    examId: "p8",
    knowledgePoint: "一次调频死区与调差率",
    specialtyId: "specialty-grid",
    topicName: "一次调频",
    respondentCount: 19,
    questionCount: 5,
    errorRate: 51.6,
    previousErrorRate: null,
  },
  {
    id: "weak-3",
    examId: "p9",
    knowledgePoint: "差动保护动作边界",
    specialtyId: "specialty-relay",
    topicName: "继电保护基础",
    respondentCount: 38,
    questionCount: 4,
    errorRate: 36.8,
    previousErrorRate: 31.2,
  },
  {
    id: "weak-4",
    examId: "p13",
    knowledgePoint: "厂用电切换闭锁条件",
    specialtyId: "specialty-electrical",
    topicName: "典型操作",
    respondentCount: 32,
    questionCount: 3,
    errorRate: 28.1,
    previousErrorRate: 33.4,
  },
  {
    id: "weak-5",
    examId: "p14",
    knowledgePoint: "工作票终结条件",
    specialtyId: "specialty-safety",
    topicName: "两票三制",
    respondentCount: 45,
    questionCount: 3,
    errorRate: 24.4,
    previousErrorRate: 21.1,
  },
  {
    id: "weak-6",
    examId: "p4",
    knowledgePoint: "异常信息汇报时序",
    specialtyId: "specialty-operation",
    topicName: "新员工基础",
    respondentCount: 8,
    questionCount: 2,
    errorRate: 43.8,
    previousErrorRate: null,
  },
];

export const MOCK_DETAIL_NAMES = [
  "李工",
  "王工",
  "赵工",
  "孙工",
  "周工",
  "吴工",
  "郑工",
  "钱工",
  "陈工",
  "刘工",
  "黄工",
  "林工",
  "徐工",
  "郭工",
  "马工",
  "何工",
  "梁工",
  "罗工",
  "宋工",
  "谢工",
  "唐工",
  "韩工",
  "冯工",
  "于工",
  "董工",
  "萧工",
  "程工",
  "曹工",
  "袁工",
  "邓工",
  "许工",
  "傅工",
  "沈工",
  "曾工",
  "彭工",
  "吕工",
  "苏工",
  "卢工",
  "蒋工",
  "蔡工",
  "贾工",
  "丁工",
  "魏工",
  "薛工",
  "叶工",
  "阎工",
  "余工",
  "潘工",
  "杜工",
  "戴工",
  "夏工",
  "钟工",
  "汪工",
  "田工",
  "任工",
  "姜工",
];
