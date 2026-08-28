import { DOCS, QUESTIONS, TOPICS, type Doc, type Topic } from "./data";
import type { MockState } from "./store";

export type DocReadStatus = "未学" | "学习中" | "已学";

export function getQuestionIdsForDoc(docId: string): string[] {
  return QUESTIONS.filter((q) => q.relatedDocId === docId).map((q) => q.id);
}

/** 简答题无法由前端可靠判分，因此仅客观题可触发自动“已学习”。 */
export function getAutoGradableQuestionIdsForDoc(docId: string): string[] {
  return QUESTIONS.filter((q) => q.relatedDocId === docId && q.type !== "text").map((q) => q.id);
}

export function getDocProgress(docId: string, state: MockState) {
  const stored = state.docProgress?.[docId];
  if (stored) return stored;

  return {
    readStatus: "未学" as const,
    answeredIds: [] as string[],
    correctIds: [] as string[],
    manuallyLearned: false,
  };
}

export function isDocLearned(docId: string, state: MockState): boolean {
  const progress = getDocProgress(docId, state);
  if (progress.readStatus === "已学" || progress.manuallyLearned) return true;
  const qIds = getAutoGradableQuestionIdsForDoc(docId);
  if (qIds.length === 0) return progress.manuallyLearned ?? false;
  return qIds.every((id) => (progress.correctIds ?? []).includes(id));
}

export function getEffectiveDocStatus(docId: string, state: MockState): DocReadStatus {
  if (isDocLearned(docId, state)) return "已学";
  const progress = getDocProgress(docId, state);
  if (progress.answeredIds.length > 0 || progress.readStatus === "学习中") return "学习中";
  return progress.readStatus;
}

export function getTopicLearningStatus(topicId: string, state: MockState): DocReadStatus {
  const topic = TOPICS.find((item) => item.id === topicId);
  if (!topic || topic.docIds.length === 0) return "未学";

  const statuses = topic.docIds.map((docId) => getEffectiveDocStatus(docId, state));
  if (statuses.every((status) => status === "已学")) return "已学";
  if (statuses.some((status) => status === "学习中")) return "学习中";
  return "未学";
}

export type ContinueLearningItem = {
  doc: Doc;
  topic: Topic | undefined;
  topicProgress: number;
  lastActivityAt: string | undefined;
};

/** 仅从有效学习行为中选择继续项；最近打开但未开始学习的资料不会出现在这里。 */
export function getLatestInProgressDoc(state: MockState): ContinueLearningItem | null {
  const candidates = Object.entries(state.docProgress)
    .map(([docId, progress]) => {
      const doc = DOCS.find((item) => item.id === docId);
      if (!doc || getEffectiveDocStatus(docId, state) !== "学习中") return null;

      const topic = TOPICS.find((item) => item.id === doc.topicId);
      return {
        doc,
        topic,
        topicProgress: topic ? getTopicProgress(topic.id, state) : 0,
        lastActivityAt: progress.lastActivityAt,
      };
    })
    .filter((item): item is ContinueLearningItem => item !== null)
    .sort(
      (left, right) =>
        (Date.parse(right.lastActivityAt ?? "") || 0) -
        (Date.parse(left.lastActivityAt ?? "") || 0),
    );

  return candidates[0] ?? null;
}

export function getTopicProgress(topicId: string, state: MockState): number {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic || topic.docIds.length === 0) return 0;
  const learned = topic.docIds.filter((id) => isDocLearned(id, state)).length;
  return Math.round((learned / topic.docIds.length) * 100);
}

export function getTopicDocsWithProgress(topicId: string, state: MockState) {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return [];
  return topic.docIds
    .map((id) => DOCS.find((d) => d.id === id))
    .filter(Boolean)
    .map((doc) => {
      const progress = getDocProgress(doc!.id, state);
      return {
        doc: doc!,
        status: getEffectiveDocStatus(doc!.id, state),
        questionCount: getQuestionIdsForDoc(doc!.id).length,
        answeredCount: progress.answeredIds.length,
        correctCount: progress.correctIds?.length ?? 0,
      };
    });
}

export function getDocPracticeSessionId(docId: string): string {
  return `doc-practice-${docId}`;
}
