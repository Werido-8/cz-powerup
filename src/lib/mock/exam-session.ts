import type { ExamScoreMode } from "@/lib/exam-admin/types";
import { EXAM_TASK_META } from "@/lib/mock/examAnalytics";
import {
  EDITOR_GROUPS,
  PAPERS,
  getPaperQuestionGroups,
  type EditorGroup,
  type Paper,
} from "@/lib/mock/examAdmin";

/** 学员端试卷 id → 管理端试卷 id */
const EMPLOYEE_TO_ADMIN_PAPER: Record<string, string> = {
  "AGC-取证复习卷": "p1",
  "主变停送电-岗位达标卷": "p2",
  "差动保护-阶段测评卷": "p3",
  "复证巩固-调频卷": "p5",
  "新员工-日常自测卷": "p4",
  "AVC-电压控制卷": "p6",
};

export interface ExamSessionPaper {
  employeePaperId: string;
  adminPaperId: string;
  title: string;
  groups: EditorGroup[];
  duration: number;
  passLine: number | null;
  scoreMode: ExamScoreMode;
  totalScore: number | null;
  goal: string;
  category: string;
  difficulty: string;
  questionCount: number;
}

export function examPaperTotalScore(groups: EditorGroup[]) {
  return groups.reduce(
    (sum, group) =>
      sum +
      group.questions.reduce((groupSum, question) => groupSum + (question.score ?? group.perScore), 0),
    0,
  );
}

export function scoreExamAnswers(
  items: ReturnType<typeof flattenExamQuestions>,
  answers: Record<string, string | string[]>,
  wrongIds: string[],
) {
  const wrongSet = new Set(wrongIds);
  return items.reduce((sum, { groupType, question }) => {
    if (groupType === "简答题" || groupType === "案例分析题" || groupType === "填空题") return sum;
    if (!isExamAnswerFilled(answers[question.id])) return sum;
    if (wrongSet.has(question.id)) return sum;
    return sum + (question.score ?? 0);
  }, 0);
}

export function parseEmployeePaperId(sessionId: string): string | null {
  const prefix = "正式考试-";
  if (!sessionId.startsWith(prefix)) return null;
  return sessionId.slice(prefix.length) || null;
}

export function resolveExamSessionPaper(sessionId: string): ExamSessionPaper | null {
  const employeePaperId = parseEmployeePaperId(sessionId);
  if (!employeePaperId) return null;

  const adminPaperId = EMPLOYEE_TO_ADMIN_PAPER[employeePaperId] ?? "p1";
  const adminPaper = PAPERS.find((p) => p.id === adminPaperId);
  const groups = getPaperQuestionGroups(adminPaperId);
  const questionCount = groups.reduce((s, g) => s + g.questions.length, 0);
  const scoreMode = EXAM_TASK_META[adminPaperId]?.scoreMode ?? "fixed";
  const computedTotal = examPaperTotalScore(groups);

  return {
    employeePaperId,
    adminPaperId,
    title: adminPaper?.name ?? employeePaperId,
    groups,
    duration: adminPaper?.duration ?? 30,
    passLine: scoreMode === "fixed" ? 60 : null,
    scoreMode,
    totalScore:
      scoreMode === "fixed"
        ? (EXAM_TASK_META[adminPaperId]?.totalScore ?? computedTotal || 100)
        : null,
    goal: adminPaper?.goal ?? "取证复习",
    category: adminPaper?.category ?? "-",
    difficulty: "中",
    questionCount: questionCount || groups.reduce((s, g) => s + g.questions.length, 0),
  };
}

export function flattenExamQuestions(groups: EditorGroup[]) {
  const items: {
    globalNo: number;
    groupType: EditorGroup["type"];
    question: EditorGroup["questions"][0];
  }[] = [];
  let no = 0;
  for (const g of groups) {
    for (const q of g.questions) {
      no += 1;
      items.push({ globalNo: no, groupType: g.type, question: q });
    }
  }
  return items;
}

export function buildExamSummary(groups: EditorGroup[]) {
  const totalCount = groups.reduce((s, g) => s + g.questions.length, 0);
  const totalScore = groups.reduce((s, g) => s + g.questions.length * g.perScore, 0);
  return [
    { label: "当前题量", value: totalCount },
    { label: "试卷总分", value: totalScore || 100 },
    ...groups
      .filter((g) => g.questions.length > 0)
      .map((g) => ({ label: g.type.replace("题", ""), value: g.questions.length })),
  ];
}

export function isExamAnswerFilled(val: string | string[] | undefined) {
  if (val === undefined) return false;
  if (Array.isArray(val)) return val.length > 0;
  return String(val).trim().length > 0;
}

export function gradeExamAnswer(
  type: EditorGroup["type"],
  correct: string | undefined,
  user: string | string[] | undefined,
): boolean {
  if (!correct) return true;
  if (type === "多选题") {
    const userKeys = Array.isArray(user) ? [...user].sort().join("") : String(user ?? "");
    const correctKeys = [...correct].sort().join("");
    return userKeys === correctKeys;
  }
  if (type === "填空题" || type === "简答题" || type === "案例分析题") {
    return false;
  }
  return user === correct;
}

/** 兜底：无法解析试卷 id 时使用默认卷面 */
export function fallbackExamSessionPaper(
  title: string,
  count: number,
  duration = 30,
  passLine = 60,
  goal = "个人测评",
  category = "综合能力",
  difficulty = "综合",
): ExamSessionPaper {
  let remaining = Math.max(1, count);
  const groups = structuredClone(EDITOR_GROUPS).map((group) => {
    const questions = group.questions.slice(0, remaining);
    remaining -= questions.length;
    return { ...group, questions };
  });
  const questionCount = groups.reduce((sum, group) => sum + group.questions.length, 0);
  const computedTotal = examPaperTotalScore(groups);
  return {
    employeePaperId: "default",
    adminPaperId: "p1",
    title,
    groups,
    duration: duration || 30,
    passLine,
    scoreMode: "fixed",
    totalScore: computedTotal || 100,
    goal,
    category,
    difficulty,
    questionCount,
  };
}

export function adminPaperById(id: string): Paper | undefined {
  return PAPERS.find((p) => p.id === id);
}
