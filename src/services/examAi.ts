/**
 * AI 组卷服务层
 * 当前为 mock 实现，后续可替换为真实 API 接口。
 * 接入真实接口时只需修改 generateExamDraft 内部实现，对外类型与调用方式不变。
 */

import type { Difficulty, QuestionType } from "@/lib/mock/examAdmin";
import type { PaperBasicInfo } from "@/components/exam/exam-paper-editor-page";

// ─────────────────── 类型 ───────────────────

export interface AiDraftParams {
  /** 用户自然语言描述的组卷需求 */
  prompt: string;
  /** 考试目标 */
  goal: string;
  /** 分类 */
  category: string;
  /** 适用岗位（多个） */
  positions: string[];
  /** 题目总数 */
  totalCount: number;
  /** 各题型分配数量 */
  typeRatio: Partial<Record<QuestionType, number>>;
  /** 整体难度 */
  difficulty: Difficulty | "";
  /** 时长（分钟） */
  duration: number;
  /** 及格分 */
  passScore: number;
  /** 资料范围 */
  sourceScope: "bank" | "bank+kb" | "kb";
  /** 是否生成答案 */
  genAnswer: boolean;
  /** 是否生成解析 */
  genAnalysis: boolean;
  /** 是否生成资料依据 */
  genEvidence: boolean;
}

export interface AiDraftQuestion {
  id: string;
  stem: string;
  type: QuestionType;
  difficulty: Difficulty;
  options?: { key: string; text: string }[];
  answer: string;
  analysis: string;
  source: string;
  knowledge: string;
  score: number;
  isAIGenerated: true;
}

export interface AiDraftGroup {
  type: QuestionType;
  perScore: number;
  questions: AiDraftQuestion[];
}

export interface AiExamDraft {
  basicInfo: PaperBasicInfo;
  groups: AiDraftGroup[];
  generatedAt: string;
}

// ─────────────────── sessionStorage Key ───────────────────

export const AI_EXAM_DRAFT_KEY = "exam-ai-draft-v1";

// ─────────────────── 内部 mock helpers ───────────────────

const STEMS: Partial<Record<QuestionType, (knowledge: string, i: number) => string>> = {
  单选题: (k, i) =>
    [
      `AGC 控制方式下，机组出力偏差超过 ±${i + 2}% 时应优先采取哪项措施？`,
      `一次调频死区设置为 ${i + 1} × 0.033Hz 时，小扰动下机组的响应特性如何？`,
      `两个细则对 ${k} 响应速率的考核标准是以下哪项？`,
      `${k} 中，以下哪项属于有功考核范围？`,
      `机组 AVC 装置异常退出时，运行人员的首要处置步骤是？`,
      `以下关于 ${k} 的说法，正确的是？`,
      `按调度规程要求，运行班组在 ${k} 指标异常后应在多少分钟内完成上报？`,
      `${k} 考核中，K 值法的主要适用场景是？`,
      `一次调频与二次调频协调配合的核心原则是？`,
      `AGC 投入状态下，运行人员不得擅自进行哪类操作？`,
    ][i % 10],
  多选题: (k, i) =>
    [
      `关于 ${k} 的描述，以下正确的有哪些？`,
      `AGC 与一次调频协调配合时，以下说法正确的有哪些？`,
      `影响厂站涉网考核结果的主要因素包括哪些？`,
      `${k} 中属于自动装置管控范围的有哪些？`,
    ][i % 4],
  判断题: (k, i) =>
    [
      `一次调频死区过大时，机组在小扰动情况下将不参与调频。（  ）`,
      `AGC 系统退出运行时，机组仍需参与一次调频响应。（  ）`,
      `差动保护属于主保护，对区内故障具有绝对选择性。（  ）`,
      `${k} 控制方式下机组响应速率不满足要求时，不予考核。（  ）`,
      `两个细则只适用于 AGC 机组，非 AGC 机组不涉及考核。（  ）`,
    ][i % 5],
};

const SCORE_MAP: Record<QuestionType, number> = {
  单选题: 2,
  多选题: 3,
  判断题: 1,
  填空题: 2,
  案例分析题: 8,
  简答题: 5,
};

function buildGroups(params: AiDraftParams): AiDraftGroup[] {
  const knowledge = params.category || "AGC / 两细则";
  const groups: AiDraftGroup[] = [];
  const types: QuestionType[] = ["单选题", "多选题", "判断题", "填空题", "简答题"];

  for (const type of types) {
    const count = params.typeRatio[type] ?? 0;
    if (count <= 0) continue;

    const perScore = SCORE_MAP[type] ?? 2;

    const questions: AiDraftQuestion[] = Array.from({ length: count }).map((_, i) => {
      const stemFn = STEMS[type];
      const stem = stemFn
        ? stemFn(knowledge, i)
        : `【${type}】${knowledge} 考点 ${i + 1}：请作答。`;

      const options =
        type === "判断题"
          ? [
              { key: "T", text: "正确" },
              { key: "F", text: "错误" },
            ]
          : type === "单选题" || type === "多选题"
            ? [
                { key: "A", text: `${knowledge} 相关核心概念与操作规范` },
                { key: "B", text: "规程条款要求与执行标准" },
                { key: "C", text: "现场操作注意事项与确认项" },
                { key: "D", text: "异常处置与上报流程" },
              ]
            : undefined;

      const answer = type === "判断题" ? "T" : type === "单选题" ? "A" : "AB";

      const analysis = params.genAnalysis
        ? `本题考察 ${knowledge} 相关知识。根据《两细则》规定，${knowledge} 中运行人员应熟悉核心考核指标与处置流程，重点关注响应时间与精度要求。`
        : "";

      const source = params.genEvidence ? `${knowledge} 规程 v2024 · 第${i + 2}章` : "AI 生成";

      return {
        id: `ai-${type.slice(0, 2)}-${i}`,
        stem,
        type,
        difficulty: params.difficulty || "中",
        options,
        answer,
        analysis,
        source,
        knowledge,
        score: perScore,
        isAIGenerated: true,
      };
    });

    groups.push({ type, perScore, questions });
  }

  return groups;
}

// ─────────────────── 对外 API ───────────────────

/**
 * 生成 AI 组卷草稿
 * 当前为 mock 实现，约 2 秒延迟后返回结果。
 * 接入真实接口时替换此函数内部实现，入参/出参类型保持不变。
 */
export async function generateExamDraft(params: AiDraftParams): Promise<AiExamDraft> {
  // Mock: simulate network delay
  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      // Simulate occasional failure (5% probability — for UI state testing)
      // if (Math.random() < 0.05) reject(new Error("网络超时"));
      resolve();
    }, 2200);
  });

  if (!params.prompt.trim()) {
    throw new Error("请先填写组卷需求");
  }

  const posStr = params.positions.filter(Boolean).join("、") || "值班员";
  const name = [params.category, params.goal].filter(Boolean).join(" · ") + " 考试";

  const groups = buildGroups(params);
  const totalScore = groups.reduce(
    (sum, group) => sum + group.questions.length * group.perScore,
    0,
  );

  const basicInfo: PaperBasicInfo = {
    name,
    goal: (params.goal || "取证复习") as PaperBasicInfo["goal"],
    category: params.category,
    position: posStr,
    duration: String(params.duration),
    passLine: String(Math.min(params.passScore, totalScore)),
    scoreMode: "fixed",
    totalScore: String(totalScore),
    difficulty: params.difficulty || "中",
    note: `AI 起草 · 依据需求：${params.prompt.slice(0, 60)}${params.prompt.length > 60 ? "…" : ""}`,
  };

  return {
    basicInfo,
    groups,
    generatedAt: new Date().toLocaleString("zh-CN"),
  };
}

export function saveAiDraft(draft: AiExamDraft): void {
  sessionStorage.setItem(AI_EXAM_DRAFT_KEY, JSON.stringify(draft));
}

export function loadAiDraft(): AiExamDraft | null {
  try {
    const raw = sessionStorage.getItem(AI_EXAM_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as AiExamDraft) : null;
  } catch {
    return null;
  }
}

export function clearAiDraft(): void {
  sessionStorage.removeItem(AI_EXAM_DRAFT_KEY);
}
