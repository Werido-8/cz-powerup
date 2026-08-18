const numberFormatter = new Intl.NumberFormat("zh-CN");

export function formatCount(value: number | null | undefined) {
  return value == null ? "—" : numberFormatter.format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  return value == null ? "—" : `${value.toFixed(digits).replace(/\.0$/, "")}%`;
}

export function formatScore(value: number | null | undefined, digits = 1) {
  return value == null ? "—" : value.toFixed(digits).replace(/\.0$/, "");
}

export function formatDelta(
  value: number | null | undefined,
  unit: "score" | "percentagePoint" = "score",
) {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  const suffix = unit === "percentagePoint" ? " 个百分点" : " 分";
  return `${sign}${value.toFixed(1).replace(/\.0$/, "")}${suffix}`;
}

export function safeRate(numerator: number, denominator: number) {
  return denominator > 0 ? (numerator / denominator) * 100 : null;
}

export function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "未设置";
  if (!start) return `截止 ${end}`;
  if (!end) return `${start} 起`;
  return `${start} 至 ${end}`;
}

export function formatScoreMode(mode: ExamScoreMode, totalScore: number | null) {
  if (mode === "fixed") return totalScore == null ? "已设分数" : `总分 ${totalScore} 分`;
  if (mode === "variable") return "按题计分，不设总分";
  return "不设分数";
}
import type { ExamScoreMode } from "@/lib/exam-admin/types";
