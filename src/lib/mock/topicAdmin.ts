// Mock data for 专题维护 (training teacher admin).
import { DOCS, QUESTIONS, TOPICS, type Topic } from "./data";

export type TopicPublishStatus = "草稿" | "已发布" | "已下架";

export type TopicSpecialty = "电气" | "锅炉" | "化学" | "运行值班" | "汽机" | "通用";

export type TopicPosition = "新员工" | "运行人员" | "检修人员" | "管理人员" | "班组长";

export type TopicScenario = "入职培训" | "故障复盘" | "标准操作" | "制度学习" | "专项提升";

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
  /** 数值下方说明 */
  hint?: string;
  /** 底部分隔线内补充说明 */
  detail?: string;
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

/** 专题知识点：严格来自本专题资料关联题目，保证列表与编辑页一致 */
function buildKnowledgePoints(topicId: string, docIds: string[]): TopicKnowledgePoint[] {
  const kpSet = new Set<string>();
  QUESTIONS.filter((q) => docIds.some((id) => q.relatedDocId === id)).forEach((q) =>
    q.knowledgePoints.forEach((k) => kpSet.add(k)),
  );
  return Array.from(kpSet).map((title, i) => ({
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
    docIds: [...topic.docIds],
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
        ? ["请继续完善资料与练习后发布"]
        : questionCount < 3
          ? ["题目覆盖不足，建议为每份资料至少关联 2 道题"]
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
    learnerCount: 0,
    maintainer: "王老师",
    aiHints: ["资料清单为空", "知识点未维护", "尚未生成关联题目"],
  },
];

export const TOPIC_ADMIN_STATS: TopicAdminStats[] = [
  {
    key: "total",
    label: "专题总数",
    value: TOPIC_ADMIN_RECORDS.length,
    hint: "全部维护专题",
    detail: "含草稿与下架",
  },
  {
    key: "published",
    label: "已发布",
    value: TOPIC_ADMIN_RECORDS.filter((t) => t.status === "已发布").length,
    hint: "对外可见",
    detail: "学员端可学习",
    tone: "success",
  },
  {
    key: "draft",
    label: "草稿",
    value: TOPIC_ADMIN_RECORDS.filter((t) => t.status === "草稿").length,
    hint: "待完善发布",
    detail: "编辑后可发布",
    tone: "warning",
  },
  {
    key: "learners",
    label: "在学人数",
    value: TOPIC_ADMIN_RECORDS.reduce((n, t) => n + (t.learnerCount || 0), 0),
    hint: "活跃学习人数",
    detail: "已发布专题累计",
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

export const EMPTY_TOPIC_DRAFT: Omit<
  TopicAdminRecord,
  "id" | "updatedAt" | "maintainer" | "learnerCount"
> = {
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

export const AI_TOPIC_TEMPLATES: { label: string; prompt: string }[] = [
  {
    label: "新员工入门",
    prompt:
      "面向新入职运行值班人员，围绕交接班、巡检和常见异常判断，组织一套入门专题。",
  },
  {
    label: "主变停投操作",
    prompt: "围绕 500kV 主变停投标准化操作，覆盖负荷转移、保护压板和中性点接地。",
  },
  {
    label: "AGC 考核专项",
    prompt: "针对运行人员，梳理两细则 AGC 考核要点、死区整定与异常处置。",
  },
];

export type AiTopicBasicInfo = {
  title: string;
  specialty: TopicSpecialty;
  scenario: TopicScenario;
  positions: TopicPosition[];
  learningGoal: string;
  intro: string;
  aiHints: string[];
};

function detectTopicIntent(prompt: string) {
  const text = prompt.toLowerCase();
  return {
    isAgc: /agc|两细则|调频/.test(text),
    isTransformer: /主变|停投|倒闸/.test(text),
    isFault: /故障|复盘|事故/.test(text),
  };
}

export function buildAiTopicBasicInfo(prompt: string): AiTopicBasicInfo {
  const { isAgc, isTransformer, isFault } = detectTopicIntent(prompt);
  const hint = `AI 起草 · 依据需求：${prompt.slice(0, 40)}${prompt.length > 40 ? "…" : ""}`;

  if (isAgc) {
    return {
      title: "AGC 与两细则考核专项",
      specialty: "运行值班",
      scenario: "专项提升",
      positions: ["运行人员", "班组长"],
      learningGoal: "能对照两细则理解 AGC 考核口径，并完成死区、速率相关现场判断。",
      intro: "围绕 AGC 调节性能考核与现场参数整定，帮助值班员把规则落到当班操作。",
      aiHints: [hint],
    };
  }
  if (isTransformer) {
    return {
      title: "主变停投标准化操作",
      specialty: "电气",
      scenario: "标准操作",
      positions: ["运行人员", "班组长"],
      learningGoal: "能按标准流程完成主变停投前核对、保护压板与中性点接地配合。",
      intro: "覆盖负荷转移、保护连接片和中性点接地等关键卡控点。",
      aiHints: [hint],
    };
  }
  if (isFault) {
    return {
      title: "典型故障复盘专项",
      specialty: "电气",
      scenario: "故障复盘",
      positions: ["运行人员", "检修人员"],
      learningGoal: "能按固定思路完成差动动作后的范围判断与复电前核对。",
      intro: "从典型事故通报提炼判断顺序与易错点，服务班组复盘培训。",
      aiHints: [hint],
    };
  }
  return {
    title: "新员工运行专业入门",
    specialty: "运行值班",
    scenario: "入职培训",
    positions: ["新员工", "运行人员"],
    learningGoal: "掌握值班巡检基本流程与常见异常初步判断。",
    intro: "面向首次上岗运行人员，围绕岗位能力与真实业务场景组织学习。",
    aiHints: [hint],
  };
}

export function recommendAiTopicDocs(prompt: string, limit = 4): string[] {
  const { isAgc, isTransformer, isFault } = detectTopicIntent(prompt);
  const pool = getLearnablePoolDocs();
  const preferred = pool.filter((doc) => {
    if (isAgc) return /agc|细则|调频/i.test(doc.title);
    if (isTransformer) return /主变|操作/i.test(doc.title);
    if (isFault) return /故障|事故|复盘|差动/i.test(doc.title);
    return true;
  });
  return (preferred.length >= 3 ? preferred : pool).slice(0, limit).map((doc) => doc.id);
}

export function generateAiKnowledgePoints(docIds: string[]): TopicKnowledgePoint[] {
  const kpSet = new Set<string>();
  docIds.forEach((docId) => {
    const doc = DOCS.find((item) => item.id === docId);
    doc?.highlight.slice(0, 2).forEach((item) => kpSet.add(item));
    QUESTIONS.filter((question) => question.relatedDocId === docId)
      .flatMap((question) => question.knowledgePoints)
      .forEach((item) => kpSet.add(item));
  });

  return Array.from(kpSet)
    .slice(0, 6)
    .map((pointTitle, index) => ({
      id: `kp-ai-${Date.now()}-${index}`,
      title: pointTitle,
      summary: `基于所选资料提炼：${pointTitle} 的核心概念与现场要点。`,
      source: "ai" as const,
      confirmed: false,
    }));
}

export function summarizeAiTopicQuestions(docIds: string[]) {
  const docQuestions = buildDocQuestions(docIds).map((item) => ({ ...item, confirmed: false }));
  const questionEdits = buildQuestionEdits(docIds);
  Object.values(questionEdits).forEach((question) => {
    question.confirmed = false;
  });
  return { docQuestions, questionEdits };
}

export function buildAiGeneratedTopicDraft(prompt: string): Omit<
  TopicAdminRecord,
  "id" | "updatedAt" | "maintainer" | "learnerCount"
> {
  const basic = buildAiTopicBasicInfo(prompt);
  const docIds = recommendAiTopicDocs(prompt);
  const { docQuestions, questionEdits } = summarizeAiTopicQuestions(docIds);

  return {
    ...basic,
    docIds,
    knowledgePoints: generateAiKnowledgePoints(docIds),
    docQuestions,
    questionEdits,
    status: "草稿",
  };
}
