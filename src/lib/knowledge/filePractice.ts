import type { KnowledgeFile } from "@/lib/knowledge/types";

export type FilePracticeQuestionType = "single" | "multiple" | "judge";

export type FilePracticeQuestion = {
  id: string;
  type: FilePracticeQuestionType;
  stem: string;
  options: { key: string; label: string }[];
  answer: string | string[];
  knowledge: string;
  difficulty: "易" | "中" | "难";
  analysis?: string;
};

export function getFilePracticeAnalysis(question: FilePracticeQuestion) {
  if (question.analysis?.trim()) return question.analysis.trim();
  const answer = Array.isArray(question.answer) ? question.answer : [question.answer];
  const answerLabels = question.options
    .filter((option) => answer.includes(option.key))
    .map((option) => `${option.key}. ${option.label}`)
    .join("；");
  return `本题考查“${question.knowledge}”。正确答案：${answerLabels}。`;
}

export const filePracticeTypeLabel: Record<FilePracticeQuestionType, string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
};

function fallbackStems(file: KnowledgeFile) {
  const subject = file.name.replace(/\.[^.]+$/, "");
  const keyword = file.aiKeywords?.[0] ?? file.tags?.[0] ?? "核心要求";
  const secondKeyword = file.aiKeywords?.[1] ?? file.tags?.[1] ?? "执行边界";

  return [
    `根据《${subject}》，执行相关操作前首先应确认哪项内容？`,
    `关于“${keyword}”的理解，下列哪些做法符合资料要求？`,
    `资料中关于“${secondKeyword}”的要求只适用于异常处置场景。`,
    `在落实《${subject}》时，发现现场条件与资料描述不一致，应如何处理？`,
    `为了保证执行过程可追溯，需要重点保留哪些信息？`,
    `完成相关工作后，以下哪项最符合资料强调的闭环要求？`,
  ];
}

export function getFilePracticeQuestions(file: KnowledgeFile): FilePracticeQuestion[] {
  const generatedStems = file.aiQuestions ?? [];
  const stems = [...generatedStems, ...fallbackStems(file)].slice(0, 6);
  const keyword = file.aiKeywords?.[0] ?? file.tags?.[0] ?? "执行要求";

  return [
    {
      id: `${file.id}-practice-1`,
      type: "single",
      stem: stems[0],
      options: [
        { key: "A", label: "核对适用范围、现场条件和责任边界" },
        { key: "B", label: "直接按历史经验开始操作" },
        { key: "C", label: "只确认文件名称是否一致" },
        { key: "D", label: "等待操作完成后再补充记录" },
      ],
      answer: "A",
      knowledge: keyword,
      difficulty: "易",
    },
    {
      id: `${file.id}-practice-2`,
      type: "multiple",
      stem: stems[1],
      options: [
        { key: "A", label: "明确执行人员与复核人员" },
        { key: "B", label: "记录关键节点和异常情况" },
        { key: "C", label: "条件变化时及时沟通确认" },
        { key: "D", label: "省略与本次工作无关的必要审批" },
      ],
      answer: ["A", "B", "C"],
      knowledge: keyword,
      difficulty: "中",
    },
    {
      id: `${file.id}-practice-3`,
      type: "judge",
      stem: stems[2],
      options: [
        { key: "T", label: "正确" },
        { key: "F", label: "错误" },
      ],
      answer: "F",
      knowledge: file.aiKeywords?.[1] ?? file.tags?.[1] ?? "适用范围",
      difficulty: "易",
    },
    {
      id: `${file.id}-practice-4`,
      type: "single",
      stem: stems[3],
      options: [
        { key: "A", label: "暂停执行并向责任部门确认" },
        { key: "B", label: "忽略差异继续执行" },
        { key: "C", label: "自行修改资料后继续" },
        { key: "D", label: "仅在工作结束后口头说明" },
      ],
      answer: "A",
      knowledge: "异常处置",
      difficulty: "中",
    },
    {
      id: `${file.id}-practice-5`,
      type: "multiple",
      stem: stems[4],
      options: [
        { key: "A", label: "操作时间与执行人员" },
        { key: "B", label: "复核结论与关键参数" },
        { key: "C", label: "异常情况及处理结果" },
        { key: "D", label: "与工作无关的个人信息" },
      ],
      answer: ["A", "B", "C"],
      knowledge: "过程留痕",
      difficulty: "中",
    },
    {
      id: `${file.id}-practice-6`,
      type: "single",
      stem: stems[5],
      options: [
        { key: "A", label: "复盘执行结果并更新必要记录" },
        { key: "B", label: "完成操作后立即结束流程" },
        { key: "C", label: "只保留最终结论" },
        { key: "D", label: "将问题留待下次处理" },
      ],
      answer: "A",
      knowledge: "闭环管理",
      difficulty: "易",
    },
  ];
}

export function isPracticeAnswerFilled(value?: string | string[]) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

export function isPracticeAnswerCorrect(
  value: string | string[] | undefined,
  answer: string | string[],
) {
  if (Array.isArray(answer)) {
    return Array.isArray(value) && [...value].sort().join("|") === [...answer].sort().join("|");
  }
  return value === answer;
}

function rewriteByInstruction(text: string, instruction: string, kind: "stem" | "option" | "analysis") {
  const hint = instruction.trim().replace(/\s+/g, " ");
  const shortHint = hint.slice(0, 18);
  if (kind === "stem") {
    const cleaned = text.replace(/（已按「[^」]+」调整）$/, "").trim();
    return `${cleaned}（已按「${shortHint}」调整）`;
  }
  if (kind === "analysis") {
    return `已按「${shortHint}」重新生成。${text.replace(/^已按「[^」]+」重新生成。/, "").trim()}`;
  }
  if (/现场|交接班|巡检/.test(hint)) {
    return text.replace(/操作/g, "现场核对").replace(/记录/g, "值班记录");
  }
  if (/干扰|易错|迷惑/.test(hint)) {
    return `${text}（易与现场习惯混淆）`;
  }
  return text;
}

export function regenerateFilePracticeQuestion(
  question: FilePracticeQuestion,
  instruction: string,
): FilePracticeQuestion {
  const hint = instruction.trim() || "更贴近现场执行场景";
  return {
    ...question,
    stem: rewriteByInstruction(question.stem, hint, "stem"),
    options: question.options.map((option, index) => ({
      ...option,
      label:
        index === 0
          ? option.label
          : rewriteByInstruction(option.label, hint, "option"),
    })),
    analysis: rewriteByInstruction(getFilePracticeAnalysis(question), hint, "analysis"),
  };
}
