import { DOCS } from "./data";
import {
  CHAT_FAVORITES,
  FAVORITE_META,
  NOTE_META,
} from "./learning-hub";
import type { MockState } from "./store";

/** 个人沉淀顶部概览卡片类型 */
export type PersonalOverviewCardKey = "docFav" | "qaFav" | "notes" | "pending";

export type PersonalOverviewCardData = {
  key: PersonalOverviewCardKey;
  label: string;
  count: number;
  hint: string;
  recentPrefix: string;
  recentText: string;
};

export type PersonalRecentDepositionItem = {
  prefix: string;
  text: string;
};

export type PersonalDepositionOverviewData = {
  cards: PersonalOverviewCardData[];
  recentItems: PersonalRecentDepositionItem[];
};

/** 演示用基准数据（接口未接入时展示；count 可整体替换为接口字段） */
export const PERSONAL_DEPOSITION_OVERVIEW_DEMO: PersonalDepositionOverviewData = {
  cards: [
    {
      key: "docFav",
      label: "收藏资料",
      count: 5,
      hint: "规程、制度、案例与 SOP",
      recentPrefix: "最近：",
      recentText: "《并网发电厂辅助服务管理实施细则》",
    },
    {
      key: "qaFav",
      label: "收藏问答",
      count: 8,
      hint: "智能问答与追问沉淀",
      recentPrefix: "最近：",
      recentText: "AGC 考核主要依据哪些文件？",
    },
    {
      key: "notes",
      label: "学习笔记",
      count: 3,
      hint: "学习过程记录",
      recentPrefix: "最近：",
      recentText: "差动保护零序四步法",
    },
    {
      key: "pending",
      label: "待整理",
      count: 4,
      hint: "未分类或未关联内容",
      recentPrefix: "建议整理：",
      recentText: "2 条问答收藏",
    },
  ],
  recentItems: [
    { prefix: "最近收藏：", text: "《并网发电厂辅助服务管理实施细则》" },
    { prefix: "最近笔记：", text: "差动保护零序四步法" },
    { prefix: "最近问答：", text: "AGC 考核主要依据哪些文件？" },
  ],
};

function truncate(text: string, max = 28) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function resolveDocTitle(docId: string, fallback: string) {
  const doc = DOCS.find((d) => d.id === docId);
  if (!doc) return fallback;
  const match = doc.title.match(/^《[^》]+》/);
  if (match) return match[0];
  return truncate(doc.title);
}

function resolveRecentFromState(
  key: PersonalOverviewCardKey,
  state: MockState,
): string | undefined {
  switch (key) {
    case "docFav": {
      const docId = state.favorites[0] ?? FAVORITE_META[0]?.docId;
      return docId ? resolveDocTitle(docId, "") : undefined;
    }
    case "qaFav": {
      const qa = CHAT_FAVORITES[0];
      return qa ? truncate(qa.question) : undefined;
    }
    case "notes": {
      const note = state.notes[state.notes.length - 1] ?? NOTE_META[NOTE_META.length - 1];
      return note?.title;
    }
    case "pending":
      return undefined;
    default:
      return undefined;
  }
}

/**
 * 构建个人沉淀顶部概览数据。
 * count 暂用演示基准值；最近记录优先从 mock store 推导。
 * 接入接口后：将 PERSONAL_DEPOSITION_OVERVIEW_DEMO.cards 的 count 映射替换为 API 字段即可。
 */
export function getPersonalDepositionOverview(state: MockState): PersonalDepositionOverviewData {
  const cards = PERSONAL_DEPOSITION_OVERVIEW_DEMO.cards.map((card) => ({
    ...card,
    recentText: resolveRecentFromState(card.key, state) || card.recentText,
  }));

  const recentItems: PersonalRecentDepositionItem[] = [
    {
      prefix: "最近收藏：",
      text: resolveRecentFromState("docFav", state) || PERSONAL_DEPOSITION_OVERVIEW_DEMO.recentItems[0].text,
    },
    {
      prefix: "最近笔记：",
      text: resolveRecentFromState("notes", state) || PERSONAL_DEPOSITION_OVERVIEW_DEMO.recentItems[1].text,
    },
    {
      prefix: "最近问答：",
      text: resolveRecentFromState("qaFav", state) || PERSONAL_DEPOSITION_OVERVIEW_DEMO.recentItems[2].text,
    },
  ];

  return { cards, recentItems };
}
