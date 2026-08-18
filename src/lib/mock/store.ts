// Tiny localStorage-backed mock store with React hook for cross-page sharing.
import { useEffect, useState, useCallback } from "react";
import { DEFAULT_COLLECTIONS, type Collection } from "./scenario";
import { QUIZ_SETS, type QuizSet } from "./learning-hub";
import { getAutoGradableQuestionIdsForDoc, getQuestionIdsForDoc } from "./learning-progress";

const KEY = "ai-grid-mock-store-v7";

const DAY = 86400000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

export type Mastery = "新增" | "初步掌握" | "需巩固" | "基本掌握" | "熟练" | "长期掌握";
const MASTERY_ORDER: Mastery[] = ["新增", "初步掌握", "需巩固", "基本掌握", "熟练", "长期掌握"];

export type WrongItem = {
  qid: string;
  wrongCount: number;
  lastWrongAt: string;
  mastery: Mastery;
};

export type NoteItem = {
  id: string;
  docId?: string;
  title: string;
  body: string;
  tag?: string;
  createdAt: string;
  updatedAt?: string;
  collectionIds?: string[];
};

export type SpacedReviewItem = {
  id: string;
  kind: "doc" | "wrong";
  sourceId: string;
  title: string;
  addedAt: string;
  round: number;
};

/** @deprecated 使用 SpacedReviewItem */
export type ReviewState = SpacedReviewItem;

export type ScenarioFavorite = {
  id: string; // unique
  scenarioId: string;
  title: string;
  kind: "typical" | "fault";
  savedAt: string;
};

export type DocProgressEntry = {
  readStatus: "未学" | "学习中" | "已学";
  answeredIds: string[];
  /** 最近一次关联练习中答对的题目，用于自动判定已学习。 */
  correctIds?: string[];
  practiceSessionId?: string;
  manuallyLearned?: boolean;
  /** 仅记录有效学习行为，单次打开资料不会更新该时间。 */
  lastActivityAt?: string;
};

export type RecentDocEntry = {
  docId: string;
  visitedAt: string;
};

export type MockState = {
  favorites: string[]; // doc ids
  favoriteQuestions: string[]; // question ids
  notes: NoteItem[];
  wrong: WrongItem[];
  reviews: SpacedReviewItem[];
  collections: Collection[];
  scenarioFavorites: ScenarioFavorite[];
  recentScenarios: string[]; // scenarioId
  recentDocs: RecentDocEntry[];
  quizSets: QuizSet[];
  docProgress: Record<string, DocProgressEntry>;
};

const DEFAULT: MockState = {
  favorites: ["d1", "d2", "d8"],
  favoriteQuestions: [],
  notes: [
    {
      id: "n-seed-1",
      docId: "d1",
      title: "AGC 三项指标速记",
      tag: "AGC",
      body: "速率 / 精度 / 响应时间 三项任一未达均纳入考核;K 值法按月统计。复习时优先看 d1 第二章。",
      createdAt: "2024-09-12 10:24",
      collectionIds: ["kc-agc"],
    },
    {
      id: "n-seed-2",
      docId: "d2",
      title: "主变停役前置核对清单",
      tag: "典型操作",
      body: "1) 负荷转移 2) 保护连接片 3) 中性点接地刀闸 4) 调度命令与操作票一致性\n关键步骤双人监护、唱票复诵。",
      createdAt: "2024-08-21 14:02",
      collectionIds: ["kc-main"],
    },
    {
      id: "n-seed-3",
      docId: "d10",
      title: "差动保护复盘四步法",
      tag: "继电保护",
      body: "TA 极性 → 二次回路 → 定值 → 一次设备状态，按序核查避免遗漏。",
      createdAt: "2024-07-08 09:15",
      collectionIds: [],
    },
  ],
  wrong: [
    { qid: "q4", wrongCount: 2, lastWrongAt: "2 天前", mastery: "需巩固" },
    { qid: "q9", wrongCount: 1, lastWrongAt: "昨天", mastery: "初步掌握" },
    { qid: "q1", wrongCount: 1, lastWrongAt: "今天", mastery: "新增" },
    { qid: "q17", wrongCount: 3, lastWrongAt: "今天", mastery: "新增" },
    { qid: "q2", wrongCount: 2, lastWrongAt: "3 天前", mastery: "基本掌握" },
    { qid: "q13", wrongCount: 1, lastWrongAt: "5 天前", mastery: "熟练" },
  ],
  reviews: [
    // 资料与错题穿插，复习轮次刻意错开（round = 已完成轮数，下次为 round+1 次复习）
    {
      id: "doc-d2",
      kind: "doc",
      sourceId: "d2",
      title: "500kV 主变停役标准化操作程序 v3.2",
      addedAt: daysAgo(12),
      round: 2,
    },
    {
      id: "wrong-q4",
      kind: "wrong",
      sourceId: "q4",
      title: "差动保护动作后,推荐的核查顺序四步法是:",
      addedAt: daysAgo(3),
      round: 0,
    },
    {
      id: "doc-d8",
      kind: "doc",
      sourceId: "d8",
      title: "两细则考核常见知识点汇编(2024)",
      addedAt: daysAgo(35),
      round: 4,
    },
    {
      id: "wrong-q9",
      kind: "wrong",
      sourceId: "q9",
      title: "差动保护误动可能由 TA 二次回路绝缘破损引起。",
      addedAt: daysAgo(6),
      round: 1,
    },
    {
      id: "doc-d1",
      kind: "doc",
      sourceId: "d1",
      title: "《并网发电厂辅助服务管理实施细则》AGC 考核条款解读",
      addedAt: daysAgo(1),
      round: 0,
    },
    {
      id: "doc-d10",
      kind: "doc",
      sourceId: "d10",
      title: "差动保护动作复盘:核查思路与典型场景",
      addedAt: daysAgo(18),
      round: 3,
    },
    {
      id: "wrong-q17",
      kind: "wrong",
      sourceId: "q17",
      title: "下列情形属于差动保护「区外故障」表现的有(多选):",
      addedAt: daysAgo(10),
      round: 2,
    },
    {
      id: "doc-d6",
      kind: "doc",
      sourceId: "d6",
      title: "厂家 SOP:AGC 控制器死区与速率配置说明",
      addedAt: daysAgo(5),
      round: 1,
    },
    {
      id: "doc-d13",
      kind: "doc",
      sourceId: "d13",
      title: "220kV 线路停送电标准化操作要点",
      addedAt: daysAgo(2),
      round: 0,
    },
    {
      id: "wrong-q1",
      kind: "wrong",
      sourceId: "q1",
      title: "两细则中 AGC 考核的三项核心指标不包括下列哪一项?",
      addedAt: daysAgo(28),
      round: 4,
    },
    {
      id: "wrong-q2",
      kind: "wrong",
      sourceId: "q2",
      title: "500kV 主变停役前应核对的项目包括(多选):",
      addedAt: daysAgo(14),
      round: 3,
    },
    {
      id: "wrong-q13",
      kind: "wrong",
      sourceId: "q13",
      title: "AVC 主要调节对象是:",
      addedAt: daysAgo(20),
      round: 4,
    },
  ],
  collections: DEFAULT_COLLECTIONS,
  scenarioFavorites: [],
  recentScenarios: [],
  recentDocs: [
    { docId: "d1", visitedAt: new Date(Date.now() - 3600000).toISOString() },
    { docId: "d2", visitedAt: new Date(Date.now() - 86400000).toISOString() },
    { docId: "d8", visitedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { docId: "d10", visitedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { docId: "d6", visitedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  ],
  quizSets: QUIZ_SETS.map((q) => ({ ...q })),
  docProgress: {},
};

function read(): MockState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = { ...DEFAULT, ...JSON.parse(raw) } as MockState;
    parsed.reviews = Array.isArray(parsed.reviews)
      ? parsed.reviews.filter(
          (r): r is SpacedReviewItem =>
            !!r && typeof r === "object" && "kind" in r && "sourceId" in r,
        )
      : DEFAULT.reviews;
    parsed.wrong = Array.isArray(parsed.wrong) ? parsed.wrong : DEFAULT.wrong;
    parsed.favorites = Array.isArray(parsed.favorites) ? parsed.favorites : DEFAULT.favorites;
    parsed.favoriteQuestions = Array.isArray(parsed.favoriteQuestions)
      ? parsed.favoriteQuestions
      : DEFAULT.favoriteQuestions;
    parsed.notes = Array.isArray(parsed.notes) ? parsed.notes : DEFAULT.notes;
    parsed.collections = Array.isArray(parsed.collections)
      ? parsed.collections
      : DEFAULT.collections;
    parsed.scenarioFavorites = Array.isArray(parsed.scenarioFavorites)
      ? parsed.scenarioFavorites
      : DEFAULT.scenarioFavorites;
    parsed.recentScenarios = Array.isArray(parsed.recentScenarios)
      ? parsed.recentScenarios
      : DEFAULT.recentScenarios;
    parsed.recentDocs = Array.isArray(parsed.recentDocs) ? parsed.recentDocs : DEFAULT.recentDocs;
    parsed.quizSets = Array.isArray(parsed.quizSets) ? parsed.quizSets : DEFAULT.quizSets;
    parsed.docProgress =
      parsed.docProgress && typeof parsed.docProgress === "object"
        ? parsed.docProgress
        : DEFAULT.docProgress;
    return parsed;
  } catch {
    return DEFAULT;
  }
}

function write(s: MockState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("mockstore-change"));
}

export function useMockStore() {
  const [state, setState] = useState<MockState>(DEFAULT);

  useEffect(() => {
    setState(read());
    const handler = () => setState(read());
    window.addEventListener("mockstore-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("mockstore-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const toggleFavorite = useCallback((docId: string) => {
    const s = read();
    s.favorites = s.favorites.includes(docId)
      ? s.favorites.filter((x) => x !== docId)
      : [...s.favorites, docId];
    write(s);
  }, []);

  const removeFavorite = useCallback((docId: string) => {
    const s = read();
    s.favorites = s.favorites.filter((x) => x !== docId);
    write(s);
  }, []);

  const toggleFavoriteQuestion = useCallback((qid: string) => {
    const s = read();
    s.favoriteQuestions = s.favoriteQuestions.includes(qid)
      ? s.favoriteQuestions.filter((x) => x !== qid)
      : [...s.favoriteQuestions, qid];
    write(s);
  }, []);

  const removeFavoriteQuestion = useCallback((qid: string) => {
    const s = read();
    s.favoriteQuestions = s.favoriteQuestions.filter((x) => x !== qid);
    write(s);
  }, []);

  const addNote = useCallback((n: Omit<NoteItem, "id" | "createdAt">) => {
    const s = read();
    const id = `n${Date.now()}`;
    s.notes = [
      { ...n, id, createdAt: new Date().toLocaleString("zh-CN", { hour12: false }) },
      ...s.notes,
    ];
    write(s);
    return id;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<NoteItem>) => {
    const s = read();
    s.notes = s.notes.map((n) =>
      n.id === id
        ? { ...n, ...patch, updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }) }
        : n,
    );
    write(s);
  }, []);

  const removeNote = useCallback((id: string) => {
    const s = read();
    s.notes = s.notes.filter((n) => n.id !== id);
    write(s);
  }, []);

  const addWrong = useCallback((qid: string) => {
    const s = read();
    const exist = s.wrong.find((w) => w.qid === qid);
    if (exist) {
      exist.wrongCount += 1;
      exist.lastWrongAt = "刚刚";
      exist.mastery = "新增";
    } else {
      s.wrong = [{ qid, wrongCount: 1, lastWrongAt: "刚刚", mastery: "新增" }, ...s.wrong];
    }
    write(s);
  }, []);

  const advanceMastery = useCallback((qid: string) => {
    const s = read();
    const w = s.wrong.find((w) => w.qid === qid);
    if (w) {
      const i = MASTERY_ORDER.indexOf(w.mastery);
      w.mastery = MASTERY_ORDER[Math.min(i + 1, MASTERY_ORDER.length - 1)];
    }
    write(s);
  }, []);

  const setMastery = useCallback((qid: string, mastery: Mastery) => {
    const s = read();
    const w = s.wrong.find((w) => w.qid === qid);
    if (w) w.mastery = mastery;
    write(s);
  }, []);

  const removeWrong = useCallback((qid: string) => {
    const s = read();
    s.wrong = s.wrong.filter((w) => w.qid !== qid);
    write(s);
  }, []);

  const setReview = useCallback((id: string, patch: Partial<SpacedReviewItem>) => {
    const s = read();
    const cur = s.reviews.find((r) => r.id === id);
    if (cur) Object.assign(cur, patch);
    else
      s.reviews = [
        ...s.reviews,
        {
          id,
          kind: "doc",
          sourceId: id,
          title: "",
          addedAt: new Date().toISOString(),
          round: 0,
          ...patch,
        },
      ];
    write(s);
  }, []);

  const addSpacedReview = useCallback(
    (item: { kind: "doc" | "wrong"; sourceId: string; title: string }) => {
      const s = read();
      const id = `${item.kind}-${item.sourceId}`;
      if (s.reviews.some((r) => r.id === id)) return id;
      s.reviews = [
        ...s.reviews,
        {
          id,
          kind: item.kind,
          sourceId: item.sourceId,
          title: item.title,
          addedAt: new Date().toISOString(),
          round: 0,
        },
      ];
      write(s);
      return id;
    },
    [],
  );

  const removeSpacedReview = useCallback((id: string) => {
    const s = read();
    s.reviews = s.reviews.filter((r) => r.id !== id);
    write(s);
  }, []);

  const hasSpacedReview = useCallback((kind: "doc" | "wrong", sourceId: string) => {
    return read().reviews.some((r) => r.kind === kind && r.sourceId === sourceId);
  }, []);

  // ---------- Collections ----------
  const createCollection = useCallback((c: Omit<Collection, "id" | "updatedAt">) => {
    const s = read();
    const id = `kc-${Date.now()}`;
    s.collections = [
      { ...c, id, updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }) },
      ...s.collections,
    ];
    write(s);
    return id;
  }, []);

  const addToCollection = useCallback(
    (collectionId: string, item: { docId?: string; noteId?: string; scenarioId?: string }) => {
      const s = read();
      s.collections = s.collections.map((c) => {
        if (c.id !== collectionId) return c;
        const next: Collection = { ...c };
        if (item.docId && !next.docIds.includes(item.docId))
          next.docIds = [...next.docIds, item.docId];
        if (item.noteId) {
          next.noteIds = next.noteIds || [];
          if (!next.noteIds.includes(item.noteId)) next.noteIds = [...next.noteIds, item.noteId];
        }
        if (item.scenarioId) {
          next.scenarioIds = next.scenarioIds || [];
          if (!next.scenarioIds.includes(item.scenarioId))
            next.scenarioIds = [...next.scenarioIds, item.scenarioId];
        }
        next.updatedAt = new Date().toLocaleString("zh-CN", { hour12: false });
        return next;
      });
      write(s);
    },
    [],
  );

  // ---------- Scenario favorites ----------
  const saveScenarioFavorite = useCallback((sf: Omit<ScenarioFavorite, "id" | "savedAt">) => {
    const s = read();
    s.scenarioFavorites = [
      {
        ...sf,
        id: `sf-${Date.now()}`,
        savedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      },
      ...s.scenarioFavorites,
    ];
    write(s);
  }, []);

  const pushRecentScenario = useCallback((scenarioId: string) => {
    const s = read();
    s.recentScenarios = [scenarioId, ...s.recentScenarios.filter((x) => x !== scenarioId)].slice(
      0,
      6,
    );
    write(s);
  }, []);

  const pushRecentDoc = useCallback((docId: string) => {
    const s = read();
    const entry = { docId, visitedAt: new Date().toISOString() };
    s.recentDocs = [entry, ...s.recentDocs.filter((x) => x.docId !== docId)].slice(0, 20);
    write(s);
  }, []);

  const resetAll = useCallback(() => {
    write(DEFAULT);
  }, []);

  const addQuizSet = useCallback((q: QuizSet) => {
    const s = read();
    s.quizSets = [q, ...s.quizSets.filter((x) => x.id !== q.id)];
    write(s);
    return q.id;
  }, []);

  const getQuizSetByMsgId = useCallback((msgId: string) => {
    return read().quizSets.find((q) => q.relatedMsgId === msgId);
  }, []);

  const updateDocProgress = useCallback(
    (docId: string, patch: Partial<MockState["docProgress"][string]>) => {
      const s = read();
      const current = s.docProgress[docId] ?? {
        readStatus: "未学" as const,
        answeredIds: [],
        correctIds: [],
      };
      s.docProgress = {
        ...s.docProgress,
        [docId]: { ...current, ...patch },
      };
      write(s);
    },
    [],
  );

  const markDocLearned = useCallback(
    (docId: string, learned = true) => {
      updateDocProgress(docId, {
        readStatus: learned ? "已学" : "未学",
        manuallyLearned: learned,
        lastActivityAt: new Date().toISOString(),
      });
    },
    [updateDocProgress],
  );

  const markDocLearningInProgress = useCallback((docId: string, practiceSessionId?: string) => {
    const s = read();
    const current = s.docProgress[docId] ?? {
      readStatus: "未学" as const,
      answeredIds: [],
      correctIds: [],
    };

    if (current.readStatus === "已学" || current.manuallyLearned) return;

    s.docProgress = {
      ...s.docProgress,
      [docId]: {
        ...current,
        readStatus: "学习中",
        practiceSessionId: practiceSessionId ?? current.practiceSessionId,
        lastActivityAt: new Date().toISOString(),
      },
    };
    write(s);
  }, []);

  const startDocPractice = useCallback(
    (docId: string) => markDocLearningInProgress(docId, `doc-practice-${docId}`),
    [markDocLearningInProgress],
  );

  const recordDocAnswers = useCallback(
    (docId: string, answeredIds: string[], correctIds: string[]) => {
      const s = read();
      const relatedQuestionIds = getQuestionIdsForDoc(docId);
      const relatedSet = new Set(relatedQuestionIds);
      const relevantAnsweredIds = answeredIds.filter((id) => relatedSet.has(id));
      const relevantCorrectIds = correctIds.filter((id) => relatedSet.has(id));
      const current = s.docProgress[docId];
      const autoGradableQuestionIds = getAutoGradableQuestionIdsForDoc(docId);
      const allCorrect =
        autoGradableQuestionIds.length > 0 &&
        autoGradableQuestionIds.every((id) => relevantCorrectIds.includes(id));
      const keepManualLearned = current?.manuallyLearned === true;

      updateDocProgress(docId, {
        answeredIds: relevantAnsweredIds,
        correctIds: relevantCorrectIds,
        readStatus: allCorrect || keepManualLearned ? "已学" : "学习中",
        manuallyLearned: keepManualLearned,
        lastActivityAt: new Date().toISOString(),
      });
    },
    [updateDocProgress],
  );

  const clearDocPractice = useCallback(
    (docId: string) => {
      updateDocProgress(docId, {
        answeredIds: [],
        correctIds: [],
        readStatus: "未学",
        manuallyLearned: false,
        practiceSessionId: undefined,
        lastActivityAt: undefined,
      });
    },
    [updateDocProgress],
  );

  return {
    state,
    toggleFavorite,
    removeFavorite,
    toggleFavoriteQuestion,
    removeFavoriteQuestion,
    addNote,
    updateNote,
    removeNote,
    addWrong,
    advanceMastery,
    setMastery,
    removeWrong,
    setReview,
    addSpacedReview,
    removeSpacedReview,
    hasSpacedReview,
    createCollection,
    addToCollection,
    saveScenarioFavorite,
    pushRecentScenario,
    pushRecentDoc,
    resetAll,
    addQuizSet,
    getQuizSetByMsgId,
    updateDocProgress,
    markDocLearned,
    markDocLearningInProgress,
    startDocPractice,
    recordDocAnswers,
    clearDocPractice,
  };
}
