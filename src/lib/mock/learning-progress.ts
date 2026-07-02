import { DOCS, QUESTIONS, TOPICS } from "./data";
import type { MockState } from "./store";

export type DocReadStatus = "未学" | "学习中" | "已学";

export function getQuestionIdsForDoc(docId: string): string[] {
  return QUESTIONS.filter((q) => q.relatedDocId === docId).map((q) => q.id);
}

export function getDocProgress(docId: string, state: MockState) {
  const stored = state.docProgress?.[docId];
  if (stored) return stored;

  const doc = DOCS.find((d) => d.id === docId);
  const fallbackStatus: DocReadStatus =
    doc?.status === "已学" ? "已学" : doc?.status === "学习中" ? "学习中" : "未学";

  return {
    readStatus: fallbackStatus,
    answeredIds: [] as string[],
    manuallyLearned: false,
  };
}

export function isDocLearned(docId: string, state: MockState): boolean {
  const progress = getDocProgress(docId, state);
  if (progress.readStatus === "已学" || progress.manuallyLearned) return true;
  const qIds = getQuestionIdsForDoc(docId);
  if (qIds.length === 0) return progress.manuallyLearned ?? false;
  return qIds.every((id) => progress.answeredIds.includes(id));
}

export function getEffectiveDocStatus(docId: string, state: MockState): DocReadStatus {
  if (isDocLearned(docId, state)) return "已学";
  const progress = getDocProgress(docId, state);
  if (progress.answeredIds.length > 0 || progress.readStatus === "学习中") return "学习中";
  return progress.readStatus;
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
    .map((doc) => ({
      doc: doc!,
      status: getEffectiveDocStatus(doc!.id, state),
      questionCount: getQuestionIdsForDoc(doc!.id).length,
      answeredCount: getDocProgress(doc!.id, state).answeredIds.length,
    }));
}

export function getDocPracticeSessionId(docId: string): string {
  return `doc-practice-${docId}`;
}
