// Mock data for 专题维护 (training teacher admin).
import { DOCS, QUESTIONS, TOPICS, type Topic } from "./data";

export type TopicPublishStatus = "草稿" | "已发布" | "已下架";

export type TopicSpecialty =
  | "电气"
  | "锅炉"
  | "化学"
  | "运行值班"
  | "汽机"
  | "通用";

export type TopicPosition =
  | "新员工"
  | "运行人员"
  | "检修人员"
  | "管理人员"
  | "班组长";

export type TopicScenario =
  | "入职培训"
  | "故障复盘"
  | "标准操作"
  | "制度学习"
  | "专项提升";

export type TopicKnowledgePoint = {
  id: string;
  title: string;
  summary: string;
  source?: "manual" | "ai";
  confirmed: boolean;
};

export type TopicDocQuestion = {
  docId: string;
  questionIds: string[];
  generated: boolean;
  confirmed: boolean;
};

/** 专题维护中可编辑的题目快照（覆盖题库原始数据） */
export type EditableTopicQuestion = {
  id: string;
  type: "single" | "multiple" | "judge" | "text";
  stem: string;
  options?: { key: string; label: string }[];
  answer: string | string[];
  analysis: string;
  relatedDocId: string;
  confirmed?: boolean;
};

export type TopicAdminRecord = {
  id: string;
  title: string;
  specialty: TopicSpecialty;
  positions: TopicPosition[];
  learningGoal: string;
  scenario: TopicScenario;
  intro: string;
  docIds: string[];
  knowledgePoints: TopicKnowledgePoint[];
  docQuestions: TopicDocQuestion[];
  /** 题目编辑覆盖，key 为 questionId */
  questionEdits?: Record<string, EditableTopicQuestion>;
  status: TopicPublishStatus;
  updatedAt: string;
  publishedAt?: string;
  learnerCount: number;
  maintainer: string;
  aiHints?: string[];
};

export type TopicAdminStats = {
  key: string;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "success";
};

const POSITION_MAP: Record<Topic["role"], TopicPosition[]> = {
  运行: ["运行人员", "班组长"],
  运检: ["检修人员"],
  管理: ["管理人员"],
  通用: ["新员工", "运行人员"],
};

const SPECIALTY_MAP: Record<string, TopicSpecialty> = {
  "t-newbie": "运行值班",
  "t-op": "电气",
  "t-fault": "电气",
  "t-agc": "运行值班",
};

const SCENARIO_MAP: Record<string, TopicScenario> = {
  "t-newbie": "入职培训",
  "t-op": "标准操作",
  "t-fault": "故障复盘",
  "t-agc": "专项提升",
};

function buildKnowledgePoints(topicId: string, docIds: string[]): TopicKnowledgePoint[] {
  const kpSet = new Set<string>();
  QUESTIONS.filter((q) => docIds.some((id) => q.relatedDocId === id)).forEach((q) =>
    q.knowledgePoints.forEach((k) => kpSet.add(k)),
  );
  return Array.from(kpSet)
    .slice(0, 6)
    .map((title, i) => ({
      id: `${topicId}-kp-${i}`,
      title,
      summary: `掌握「${title}」相关概念与现场应用要点。`,
      source: "ai" as const,
      confirmed: true,
    }));
}

function buildDocQuestions(docIds: string[]): TopicDocQuestion[] {
  return docIds.map((docId) => {
    const qids = QUESTIONS.filter((q) => q.relatedDocId === docId).map((q) => q.id);
    return {
      docId,
      questionIds: qids,
      generated: qids.length > 0,
      confirmed: qids.length > 0,
    };
  });
}

function buildQuestionEdits(docIds: string[]): Record<string, EditableTopicQuestion> {
  const edits: Record<string, EditableTopicQuestion> = {};
  docIds.forEach((docId) => {
    QUESTIONS.filter((q) => q.relatedDocId === docId).forEach((q) => {
      edits[q.id] = {
        id: q.id,
        type: q.type,
        stem: q.stem,
        options: q.options?.map((o) => ({ ...o })),
        answer: Array.isArray(q.answer) ? [...q.answer] : q.answer,
        analysis: q.analysis,
        relatedDocId: docId,
        confirmed: true,
      };
    });
  });
  return edits;
}

function topicToAdminRecord(topic: Topic, status: TopicPublishStatus): TopicAdminRecord {
  const docQuestions = buildDocQuestions(topic.docIds);
  const questionCount = docQuestions.reduce((n, d) => n + d.questionIds.length, 0);

  return {
    id: topic.id,
    title: topic.title,
    specialty: SPECIALTY_MAP[topic.id] ?? "通用",
    positions: POSITION_MAP[topic.role] ?? ["运行人员"],
    learningGoal: `学完后能独立完成${topic.title}相关现场判断与操作。`,
    scenario: SCENARIO_MAP[topic.id] ?? "专项提升",
    intro: topic.desc,
    docIds: topic.docIds,
    knowledgePoints: buildKnowledgePoints(topic.id, topic.docIds),
    docQuestions,
    questionEdits: buildQuestionEdits(topic.docIds),
    status,
    updatedAt: "2025-06-28",
    publishedAt: status === "已发布" ? "2025-06-20" : undefined,
    learnerCount: status === "已发布" ? 24 + topic.progress : 0,
    maintainer: "李老师",
    aiHints:
      status === "草稿"
        ? ["资料清单为空，请从学习资料池选择至少 2 份资料", "尚未维护知识点"]
        : questionCount < 5
          ? ["题目覆盖不足，建议为每份资料生成 3–5 道题"]
          : undefined,
  };
}

export const TOPIC_ADMIN_RECORDS: TopicAdminRecord[] = [
  topicToAdminRecord(TOPICS[0], "已发布"),
  topicToAdminRecord(TOPICS[1], "已发布"),
  topicToAdminRecord(TOPICS[2], "草稿"),
  topicToAdminRecord(TOPICS[3], "已下架"),
  {
    id: "t-draft-new",
    title: "化学专业水质监测入门",
    specialty: "化学",
    positions: ["新员工", "运行人员"],
    learningGoal: "掌握循环水、补给水日常监测指标与异常判断方法。",
    scenario: "入职培训",
    intro: "面向化学专业新员工，梳理水质监测基础与厂内化验流程。",
    docIds: [],
    knowledgePoints: [],
    docQuestions: [],
    status: "草稿",
    updatedAt: "2025-06-30",
    maintainer: "王老师",
    aiHints: ["资料清单为空", "知识点未维护", "尚未生成关联题目"],
  },
];

export const TOPIC_ADMIN_STATS: TopicAdminStats[] = [
  { key: "total", label: "专题总数", value: TOPIC_ADMIN_RECORDS.length, hint: "含草稿与下架" },
  {
    key: "published",
    label: "已发布",
    value: TOPIC_ADMIN_RECORDS.filter((t) => t.status === "已发布").length,
    tone: "success",
  },
  {
    key: "draft",
    label: "草稿",
    value: TOPIC_ADMIN_RECORDS.filter((t) => t.status === "草稿").length,
    tone: "warning",
  },
  {
    key: "learners",
    label: "在学人数",
    value: TOPIC_ADMIN_RECORDS.reduce((n, t) => n + t.learnerCount, 0),
    hint: "已发布专题累计",
  },
];

export const SPECIALTY_OPTIONS: TopicSpecialty[] = [
  "电气",
  "锅炉",
  "化学",
  "运行值班",
  "汽机",
  "通用",
];

export const POSITION_OPTIONS: TopicPosition[] = [
  "新员工",
  "运行人员",
  "检修人员",
  "管理人员",
  "班组长",
];

export const SCENARIO_OPTIONS: TopicScenario[] = [
  "入职培训",
  "故障复盘",
  "标准操作",
  "制度学习",
  "专项提升",
];

/** 学习资料池：知识类、可纳入专题的资料 */
export function getLearnablePoolDocs() {
  return DOCS.filter((d) => d.status !== "未学" || d.topicId);
}

export function getTopicAdminById(id: string) {
  return TOPIC_ADMIN_RECORDS.find((t) => t.id === id);
}

export function getTopicQuestionCount(record: TopicAdminRecord) {
  return record.docQuestions.reduce((n, d) => n + d.questionIds.length, 0);
}

export const EMPTY_TOPIC_DRAFT: Omit<TopicAdminRecord, "id" | "updatedAt" | "maintainer" | "learnerCount"> = {
  title: "",
  specialty: "运行值班",
  positions: ["运行人员"],
  learningGoal: "",
  scenario: "入职培训",
  intro: "",
  docIds: [],
  knowledgePoints: [],
  docQuestions: [],
  status: "草稿",
};
