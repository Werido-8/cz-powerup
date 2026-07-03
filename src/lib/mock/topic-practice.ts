import { DOCS, QUESTIONS, type Question, type Topic } from "./data";

export type TopicPracticeDraft = {
  topicId: string;
  answers: Record<string, string | string[]>;
  currentIndex: number;
  savedAt: string;
};

export type TopicQuestionItem = {
  question: Question;
  docId: string;
  docTitle: string;
  globalIndex: number;
};

function practiceKey(topicId: string) {
  return `topic-practice:${topicId}`;
}

export function getTopicPracticeSessionId(topicId: string) {
  return `topic-practice-${topicId}`;
}

export function getTopicQuestions(topic: Topic): TopicQuestionItem[] {
  const items: TopicQuestionItem[] = [];
  let n = 0;
  topic.docIds.forEach((docId) => {
    const doc = DOCS.find((d) => d.id === docId);
    QUESTIONS.filter((q) => q.relatedDocId === docId).forEach((question) => {
      n += 1;
      items.push({
        question,
        docId,
        docTitle: doc?.title ?? docId,
        globalIndex: n,
      });
    });
  });
  return items;
}

export function loadTopicPracticeDraft(topicId: string): TopicPracticeDraft | null {
  try {
    const raw = sessionStorage.getItem(practiceKey(topicId));
    return raw ? (JSON.parse(raw) as TopicPracticeDraft) : null;
  } catch {
    return null;
  }
}

export function saveTopicPracticeDraft(draft: TopicPracticeDraft) {
  sessionStorage.setItem(practiceKey(draft.topicId), JSON.stringify(draft));
}

export function clearTopicPracticeDraft(topicId: string) {
  sessionStorage.removeItem(practiceKey(topicId));
}

function isAnswered(value: string | string[] | undefined): boolean {
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value !== "";
}

/** 统计暂存卷面中已作答题数；传入 questionIds 时仅统计专题内题目 */
export function countDraftAnswers(
  draft: TopicPracticeDraft | null,
  questionIds?: string[],
): number {
  if (!draft) return 0;
  const ids = questionIds?.length ? questionIds : Object.keys(draft.answers);
  return ids.filter((id) => isAnswered(draft.answers[id])).length;
}

export function hasTopicPracticeDraft(topicId: string): boolean {
  const draft = loadTopicPracticeDraft(topicId);
  return draft != null && countDraftAnswers(draft) > 0;
}
