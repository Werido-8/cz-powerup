import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardCheck,
  Library,
  FileText,
  Search,
  Sparkles,
  Plus,
  Send,
  Eye,
  Pencil,
  Wand2,
  Copy,
  Ban,
  GitMerge,
  CheckCircle2,
  FileSearch,
  Users,
  History,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Save,
  Layers,
  ShieldCheck,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  Power,
  PlusCircle,
  ListChecks,
  Clock,
  TrendingUp,
  Folder,
  Zap,
  SlidersHorizontal,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { ExamPaperEditor, type ExamPaperEditorMode } from "@/components/exam/exam-paper-editor";
import { PageHeader, StatCard, ModuleTabs, ModulePanel, TableListPager, TABLE_PAGE_SIZE_DEFAULT, PillSelect } from "@/components/learning/ui";
import { StemCell } from "@/components/common/ellipsis-tooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  EXAM_STATS,
  REVIEW_QUESTIONS,
  BANK_QUESTIONS,
  PAPERS,
  ANSWER_DETAIL,
  PERSONNEL,
  BANK_CATEGORIES,
  SWAP_CANDIDATES,
  PAPER_PREVIEW,
  OPTIMIZE,
  PERSON_AGGREGATES,
  RECORD_STATUS_OPTIONS,
  TEAM_OPTIONS,
  HISTORY_OPTIONS,
  BANK_DETAILS,
  DISABLE_REASONS,
  REWRITE_GOALS,
  REWRITE_DIAGS,
  REWRITE_CANDIDATES,
  SIMILAR_QUESTIONS,
  BANK_USAGE,
  DRAFT_PAPERS,
  REVIEW_DETAILS,
  REVIEW_SIMILAR,
  REVIEW_AUDIT_LOGS,
  aggregateStats,
  type Difficulty,
  type Paper,
  type ExamGoal,
  type QuestionType,
  type AssignRecord,
  type PersonAggregate,
  type PersonExamRecord,
  type RecordStatus,
  type BankQuestion,
  type RewriteCandidate,
} from "@/lib/mock/examAdmin";
function diffClass(d: Difficulty) {
  return d === "易"
    ? "bg-success-soft text-success"
    : d === "中"
      ? "bg-warning-soft text-warning-foreground"
      : "bg-destructive/10 text-destructive";
}

function riskClass(r: string) {
  return r === "高"
    ? "bg-destructive/10 text-destructive"
    : r === "中"
      ? "bg-warning-soft text-warning-foreground"
      : r === "低"
        ? "bg-primary-soft text-primary"
        : "bg-muted text-muted-foreground";
}

const EXAM_STAT_ICONS: Record<string, React.ReactNode> = {
  pending: <ClipboardCheck className="h-[18px] w-[18px]" />,
  bank: <Library className="h-[18px] w-[18px]" />,
  issued: <FileText className="h-[18px] w-[18px]" />,
  finish: <ListChecks className="h-[18px] w-[18px]" />,
  correct: <TrendingUp className="h-[18px] w-[18px]" />,
  time: <Clock className="h-[18px] w-[18px]" />,
};

function StatCards() {
  return (
    <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {EXAM_STATS.map((s, i) => (
        <StatCard
          key={s.key}
          label={s.label}
          value={s.value}
          hint={s.hint}
          icon={EXAM_STAT_ICONS[s.key]}
          tint={i}
          emphasis={s.tone === "warning" ? "remind" : s.tone === "success" ? "default" : "primary"}
        />
      ))}
    </section>
  );
}

// ---------- Generic table primitives ----------
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

function ThWithTip({
  label,
  tip,
  className = "",
}: {
  label: string;
  tip: string;
  className?: string;
}) {
  return (
    <Th className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help items-center gap-1">
            {label}
            <HelpCircle className="h-3 w-3 shrink-0 opacity-45" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-left font-normal leading-relaxed">
          {tip}
        </TooltipContent>
      </Tooltip>
    </Th>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  variant = "ghost",
  disabled = false,
}: {
  icon: typeof Eye;
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger" | "primary";
  variant?: "ghost" | "text";
  disabled?: boolean;
}) {
  const cls =
    variant === "text"
      ? tone === "danger"
        ? "text-destructive hover:text-destructive/80"
        : tone === "primary"
          ? "text-primary hover:text-primary/80"
          : "text-muted-foreground hover:text-primary"
      : tone === "danger"
        ? "text-destructive hover:bg-destructive/10"
        : tone === "primary"
          ? "text-primary hover:bg-primary-soft"
          : "text-muted-foreground hover:bg-muted hover:text-foreground";
  const base =
    variant === "text"
      ? "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-1 py-0.5 text-[12px] font-medium transition-colors"
      : "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[12px] transition-colors";
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${cls} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  if (!disabled) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{button}</span>
      </TooltipTrigger>
      <TooltipContent side="top">暂无审核记录</TooltipContent>
    </Tooltip>
  );
}

// ---------- Review module ----------
type ReviewItem = (typeof REVIEW_QUESTIONS)[number];

function ReviewStatusBadge({ status }: { status: ReviewItem["status"] }) {
  const cls =
    status === "待审核"
      ? "bg-warning-soft text-warning-foreground"
      : status === "已入库"
        ? "bg-success-soft text-success"
        : status === "已合并"
          ? "bg-primary-soft text-primary"
          : status === "已退回"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground";
  return <span className={`rounded-md px-2 py-0.5 text-[11px] ${cls}`}>{status}</span>;
}

export function ReviewModule() {
  const [rows, setRows] = useState<ReviewItem[]>(REVIEW_QUESTIONS);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [evidenceOf, setEvidenceOf] = useState<ReviewItem | null>(null);
  const [auditOf, setAuditOf] = useState<ReviewItem | null>(null);
  const [editOf, setEditOf] = useState<ReviewItem | null>(null);
  const [deleteOf, setDeleteOf] = useState<ReviewItem | null>(null);
  const [mergeOf, setMergeOf] = useState<ReviewItem | null>(null);

  const [batchApproveOpen, setBatchApproveOpen] = useState(false);
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const updateStatus = (ids: string[], status: ReviewItem["status"]) => {
    setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
    setSelected(new Set());
  };

  const removeRows = (ids: string[]) => {
    setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
    setSelected(new Set());
  };

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const allChecked = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));

  const selectedRows = rows.filter((r) => selected.has(r.id));
  const highRiskCount = selectedRows.filter((r) => r.similarRisk === "高").length;

  return (
    <div>
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-[12.5px] text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        AI 生成或人工录入题目需审核后进入正式题库。所有操作均需人工确认,不会自动入库。
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 py-2">
        <div className="text-[12.5px] text-muted-foreground">
          已选 <span className="font-semibold text-foreground">{selected.size}</span> / {rows.length} 道
          {highRiskCount > 0 && (
            <span className="ml-2 rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
              含 {highRiskCount} 道高相似风险
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            disabled={selected.size === 0}
            onClick={() => setBatchApproveOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] disabled:opacity-40 hover:bg-muted"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> 批量通过
          </button>
          <button
            disabled={selected.size === 0}
            onClick={() => setBatchRejectOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] text-destructive disabled:opacity-40 hover:bg-destructive/10"
          >
            <XCircle className="h-3.5 w-3.5" /> 批量驳回
          </button>
          <button
            disabled={selected.size === 0}
            onClick={() => setBatchDeleteOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] text-destructive disabled:opacity-40 hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> 批量删除
          </button>
          {/* <button
            disabled={selected.size === 0}
            onClick={() => toast.info(`已对 ${selected.size} 道题进行查重`)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] disabled:opacity-40 hover:bg-muted"
          >
            <GitMerge className="h-3.5 w-3.5" /> 批量查重
          </button> */}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-[13px]">
          <thead className="bg-muted/40 text-[12px] text-muted-foreground">
            <tr>
              <Th className="w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 cursor-pointer accent-primary"
                />
              </Th>
              <Th className="min-w-[280px]">题干</Th>
              <Th>题型</Th>
              <Th>知识点</Th>
              <Th>难度</Th>
              <Th>来源资料</Th>
              {/* <Th>相似题风险</Th> */}
              <Th>审核状态</Th>
              <Th className="text-right">操作</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => {
              const done = q.status === "已入库" || q.status === "已合并" || q.status === "已退回";
              const auditLogs = REVIEW_AUDIT_LOGS[q.id] ?? [];
              const hasAuditHistory = auditLogs.length > 0;
              return (
                <tr key={q.id} className="border-t border-border align-top">
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.has(q.id)}
                      onChange={() => toggle(q.id)}
                      className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    />
                  </Td>
                  <StemCell text={q.stem} />
                  <Td className="whitespace-nowrap text-muted-foreground">{q.type}</Td>
                  <Td className="whitespace-nowrap">
                    <Badge variant="secondary" className="font-normal">{q.knowledge}</Badge>
                  </Td>
                  <Td>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] ${diffClass(q.difficulty)}`}>{q.difficulty}</span>
                  </Td>
                  <Td className="max-w-[160px] text-[12px] text-muted-foreground">{q.source}</Td>
                  {/* <Td>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] ${riskClass(q.similarRisk)}`}>{q.similarRisk}</span>
                  </Td> */}
                  <Td><ReviewStatusBadge status={q.status} /></Td>
                  <Td>
                    <div className="flex flex-wrap justify-end gap-0.5">
                      <ActionBtn icon={FileSearch} label="查看依据" onClick={() => setEvidenceOf(q)} />
                      <ActionBtn
                        icon={History}
                        label="审核记录"
                        disabled={!hasAuditHistory}
                        onClick={() => setAuditOf(q)}
                      />
                      {!done && (
                        <>
                          <ActionBtn icon={ClipboardCheck} label="审核" tone="primary" onClick={() => setEditOf(q)} />
                          <ActionBtn icon={Trash2} label="删除" tone="danger" onClick={() => setDeleteOf(q)} />
                          {/* <ActionBtn icon={GitMerge} label="合并相似题" onClick={() => setMergeOf(q)} /> */}
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EvidenceDrawer
        q={evidenceOf}
        onClose={() => setEvidenceOf(null)}
        onReview={(r) => { setEvidenceOf(null); setEditOf(r); }}
      />
      <AuditRecordDrawer q={auditOf} onClose={() => setAuditOf(null)} />
      <ReviewEditDrawer
        q={editOf}
        onClose={() => setEditOf(null)}
        onSave={() => { setEditOf(null); toast.success("已保存,状态保持待审核"); }}
        onSaveAndApprove={(r) => { updateStatus([r.id], "已入库"); setEditOf(null); toast.success("已保存并通过入库"); }}
        onReject={(r, _comment) => { updateStatus([r.id], "已退回"); setEditOf(null); toast.success("已驳回题目"); }}
      />
      <DeleteDialog
        q={deleteOf}
        onClose={() => setDeleteOf(null)}
        onConfirm={(r) => { removeRows([r.id]); setDeleteOf(null); toast.success("已删除题目"); }}
      />
      <MergeDrawer
        q={mergeOf}
        onClose={() => setMergeOf(null)}
        onDone={(r, mode) => {
          if (mode === "keepBoth") {
            toast.success("已保留两题");
          } else {
            updateStatus([r.id], "已合并");
            toast.success(mode === "keepExisting" ? "已保留已有题,放弃当前题" : mode === "keepCurrent" ? "已保留当前题,禁用相似题" : "已生成合并题");
          }
          setMergeOf(null);
        }}
      />

      <Dialog open={batchApproveOpen} onOpenChange={setBatchApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量通过入库</DialogTitle>
            <DialogDescription>共 {selectedRows.length} 道题将通过入库</DialogDescription>
          </DialogHeader>
          {highRiskCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              所选题目中有 {highRiskCount} 道存在高相似题风险,建议先处理后入库。
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setBatchApproveOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
            <button
              onClick={() => { updateStatus(selectedRows.map((r) => r.id), "已入库"); setBatchApproveOpen(false); toast.success("已批量入库"); }}
              className="rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              仍然入库
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectDialog
        open={batchRejectOpen}
        onClose={() => setBatchRejectOpen(false)}
        title="批量驳回题目"
        description={`共 ${selectedRows.length} 道题将被驳回,请填写驳回意见`}
        onConfirm={() => {
          updateStatus(selectedRows.map((r) => r.id), "已退回");
          setBatchRejectOpen(false);
          toast.success(`已批量驳回 ${selectedRows.length} 道题`);
        }}
      />

      <Dialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量删除题目</DialogTitle>
            <DialogDescription>共 {selectedRows.length} 道题将被永久删除,此操作不可恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setBatchDeleteOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
            <button
              onClick={() => { removeRows(selectedRows.map((r) => r.id)); setBatchDeleteOpen(false); toast.success("已批量删除"); }}
              className="rounded-lg bg-destructive px-3.5 py-2 text-[12.5px] font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewSummary({ q }: { q: ReviewItem }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
      <div className="text-[13.5px] font-medium leading-relaxed">{q.stem}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
        <span>题型: <span className="text-foreground">{q.type}</span></span>
        <span>知识点: <span className="text-foreground">{q.knowledge}</span></span>
        <span>难度: <span className={`rounded px-1.5 py-0.5 text-[10.5px] ${diffClass(q.difficulty)}`}>{q.difficulty}</span></span>
        <span>来源: <span className="text-foreground">{q.source}</span></span>
        <span>状态: <ReviewStatusBadge status={q.status} /></span>
      </div>
    </div>
  );
}

function AuditRecordDrawer({
  q,
  onClose,
}: {
  q: ReviewItem | null;
  onClose: () => void;
}) {
  const logs = q ? (REVIEW_AUDIT_LOGS[q.id] ?? []) : [];

  return (
    <Sheet open={!!q} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {q && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle>审核记录</SheetTitle>
              <SheetDescription>查看该题目的历史审核流转记录</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <ReviewSummary q={q} />

              {logs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
                  暂无审核记录
                </div>
              ) : (
                <ol className="relative space-y-0 border-l border-border pl-4">
                  {logs.map((log, index) => (
                    <li key={log.id} className="relative pb-5 last:pb-0">
                      <span
                        className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary"
                        aria-hidden
                      />
                      <div className="rounded-lg border border-border bg-card px-3.5 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13px] font-medium text-foreground">{log.action}</span>
                          <span className="text-[11.5px] tabular-nums text-muted-foreground">{log.time}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                          <span>操作人: {log.operator}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            状态:
                            <ReviewStatusBadge status={log.statusAfter} />
                          </span>
                        </div>
                        {log.comment && (
                          <div className="mt-2 rounded-md bg-muted/40 px-2.5 py-2 text-[12px] leading-relaxed text-muted-foreground">
                            {log.comment}
                          </div>
                        )}
                      </div>
                      {index < logs.length - 1 && <div className="h-1" aria-hidden />}
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="flex items-center justify-end border-t border-border px-6 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted"
              >
                关闭
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function EvidenceDrawer({
  q,
  onClose,
  onReview,
}: {
  q: ReviewItem | null;
  onClose: () => void;
  onReview: (r: ReviewItem) => void;
}) {
  const d = q ? REVIEW_DETAILS[q.id] : undefined;
  const [openKinds, setOpenKinds] = useState<Set<string>>(new Set(["主依据0"]));
  const toggleKind = (k: string) => {
    setOpenKinds((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };
  return (
    <Sheet open={!!q} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {q && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle>题目依据</SheetTitle>
              <SheetDescription>查看 AI / 人工录入题目的资料来源</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <ReviewSummary q={q} />

              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">题目生成依据</div>
                <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {d?.genReason ?? "—"}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">依据内容</div>
                <div className="space-y-2">
                  {(d?.evidences ?? []).map((e, i) => {
                    const key = e.kind + i;
                    const open = openKinds.has(key);
                    return (
                      <div key={key} className="rounded-lg border border-border bg-card">
                        <button
                          onClick={() => toggleKind(key)}
                          className="flex w-full items-center justify-between px-3 py-2 text-[12.5px]"
                        >
                          <span className="flex items-center gap-2 text-left">
                            <Badge variant="secondary" className="font-normal">{e.kind}</Badge>
                            <span className="font-medium">{e.source}</span>
                            <span className="text-muted-foreground">· {e.location}</span>
                          </span>
                          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                        {open && (
                          <div className="border-t border-border bg-muted/30 px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                            {e.excerpt}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!d?.evidences || d.evidences.length === 0) && (
                    <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">暂无依据资料</div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                该题目由以上资料生成,审核人需确认题干、答案、解析与资料依据一致。
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
              <button onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">关闭</button>
              {(q.status === "待审核") && (
                <button onClick={() => onReview(q)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">
                  <ClipboardCheck className="h-3.5 w-3.5" /> 审核题目
                </button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function parseAnswerKeys(answer: string): string[] {
  const trimmed = answer.trim();
  if (!trimmed) return [];
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (/^[A-Z]{2,}$/.test(trimmed)) {
    return trimmed.split("");
  }
  return [trimmed];
}

function formatAnswerDisplay(keys: string[], type: QuestionType): string {
  if (keys.length === 0) return "";
  if (type === "多选题") {
    return [...keys].sort().join(",");
  }
  return keys[0];
}

type ChoiceOption = { key: string; text: string };

function isChoiceType(type: QuestionType) {
  return type === "单选题" || type === "多选题";
}

function rekeyOptions(options: ChoiceOption[]): ChoiceOption[] {
  return options.map((o, i) => ({ ...o, key: String.fromCharCode(65 + i) }));
}

function defaultChoiceOptions(count = 4): ChoiceOption[] {
  return Array.from({ length: count }, (_, i) => ({
    key: String.fromCharCode(65 + i),
    text: "",
  }));
}

function defaultJudgeOptions(): ChoiceOption[] {
  return [
    { key: "T", text: "正确" },
    { key: "F", text: "错误" },
  ];
}

/** 切换为单选/多选时，统一转为 A/B/C/D… 选项键 */
function normalizeOptionsForChoice(options: ChoiceOption[]): ChoiceOption[] {
  if (options.length === 0) return defaultChoiceOptions();

  const isJudgeLike =
    options.length <= 2 &&
    options.every((o) => o.key === "T" || o.key === "F" || o.key === "A" || o.key === "B");

  if (isJudgeLike && (options.some((o) => o.key === "T" || o.key === "F") || options.length === 2)) {
    const tOpt = options.find((o) => o.key === "T") ?? options[0];
    const fOpt = options.find((o) => o.key === "F") ?? options[1];
    return [
      { key: "A", text: tOpt?.text || "正确" },
      { key: "B", text: fOpt?.text || "错误" },
      { key: "C", text: "" },
      { key: "D", text: "" },
    ];
  }

  return rekeyOptions(options);
}

function migrateSelectedKeysToAbcd(
  oldOptions: ChoiceOption[],
  selectedKeys: string[],
  newOptions: ChoiceOption[],
): string[] {
  const mapped = selectedKeys.flatMap((key) => {
    if (key === "T") return ["A"];
    if (key === "F") return ["B"];
    const idx = oldOptions.findIndex((o) => o.key === key);
    if (idx >= 0 && idx < newOptions.length) return [newOptions[idx].key];
    if (/^[A-Z]$/.test(key) && newOptions.some((o) => o.key === key)) return [key];
    return [];
  });
  return [...new Set(mapped)];
}

function applyQuestionTypeChange(
  prevType: QuestionType,
  nextType: QuestionType,
  options: ChoiceOption[],
  selectedKeys: string[],
): { options: ChoiceOption[]; selectedKeys: string[] } {
  if (isChoiceType(nextType)) {
    const nextOptions = normalizeOptionsForChoice(isChoiceType(prevType) ? rekeyOptions(options) : options);
    let nextKeys = isChoiceType(prevType)
      ? selectedKeys.filter((k) => nextOptions.some((o) => o.key === k))
      : migrateSelectedKeysToAbcd(options, selectedKeys, nextOptions);
    if (nextType === "单选题" && nextKeys.length > 1) {
      nextKeys = nextKeys.slice(0, 1);
    }
    return { options: nextOptions, selectedKeys: nextKeys };
  }
  if (nextType === "判断题") {
    return { options: defaultJudgeOptions(), selectedKeys: [] };
  }
  return { options, selectedKeys };
}

function createAddOption(options: ChoiceOption[]) {
  if (options.length >= 26) return options;
  const nextKey = String.fromCharCode(65 + options.length);
  return [...options, { key: nextKey, text: "" }];
}

function createRemoveOption(options: ChoiceOption[], removeKey: string, selectedKeys: string[]) {
  if (options.length <= 2) return { options, selectedKeys };
  const removedIndex = options.findIndex((o) => o.key === removeKey);
  const filtered = options.filter((o) => o.key !== removeKey);
  const rekeyed = rekeyOptions(filtered);
  const nextKeys = selectedKeys
    .filter((key) => key !== removeKey)
    .map((key) => {
      const oldIndex = options.findIndex((o) => o.key === key);
      if (oldIndex < 0) return key;
      if (oldIndex > removedIndex) return String.fromCharCode(65 + oldIndex - 1);
      return String.fromCharCode(65 + oldIndex);
    })
    .filter((key) => rekeyed.some((o) => o.key === key));
  return { options: rekeyed, selectedKeys: nextKeys };
}

function BankField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function ChoiceOptionsEditor({
  type,
  options,
  selectedKeys,
  onOptionsChange,
  onSelectedKeysChange,
  onAddOption,
  onRemoveOption,
}: {
  type: "单选题" | "多选题";
  options: { key: string; text: string }[];
  selectedKeys: string[];
  onOptionsChange: (options: ChoiceOption[]) => void;
  onSelectedKeysChange: (keys: string[]) => void;
  onAddOption: () => void;
  onRemoveOption: (key: string) => void;
}) {
  const isSingle = type === "单选题";
  const answerDisplay = formatAnswerDisplay(selectedKeys, type);

  const toggleKey = (key: string) => {
    if (isSingle) {
      onSelectedKeysChange([key]);
      return;
    }
    onSelectedKeysChange(
      selectedKeys.includes(key) ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key],
    );
  };

  return (
    <>
      <BankField label="选项">
        <div className="space-y-2">
          {options.map((o) => (
            <div key={o.key} className="flex items-center gap-2">
              <input
                type={isSingle ? "radio" : "checkbox"}
                name="choice-answer"
                checked={selectedKeys.includes(o.key)}
                onChange={() => toggleKey(o.key)}
                className="h-3.5 w-3.5 shrink-0 accent-primary"
              />
              <span className="w-5 shrink-0 text-center text-[12px] font-medium text-muted-foreground">{o.key}</span>
              <Input
                value={o.text}
                onChange={(e) =>
                  onOptionsChange(options.map((x) => (x.key === o.key ? { ...x, text: e.target.value } : x)))
                }
                className="text-[13px]"
              />
              <button
                type="button"
                onClick={() => onRemoveOption(o.key)}
                disabled={options.length <= 2}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                title="删除选项"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddOption}
            disabled={options.length >= 26}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-primary/40 bg-primary/5 py-2 text-[12px] font-medium text-primary hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-40"
          >
            <PlusCircle className="h-3.5 w-3.5" /> 新增选项
          </button>
        </div>
      </BankField>
      <BankField label="正确答案">
        <Input
          readOnly
          value={answerDisplay}
          placeholder={isSingle ? "请在上方选择正确选项" : "请在上方勾选正确选项"}
          className="cursor-default bg-muted/40 text-[13px]"
        />
      </BankField>
    </>
  );
}

function JudgeOptionsEditor({
  options,
  selectedKeys,
  onSelect,
}: {
  options: { key: string; text: string }[];
  selectedKeys: string[];
  onSelect: (key: string) => void;
}) {
  const answerDisplay = selectedKeys[0] ?? "";

  return (
    <>
      <BankField label="选项">
        <div className="space-y-2">
          {options.map((o) => (
            <div key={o.key} className="flex items-center gap-2">
              <input
                type="radio"
                name="judge-answer"
                checked={selectedKeys.includes(o.key)}
                onChange={() => onSelect(o.key)}
                className="h-3.5 w-3.5 shrink-0 accent-primary"
              />
              <span className="w-5 shrink-0 text-center text-[12px] font-medium text-muted-foreground">{o.key}</span>
              <Input readOnly value={o.text} className="cursor-default bg-muted/30 text-[13px]" />
            </div>
          ))}
        </div>
      </BankField>
      <BankField label="正确答案">
        <Input readOnly value={answerDisplay} className="cursor-default bg-muted/40 text-[13px]" />
      </BankField>
    </>
  );
}

function ReviewEditDrawer({
  q,
  onClose,
  onSave,
  onSaveAndApprove,
  onReject,
}: {
  q: ReviewItem | null;
  onClose: () => void;
  onSave: (r: ReviewItem) => void;
  onSaveAndApprove: (r: ReviewItem) => void;
  onReject: (r: ReviewItem, comment: string) => void;
}) {
  const [type, setType] = useState<QuestionType>(q?.type ?? "单选题");
  const [stem, setStem] = useState(q?.stem ?? "");
  const [opened, setOpened] = useState<string | null>(null);
  const [options, setOptions] = useState<{ key: string; text: string }[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  if (q && q.id !== opened) {
    setOpened(q.id);
    setType(q.type);
    setStem(q.stem);
    const detail = REVIEW_DETAILS[q.id];
    const ans = detail?.answer ?? "";
    if (q.type === "单选题" || q.type === "多选题") {
      const rawOptions = detail?.options ?? [];
      const normalized = normalizeOptionsForChoice(rawOptions);
      setOptions(normalized);
      setSelectedKeys(migrateSelectedKeysToAbcd(rawOptions, parseAnswerKeys(ans), normalized));
      setTextAnswer("");
    } else if (q.type === "判断题") {
      setOptions(detail?.options ?? []);
      setSelectedKeys(parseAnswerKeys(ans));
      setTextAnswer("");
    } else {
      setOptions([]);
      setSelectedKeys([]);
      setTextAnswer(ans);
    }
  }
  const d = q ? REVIEW_DETAILS[q.id] : undefined;

  const addOption = () => setOptions((prev) => createAddOption(prev));
  const removeOption = (k: string) => {
    setOptions((prev) => {
      const result = createRemoveOption(prev, k, selectedKeys);
      setSelectedKeys(result.selectedKeys);
      return result.options;
    });
  };

  const handleTypeChange = (next: QuestionType) => {
    const { options: nextOptions, selectedKeys: nextKeys } = applyQuestionTypeChange(
      type,
      next,
      options,
      selectedKeys,
    );
    setOptions(nextOptions);
    setSelectedKeys(nextKeys);
    setType(next);
    if (next === "判断题" || isChoiceType(next)) {
      setTextAnswer("");
    }
  };

  const isChoice = isChoiceType(type);
  const isJudge = type === "判断题";
  const isLong = type === "简答题" || type === "案例分析题";

  return (
    <Sheet open={!!q} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        {q && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle>题目审核</SheetTitle>
              <SheetDescription>编辑题目内容,可保存、通过入库或驳回</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <BankField label="题干">
                <Textarea value={stem} onChange={(e) => setStem(e.target.value)} rows={3} className="text-[13px]" />
              </BankField>
              <div className="grid grid-cols-2 gap-3">
                <BankField label="题型">
                  <Select value={type} onValueChange={(v) => handleTypeChange(v as QuestionType)}>
                    <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </BankField>
                <BankField label="难度">
                  <Select defaultValue={q.difficulty}>
                    <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </BankField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <BankField label="知识点"><Input defaultValue={q.knowledge} className="text-[13px]" /></BankField>
                <BankField label="来源资料"><Input defaultValue={q.source} className="text-[13px]" /></BankField>
              </div>

              {isChoice && (
                <ChoiceOptionsEditor
                  type={type as "单选题" | "多选题"}
                  options={options.length > 0 ? options : defaultChoiceOptions()}
                  selectedKeys={selectedKeys}
                  onOptionsChange={setOptions}
                  onSelectedKeysChange={setSelectedKeys}
                  onAddOption={addOption}
                  onRemoveOption={removeOption}
                />
              )}

              {isJudge && (
                <JudgeOptionsEditor
                  options={defaultJudgeOptions()}
                  selectedKeys={selectedKeys}
                  onSelect={(key) => setSelectedKeys([key])}
                />
              )}

              {type === "填空题" && (
                <BankField label="正确答案">
                  <Input value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} className="text-[13px]" />
                </BankField>
              )}

              {isLong && (
                <>
                  <BankField label="参考答案"><Textarea defaultValue={d?.analysis} rows={3} className="text-[13px]" /></BankField>
                  <BankField label="评分要点">
                    <Textarea
                      defaultValue={(d?.scoringPoints ?? []).join("\n")}
                      rows={3}
                      placeholder="每行一个评分要点"
                      className="text-[13px]"
                    />
                  </BankField>
                </>
              )}

              <BankField label="解析"><Textarea defaultValue={d?.analysis} rows={3} className="text-[13px]" /></BankField>
              <BankField label="审核备注"><Textarea defaultValue={d?.note} rows={2} placeholder="可记录修改说明" className="text-[13px]" /></BankField>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
              <button onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
              <button onClick={() => setRejectOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3.5 py-2 text-[12.5px] text-destructive hover:bg-destructive/10">
                <XCircle className="h-3.5 w-3.5" /> 驳回
              </button>
              {/* <button onClick={() => onSave(q)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">
                <Save className="h-3.5 w-3.5" /> 保存
              </button> */}
              <button onClick={() => onSaveAndApprove(q)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">
                <CheckCircle2 className="h-3.5 w-3.5" /> 保存并通过
              </button>
            </div>
            <RejectDialog
              open={rejectOpen}
              onClose={() => setRejectOpen(false)}
              title="驳回题目"
              description="请填写驳回意见,提交后题目状态将变为已退回"
              summary={q}
              onConfirm={(comment) => {
                onReject(q, comment);
                setRejectOpen(false);
              }}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RejectDialog({
  open,
  onClose,
  title,
  description,
  summary,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  summary?: ReviewItem | null;
  onConfirm: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) setComment("");
  }, [open]);

  const canSubmit = comment.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">
          {summary && <ReviewSummary q={summary} />}
          <div>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              驳回意见 <span className="text-destructive">*</span>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="请说明驳回原因,例如:题干表述不清、答案与依据不符、选项存在歧义等"
              className="text-[13px]"
            />
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
          <button
            disabled={!canSubmit}
            onClick={() => onConfirm(comment.trim())}
            className="rounded-lg bg-destructive px-3.5 py-2 text-[12.5px] font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
          >
            确认驳回
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  q,
  onClose,
  onConfirm,
}: {
  q: ReviewItem | null;
  onClose: () => void;
  onConfirm: (r: ReviewItem) => void;
}) {
  return (
    <Dialog open={!!q} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {q && (
          <>
            <DialogHeader>
              <DialogTitle>删除题目</DialogTitle>
              <DialogDescription>删除后不可恢复,请确认是否删除该待审核题目。</DialogDescription>
            </DialogHeader>
            <ReviewSummary q={q} />
            <DialogFooter>
              <button onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
              <button onClick={() => onConfirm(q)} className="rounded-lg bg-destructive px-3.5 py-2 text-[12.5px] font-medium text-destructive-foreground hover:bg-destructive/90">确认删除</button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type MergeMode = "keepExisting" | "keepCurrent" | "merged" | "keepBoth";

function MergeDrawer({
  q,
  onClose,
  onDone,
}: {
  q: ReviewItem | null;
  onClose: () => void;
  onDone: (r: ReviewItem, mode: MergeMode) => void;
}) {
  const sims = q ? (REVIEW_SIMILAR[q.id] ?? []) : [];
  const [mode, setMode] = useState<MergeMode>("keepExisting");
  const [openedId, setOpenedId] = useState<string | null>(null);
  if (q && q.id !== openedId) { setOpenedId(q.id); setMode("keepExisting"); }

  const modeOptions: { value: MergeMode; label: string; desc: string }[] = [
    { value: "keepExisting", label: "保留已有题,放弃当前题", desc: "当前待审核题不入库" },
    { value: "keepCurrent", label: "保留当前题,禁用已有相似题", desc: "已有相似题状态置为禁用" },
    { value: "merged", label: "合并生成新题", desc: "基于两题生成新题,保留来源依据" },
  ];

  return (
    <Sheet open={!!q} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        {q && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle>合并相似题</SheetTitle>
              <SheetDescription>处理重复考点,减少题库冗余</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">当前待审核题</div>
                <ReviewSummary q={q} />
              </div>

              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">系统识别相似题 ({sims.length})</div>
                {sims.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[12.5px] text-muted-foreground">未识别到相似题</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-[12.5px]">
                      <thead className="bg-muted/40 text-[11.5px] text-muted-foreground">
                        <tr>
                          <Th className="min-w-[260px]">题干</Th>
                          <Th>知识点</Th>
                          <Th>题型</Th>
                          <Th>难度</Th>
                          {/* <Th>相似度</Th> */}
                          <Th>状态</Th>
                          <Th>使用 / 正确率</Th>
                          <Th className="text-right">操作</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {sims.map((s) => (
                          <tr key={s.id} className="border-t border-border align-top">
                            <StemCell text={s.stem} maxWidthClass="max-w-[300px]" className="font-normal" />
                            <Td><Badge variant="secondary" className="font-normal">{s.knowledge}</Badge></Td>
                            <Td className="text-muted-foreground">{s.type}</Td>
                            <Td><span className={`rounded px-1.5 py-0.5 text-[10.5px] ${diffClass(s.difficulty)}`}>{s.difficulty}</span></Td>
                            {/* <Td><span className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] text-primary">{s.similarity}%</span></Td> */}
                            <Td className="text-muted-foreground">{s.status}</Td>
                            <Td className="text-muted-foreground">{s.usedCount} 次 · {s.correctRate}%</Td>
                            <Td>
                              <div className="flex flex-wrap justify-end gap-0.5">
                                <ActionBtn icon={Eye} label="查看" onClick={() => toast.info("查看相似题详情")} />
                                <ActionBtn icon={CheckCircle2} label="设为保留" onClick={() => { setMode("keepExisting"); toast.info("已选择保留该相似题"); }} />
                                <ActionBtn icon={GitMerge} label="合并到该题" onClick={() => { setMode("keepExisting"); toast.info("将合并到该已有题"); }} />
                              </div>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">合并模式</div>
                <div className="grid gap-2">
                  {modeOptions.map((m) => (
                    <label
                      key={m.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-[12.5px] ${
                        mode === m.value ? "border-primary bg-primary-soft/40" : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="merge-mode"
                        checked={mode === m.value}
                        onChange={() => setMode(m.value)}
                        className="mt-1 accent-primary"
                      />
                      <div>
                        <div className="font-medium">{m.label}</div>
                        <div className="text-[11.5px] text-muted-foreground">{m.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {mode === "merged" && (
                <div>
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">合并预览</div>
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3.5">
                    <div>
                      <div className="text-[11px] text-muted-foreground">合并后题干</div>
                      <Textarea defaultValue={q.stem} rows={2} className="mt-1 text-[13px]" />
                    </div>
                    {REVIEW_DETAILS[q.id]?.options && (
                      <div>
                        <div className="mb-1 text-[11px] text-muted-foreground">合并后选项</div>
                        <OptionList options={REVIEW_DETAILS[q.id]?.options} answer={REVIEW_DETAILS[q.id]?.answer} />
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] text-muted-foreground">合并后答案</div>
                      <Input defaultValue={REVIEW_DETAILS[q.id]?.answer} className="mt-1 text-[13px]" />
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground">合并后解析</div>
                      <Textarea defaultValue={REVIEW_DETAILS[q.id]?.analysis} rows={2} className="mt-1 text-[13px]" />
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      保留依据: {(REVIEW_DETAILS[q.id]?.evidences ?? []).map((e) => e.source).join(" · ") || "—"}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                合并相似题用于减少重复考点,最终处理需审核人确认。
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
              <button onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
              <button onClick={() => onDone(q, "keepBoth")} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">保留两题</button>
              <button onClick={() => onDone(q, mode)} className="rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">确认合并</button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

