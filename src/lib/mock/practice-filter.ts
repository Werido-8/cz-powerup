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
  if (opts.types.length === 0) return 0;

  const categories =
    opts.categoryKeys.length > 0
      ? KNOWLEDGE_CATEGORIES.filter((item) => opts.categoryKeys.includes(item.key))
      : KNOWLEDGE_CATEGORIES;
  const bankSize = categories.reduce((sum, item) => sum + item.questionCount, 0);
  if (bankSize === 0) return 0;

  const typeShare: Record<QuestionType, number> = {
    single: 0.46,
    multiple: 0.24,
    judge: 0.2,
    text: 0.1,
  };
  const typeRatio = opts.types.reduce((sum, type) => sum + typeShare[type], 0);
  const diffRatio = opts.diff === "all" ? 1 : opts.diff === "easy" ? 0.58 : 0.42;

  return Math.max(1, Math.round(bankSize * typeRatio * diffRatio));
}
