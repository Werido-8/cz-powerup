/** 员工从资料学习页解析、编辑并提交审核的题目贡献 */

export type ContributionStatus = "草稿" | "待审核" | "已退回" | "已入库";

export type ContributionAuditAction =
  | "AI 解析生成"
  | "提交审核"
  | "驳回"
  | "重新提交"
  | "审核通过";

export interface ContributionAuditRecord {
  id: string;
  action: ContributionAuditAction;
  operator: string;
  time: string;
  comment?: string;
  statusAfter: ContributionStatus;
}

export interface QuestionContribution {
  id: string;
  docId: string;
  stem: string;
  type: "单选题" | "多选题" | "判断题" | "简答题";
  knowledgePoints: string[];
  status: ContributionStatus;
  submittedAt?: string;
  updatedAt: string;
  options?: { key: string; text: string }[];
  answer?: string;
  analysis?: string;
  rejectComment?: string;
}

export const QUESTION_CONTRIBUTIONS: QuestionContribution[] = [
  {
    id: "mc-d1-1",
    docId: "d1",
    stem: "AGC 投入运行后,机组实际出力与调度指令偏差持续超过 ±3% 时,应优先采取下列哪项处理?",
    type: "单选题",
    knowledgePoints: ["AGC", "两细则"],
    status: "待审核",
    submittedAt: "2026-07-01 09:20",
    updatedAt: "2026-07-01 09:20",
    options: [
      { key: "A", text: "立即手动调整出力,使其匹配调度指令" },
      { key: "B", text: "检查 AGC 控制器状态,确认是否退出 AGC 控制" },
      { key: "C", text: "等待 AGC 自动调整恢复" },
      { key: "D", text: "立即通知运行值长后再处理" },
    ],
    answer: "B",
    analysis: "持续偏差超过 ±3% 应优先确认 AGC 控制器状态,必要时退出 AGC 改手动。",
  },
  {
    id: "mc-d2-1",
    docId: "d2",
    stem: "500kV 主变停役前,下列哪项核对不属于必须项?",
    type: "单选题",
    knowledgePoints: ["主变停役", "典型操作"],
    status: "已退回",
    submittedAt: "2026-06-28 14:10",
    updatedAt: "2026-06-28 16:45",
    rejectComment: "题干表述有歧义,「不属于必须项」与资料原文考点不一致,请改为正向提问并核对选项依据。",
    options: [
      { key: "A", text: "负荷转移情况" },
      { key: "B", text: "保护连接片位置" },
      { key: "C", text: "厂用电切换方案" },
      { key: "D", text: "调度命令与操作票一致性" },
    ],
    answer: "C",
    analysis: "停役前核对项以规程第 1 章为准,厂用电切换属于后续步骤而非停役前必须核对项。",
  },
  {
    id: "mc-d6-1",
    docId: "d6",
    stem: "下列关于 AGC 控制器死区设置的说法,正确的有哪些?",
    type: "多选题",
    knowledgePoints: ["AGC", "死区"],
    status: "已退回",
    submittedAt: "2026-06-29 11:30",
    updatedAt: "2026-06-30 09:15",
    rejectComment: "选项 B 表述存在歧义,需重写;解析需补充资料页码依据。",
    options: [
      { key: "A", text: "死区建议设置 ≤1MW" },
      { key: "B", text: "死区越大越有利于考核" },
      { key: "C", text: "变更前须经调度同意" },
      { key: "D", text: "死区与速率限制无关" },
    ],
    answer: "A,C",
    analysis: "资料第 1 节明确死区推荐 ≤1MW,参数变更须经调度同意。",
  },
  {
    id: "mc-d1-2",
    docId: "d1",
    stem: "两细则中 AGC 考核的三项核心指标不包括下列哪一项?",
    type: "单选题",
    knowledgePoints: ["AGC", "两细则"],
    status: "已入库",
    submittedAt: "2026-06-15 10:00",
    updatedAt: "2026-06-18 15:20",
    options: [
      { key: "A", text: "调节速率" },
      { key: "B", text: "调节精度" },
      { key: "C", text: "响应时间" },
      { key: "D", text: "无功补偿容量" },
    ],
    answer: "D",
    analysis: "AGC 考核三项指标为调节速率、调节精度、响应时间。",
  },
  {
    id: "mc-d2-draft",
    docId: "d2",
    stem: "主变停役操作中,拉开刀闸前应确认哪些条件?(草稿)",
    type: "简答题",
    knowledgePoints: ["主变停役"],
    status: "草稿",
    updatedAt: "2026-07-02 16:00",
    analysis: "应确认断路器已断开、无负荷、保护已退出等。",
  },
];

export const CONTRIBUTION_AUDIT_LOGS: Record<string, ContributionAuditRecord[]> = {
  "mc-d1-1": [
    { id: "ca-1", action: "AI 解析生成", operator: "系统", time: "2026-07-01 09:05", statusAfter: "草稿" },
    { id: "ca-2", action: "提交审核", operator: "当前用户", time: "2026-07-01 09:20", statusAfter: "待审核" },
  ],
  "mc-d2-1": [
    { id: "ca-3", action: "AI 解析生成", operator: "系统", time: "2026-06-28 13:50", statusAfter: "草稿" },
    { id: "ca-4", action: "提交审核", operator: "当前用户", time: "2026-06-28 14:10", statusAfter: "待审核" },
    {
      id: "ca-5",
      action: "驳回",
      operator: "王审核",
      time: "2026-06-28 16:45",
      comment: "题干表述有歧义,「不属于必须项」与资料原文考点不一致,请改为正向提问并核对选项依据。",
      statusAfter: "已退回",
    },
  ],
  "mc-d6-1": [
    { id: "ca-6", action: "AI 解析生成", operator: "系统", time: "2026-06-29 11:10", statusAfter: "草稿" },
    { id: "ca-7", action: "提交审核", operator: "当前用户", time: "2026-06-29 11:30", statusAfter: "待审核" },
    {
      id: "ca-8",
      action: "驳回",
      operator: "王审核",
      time: "2026-06-30 09:15",
      comment: "选项 B 表述存在歧义,需重写;解析需补充资料页码依据。",
      statusAfter: "已退回",
    },
  ],
  "mc-d1-2": [
    { id: "ca-9", action: "提交审核", operator: "当前用户", time: "2026-06-15 10:00", statusAfter: "待审核" },
    { id: "ca-10", action: "审核通过", operator: "王审核", time: "2026-06-18 15:20", statusAfter: "已入库" },
  ],
  "mc-d2-draft": [
    { id: "ca-11", action: "AI 解析生成", operator: "系统", time: "2026-07-02 16:00", statusAfter: "草稿" },
  ],
};

export function getContributionsByDoc(docId: string): QuestionContribution[] {
  return QUESTION_CONTRIBUTIONS.filter((c) => c.docId === docId);
}

export function getReturnedContributionCount(): number {
  return QUESTION_CONTRIBUTIONS.filter((c) => c.status === "已退回").length;
}

export function getReturnedCountByDoc(docId: string): number {
  return QUESTION_CONTRIBUTIONS.filter((c) => c.docId === docId && c.status === "已退回").length;
}

export function getDocIdsWithReturnedContributions(): string[] {
  return [...new Set(QUESTION_CONTRIBUTIONS.filter((c) => c.status === "已退回").map((c) => c.docId))];
}

export const CONTRIBUTION_STATUS_LABEL: Record<ContributionStatus, string> = {
  草稿: "草稿",
  待审核: "待审核",
  已退回: "已退回",
  已入库: "已入库",
};

export const CONTRIBUTION_STATUS_STYLE: Record<ContributionStatus, string> = {
  草稿: "bg-muted text-muted-foreground",
  待审核: "bg-primary-soft text-primary",
  已退回: "bg-destructive/10 text-destructive",
  已入库: "bg-success-soft text-success",
};
