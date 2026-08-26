// Tiny localStorage-backed mock store with React hook for cross-page sharing.
import { useEffect, useState, useCallback } from "react";
import { DEFAULT_COLLECTIONS, type Collection } from "./scenario";
import { QUIZ_SETS, type QuizSet } from "./learning-hub";
import { getAutoGradableQuestionIdsForDoc, getQuestionIdsForDoc } from "./learning-progress";

const KEY = "ai-grid-mock-store-v8";

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
  favoriteQuestions: ["q1", "q3"],
  notes: [
    {
      id: "n-seed-1",
      docId: "d1",
      title: "AGC 三项指标速记",
      tag: "AGC",
      body: "AGC 调节性能按调节速率、调节精度、响应时间三项综合考核，任一项未达调度合格阈值，均按对应规则纳入月度考核，不能用另外两项“平均”抵消。\n\n速记口径：\n1. 调节速率：跟踪目标功率变化的能力，关注升降负荷段是否跟上曲线，深调、启停并网初期最容易掉点。\n2. 调节精度：稳态跟踪偏差，死区设大了看起来“稳”，精度往往先被扣。\n3. 响应时间：接到指令后进入有效调节的时延，通讯抖动、控制器闭锁都会把它拉长。\n\n厂站侧执行：K 值法按月统计，值班应结合负荷率、燃料品质与控制策略看曲线，不要只看当班有没有告警。复习优先看细则第二章及厂家 SOP 中死区、速率上下限的对应关系。\n\n当班提醒：AGC 投自动前确认远方/就地、上下限、闭锁条件；退出前先跟调度说清原因，避免“自己退了还在考核窗口里”。",
      createdAt: "2024-09-12 10:24",
      collectionIds: ["kc-agc"],
    },
    {
      id: "n-seed-2",
      docId: "d2",
      title: "主变停役前置核对清单",
      tag: "典型操作",
      body: "500kV 主变停役不是“拉开刀闸就结束”，前置核对漏一项，后面保护、接地、中性点都可能把人绕进去。操作前按下面四步走完再开票。\n\n1) 负荷转移\n确认并列、倒代路径和限额，低压侧、中压侧负荷是否已转移到指定变压器或线路；记录转移前后潮流，避免停役过程中另一台主变过载。\n\n2) 保护连接片\n差动、后备、瓦斯、失灵联跳压板按本次方式投退，严禁“习惯性全投/全退”。核对压板名称与定值单、一次接线图一致，特别注意旁路代路、联变分列时的范围变化。\n\n3) 中性点接地刀闸\n停役变压器中性点接地方式要与系统接地要求一致：哪台接地、哪台断开，写进操作票并在现场复诵。切换顺序错误会造成短时失地或两点接地。\n\n4) 调度命令与操作票一致性\n核对调度下令范围、设备双重名称、操作任务与现场实际状态。关键步骤双人监护、唱票复诵，操作中若方式变化，停下来重新请示，不现场“顺手改票”。",
      createdAt: "2024-08-21 14:02",
      collectionIds: ["kc-main"],
    },
    {
      id: "n-seed-3",
      docId: "d10",
      title: "差动保护复盘四步法",
      tag: "继电保护",
      body: "差动保护动作后不要一上来就“恢复送电”。按 TA 极性 → 二次回路 → 定值 → 一次设备状态的顺序核查，前面没查完不要跳到后面，避免把二次问题当成一次故障处理。\n\n第一步：TA 极性与变比\n核对接线、极性标识、变比与保护装置采样是否一致。重点看是否有反接、开路、饱和，以及两侧 TA 型号混用造成的差流。\n\n第二步：二次回路\n查电流回路端子、屏柜连片、电缆屏蔽与接地。瞬时接地、端子松动、试验接线未恢复，都是高频误动原因。对照动作报告里的差流、制动电流波形，判断是区外穿越还是区内真实故障。\n\n第三步：定值\n核对差动门槛、比率制动、二次谐波闭锁、TA 断线闭锁是否与最新定值单一致。版本、执行日期、现场压板状态三者对不上时，先把定值问题钉死。\n\n第四步：一次设备\n绕组、套管、引线、油色谱和气体继电器。确认一次无明显异常后，才能讨论“误动后的恢复条件”。四步都记进复盘，下次值班按同一清单走，不靠临场发挥。",
      createdAt: "2024-07-08 09:15",
      collectionIds: ["kc-fault"],
    },
    {
      id: "n-seed-4",
      docId: "d2",
      title: "主变中性点接地方式与停役配合",
      tag: "主变",
      body: "主变停役时中性点怎么处理，最容易和“系统必须保持一点接地”这条打架。记住：停哪台、留哪台接地，要按当前运行方式算，不能按上次票抄。\n\n配合要点：\n- 两台主变并列，停役一台前，确认另一台中性点已接地且刀闸位置核对无误。\n- 切换接地刀闸的顺序写进票：先合后拉，避免系统短时失地。\n- 间隙接地、避雷器侧的状态也要看，不要只盯接地刀闸一把。\n- 操作结束后在监控核对中性点刀闸遥信、现场位置牌、一次接线图三处一致。\n\n易错：有人停役完成后才发现接地还留在已停电变压器上，运行变变成不接地。复盘里把这一条单列成检查项。",
      createdAt: "2024-08-19 16:40",
      collectionIds: ["kc-main"],
    },
    {
      id: "n-seed-5",
      docId: "d4",
      title: "500kV 主变停役操作票易错项",
      tag: "典型操作",
      body: "对照厂站规程和标准化程序，把近几次主变停役票里反复出现的错漏记下来，开票前先过一遍。\n\n1. 设备双重名称漏写电压等级或左右侧，调度令与现场牌对不上。\n2. 把“冷倒”写成“热倒”，或漏写旁路代路时的保护范围变化。\n3. 瓦斯、压力释放、油温高跳闸压板未按本次检修范围退出，检修中误跳运行变。\n4. 接地线（地刀）装设位置与工作地点不对应，工作票和操作票各写各的。\n5. 操作中断后未重新核对当前状态，接着往下走导致漏项。\n\n处理习惯：票面改动必须重新审核；现场发现与票不符，停止操作并汇报值班负责人。这些不是“形式”，是把误操作挡在执行前。",
      createdAt: "2024-08-18 09:12",
      collectionIds: ["kc-main"],
    },
    {
      id: "n-seed-6",
      docId: "d6",
      title: "AGC 死区与调节速率现场整定要点",
      tag: "AGC",
      body: "厂家 SOP 里死区和速率是一对：死区太大，小指令不动作，精度差；死区太小，频繁调节，设备累、速率曲线也不好看。现场整定不要只听“调灵敏一点”。\n\n整定前先确认：\n- 当前有功上下限、滑压/定压方式、磨煤机组合是否与试验工况一致。\n- 控制器远方给定与 DCS 手自动无冲突，闭锁条件（RB、RUNBACK、主汽压力低）已理解。\n- 记录整定前 30 分钟 AGC 跟踪曲线，作为对比基线。\n\n整定时：先改死区观察稳态偏差，再动速率限幅。每次只动一个参数，等一个调度指令周期再判断。深调段、过阀点段单独看，不要用满负荷曲线代替。\n\n整定后：把参数、时间、值班人记进运行记事，并对照两细则精度、速率条款做一次自查，避免“现场顺了、月底考核没顺”。",
      createdAt: "2024-09-10 15:05",
      collectionIds: ["kc-agc"],
    },
    {
      id: "n-seed-7",
      docId: "d8",
      title: "两细则月度考核对标自查清单",
      tag: "AGC",
      body: "月底考核出来再解释，不如月中按清单自查。把两细则里和值班最相关的几条做成固定动作。\n\nAGC：抽查本月调节速率、精度、响应时间不合格时段，对应到当时工况（启停、深调、燃料波动、通讯中断）。\n一次调频：核对投入信号、动作死区、限幅是否与试验报告一致；就地退出要有调度许可记录。\nAVC：投自动后电压越限次数、无功越限是否及时切手动并汇报。\n非计划停运、降出力：原因分类有没有填对，避免“设备问题”写成“电网原因”对不上调度口径。\n\n资料侧：细则条款、厂家 SOP、本厂月报三份对着看。自查记录留在这个目录，交接班时点一下未闭环项。",
      createdAt: "2024-09-08 11:20",
      collectionIds: ["kc-agc"],
    },
    {
      id: "n-seed-8",
      docId: "d3",
      title: "母差保护误动复盘要点",
      tag: "继电保护",
      body: "某 500kV 站母差误动，核心不是“保护不好”，而是二次回路和运行方式变化没有同步。复盘时抓住三条线：动作时刻一次有没有故障、差流从哪来、闭锁为什么没挡住。\n\n记录要写清：\n- 动作母线、跳闸开关清单、重合/闭锁情况。\n- 故障录波：差流、制动电流、电压、开关量变位时序。\n- 当时母线倒闸、CT 二次是否有工作、试验接线是否恢复。\n- 母差比率制动、TA 断线闭锁、电压闭锁是否按定值执行。\n\n结论模板：原因（回路/定值/方式）→ 暴露的管理漏洞（谁许可、谁监护、谁验收）→ 反措（端子标记、工作结束核对、倒闸后复归检查）。同类倒闸前把这三条当必读。",
      createdAt: "2024-08-30 17:02",
      collectionIds: ["kc-fault"],
    },
    {
      id: "n-seed-9",
      docId: "d12",
      title: "母线倒闸误送电：操作与监护断点",
      tag: "故障复盘",
      body: "误送电事故里，票面往往是对的，断在执行和监护。把断点写明白，比再背一遍步骤有用。\n\n常见断点：\n1. 倒闸中途方式变化，监护人去接电话，操作人继续走下一步。\n2. 地刀/接地线位置看错间隔，名称相近的开关、刀闸在灯光下不好辨。\n3. 五防解锁后未恢复闭锁，后续步骤失去校核。\n4. 送电前未确认工作班全部撤离、接地已拆除。\n\n当班做法：倒闸过程监护人不离岗；解锁必须登记、限时、监护；送电前“人、地、牌、图”四核对。这份笔记放在复盘目录，专题练习时当反面教材用。",
      createdAt: "2024-08-28 08:46",
      collectionIds: ["kc-fault"],
    },
    {
      id: "n-seed-10",
      docId: "d8",
      title: "一次调频考试高频易错点",
      tag: "考试",
      body: "考试和现场最容易混的是：一次调频是系统频率变化时机组主动贡献有功，不是 AGC 指令跟踪。题目里出现“调度下达目标功率”要先分清考的是哪一套。\n\n易错点：\n- 死区：一次调频死区与 AGC 死区不是同一个参数，不能互相套用。\n- 限幅：一次调频出力限制与 AGC 上下限同时存在时，以更严的约束为准，但考核条款分开计算。\n- 投入信号：装置投入、DCS 投入、调度侧看见的状态，三处不一致时判“未投入”。\n- 试验与运行：试验步骤按厂家 SOP，运行中退出必须有调度令，考试爱考“能不能自己退”。\n\n答题策略：先判断题干说的是频率响应还是远方 AGC，再写死区、限幅、投入状态。把这页在考前过一遍。",
      createdAt: "2024-08-22 20:18",
      collectionIds: ["kc-exam"],
    },
    {
      id: "n-seed-11",
      docId: "d11",
      title: "AVC 投自动后电压越限处置口诀",
      tag: "AVC",
      body: "AVC 投自动后母线电压越限，不要先改变压器分接头“顶回去”，顺序错了会和 AVC 对着调。\n\n口诀：看闭锁 → 转手动 → 报调度 → 查无功 → 再谈投退。\n\n1. 看闭锁：装置是否因越限、滑档、通讯异常已经闭锁；闭锁灯、报文、DCS 状态对照。\n2. 转手动：确认 AVC 切就地/手动，避免自动指令继续发。\n3. 报调度：说明越限幅度、已采取的切手动，听调度定电压曲线还是保持。\n4. 查无功：机组无功、受阻、电容器/电抗器、邻近机组 AVC 是否同时异常。\n5. 再谈投退：原因未查清不重新投自动；投之前核对目标电压、上下限、闭锁复归。\n\n考试和现场都爱考“首先应做什么”，答案通常是切手动并汇报，不是直接调档。",
      createdAt: "2024-08-16 13:55",
      collectionIds: ["kc-exam"],
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
    { docId: "d9", visitedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { docId: "d12", visitedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { docId: "d13", visitedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
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

  const updateCollection = useCallback((id: string, patch: Partial<Collection>) => {
    const s = read();
    s.collections = s.collections.map((c) =>
      c.id === id
        ? { ...c, ...patch, updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }) }
        : c,
    );
    write(s);
  }, []);

  const removeCollection = useCallback((id: string) => {
    const s = read();
    s.collections = s.collections.filter((c) => c.id !== id);
    s.notes = s.notes.map((n) => ({
      ...n,
      collectionIds: (n.collectionIds ?? []).filter((cid) => cid !== id),
    }));
    write(s);
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
    updateCollection,
    removeCollection,
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
