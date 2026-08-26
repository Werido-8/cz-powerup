export type TrainingResultKind = "formal" | "custom" | "practice" | "file" | "review";
export type TrainingScoreMode = "fixed" | "variable" | "unscored";

export type TrainingResultAnswer = string | string[];

export type TrainingResultQuestion = {
  id: string;
  type: string;
  stem: string;
  options?: { key: string; label: string }[];
  answer: TrainingResultAnswer;
  analysis?: string;
  knowledge?: string;
  score?: number;
};

export type SavedTrainingResult = {
  wrongIds: string[];
  total: number;
  answers: Record<string, TrainingResultAnswer>;
  qids: string[];
  elapsed: number;
  mode: "practice" | "exam" | "review";
  kind?: TrainingResultKind;
  title?: string;
  sourceLabel?: string;
  submittedAt?: string;
  passScore?: number | null;
  durationLimit?: number;
  /** 实际得分；练习场景不使用，改看正确率 */
  score?: number;
  scoreMode?: TrainingScoreMode;
  /** 固定总分时的卷面满分；按题计分 / 不计分时为空 */
  totalScore?: number | null;
  paperId?: string;
  topicId?: string;
  docId?: string;
  fileId?: string;
  knowledgeBaseId?: string;
  questions?: TrainingResultQuestion[];
};

const PRACTICE_KINDS = new Set<TrainingResultKind>(["practice", "file", "review"]);
const PRACTICE_SOURCE_LABELS = new Set(["专项练习", "专题练习", "资料练习", "资料内练习"]);

export type TrainingResultUpstream =
  | { type: "file"; fileId: string; knowledgeBaseId?: string }
  | { type: "topic"; topicId: string }
  | { type: "doc"; docId: string }
  | { type: "exam" }
  | { type: "custom-exam" }
  | { type: "wrong" }
  | { type: "practice" }
  | { type: "records" };

export function resolveTrainingResultUpstream(result: SavedTrainingResult): TrainingResultUpstream {
  if (result.kind === "file" && result.fileId) {
    return { type: "file", fileId: result.fileId, knowledgeBaseId: result.knowledgeBaseId };
  }
  if (result.topicId) return { type: "topic", topicId: result.topicId };
  if (result.docId) return { type: "doc", docId: result.docId };

  const label = result.sourceLabel ?? "";
  if (result.kind === "formal" || label === "正式考试") return { type: "exam" };
  if (result.kind === "custom" || label === "自主组卷") return { type: "custom-exam" };
  if (result.kind === "review" || result.mode === "review" || label === "错题本") {
    return { type: "wrong" };
  }
  if (result.kind === "practice" || label === "专项练习") return { type: "practice" };
  return { type: "records" };
}

export function trainingResultStorageKey(id: string) {
  return `result-${id}`;
}

export function isTrainingResultAnswerFilled(value?: TrainingResultAnswer) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
}

export function isPracticeScoringResult(result: SavedTrainingResult) {
  if (result.kind && PRACTICE_KINDS.has(result.kind)) return true;
  if (result.sourceLabel && PRACTICE_SOURCE_LABELS.has(result.sourceLabel)) return true;
  return result.mode === "practice" || result.mode === "review";
}

function formatPoints(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function earnedQuestionPoints(result: SavedTrainingResult) {
  return (result.questions ?? []).reduce((sum, question) => {
    if ((question.score ?? 0) <= 0) return sum;
    if (!isTrainingResultAnswerFilled(result.answers[question.id])) return sum;
    if (result.wrongIds.includes(question.id)) return sum;
    return sum + (question.score ?? 0);
  }, 0);
}

function paperQuestionPoints(result: SavedTrainingResult) {
  return (result.questions ?? []).reduce((sum, question) => sum + (question.score ?? 0), 0);
}

export type TrainingResultScoreDisplay = {
  metric: "accuracy" | "points" | "unscored";
  displayValue: string;
  displayLabel: string;
  scoreValue: number | null;
  ringPercent: number;
  tonePercent: number;
  caption: string;
  scoringLabel: string;
  hasPassLine: boolean;
};

export function resolveTrainingResultScore(
  result: SavedTrainingResult,
  stats: { correct: number; total: number },
): TrainingResultScoreDisplay {
  const questionCount = Math.max(stats.total, 1);
  const accuracy = Math.round((stats.correct / questionCount) * 100);

  if (isPracticeScoringResult(result)) {
    return {
      metric: "accuracy",
      displayValue: `${accuracy}%`,
      displayLabel: "正确率",
      scoreValue: accuracy,
      ringPercent: accuracy,
      tonePercent: accuracy,
      caption: `本次共 ${result.total} 题，按正确率统计，不设置达标要求`,
      scoringLabel: "正确率",
      hasPassLine: false,
    };
  }

  if (result.scoreMode === "unscored") {
    return {
      metric: "unscored",
      displayValue: "—",
      displayLabel: "不计分",
      scoreValue: null,
      ringPercent: accuracy,
      tonePercent: accuracy,
      caption: `本次考试不计分，共 ${result.total} 题，正确率 ${accuracy}%`,
      scoringLabel: "不计分",
      hasPassLine: false,
    };
  }

  const questionPoints = paperQuestionPoints(result);
  const isVariable = result.scoreMode === "variable";
  const totalScore = isVariable
    ? null
    : (result.totalScore ?? (questionPoints > 0 ? questionPoints : 100));
  const score = result.score ?? (questionPoints > 0 ? earnedQuestionPoints(result) : accuracy);
  const ringPercent =
    totalScore && totalScore > 0
      ? Math.min(100, Math.max(0, (score / totalScore) * 100))
      : accuracy;
  const caption = isVariable
    ? `本次按题计分，不设总分，共 ${result.total} 题`
    : result.passScore != null
      ? `本次总分 ${formatPoints(totalScore ?? 0)} 分，达标分数 ${formatPoints(result.passScore)} 分`
      : `本次总分 ${formatPoints(totalScore ?? 0)} 分，不设置达标要求`;

  return {
    metric: "points",
    displayValue: formatPoints(score),
    displayLabel: "得分",
    scoreValue: score,
    ringPercent,
    tonePercent: ringPercent,
    caption,
    scoringLabel: isVariable
      ? "按题计分"
      : totalScore != null
        ? `总分 ${formatPoints(totalScore)} 分`
        : "按题计分",
    hasPassLine: result.passScore != null,
  };
}
