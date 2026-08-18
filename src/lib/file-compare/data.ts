import type {
  ChapterDensityItem,
  ChapterNode,
  CompareDocument,
  CompareSide,
  CompareTask,
  CompareVersion,
  DiffItem,
  DiffType,
  DocBlock,
  DocSpan,
  DocTableCell,
} from "./types";

/* ─── 版本与任务 ─── */

export const COMPARE_VERSIONS: CompareVersion[] = [
  {
    id: "v3",
    label: "V3",
    fileName: "2022版.pdf",
    title: "涉网运行管理规定（2022 版）",
    publishedAt: "2022-04-18",
    pages: 74,
    size: "6.2 MB",
  },
  {
    id: "v4",
    label: "V4",
    fileName: "2023版.pdf",
    title: "涉网运行管理规定（2023 版）",
    publishedAt: "2023-06-02",
    pages: 80,
    size: "6.8 MB",
  },
  {
    id: "v5",
    label: "V5",
    fileName: "2025版.pdf",
    title: "涉网运行管理规定（2025 版）",
    publishedAt: "2025-01-12",
    pages: 86,
    size: "7.4 MB",
  },
  {
    id: "v6",
    label: "V6",
    fileName: "2026版.pdf",
    title: "涉网运行管理规定（2026 版）",
    publishedAt: "2026-03-05",
    pages: 92,
    size: "8.1 MB",
  },
];

export const DEFAULT_COMPARE_TASK_ID = "cmp-2026-001";

export const COMPARE_TASK: CompareTask = {
  id: DEFAULT_COMPARE_TASK_ID,
  title: "涉网运行管理规定 2025—2026 版本比对",
  baseVersionId: "v5",
  targetVersionId: "v6",
  status: "done",
  finishedAt: "2026-03-08 09:42",
  operator: "超级管理员",
  summaryTitle: "本次修订主要集中在运行管理与资料归档",
  summaryBody:
    "更新条款新增了运行监视记录要求，调整了部分参数表述，并重排了异常处置章节。摘要仅用于快速定位，不构成合规或正确性判断。",
};

export function getCompareVersion(id: string): CompareVersion {
  return COMPARE_VERSIONS.find((item) => item.id === id) ?? COMPARE_VERSIONS[2];
}

/* ─── 章节目录 ─── */

export const COMPARE_CHAPTERS: ChapterNode[] = [
  { id: "ch1", no: "1", title: "总则" },
  {
    id: "ch2",
    no: "2",
    title: "术语与定义",
    children: [
      { id: "ch2-1", no: "2.1", title: "基本术语" },
      { id: "ch2-3", no: "2.3", title: "术语修订" },
    ],
  },
  {
    id: "ch3",
    no: "3",
    title: "运行管理要求",
    children: [
      { id: "ch3-1", no: "3.1", title: "岗位职责" },
      { id: "ch3-2", no: "3.2", title: "运行监视" },
      { id: "ch3-3", no: "3.3", title: "异常处置" },
    ],
  },
  {
    id: "ch4",
    no: "4",
    title: "涉网设备管理",
    children: [
      { id: "ch4-1", no: "4.1", title: "设备状态确认" },
      { id: "ch4-2", no: "4.2", title: "设备维护" },
    ],
  },
  {
    id: "ch5",
    no: "5",
    title: "性能试验管理",
    children: [
      { id: "ch5-1", no: "5.1", title: "试验组织" },
      { id: "ch5-2", no: "5.2", title: "试验参数" },
    ],
  },
  {
    id: "ch6",
    no: "6",
    title: "资料归档",
    children: [{ id: "ch6-3", no: "6.3", title: "归档清单" }],
  },
  {
    id: "ch7",
    no: "7",
    title: "附录",
    children: [{ id: "ch7-1", no: "7.1", title: "附录索引" }],
  },
];

/** 章节总数（含子章节），用于「N 个章节」文案 */
export const COMPARE_CHAPTER_COUNT = COMPARE_CHAPTERS.reduce(
  (total, chapter) => total + 1 + (chapter.children?.length ?? 0),
  0,
);

/* ─── 差异清单（28 处） ─── */

export const COMPARE_DIFFS: DiffItem[] = [
  {
    id: "d01",
    seq: 1,
    type: "added",
    title: "新增术语定义",
    description: "术语表新增「涉网设备状态」条目，用于统一状态描述口径。",
    chapterId: "ch2",
    sectionId: "ch2-1",
    clause: "2.1",
    basePage: 6,
    targetPage: 6,
    anchor: "a-2-1-p1",
  },
  {
    id: "d02",
    seq: 2,
    type: "added",
    title: "新增数据来源术语",
    description: "补充「数据来源」定义，明确运行记录参数的取值测点。",
    chapterId: "ch2",
    sectionId: "ch2-1",
    clause: "2.1",
    basePage: 6,
    targetPage: 7,
    anchor: "a-2-1-p2",
  },
  {
    id: "d03",
    seq: 3,
    type: "modified",
    title: "术语表述统一调整",
    description: "「运行监视记录」统一表述为「涉网运行监视记录」。",
    chapterId: "ch2",
    sectionId: "ch2-3",
    clause: "2.3",
    basePage: 8,
    targetPage: 8,
    anchor: "a-2-3-p1",
  },
  {
    id: "d04",
    seq: 4,
    type: "added",
    title: "岗位职责新增交接确认",
    description: "交接班环节新增涉网设备状态与未完成事项的确认要求。",
    chapterId: "ch3",
    sectionId: "ch3-1",
    clause: "3.1.2",
    basePage: 15,
    targetPage: 16,
    anchor: "a-3-1-p1",
  },
  {
    id: "d05",
    seq: 5,
    type: "modified",
    title: "值班检查频次调整",
    description: "值班负责人检查频次由每班一次调整为每班两次。",
    chapterId: "ch3",
    sectionId: "ch3-1",
    clause: "3.1.4",
    basePage: 16,
    targetPage: 17,
    anchor: "a-3-1-p2",
  },
  {
    id: "d06",
    seq: 6,
    type: "added",
    title: "新增运行记录范围要求",
    description: "补充运行记录范围，覆盖涉网设备的启停与并网状态。",
    chapterId: "ch3",
    sectionId: "ch3-2",
    clause: "3.2.1",
    basePage: 18,
    targetPage: 20,
    anchor: "a-3-2-1",
  },
  {
    id: "d07",
    seq: 7,
    type: "modified",
    title: "运行监视频次调整",
    summaryTitle: "运行监视频次表述发生修改",
    description:
      "原文「每 60 分钟记录一次」调整为「每 45 分钟记录一次」，并补充异常情况下的记录要求。",
    chapterId: "ch3",
    sectionId: "ch3-2",
    clause: "3.2.2",
    basePage: 18,
    targetPage: 20,
    anchor: "a-3-2-2-freq",
    highlight: true,
  },
  {
    id: "d08",
    seq: 8,
    type: "added",
    title: "新增异常记录要求",
    description: "记录内容补充数据来源，并要求异常期间提高记录频次。",
    chapterId: "ch3",
    sectionId: "ch3-2",
    clause: "3.2.2",
    basePage: 18,
    targetPage: 20,
    anchor: "a-3-2-2-content",
  },
  {
    id: "d09",
    seq: 9,
    type: "removed",
    title: "删除记录内容旧表述",
    description: "删除仅列举设备状态、运行方式和主要参数的旧表述。",
    chapterId: "ch3",
    sectionId: "ch3-2",
    clause: "3.2.2",
    basePage: 18,
    targetPage: 20,
    anchor: "a-3-2-2-content",
  },
  {
    id: "d10",
    seq: 10,
    type: "modified",
    title: "异常记录方式表格调整",
    description: "表 3-1 中主要参数的记录方式增加异常加密记录。",
    chapterId: "ch3",
    sectionId: "ch3-3",
    clause: "表 3-1",
    basePage: 20,
    targetPage: 22,
    anchor: "a-3-3-table",
  },
  {
    id: "d11",
    seq: 11,
    type: "removed",
    title: "删除重复职责描述",
    description: "删除与 3.1 岗位职责重复的责任划分描述。",
    chapterId: "ch3",
    sectionId: "ch3-3",
    clause: "3.3.1",
    basePage: 21,
    targetPage: 23,
    anchor: "a-3-3-p2",
  },
  {
    id: "d12",
    seq: 12,
    type: "added",
    title: "新增异常处置留痕要求",
    description: "异常处置结束后新增过程留痕与复核签署要求。",
    chapterId: "ch3",
    sectionId: "ch3-3",
    clause: "3.3.2",
    basePage: 22,
    targetPage: 24,
    anchor: "a-3-3-p3",
  },
  {
    id: "d13",
    seq: 13,
    type: "added",
    title: "新增涉网设备状态确认条款",
    summaryTitle: "新增涉网设备状态确认条款",
    description: "新增一段设备状态确认、记录留存及责任岗位说明。",
    chapterId: "ch4",
    sectionId: "ch4-1",
    clause: "4.1.3",
    basePage: 25,
    targetPage: 25,
    anchor: "a-4-1-p1",
    highlight: true,
  },
  {
    id: "d14",
    seq: 14,
    type: "modified",
    title: "状态确认字段变更",
    description: "状态确认记录字段由「确认人」调整为「确认人 / 复核人」。",
    chapterId: "ch4",
    sectionId: "ch4-1",
    clause: "4.1.3",
    basePage: 25,
    targetPage: 26,
    anchor: "a-4-1-p2",
  },
  {
    id: "d15",
    seq: 15,
    type: "added",
    title: "新增设备台账要求",
    description: "新增涉网设备台账建立与季度核对要求。",
    chapterId: "ch4",
    sectionId: "ch4-1",
    clause: "4.1.5",
    basePage: 27,
    targetPage: 28,
    anchor: "a-4-1-p3",
  },
  {
    id: "d16",
    seq: 16,
    type: "removed",
    title: "删除旧维护周期说明",
    description: "删除按季度统一安排维护的旧说明。",
    chapterId: "ch4",
    sectionId: "ch4-2",
    clause: "4.2.1",
    basePage: 29,
    targetPage: 30,
    anchor: "a-4-2-p1",
  },
  {
    id: "d17",
    seq: 17,
    type: "added",
    title: "新增维护记录字段",
    description: "维护记录新增「处理结论」与「验收人」字段。",
    chapterId: "ch4",
    sectionId: "ch4-2",
    clause: "4.2.3",
    basePage: 30,
    targetPage: 31,
    anchor: "a-4-2-p2",
  },
  {
    id: "d18",
    seq: 18,
    type: "modified",
    title: "设备维护周期调整",
    description: "维护周期由 12 个月调整为 6 个月。",
    chapterId: "ch4",
    sectionId: "ch4-2",
    clause: "4.2.4",
    basePage: 31,
    targetPage: 32,
    anchor: "a-4-2-p3",
  },
  {
    id: "d19",
    seq: 19,
    type: "added",
    title: "新增试验组织流程要求",
    description: "试验组织新增方案审批与风险预控环节。",
    chapterId: "ch5",
    sectionId: "ch5-1",
    clause: "5.1.2",
    basePage: 41,
    targetPage: 43,
    anchor: "a-5-1-p1",
  },
  {
    id: "d20",
    seq: 20,
    type: "modified",
    title: "表 5-2 参数调整",
    summaryTitle: "表 5-2 的两个参数值调整",
    description: "表格结构保持不变，第二列与第四列的示例参数发生变化。",
    chapterId: "ch5",
    sectionId: "ch5-2",
    clause: "表 5-2",
    basePage: 43,
    targetPage: 45,
    anchor: "a-5-2-table",
    highlight: true,
  },
  {
    id: "d21",
    seq: 21,
    type: "removed",
    title: "删除重复试验说明",
    description: "删除与 5.1 试验组织重复的准备工作说明。",
    chapterId: "ch5",
    sectionId: "ch5-2",
    clause: "5.2.3",
    basePage: 44,
    targetPage: 46,
    anchor: "a-5-2-p1",
  },
  {
    id: "d22",
    seq: 22,
    type: "added",
    title: "新增试验数据留存要求",
    description: "试验原始数据新增不少于 5 年的留存要求。",
    chapterId: "ch5",
    sectionId: "ch5-2",
    clause: "5.2.5",
    basePage: 45,
    targetPage: 47,
    anchor: "a-5-2-p2",
  },
  {
    id: "d23",
    seq: 23,
    type: "modified",
    title: "试验报告格式调整",
    description: "试验报告结论章节由文字描述调整为结论表。",
    chapterId: "ch5",
    sectionId: "ch5-2",
    clause: "5.2.7",
    basePage: 46,
    targetPage: 48,
    anchor: "a-5-2-p3",
  },
  {
    id: "d24",
    seq: 24,
    type: "added",
    title: "新增版本标识字段",
    summaryTitle: "资料归档新增版本标识字段",
    description: "归档清单新增「文件版本」和「生效日期」两个字段。",
    chapterId: "ch6",
    sectionId: "ch6-3",
    clause: "6.3",
    basePage: 78,
    targetPage: 82,
    anchor: "a-6-3-p1",
    highlight: true,
  },
  {
    id: "d25",
    seq: 25,
    type: "modified",
    title: "归档时限要求调整",
    description: "归档时限由 30 个工作日调整为 15 个工作日。",
    chapterId: "ch6",
    sectionId: "ch6-3",
    clause: "6.3.2",
    basePage: 79,
    targetPage: 83,
    anchor: "a-6-3-p2",
  },
  {
    id: "d26",
    seq: 26,
    type: "removed",
    title: "删除旧归档清单条目",
    description: "删除已停用的纸质台账归档条目。",
    chapterId: "ch6",
    sectionId: "ch6-3",
    clause: "6.3.4",
    basePage: 80,
    targetPage: 84,
    anchor: "a-6-3-p3",
  },
  {
    id: "d27",
    seq: 27,
    type: "moved",
    title: "附录 A 位置调整",
    description: "附录 A 由正文之后移动至附录索引之前。",
    chapterId: "ch7",
    sectionId: "ch7-1",
    clause: "附录 A",
    basePage: 82,
    targetPage: 86,
    anchor: "a-7-1-p1",
  },
  {
    id: "d28",
    seq: 28,
    type: "moved",
    title: "附录 C 顺序移动",
    description: "附录 C 与附录 D 的排列顺序互换。",
    chapterId: "ch7",
    sectionId: "ch7-1",
    clause: "附录 C",
    basePage: 84,
    targetPage: 88,
    anchor: "a-7-1-p2",
  },
];

/* ─── 派生统计 ─── */

export const DIFF_TYPE_ORDER: DiffType[] = ["added", "removed", "modified", "moved"];

export function countByType(diffs: DiffItem[], type: DiffType) {
  return diffs.filter((diff) => diff.type === type).length;
}

export function countByChapter(diffs: DiffItem[], chapterId: string) {
  return diffs.filter((diff) => diff.chapterId === chapterId).length;
}

export function countBySection(diffs: DiffItem[], sectionId: string) {
  return diffs.filter((diff) => diff.sectionId === sectionId).length;
}

/** 目录节点上的差异数：一级章节取全章合计，子章节取本节合计 */
export function countByChapterNode(diffs: DiffItem[], node: ChapterNode, isTopLevel: boolean) {
  return isTopLevel ? countByChapter(diffs, node.id) : countBySection(diffs, node.id);
}

export function getAffectedChapterCount(diffs: DiffItem[]) {
  return new Set(diffs.map((diff) => diff.chapterId)).size;
}

export function getChapterDensity(diffs: DiffItem[], limit = 6): ChapterDensityItem[] {
  return (
    COMPARE_CHAPTERS.map((chapter, index) => ({
      chapterId: chapter.id,
      label: `${chapter.no} ${chapter.title}`,
      count: countByChapter(diffs, chapter.id),
      index,
    }))
      .filter((item) => item.count > 0)
      // 数量相同时优先展示正文靠后的章节，这部分变化更容易被漏读
      .sort((a, b) => b.count - a.count || b.index - a.index)
      .slice(0, limit)
      .map(({ chapterId, label, count }) => ({ chapterId, label, count }))
  );
}

/** 中间「变化摘要」列表顺序：重点变化优先，其余按文档顺序 */
export function sortForSummaryList(diffs: DiffItem[]) {
  return [...diffs].sort((a, b) => {
    if (Boolean(a.highlight) !== Boolean(b.highlight)) return a.highlight ? -1 : 1;
    return a.seq - b.seq;
  });
}

export function findChapterById(id: string): ChapterNode | undefined {
  for (const chapter of COMPARE_CHAPTERS) {
    if (chapter.id === id) return chapter;
    const child = chapter.children?.find((item) => item.id === id);
    if (child) return child;
  }
  return undefined;
}

export function getChapterLabel(id: string) {
  const chapter = findChapterById(id);
  return chapter ? `${chapter.no} ${chapter.title}` : "全文概览";
}

/** 章节节点是否命中筛选（一级章节包含其子节点的差异） */
export function diffMatchesChapter(diff: DiffItem, chapterId: string | undefined) {
  if (!chapterId || chapterId === "all") return true;
  return diff.chapterId === chapterId || diff.sectionId === chapterId;
}

/* ─── 文档正文（双栏对照用） ─── */

type BlockSpec =
  | { kind: "heading"; level: 1 | 2; text: string }
  | { kind: "paragraph"; spans: DocSpan[] }
  | { kind: "table"; columns: string[]; rows: DocTableCell[][] };

interface BlockPair {
  anchor: string;
  diffId?: string;
  base: BlockSpec;
  target: BlockSpec;
}

const text = (value: string): DocSpan[] => [{ text: value }];

/** 两侧完全一致的段落 */
function same(anchor: string, spec: BlockSpec): BlockPair {
  return { anchor, base: spec, target: spec };
}

function heading(anchor: string, level: 1 | 2, value: string): BlockPair {
  return same(anchor, { kind: "heading", level, text: value });
}

function paragraph(anchor: string, value: string): BlockPair {
  return same(anchor, { kind: "paragraph", spans: text(value) });
}

const DOCUMENT_BLOCKS: BlockPair[] = [
  heading("a-1", 1, "1 总则"),
  paragraph(
    "a-1-p1",
    "1.1 本规定用于规范涉网设备的运行管理、试验管理与资料归档工作，适用于全厂涉网运行相关岗位。",
  ),
  paragraph("a-1-p2", "1.2 涉网运行工作应遵循安全第一、预防为主的原则，按照调度指令与本规定执行。"),

  heading("a-2", 1, "2 术语与定义"),
  heading("a-2-1", 2, "2.1 基本术语"),
  {
    anchor: "a-2-1-p1",
    diffId: "d01",
    base: {
      kind: "paragraph",
      spans: text("涉网设备指与电网直接连接并参与电网运行的设备，包括发电机、励磁系统与调速系统。"),
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "涉网设备指与电网直接连接并参与电网运行的设备，包括发电机、励磁系统与调速系统。" },
        { text: "涉网设备状态指设备在并网运行中的可用性与主要参数一致性描述。", tone: "add" },
      ],
    },
  },
  {
    anchor: "a-2-1-p2",
    diffId: "d02",
    base: {
      kind: "paragraph",
      spans: text("运行记录指运行人员按规定间隔记录的设备状态与主要参数。"),
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "运行记录指运行人员按规定间隔记录的设备状态与主要参数。" },
        { text: "数据来源指运行记录中参数取值所对应的测点或业务系统。", tone: "add" },
      ],
    },
  },
  heading("a-2-3", 2, "2.3 术语修订"),
  {
    anchor: "a-2-3-p1",
    diffId: "d03",
    base: {
      kind: "paragraph",
      spans: [
        { text: "本版本术语沿用 " },
        { text: "“运行监视记录”", tone: "modifyOld" },
        { text: " 的表述，与附录 A 保持一致。" },
      ],
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "本版本术语沿用 " },
        { text: "“涉网运行监视记录”", tone: "modifyNew" },
        { text: " 的表述，与附录 A 保持一致。" },
      ],
    },
  },

  heading("a-3", 1, "3 运行管理要求"),
  heading("a-3-1", 2, "3.1 岗位职责"),
  {
    anchor: "a-3-1-p1",
    diffId: "d04",
    base: {
      kind: "paragraph",
      spans: text("3.1.2 运行人员应按照岗位分工履行涉网运行的监视与记录职责。"),
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "3.1.2 运行人员应按照岗位分工履行涉网运行的监视与记录职责。" },
        { text: "交接班时应确认涉网设备状态与未完成事项。", tone: "add" },
      ],
    },
  },
  {
    anchor: "a-3-1-p2",
    diffId: "d05",
    base: {
      kind: "paragraph",
      spans: [
        { text: "3.1.4 值班负责人应 " },
        { text: "每班检查一次", tone: "modifyOld" },
        { text: " 涉网设备运行情况，并在值班记录中签署。" },
      ],
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "3.1.4 值班负责人应 " },
        { text: "每班检查两次", tone: "modifyNew" },
        { text: " 涉网设备运行情况，并在值班记录中签署。" },
      ],
    },
  },
  heading("a-3-2", 2, "3.2 运行监视"),
  {
    anchor: "a-3-2-1",
    diffId: "d06",
    base: {
      kind: "paragraph",
      spans: text("3.2.1 运行人员应按规定监视涉网设备状态，并完整记录运行数据。"),
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "3.2.1 运行人员应按规定监视涉网设备状态，并完整记录运行数据。" },
        { text: "记录范围包括启停与并网状态。", tone: "add" },
      ],
    },
  },
  {
    anchor: "a-3-2-2-freq",
    diffId: "d07",
    base: {
      kind: "paragraph",
      spans: [
        { text: "3.2.2 正常运行期间，应按照运行记录要求，" },
        { text: "每 60 分钟记录一次", tone: "modifyOld" },
        { text: " 主要运行参数。" },
      ],
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "3.2.2 正常运行期间，应按运行记录要求，" },
        { text: "每 45 分钟记录一次", tone: "modifyNew" },
        { text: " 主要运行参数。" },
      ],
    },
  },
  {
    anchor: "a-3-2-2-content",
    diffId: "d09",
    base: {
      kind: "paragraph",
      spans: [{ text: "记录内容包括设备状态、运行方式和主要参数。", tone: "remove" }],
    },
    target: {
      kind: "paragraph",
      spans: [
        {
          text: "记录内容包括设备状态、运行方式、主要参数及数据来源；发生异常时应增加记录频次。",
          tone: "add",
        },
      ],
    },
  },
  paragraph("a-3-2-3", "3.2.3 发现状态异常时，应及时核对相关信息并按既定流程处置。"),
  heading("a-3-3", 2, "3.3 异常处置"),
  paragraph("a-3-3-p1", "异常处置过程应保留必要记录，事后完成资料归档。"),
  {
    anchor: "a-3-3-table",
    diffId: "d10",
    base: {
      kind: "table",
      columns: ["记录项目", "记录方式"],
      rows: [
        [text("设备状态"), text("运行日志")],
        [text("主要参数"), text("定时记录")],
      ],
    },
    target: {
      kind: "table",
      columns: ["记录项目", "记录方式"],
      rows: [
        [text("设备状态"), text("运行日志")],
        [text("主要参数"), [{ text: "定时记录 + 异常加密记录", tone: "add" }]],
      ],
    },
  },
  {
    anchor: "a-3-3-p2",
    diffId: "d11",
    base: {
      kind: "paragraph",
      spans: [
        { text: "3.3.1 " },
        {
          text: "异常处置的责任划分按第 3.1 条执行，值班负责人承担现场组织责任。",
          tone: "remove",
        },
      ],
    },
    target: { kind: "paragraph", spans: text("3.3.1 异常处置按调度指令与现场规程执行。") },
  },
  {
    anchor: "a-3-3-p3",
    diffId: "d12",
    base: { kind: "paragraph", spans: text("3.3.2 异常处置结束后应恢复正常监视方式。") },
    target: {
      kind: "paragraph",
      spans: [
        { text: "3.3.2 异常处置结束后应恢复正常监视方式。" },
        { text: "处置过程应留痕并由专业工程师复核签署。", tone: "add" },
      ],
    },
  },

  heading("a-4", 1, "4 涉网设备管理"),
  heading("a-4-1", 2, "4.1 设备状态确认"),
  {
    anchor: "a-4-1-p1",
    diffId: "d13",
    base: { kind: "paragraph", spans: text("4.1.3 涉网设备投入运行前应完成状态检查。") },
    target: {
      kind: "paragraph",
      spans: [
        { text: "4.1.3 涉网设备投入运行前应完成状态检查。" },
        {
          text: "状态确认结果应形成记录并留存，责任岗位为值班负责人与专业工程师。",
          tone: "add",
        },
      ],
    },
  },
  {
    anchor: "a-4-1-p2",
    diffId: "d14",
    base: {
      kind: "paragraph",
      spans: [
        { text: "状态确认记录应包含 " },
        { text: "确认人", tone: "modifyOld" },
        { text: " 与确认时间。" },
      ],
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "状态确认记录应包含 " },
        { text: "确认人 / 复核人", tone: "modifyNew" },
        { text: " 与确认时间。" },
      ],
    },
  },
  {
    anchor: "a-4-1-p3",
    diffId: "d15",
    base: { kind: "paragraph", spans: text("4.1.5 涉网设备参数变更应及时通知调度机构。") },
    target: {
      kind: "paragraph",
      spans: [
        { text: "4.1.5 涉网设备参数变更应及时通知调度机构。" },
        { text: "应建立涉网设备台账并按季度核对。", tone: "add" },
      ],
    },
  },
  heading("a-4-2", 2, "4.2 设备维护"),
  {
    anchor: "a-4-2-p1",
    diffId: "d16",
    base: {
      kind: "paragraph",
      spans: [
        { text: "4.2.1 " },
        { text: "涉网设备维护按季度统一安排，由检修部门编制计划。", tone: "remove" },
      ],
    },
    target: { kind: "paragraph", spans: text("4.2.1 涉网设备维护应纳入年度检修计划。") },
  },
  {
    anchor: "a-4-2-p2",
    diffId: "d17",
    base: { kind: "paragraph", spans: text("4.2.3 维护记录应包含维护内容与实施人。") },
    target: {
      kind: "paragraph",
      spans: [
        { text: "4.2.3 维护记录应包含维护内容与实施人。" },
        { text: "并新增处理结论与验收人字段。", tone: "add" },
      ],
    },
  },
  {
    anchor: "a-4-2-p3",
    diffId: "d18",
    base: {
      kind: "paragraph",
      spans: [
        { text: "4.2.4 涉网保护装置校验周期为 " },
        { text: "12 个月", tone: "modifyOld" },
        { text: "。" },
      ],
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "4.2.4 涉网保护装置校验周期为 " },
        { text: "6 个月", tone: "modifyNew" },
        { text: "。" },
      ],
    },
  },

  heading("a-5", 1, "5 性能试验管理"),
  heading("a-5-1", 2, "5.1 试验组织"),
  {
    anchor: "a-5-1-p1",
    diffId: "d19",
    base: { kind: "paragraph", spans: text("5.1.2 性能试验应提前编制试验方案。") },
    target: {
      kind: "paragraph",
      spans: [
        { text: "5.1.2 性能试验应提前编制试验方案。" },
        { text: "试验方案应经专业审批并完成风险预控交底。", tone: "add" },
      ],
    },
  },
  heading("a-5-2", 2, "5.2 试验参数"),
  {
    anchor: "a-5-2-table",
    diffId: "d20",
    base: {
      kind: "table",
      columns: ["试验项目", "整定值", "允许偏差", "记录周期"],
      rows: [
        [
          text("一次调频"),
          [{ text: "0.05 Hz", tone: "modifyOld" }],
          text("±0.01"),
          text("15 分钟"),
        ],
        [text("AGC 调节"), text("1.5 %"), text("±0.20"), [{ text: "30 分钟", tone: "modifyOld" }]],
      ],
    },
    target: {
      kind: "table",
      columns: ["试验项目", "整定值", "允许偏差", "记录周期"],
      rows: [
        [
          text("一次调频"),
          [{ text: "0.03 Hz", tone: "modifyNew" }],
          text("±0.01"),
          text("15 分钟"),
        ],
        [text("AGC 调节"), text("1.5 %"), text("±0.20"), [{ text: "15 分钟", tone: "modifyNew" }]],
      ],
    },
  },
  {
    anchor: "a-5-2-p1",
    diffId: "d21",
    base: {
      kind: "paragraph",
      spans: [
        { text: "5.2.3 " },
        { text: "试验前的准备工作按第 5.1 条执行，不再单独说明。", tone: "remove" },
      ],
    },
    target: { kind: "paragraph", spans: text("5.2.3 试验前应完成测点校核与数据采集确认。") },
  },
  {
    anchor: "a-5-2-p2",
    diffId: "d22",
    base: { kind: "paragraph", spans: text("5.2.5 试验数据应完整记录并归档。") },
    target: {
      kind: "paragraph",
      spans: [
        { text: "5.2.5 试验数据应完整记录并归档。" },
        { text: "原始数据留存期限不少于 5 年。", tone: "add" },
      ],
    },
  },
  {
    anchor: "a-5-2-p3",
    diffId: "d23",
    base: {
      kind: "paragraph",
      spans: [
        { text: "5.2.7 试验报告结论章节采用 " },
        { text: "文字描述", tone: "modifyOld" },
        { text: " 形式。" },
      ],
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "5.2.7 试验报告结论章节采用 " },
        { text: "结论表", tone: "modifyNew" },
        { text: " 形式。" },
      ],
    },
  },

  heading("a-6", 1, "6 资料归档"),
  heading("a-6-3", 2, "6.3 归档清单"),
  {
    anchor: "a-6-3-p1",
    diffId: "d24",
    base: { kind: "paragraph", spans: text("归档清单应包含文件名称、归档人与归档时间。") },
    target: {
      kind: "paragraph",
      spans: [
        { text: "归档清单应包含文件名称、归档人与归档时间。" },
        { text: "并新增「文件版本」和「生效日期」两个字段。", tone: "add" },
      ],
    },
  },
  {
    anchor: "a-6-3-p2",
    diffId: "d25",
    base: {
      kind: "paragraph",
      spans: [
        { text: "6.3.2 资料应在工作结束后 " },
        { text: "30 个工作日", tone: "modifyOld" },
        { text: " 内完成归档。" },
      ],
    },
    target: {
      kind: "paragraph",
      spans: [
        { text: "6.3.2 资料应在工作结束后 " },
        { text: "15 个工作日", tone: "modifyNew" },
        { text: " 内完成归档。" },
      ],
    },
  },
  {
    anchor: "a-6-3-p3",
    diffId: "d26",
    base: {
      kind: "paragraph",
      spans: [{ text: "6.3.4 " }, { text: "纸质运行台账按年度装订后移交档案室。", tone: "remove" }],
    },
    target: { kind: "paragraph", spans: text("6.3.4 归档资料应同步上传知识库并登记来源。") },
  },

  heading("a-7", 1, "7 附录"),
  heading("a-7-1", 2, "7.1 附录索引"),
  {
    anchor: "a-7-1-p1",
    diffId: "d27",
    base: { kind: "paragraph", spans: text("附录 A 涉网运行监视记录表（位于正文之后）。") },
    target: {
      kind: "paragraph",
      spans: [{ text: "附录 A 涉网运行监视记录表（移动至附录索引之前）。" }],
    },
  },
  {
    anchor: "a-7-1-p2",
    diffId: "d28",
    base: { kind: "paragraph", spans: text("附录 C 试验参数表、附录 D 归档清单模板。") },
    target: { kind: "paragraph", spans: text("附录 D 归档清单模板、附录 C 试验参数表。") },
  },
];

function buildDocument(side: CompareSide, versionId: string): CompareDocument {
  const version = getCompareVersion(versionId);
  const blocks: DocBlock[] = DOCUMENT_BLOCKS.map((pair, index) => {
    const spec = side === "base" ? pair.base : pair.target;
    const shared = {
      id: `${side}-${index}`,
      anchor: pair.anchor,
      diffId: pair.diffId,
    };
    if (spec.kind === "heading")
      return { ...shared, kind: "heading", level: spec.level, text: spec.text };
    if (spec.kind === "table")
      return { ...shared, kind: "table", columns: spec.columns, rows: spec.rows };
    return { ...shared, kind: "paragraph", spans: spec.spans };
  });

  return {
    side,
    versionId,
    fileName: version.fileName,
    label: version.label,
    totalPages: version.pages,
    blocks,
  };
}

export function getCompareDocuments(baseVersionId: string, targetVersionId: string) {
  return {
    base: buildDocument("base", baseVersionId),
    target: buildDocument("target", targetVersionId),
  };
}

/** 文档中出现差异的锚点顺序，用于缩略条 */
export const DOCUMENT_ANCHOR_ORDER = DOCUMENT_BLOCKS.map((pair) => pair.anchor);

export function getDiffsByAnchor(anchor: string) {
  return COMPARE_DIFFS.filter((diff) => diff.anchor === anchor);
}
