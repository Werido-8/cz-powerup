import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Ban,
  Eye,
  FileStack,
  History,
  Info,
  ListTree,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Square,
  Trash2,
  ArrowUpFromLine,
} from "lucide-react";
import type { KnowledgeStatusTone } from "./status";
import type { UploadRecord } from "./types";
import { getBaseById } from "./model";

/* ─────────────────────────────────────────────
 * 视图与三维状态模型
 * ───────────────────────────────────────────── */

export type UploadView = "all" | "review" | "parse" | "publish";

export const UPLOAD_VIEWS: UploadView[] = ["all", "review", "parse", "publish"];

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ParseStage = "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
export type PublishStage = "PENDING" | "PUBLISHED" | "DISABLED";
export type CurrentStage = "REVIEW" | "PARSE" | "PUBLISH";

/** 记录当前所处的具体处境，用于生成动态操作 */
export type UploadSituation =
  | "reviewPending"
  | "reviewRejected"
  | "parseWaiting"
  | "parseProcessing"
  | "parseCompleted"
  | "parseError"
  | "published"
  | "disabled";

/* ─── 维度派生（基于既有 status + parseStatus） ─── */

export function getReviewStatus(record: UploadRecord): ReviewStatus {
  if (record.status === "pendingApproval") return "PENDING";
  if (record.status === "rejected") return "REJECTED";
  return "APPROVED";
}

export function getParseStage(record: UploadRecord): ParseStage {
  // 先解析后审批：公共库在审核完成前即可进入解析流程
  switch (record.parseStatus) {
    case "parsing":
      return "PROCESSING";
    case "success":
      return "COMPLETED";
    case "failed":
      return "ERROR";
    default:
      return "PENDING";
  }
}

export function getPublishStage(record: UploadRecord): PublishStage {
  if (record.status === "published") return "PUBLISHED";
  if (record.status === "disabled") return "DISABLED";
  return "PENDING";
}

export function getCurrentStage(record: UploadRecord): CurrentStage {
  const base = getBaseById(record.targetKnowledgeBaseId);
  const parse = getParseStage(record);
  const review = getReviewStatus(record);

  if (base?.scope === "personal") {
    if (parse === "PENDING" || parse === "PROCESSING" || parse === "ERROR") return "PARSE";
    return "PUBLISH";
  }

  if (parse === "PENDING" || parse === "PROCESSING" || parse === "ERROR") return "PARSE";
  if (review === "PENDING" || review === "REJECTED") return "REVIEW";
  return "PUBLISH";
}

export function getSituation(record: UploadRecord): UploadSituation {
  const review = getReviewStatus(record);
  if (review === "PENDING") return "reviewPending";
  if (review === "REJECTED") return "reviewRejected";
  const publish = getPublishStage(record);
  if (publish === "DISABLED") return "disabled";
  if (publish === "PUBLISHED") return "published";
  switch (getParseStage(record)) {
    case "PROCESSING":
      return "parseProcessing";
    case "ERROR":
      return "parseError";
    case "COMPLETED":
      return "parseCompleted";
    default:
      return "parseWaiting";
  }
}

/* ─── 文案与色调（严格对齐规范用词） ─── */

export function reviewStatusLabel(s: ReviewStatus) {
  return { PENDING: "待审核", APPROVED: "审核通过", REJECTED: "审核驳回" }[s];
}
export function reviewStatusTone(s: ReviewStatus): KnowledgeStatusTone {
  return { PENDING: "warning", APPROVED: "success", REJECTED: "danger" }[s] as KnowledgeStatusTone;
}

export function parseStageLabel(s: ParseStage) {
  return { PENDING: "待解析", PROCESSING: "解析中", COMPLETED: "解析完成", ERROR: "解析异常" }[s];
}
export function parseStageTone(s: ParseStage): KnowledgeStatusTone {
  return { PENDING: "neutral", PROCESSING: "warning", COMPLETED: "success", ERROR: "danger" }[
    s
  ] as KnowledgeStatusTone;
}

export function publishStageLabel(s: PublishStage) {
  return { PENDING: "待发布", PUBLISHED: "已发布", DISABLED: "已停用" }[s];
}
export function publishStageTone(s: PublishStage): KnowledgeStatusTone {
  return { PENDING: "neutral", PUBLISHED: "success", DISABLED: "neutral" }[
    s
  ] as KnowledgeStatusTone;
}

export function stageLabel(s: CurrentStage) {
  return { REVIEW: "审核阶段", PARSE: "解析阶段", PUBLISH: "发布阶段" }[s];
}

/** 「全部上传」文件状态：反映审核结果（待审核 / 已通过 / 已驳回），发布启停归入启用状态列 */
export function fileStatusOf(record: UploadRecord): {
  label: string;
  tone: KnowledgeStatusTone;
} {
  const review = getReviewStatus(record);
  if (review === "PENDING") return { label: "待审核", tone: "warning" };
  if (review === "REJECTED") return { label: "已驳回", tone: "danger" };
  return { label: "已通过", tone: "success" };
}

/** 只读启用状态：已进入发布阶段的文件区分「启用 / 停用」，其余阶段视为未生效 */
export function enabledStateOf(record: UploadRecord): {
  label: string;
  tone: KnowledgeStatusTone;
} {
  const publish = getPublishStage(record);
  if (publish === "PUBLISHED") return { label: "启用", tone: "success" };
  if (publish === "DISABLED") return { label: "停用", tone: "neutral" };
  return { label: "未生效", tone: "neutral" };
}

/** 「全部上传」当前状态：取当前阶段对应维度的细粒度状态 */
export function currentStatusOf(record: UploadRecord): {
  label: string;
  tone: KnowledgeStatusTone;
} {
  const stage = getCurrentStage(record);
  if (stage === "REVIEW") {
    const s = getReviewStatus(record);
    return { label: reviewStatusLabel(s), tone: reviewStatusTone(s) };
  }
  if (stage === "PARSE") {
    const s = getParseStage(record);
    return { label: parseStageLabel(s), tone: parseStageTone(s) };
  }
  const s = getPublishStage(record);
  return { label: publishStageLabel(s), tone: publishStageTone(s) };
}

/* ─────────────────────────────────────────────
 * 计数（左侧徽标、概览卡片、待我处理，统一口径）
 * ───────────────────────────────────────────── */

export interface UploadCounts {
  all: number;
  /** 审核进度徽标：待审核 + 审核驳回 */
  reviewPending: number;
  /** 解析进度徽标：待解析 + 解析中 + 解析异常（仅已通过审核） */
  parsePending: number;
  /** 发布状态徽标：待发布 + 已停用 */
  publishPending: number;
  /** 概览卡片 */
  reviewInProgress: number; // 审核进行中（待审核）
  parseInProgress: number; // 解析进行中（解析中）
  published: number; // 已发布
  /** 待我处理 */
  needRejected: number;
  needParseError: number;
  needDisabled: number;
}

export function getUploadCounts(records: UploadRecord[]): UploadCounts {
  const counts: UploadCounts = {
    all: records.length,
    reviewPending: 0,
    parsePending: 0,
    publishPending: 0,
    reviewInProgress: 0,
    parseInProgress: 0,
    published: 0,
    needRejected: 0,
    needParseError: 0,
    needDisabled: 0,
  };
  for (const r of records) {
    const review = getReviewStatus(r);
    const parse = getParseStage(r);
    const publish = getPublishStage(r);

    if (review === "PENDING" || review === "REJECTED") counts.reviewPending += 1;
    if (review === "APPROVED" && (parse === "PENDING" || parse === "PROCESSING" || parse === "ERROR"))
      counts.parsePending += 1;
    if (publish === "PENDING" && getCurrentStage(r) === "PUBLISH") counts.publishPending += 1;
    if (publish === "DISABLED") counts.publishPending += 1;

    if (review === "PENDING") counts.reviewInProgress += 1;
    if (review === "APPROVED" && parse === "PROCESSING") counts.parseInProgress += 1;
    if (publish === "PUBLISHED") counts.published += 1;

    if (review === "REJECTED") counts.needRejected += 1;
    if (parse === "ERROR") counts.needParseError += 1;
    if (publish === "DISABLED") counts.needDisabled += 1;
  }
  return counts;
}

/* ─────────────────────────────────────────────
 * 各视图筛选配置
 * ───────────────────────────────────────────── */

export interface FilterOption {
  value: string;
  label: string;
}

/** 视图内「状态/阶段」下拉选项 */
export function getViewStatusOptions(view: UploadView): FilterOption[] {
  switch (view) {
    case "all":
      return [
        { value: "all", label: "全部阶段" },
        { value: "REVIEW", label: "审核阶段" },
        { value: "PARSE", label: "解析阶段" },
        { value: "PUBLISH", label: "发布阶段" },
      ];
    case "review":
      return [
        { value: "all", label: "全部审核" },
        { value: "PENDING", label: "待审核" },
        { value: "APPROVED", label: "审核通过" },
        { value: "REJECTED", label: "审核驳回" },
      ];
    case "parse":
      return [
        { value: "all", label: "全部解析" },
        { value: "PENDING", label: "待解析" },
        { value: "PROCESSING", label: "解析中" },
        { value: "COMPLETED", label: "解析完成" },
        { value: "ERROR", label: "解析异常" },
      ];
    case "publish":
      return [
        { value: "all", label: "全部状态" },
        { value: "PUBLISHED", label: "已发布" },
        { value: "DISABLED", label: "已停用" },
      ];
  }
}

export function getViewStatusFilterLabel(view: UploadView) {
  return { all: "阶段", review: "审核", parse: "解析", publish: "发布" }[view];
}

/** 判断记录是否命中当前视图的「状态/阶段」筛选值 */
export function matchViewStatus(view: UploadView, record: UploadRecord, value: string) {
  if (value === "all") return true;
  switch (view) {
    case "all":
      return getCurrentStage(record) === value;
    case "review":
      return getReviewStatus(record) === value;
    case "parse":
      return getParseStage(record) === value;
    case "publish":
      return getPublishStage(record) === value;
  }
}

/** 视图归属：哪些记录应出现在该视图列表中 */
export function belongsToView(view: UploadView, record: UploadRecord) {
  switch (view) {
    case "all":
      return true;
    case "review":
      // 审核维度有意义（所有记录都经历过审核）
      return true;
    case "parse":
      // 先解析后审批：非驳回记录均可展示解析进度
      return getReviewStatus(record) !== "REJECTED";
    case "publish":
      // 已发布 / 已停用 / 待发布
      return getCurrentStage(record) === "PUBLISH";
  }
}

/* ─────────────────────────────────────────────
 * 视图元信息（标题 / 说明 / 空态 / 结果计量词）
 * ───────────────────────────────────────────── */

export interface ViewMeta {
  navLabel: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDesc: string;
  countUnit: string; // 「共 N 条XX记录」
}

export const UPLOAD_VIEW_META: Record<UploadView, ViewMeta> = {
  all: {
    navLabel: "全部上传",
    title: "全部上传",
    // description: "查看本人上传文件当前所处的审核、解析与发布阶段",
        description: "",
    emptyTitle: "暂无上传文件",
    emptyDesc: "上传文件后，可在这里跟踪审核、解析和发布进度",
    countUnit: "上传记录",
  },
  review: {
    navLabel: "审核进度",
    title: "审核进度",
    // description: "查看文件审核状态、审批记录和驳回原因",
        description: "",
    emptyTitle: "暂无审核记录",
    emptyDesc: "提交到公共知识库的文件将在这里展示审核进度",
    countUnit: "审核记录",
  },
  parse: {
    navLabel: "解析进度",
    title: "解析进度",
    // description: "跟踪文件解析过程，查看解析结果与异常原因",
        description: "",
    emptyTitle: "暂无解析记录",
    emptyDesc: "文件上传后将先进入解析，解析完成后进入审批",
    countUnit: "解析记录",
  },
  publish: {
    navLabel: "发布状态",
    title: "发布状态",
    // description: "查看文件进入目标知识库后的发布与使用情况",
        description: "",
    emptyTitle: "暂无已发布文件",
    emptyDesc: "文件解析并发布后，将在这里展示使用状态",
    countUnit: "发布记录",
  },
};

/* ─────────────────────────────────────────────
 * 动态操作（普通上传人视角，按 视图 × 处境 生成）
 * ───────────────────────────────────────────── */

export type UploadActionKind =
  | "withdraw"
  | "resubmit"
  | "reason"
  | "preview"
  | "detail"
  | "submitDetail"
  | "download"
  | "delete"
  | "progress"
  | "terminate"
  | "startParse"
  | "reparse"
  | "replace"
  | "parseResult"
  | "chunks"
  | "approveRecord"
  | "gotoBase"
  | "history"
  | "newVersion"
  | "takedown"
  | "restore";

export interface UploadActionItem {
  kind: UploadActionKind;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
}

// 复用的原子操作（标签尽量四字）
const A = {
  withdraw: { kind: "withdraw", label: "撤回申请", icon: RotateCcw } as UploadActionItem,
  preview: { kind: "preview", label: "预览文件", icon: Eye } as UploadActionItem,
  viewFile: { kind: "preview", label: "查看文件", icon: Eye } as UploadActionItem,
  submitDetail: { kind: "submitDetail", label: "提交详情", icon: Info } as UploadActionItem,
  detail: { kind: "detail", label: "查看详情", icon: Info } as UploadActionItem,
  rejectReason: { kind: "reason", label: "驳回原因", icon: Info } as UploadActionItem,
  errorReason: { kind: "reason", label: "异常原因", icon: Info } as UploadActionItem,
  delete: { kind: "delete", label: "删除记录", icon: Trash2, danger: true } as UploadActionItem,
  progress: { kind: "progress", label: "解析进度", icon: RefreshCw } as UploadActionItem,
  terminate: { kind: "terminate", label: "终止解析", icon: Square } as UploadActionItem,
  startParse: { kind: "startParse", label: "开始解析", icon: RefreshCw } as UploadActionItem,
  reparse: { kind: "reparse", label: "重新解析", icon: RotateCcw } as UploadActionItem,
  parseResult: { kind: "parseResult", label: "解析结果", icon: FileStack } as UploadActionItem,
  chunks: { kind: "chunks", label: "分块内容", icon: ListTree } as UploadActionItem,
  approveRecord: { kind: "approveRecord", label: "审批记录", icon: ShieldCheck } as UploadActionItem,
  gotoBase: { kind: "gotoBase", label: "进入知识库", icon: ArrowRight } as UploadActionItem,
  history: { kind: "history", label: "版本记录", icon: History } as UploadActionItem,
  newVersion: { kind: "newVersion", label: "上传新版", icon: ArrowUpFromLine } as UploadActionItem,
  takedown: { kind: "takedown", label: "申请下架", icon: Ban, danger: true } as UploadActionItem,
  restore: { kind: "restore", label: "申请恢复", icon: RotateCcw } as UploadActionItem,
} as const;

function mark(items: UploadActionItem[]): UploadActionItem[] {
  // 第一个为主操作，最后一个危险操作前加分隔线
  return items.map((it, i) => {
    const next: UploadActionItem = { ...it, primary: i === 0 };
    if (it.danger && i > 0) next.separatorBefore = true;
    return next;
  });
}

export function getTrackingActions(view: UploadView, record: UploadRecord): UploadActionItem[] {
  const situation = getSituation(record);

  if (view === "review") {
    switch (getReviewStatus(record)) {
      case "PENDING":
        return mark([A.withdraw]);
      case "REJECTED":
        return mark([A.rejectReason]);
      default:
        return mark([A.viewFile]);
    }
  }

  if (view === "parse") {
    switch (getParseStage(record)) {
      case "PENDING":
        return mark([A.startParse]);
      case "PROCESSING":
        return mark([A.progress, A.terminate]);
      case "COMPLETED":
        return mark([A.chunks, A.reparse]);
      case "ERROR":
        return mark([A.errorReason, A.reparse]);
    }
  }

  if (view === "publish") {
    switch (getPublishStage(record)) {
      case "PUBLISHED":
        // 暂时仅保留「查看文件」；新版本 / 版本记录先隐藏，进入知识库、申请下架无此功能
        return mark([A.viewFile /*, A.history, A.newVersion */]);
      case "DISABLED":
        // 停用文件仅可查看，暂无申请恢复 / 上传新版 / 版本记录
        return mark([A.viewFile]);
      default:
        return mark([A.parseResult, A.detail]);
    }
  }

  // view === "all"：按处境给出当前阶段最重要操作
  switch (situation) {
    case "reviewPending":
      return mark([A.withdraw, A.preview]);
    case "reviewRejected":
      return mark([A.rejectReason, A.preview]);
    case "parseWaiting":
      return mark([A.startParse]);
    case "parseProcessing":
      return mark([A.progress, A.terminate]);
    case "parseCompleted":
      return mark([A.chunks, A.reparse]);
    case "parseError":
      return mark([A.errorReason, A.reparse]);
    case "published":
      // 暂时仅保留「查看文件」；新版本 / 版本记录先隐藏，进入知识库、申请下架无此功能
      return mark([A.viewFile /*, A.history, A.newVersion */]);
    case "disabled":
      // 停用文件仅可查看，暂无申请恢复 / 上传新版 / 版本记录
      return mark([A.viewFile]);
  }
}
