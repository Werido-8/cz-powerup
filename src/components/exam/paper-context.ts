import type { Difficulty } from "@/lib/mock/examAdmin";

export interface PaperContextInfo {
  name: string;
  goal: string;
  category: string;
  specialty: string;
  duration: string;
  passLine: string;
  difficulty: Difficulty | "";
}

export function isPaperContextReady(info: PaperContextInfo): boolean {
  return Boolean(
    info.name.trim() &&
      info.goal &&
      info.category.trim() &&
      info.specialty.trim() &&
      info.duration.trim() &&
      info.passLine.trim() &&
      info.difficulty,
  );
}

export const AI_APPEND_INCOMPLETE_MSG =
  "请先完善试卷名称、考试目标、分类、适用专业和难度后，再使用 AI 补题。";

export const AI_APPEND_DISABLED_TOOLTIP =
  "AI 补题需要根据试卷目标、专业、分类和难度生成题目。";

export const AI_APPEND_ENABLED_TOOLTIP = "根据当前试卷信息和题型要求补充题目。";

export const AI_APPEND_BATCH_SIZE = 3;
