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
  /** YYYY-MM-DD，用于日历聚合与筛选 */
  dateKey: string;
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

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatShortDate(dateKey: string, now = new Date()) {
  const date = parseDateKey(dateKey);
  const dayMs = 86400000;
  const diff = Math.floor(
    (date.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / dayMs,
  );
  const text = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  return text;
}

export function formatWeekday(dateKey: string) {
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return weekdays[parseDateKey(dateKey).getDay()];
}

export type ReviewDateBucket = {
  rows: ReviewPlanRow[];
  dueCount: number;
};

export type ReviewTimelineEntry = {
  id: string;
  dateKey: string;
  row: ReviewPlanRow;
  round: number;
  at: string;
  status: ReviewScheduleEntry["status"];
  nextRound: number | null;
  nextAt: string | null;
  nextDateKey: string | null;
};

export type ReviewTimelineDay = {
  dateKey: string;
  entries: ReviewTimelineEntry[];
};

export type ReviewEntryPhase = "overdue" | "due" | "upcoming";

export function getEntryPhase(
  entry: Pick<ReviewScheduleEntry, "status" | "at" | "dateKey">,
  now = new Date(),
): ReviewEntryPhase {
  if (entry.at.startsWith("已逾期")) return "overdue";
  if (entry.status === "due" || entry.at.startsWith("今天")) return "due";
  const todayKey = toDateKey(now);
  if (entry.dateKey < todayKey) return "overdue";
  return "upcoming";
}

export function getRowPhase(row: ReviewPlanRow, now = new Date()): ReviewEntryPhase {
  const next = row.schedule[row.currentRound] ?? row.schedule.find((s) => s.status !== "done");
  if (!next) return "upcoming";
  return getEntryPhase(next, now);
}

export const ENTRY_PHASE_LABEL: Record<ReviewEntryPhase, string> = {
  overdue: "已逾期",
  due: "待复习",
  upcoming: "未开始",
};

function formatDue(date: Date, now = new Date()) {
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const dayMs = 86400000;
  const diff = Math.floor(
    (new Date(date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / dayMs,
  );
  if (diff < 0) return `已逾期 ${time}`;
  if (diff === 0) return `今天 ${time}`;
  if (diff === 1) return `明天 ${time}`;
  if (diff === 2) return `后天 ${time}`;
  return `${diff} 天后 ${time}`;
}

const REVIEW_TIME_SLOTS = [
  { h: 8, m: 30 },
  { h: 9, m: 15 },
  { h: 10, m: 0 },
  { h: 11, m: 30 },
  { h: 14, m: 0 },
  { h: 15, m: 45 },
  { h: 17, m: 0 },
  { h: 18, m: 30 },
  { h: 20, m: 0 },
];

function reviewTimeForSeed(seed: string, round: number) {
  let hash = round * 17;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 3)) % REVIEW_TIME_SLOTS.length;
  return REVIEW_TIME_SLOTS[hash];
}

function applyReviewTime(date: Date, seed: string, round: number) {
  const { h, m } = reviewTimeForSeed(seed, round);
  date.setHours(h, m, 0, 0);
  return date;
}

/** 错题纳入计划的时间偏移（天），使各题复习节点错开 */
const WRONG_ADDED_DAYS: Record<string, number> = {
  q4: 11,
  q9: 5,
  q1: 2,
  q17: 0,
  q2: 14,
  q13: 20,
  q21: 16,
};

/** 从纳入计划时间起，生成各轮复习节点 */
export function buildSchedule(
  addedAt: string,
  completedRound: number,
  now = new Date(),
  timeSeed?: string,
): ReviewScheduleEntry[] {
  const base = new Date(addedAt);
  const seed = timeSeed ?? addedAt;
  let cursor = new Date(base);
  const entries: ReviewScheduleEntry[] = [];

  for (let i = 0; i < EBBINGHAUS_DAYS.length; i++) {
    cursor = addDays(i === 0 ? base : cursor, EBBINGHAUS_DAYS[i]);
    const dueDate = applyReviewTime(new Date(cursor), seed, i + 1);
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
      dateKey: toDateKey(dueDate),
    });
  }
  return entries;
}

function rowFromItem(
  item: SpacedReviewItem,
  now = new Date(),
): ReviewPlanRow {
  const schedule = buildSchedule(item.addedAt, item.round, now, item.id);
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

export function getWrongNextReviewLabel(w: WrongItem, now = new Date()): string {
  const row = rowFromWrong(w, "", now);
  const next = row.schedule[row.currentRound] ?? row.schedule.find((s) => s.status !== "done");
  if (!next) return formatShortDate(toDateKey(now), now);
  return formatShortDate(next.dateKey, now);
}

function rowFromWrong(w: WrongItem, title: string, now = new Date()): ReviewPlanRow {
  const round = MASTERY_ROUND[w.mastery];
  const daysAgo = WRONG_ADDED_DAYS[w.qid] ?? round + 2;
  const addedAt = new Date(now.getTime() - daysAgo * 86400000).toISOString();
  const schedule = buildSchedule(addedAt, round, now, w.qid);
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

/** 按日期聚合待复习项（跳过已完成节点） */
export function buildReviewDateIndex(plan: ReviewPlanRow[]): Map<string, ReviewDateBucket> {
  const map = new Map<string, ReviewDateBucket>();

  for (const row of plan) {
    for (const entry of row.schedule) {
      if (entry.status === "done") continue;

      const bucket = map.get(entry.dateKey) ?? { rows: [], dueCount: 0 };
      if (!bucket.rows.some((r) => r.id === row.id)) {
        bucket.rows.push(row);
      }
      if (entry.status === "due" || entry.at.startsWith("今天") || entry.at.startsWith("已逾期")) {
        bucket.dueCount += 1;
      }
      map.set(entry.dateKey, bucket);
    }
  }

  return map;
}

export function filterPlanByDate(plan: ReviewPlanRow[], dateKey: string): ReviewPlanRow[] {
  return plan.filter((row) =>
    row.schedule.some((entry) => entry.status !== "done" && entry.dateKey === dateKey),
  );
}

/** 按日期展开复习安排，用于时间轴展示 */
export function buildReviewTimeline(plan: ReviewPlanRow[]): ReviewTimelineDay[] {
  const dayMap = new Map<string, ReviewTimelineEntry[]>();

  for (const row of plan) {
    for (const entry of row.schedule) {
      if (entry.status === "done") continue;

      const next = row.schedule.find((s) => s.round === entry.round + 1);
      const list = dayMap.get(entry.dateKey) ?? [];
      list.push({
        id: `${row.id}-r${entry.round}`,
        dateKey: entry.dateKey,
        row,
        round: entry.round,
        at: entry.at,
        status: entry.status,
        nextRound: next?.round ?? null,
        nextAt: next?.at ?? null,
        nextDateKey: next?.dateKey ?? null,
      });
      dayMap.set(entry.dateKey, list);
    }
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, entries]) => ({
      dateKey,
      entries: entries.sort((a, b) => {
        if (a.status === "due" && b.status !== "due") return -1;
        if (b.status === "due" && a.status !== "due") return 1;
        return a.row.title.localeCompare(b.row.title, "zh-CN");
      }),
    }));
}

export function formatReviewDayLabel(date: Date, now = new Date()) {
  const dayMs = 86400000;
  const diff = Math.floor(
    (new Date(date).setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / dayMs,
  );
  const dateText = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  if (diff === 0) return `${dateText}（今天）`;
  if (diff === 1) return `${dateText}（明天）`;
  if (diff === -1) return `${dateText}（昨天）`;
  return dateText;
}

const MONTHS_ZH = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

export function formatMonthTitle(date: Date) {
  return `${MONTHS_ZH[date.getMonth()]} ${date.getFullYear()}`;
}

export function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function getWeekDays(date: Date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
  return cells;
}

export function entriesForDate(timeline: ReviewTimelineDay[], dateKey: string) {
  return timeline.find((d) => d.dateKey === dateKey)?.entries ?? [];
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
