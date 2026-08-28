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

/** 统计暂存进度中已作答题数；传入 questionIds 时仅统计专题内题目 */
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

export type TopicPracticeLastScore = {
  topicId: string;
  accuracy: number;
  correct: number;
  total: number;
  submittedAt: string;
};

const LAST_SCORE_DEFAULTS: Record<string, Omit<TopicPracticeLastScore, "topicId">> = {
  "t-agc": { accuracy: 82, correct: 9, total: 11, submittedAt: "2026-08-21T16:40:00+08:00" },
  "t-newbie": { accuracy: 76, correct: 13, total: 17, submittedAt: "2026-08-19T09:12:00+08:00" },
};

function lastScoreKey(topicId: string) {
  return `topic-practice-last:${topicId}`;
}

export function loadTopicPracticeLastScore(topicId: string): TopicPracticeLastScore | null {
  try {
    const raw = sessionStorage.getItem(lastScoreKey(topicId));
    if (raw) return JSON.parse(raw) as TopicPracticeLastScore;
  } catch {
    /* ignore */
  }
  const seeded = LAST_SCORE_DEFAULTS[topicId];
  return seeded ? { topicId, ...seeded } : null;
}

export function saveTopicPracticeLastScore(score: TopicPracticeLastScore) {
  sessionStorage.setItem(lastScoreKey(score.topicId), JSON.stringify(score));
}

// ─── 资料内练习最近一次得分（mock 默认数据） ─────────────────────────────────

const DOC_PRACTICE_DEFAULTS: Record<string, { accuracy: number; correct: number; total: number }> =
  {
    d1: { accuracy: 85, correct: 11, total: 13 },
    d2: { accuracy: 73, correct: 8, total: 11 },
    d5: { accuracy: 90, correct: 9, total: 10 },
    d8: { accuracy: 67, correct: 6, total: 9 },
  };

function docPracticeKey(docId: string) {
  return `doc-practice-last:${docId}`;
}

export function loadDocLastPracticeScore(
  docId: string,
): { accuracy: number; correct: number; total: number } | null {
  try {
    const raw = sessionStorage.getItem(docPracticeKey(docId));
    if (raw) return JSON.parse(raw) as { accuracy: number; correct: number; total: number };
  } catch {
    /* ignore */
  }
  return DOC_PRACTICE_DEFAULTS[docId] ?? null;
}

export function saveDocLastPracticeScore(
  docId: string,
  score: { accuracy: number; correct: number; total: number },
) {
  sessionStorage.setItem(docPracticeKey(docId), JSON.stringify(score));
}
