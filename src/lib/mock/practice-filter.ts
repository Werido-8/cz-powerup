import { QUESTIONS, KNOWLEDGE_CATEGORIES, type Question, type QuestionType } from "./data";

export type PracticeDifficulty = "all" | "easy" | "hard";

export const PRACTICE_TYPE_OPTIONS: { key: QuestionType; label: string }[] = [
  { key: "single", label: "单选题" },
  { key: "multiple", label: "多选题" },
  { key: "judge", label: "判断题" },
  { key: "text", label: "简答题" },
];

/** 无 difficulty 字段时按题号推导 */
export function getQuestionDifficulty(q: Question): "easy" | "hard" {
  if (q.difficulty) return q.difficulty;
  const num = Number.parseInt(q.id.replace(/\D/g, ""), 10);
  return Number.isFinite(num) && num % 3 === 0 ? "hard" : "easy";
}

function matchesCategory(q: Question, catKey: string): boolean {
  const cat = KNOWLEDGE_CATEGORIES.find((c) => c.key === catKey);
  const label = cat?.label ?? catKey;
  return (
    q.knowledgePoints.some(
      (k) => k.includes(catKey) || catKey.includes(k) || k.includes(label) || label.includes(k),
    ) ||
    (q.scene != null && (q.scene.includes(catKey) || catKey.includes(q.scene)))
  );
}

export function filterPracticeQuestions(opts: {
  categoryKeys: string[];
  types: QuestionType[];
  diff: PracticeDifficulty;
}): Question[] {
  let pool = QUESTIONS;

  if (opts.categoryKeys.length > 0) {
    pool = pool.filter((q) => opts.categoryKeys.some((cat) => matchesCategory(q, cat)));
  }

  if (opts.types.length > 0) {
    pool = pool.filter((q) => opts.types.includes(q.type));
  }

  if (opts.diff === "easy") {
    pool = pool.filter((q) => getQuestionDifficulty(q) === "easy");
  } else if (opts.diff === "hard") {
    pool = pool.filter((q) => getQuestionDifficulty(q) === "hard");
  }

  return pool;
}

export function countAvailableQuestions(opts: {
  categoryKeys: string[];
  types: QuestionType[];
  diff: PracticeDifficulty;
}): number {
  return filterPracticeQuestions(opts).length;
}
