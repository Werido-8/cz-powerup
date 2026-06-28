import type { Mastery, SpacedReviewItem, WrongItem } from "./store";

/** 艾宾浩斯复习间隔（天） */
export const EBBINGHAUS_DAYS = [1, 2, 4, 7, 15, 30];

const MASTERY_ROUND: Record<Mastery, number> = {
  新增: 0,
  初步掌握: 1,
  需巩固: 2,
  基本掌握: 3,
  熟练: 4,
  长期掌握: 5,
};

export type ReviewScheduleEntry = {
  round: number;
  label: string;
  at: string;
  status: "done" | "due" | "upcoming";
};

export type ReviewPlanRow = {
  id: string;
  kind: "doc" | "wrong";
  sourceId: string;
  title: string;
  kindLabel: string;
  currentRound: number;
  nextRound: number;
  nextAt: string;
  schedule: ReviewScheduleEntry[];
  due: boolean;
};

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDue(date: Date, now = new Date()) {
  const dayMs = 86400000;
  const diff = Math.floor((date.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / dayMs);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  if (diff < 0) return "已逾期";
  if (diff === 0) return `今天 ${time === "00:00" ? "18:00" : time}`;
  if (diff === 1) return `明天 ${time === "00:00" ? "09:00" : time}`;
  if (diff === 2) return `后天 ${time === "00:00" ? "10:00" : time}`;
  return `${diff} 天后 ${time === "00:00" ? "09:00" : time}`;
}

/** 从纳入计划时间起，生成各轮复习节点 */
export function buildSchedule(addedAt: string, completedRound: number, now = new Date()): ReviewScheduleEntry[] {
  const base = new Date(addedAt);
  let cursor = new Date(base);
  const entries: ReviewScheduleEntry[] = [];

  for (let i = 0; i < EBBINGHAUS_DAYS.length; i++) {
    cursor = addDays(i === 0 ? base : cursor, EBBINGHAUS_DAYS[i]);
    const dueDate = new Date(cursor);
    let status: ReviewScheduleEntry["status"] = "upcoming";
    if (i < completedRound) status = "done";
    else if (i === completedRound) {
      status = dueDate.getTime() <= now.getTime() + 86400000 ? "due" : "upcoming";
    }
    entries.push({
      round: i + 1,
      label: `第 ${i + 1} 次复习`,
      at: formatDue(dueDate, now),
      status,
    });
  }
  return entries;
}

function rowFromItem(
  item: SpacedReviewItem,
  now = new Date(),
): ReviewPlanRow {
  const schedule = buildSchedule(item.addedAt, item.round, now);
  const next = schedule[item.round] ?? schedule[schedule.length - 1];
  return {
    id: item.id,
    kind: item.kind,
    sourceId: item.sourceId,
    title: item.title,
    kindLabel: item.kind === "doc" ? "资料" : "错题",
    currentRound: item.round,
    nextRound: next?.round ?? item.round + 1,
    nextAt: next?.at ?? "—",
    schedule,
    due: next?.status === "due" || next?.at.startsWith("今天") || next?.at.startsWith("已逾期"),
  };
}

function rowFromWrong(w: WrongItem, title: string, now = new Date()): ReviewPlanRow {
  const round = MASTERY_ROUND[w.mastery];
  const addedAt = new Date(now.getTime() - (round + 1) * 86400000).toISOString();
  const schedule = buildSchedule(addedAt, round, now);
  const next = schedule[round] ?? schedule[0];
  return {
    id: `wrong-${w.qid}`,
    kind: "wrong",
    sourceId: w.qid,
    title,
    kindLabel: "错题",
    currentRound: round,
    nextRound: next?.round ?? 1,
    nextAt: next?.at ?? "今天",
    schedule,
    due: round <= 1,
  };
}

export function buildReviewPlan(
  spacedReviews: SpacedReviewItem[],
  wrongItems: WrongItem[],
  questionTitles: Record<string, string>,
  now = new Date(),
): ReviewPlanRow[] {
  const rows: ReviewPlanRow[] = spacedReviews.map((r) => rowFromItem(r, now));
  const docIds = new Set(spacedReviews.filter((r) => r.kind === "doc").map((r) => r.sourceId));

  (wrongItems ?? []).forEach((w) => {
    if (spacedReviews.some((r) => r.kind === "wrong" && r.sourceId === w.qid)) return;
    rows.push(rowFromWrong(w, questionTitles[w.qid] ?? `错题 ${w.qid}`, now));
  });

  return rows.sort((a, b) => {
    if (a.due !== b.due) return a.due ? -1 : 1;
    return a.nextAt.localeCompare(b.nextAt, "zh-CN");
  });
}

/** 迷你艾宾浩斯曲线采样点（保留率 0~1） */
export const EBBINGHAUS_CURVE = [
  { day: 0, retention: 1 },
  { day: 1, retention: 0.34 },
  { day: 2, retention: 0.28 },
  { day: 4, retention: 0.24 },
  { day: 7, retention: 0.2 },
  { day: 15, retention: 0.18 },
  { day: 30, retention: 0.15 },
];
