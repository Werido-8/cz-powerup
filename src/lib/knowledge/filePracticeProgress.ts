import { isPracticeAnswerFilled } from "./filePractice";

export type FilePracticeLastScore = {
  fileId: string;
  accuracy: number;
  correct: number;
  total: number;
  submittedAt: string;
};

const FILE_DRAFT_KEY = (fileId: string) => `knowledge-file-practice-draft:${fileId}`;
const FILE_SCORE_KEY = (fileId: string) => `file-practice-last:${fileId}`;

const LAST_SCORE_DEFAULTS: Record<string, Omit<FilePracticeLastScore, "fileId">> = {
  "file-grid-guide": {
    accuracy: 83,
    correct: 5,
    total: 6,
    submittedAt: "2026-08-22T11:20:00+08:00",
  },
  "file-agc-rule": {
    accuracy: 67,
    correct: 4,
    total: 6,
    submittedAt: "2026-08-20T15:48:00+08:00",
  },
  "file-public-safety": {
    accuracy: 90,
    correct: 5,
    total: 6,
    submittedAt: "2026-08-18T09:05:00+08:00",
  },
};

export function filePracticeDraftKey(fileId: string) {
  return FILE_DRAFT_KEY(fileId);
}

export function loadFilePracticeDraft(fileId: string): {
  answers: Record<string, string | string[]>;
  savedAt?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FILE_DRAFT_KEY(fileId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as { answers?: Record<string, string | string[]>; savedAt?: string };
    return { answers: draft.answers ?? {}, savedAt: draft.savedAt };
  } catch {
    return null;
  }
}

export function countFilePracticeDraftAnswers(fileId: string, questionIds: string[]) {
  const draft = loadFilePracticeDraft(fileId);
  if (!draft) return 0;
  return questionIds.filter((id) => isPracticeAnswerFilled(draft.answers[id])).length;
}

export function loadFileLastPracticeScore(fileId: string): FilePracticeLastScore | null {
  if (typeof window === "undefined") return LAST_SCORE_DEFAULTS[fileId]
    ? { fileId, ...LAST_SCORE_DEFAULTS[fileId] }
    : null;
  try {
    const raw = window.sessionStorage.getItem(FILE_SCORE_KEY(fileId));
    if (raw) return JSON.parse(raw) as FilePracticeLastScore;
  } catch {
    /* ignore */
  }
  const seeded = LAST_SCORE_DEFAULTS[fileId];
  return seeded ? { fileId, ...seeded } : null;
}

export function saveFileLastPracticeScore(score: FilePracticeLastScore) {
  window.sessionStorage.setItem(FILE_SCORE_KEY(score.fileId), JSON.stringify(score));
}
