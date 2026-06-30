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
  ArrowUp,
  ArrowDown,
  Trash2,
  Save,
  Layers,
  ShieldCheck,
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
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import {
  PaperQuestionList,
  PaperQuestionSummary,
  usePaperQuestionGroups,
} from "@/components/exam/paper-question-list";
import { PageHeader, StatCard, ModuleTabs, ModulePanel, TableListPager, TABLE_PAGE_SIZE_DEFAULT, PillSelect } from "@/components/learning/ui";
import { StemCell } from "@/components/common/ellipsis-tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  GEN_PREVIEW,
  PERSONNEL,
  BANK_CATEGORIES,
  EDITOR_GROUPS,
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
  aggregateStats,
  type Difficulty,
  type Paper,
  type QuestionType,
  type EditorGroup,
  type AssignRecord,
  type PersonAggregate,
  type PersonExamRecord,
  type RecordStatus,
  type BankQuestion,
  type RewriteCandidate,
} from "@/lib/mock/examAdmin";

export const Route = createFileRoute("/exam-admin")({
  component: ExamAdminPage,
  head: () => ({
    meta: [
      { title: "考试管理 · 涉网运行 AI 训练平台" },
      {
        name: "description",
        content: "题目审核、题库维护、智能组卷、试卷下发与答题跟踪的考试管理闭环。",
      },
    ],
  }),
});

type TabKey = "review" | "bank" | "paper";

const TABS: { key: TabKey; label: string; icon: typeof FileText; desc: string }[] = [
  { key: "review", label: "题目审核", icon: ClipboardCheck, desc: "AI 生成 / 人工录入待审核题目" },
  { key: "bank", label: "题库管理", icon: Library, desc: "正式题库资产维护" },
  { key: "paper", label: "试卷管理", icon: FileText, desc: "智能组卷与试卷下发中心" },
];

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

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  variant = "ghost",
}: {
  icon: typeof Eye;
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger" | "primary";
  variant?: "ghost" | "text";
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
  return (
    <button type="button" onClick={onClick} className={`${base} ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
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

function ReviewModule() {
  const [rows, setRows] = useState<ReviewItem[]>(REVIEW_QUESTIONS);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [evidenceOf, setEvidenceOf] = useState<ReviewItem | null>(null);
  const [editOf, setEditOf] = useState<ReviewItem | null>(null);
  const [approveOf, setApproveOf] = useState<ReviewItem | null>(null);
  const [deleteOf, setDeleteOf] = useState<ReviewItem | null>(null);
  const [mergeOf, setMergeOf] = useState<ReviewItem | null>(null);

  const [batchApproveOpen, setBatchApproveOpen] = useState(false);
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
              <Th>生成方式</Th>
              <Th>审核状态</Th>
              <Th className="text-right">操作</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => {
              const done = q.status === "已入库" || q.status === "已合并" || q.status === "已退回";
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
                  <Td className="whitespace-nowrap text-[12px] text-muted-foreground">{q.origin}</Td>
                  <Td><ReviewStatusBadge status={q.status} /></Td>
                  <Td>
                    <div className="flex flex-wrap justify-end gap-0.5">
                      <ActionBtn icon={FileSearch} label="查看依据" onClick={() => setEvidenceOf(q)} />
                      <ActionBtn icon={Pencil} label="编辑" onClick={() => setEditOf(q)} />
                      {!done && (
                        <>
                          <ActionBtn icon={CheckCircle2} label="通过入库" tone="primary" onClick={() => setApproveOf(q)} />
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
        onEdit={(r) => { setEvidenceOf(null); setEditOf(r); }}
        onApprove={(r) => { setEvidenceOf(null); setApproveOf(r); }}
      />
      <ReviewEditDrawer
        q={editOf}
        onClose={() => setEditOf(null)}
        onSave={() => { setEditOf(null); toast.success("已保存,状态保持待审核"); }}
        onSaveAndApprove={(r) => { updateStatus([r.id], "已入库"); setEditOf(null); toast.success("已保存并入库"); }}
      />
      <ApproveDialog
        q={approveOf}
        onClose={() => setApproveOf(null)}
        onConfirm={(r) => { updateStatus([r.id], "已入库"); setApproveOf(null); toast.success("已通过并入库"); }}
        onViewSimilar={(r) => { setApproveOf(null); setMergeOf(r); }}
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
        <span>生成方式: <span className="text-foreground">{q.origin}</span></span>
        <span>状态: <ReviewStatusBadge status={q.status} /></span>
      </div>
    </div>
  );
}

function EvidenceDrawer({
  q,
  onClose,
  onEdit,
  onApprove,
}: {
  q: ReviewItem | null;
  onClose: () => void;
  onEdit: (r: ReviewItem) => void;
  onApprove: (r: ReviewItem) => void;
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
              <button onClick={() => onEdit(q)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">
                <Pencil className="h-3.5 w-3.5" /> 编辑题目
              </button>
              {(q.status === "待审核" ) && (
                <button onClick={() => onApprove(q)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 通过入库
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
}: {
  q: ReviewItem | null;
  onClose: () => void;
  onSave: (r: ReviewItem) => void;
  onSaveAndApprove: (r: ReviewItem) => void;
}) {
  const [type, setType] = useState<QuestionType>(q?.type ?? "单选题");
  const [stem, setStem] = useState(q?.stem ?? "");
  const [opened, setOpened] = useState<string | null>(null);
  const [options, setOptions] = useState<{ key: string; text: string }[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");

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
              <SheetTitle>编辑题目</SheetTitle>
              <SheetDescription>保存后状态保持待审核,需再次确认通过入库</SheetDescription>
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
              <button onClick={() => onSave(q)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">
                <Save className="h-3.5 w-3.5" /> 保存修改
              </button>
              <button onClick={() => onSaveAndApprove(q)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">
                <CheckCircle2 className="h-3.5 w-3.5" /> 保存并通过入库
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ApproveDialog({
  q,
  onClose,
  onConfirm,
  onViewSimilar,
}: {
  q: ReviewItem | null;
  onClose: () => void;
  onConfirm: (r: ReviewItem) => void;
  onViewSimilar: (r: ReviewItem) => void;
}) {
  return (
    <Dialog open={!!q} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {q && (
          <>
            <DialogHeader>
              <DialogTitle>确认通过入库</DialogTitle>
              <DialogDescription>通过后该题进入正式题库,可用于组卷</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <ReviewSummary q={q} />
              {/* <div className="flex items-center gap-2 text-[12.5px]">
                <span className="text-muted-foreground">相似题风险:</span>
                <span className={`rounded-md px-2 py-0.5 text-[11px] ${riskClass(q.similarRisk)}`}>{q.similarRisk}</span>
              </div>
              {q.similarRisk === "高" && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  该题存在高相似题风险,建议先查看或合并相似题后再入库。
                </div>
              )} */}
              <div>
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">审核备注</div>
                <Textarea
                  rows={3}
                  placeholder="可填写入库说明,例如:依据准确,答案唯一,适合 AGC/两细则取证复习。"
                  className="text-[13px]"
                />
              </div>
            </div>
            <DialogFooter>
              <button onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
              <button onClick={() => onViewSimilar(q)} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">查看相似题</button>
              <button onClick={() => onConfirm(q)} className="rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">仍然入库</button>
            </DialogFooter>
          </>
        )}
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

// ---------- Bank module ----------
const BANK_CATEGORY_FILTER: Record<string, (row: BankQuestion) => boolean> = {
  all: () => true,
  agc: (r) => /AGC|两细则/.test(r.knowledge),
  avc: (r) => /AVC/.test(r.knowledge),
  pf: (r) => /一次调频|调频/.test(r.knowledge),
  op: (r) => /主变|操作|停役|停送电/.test(r.knowledge),
  fault: (r) => /差动|故障|保护|安控/.test(r.knowledge),
  newbie: (r) => /新员工|基础/.test(r.knowledge),
  reg: (r) => /规程|制度/.test(r.knowledge),
  case: (r) => /案例/.test(r.knowledge),
};

const BANK_CAT_ICONS: Record<string, typeof Folder> = {
  all: Layers,
  agc: TrendingUp,
  avc: RefreshCw,
  pf: Zap,
  op: ListChecks,
  fault: ShieldCheck,
  newbie: Users,
  reg: FileText,
  case: History,
};

function diffOptionBadge(d: Difficulty) {
  return <span className={`rounded-md px-2 py-0.5 text-[11px] ${diffClass(d)}`}>{d}</span>;
}

function createBankQuestionId(rows: BankQuestion[]) {
  const max = rows.reduce((m, r) => {
    const n = Number.parseInt(r.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `bq${max + 1}`;
}

function BankFilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="shrink-0 text-[12px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function BankModule() {
  const [searchMode, setSearchMode] = useState<"filter" | "ai">("filter");
  const [aiQuery, setAiQuery] = useState("");
  const [keyword, setKeyword] = useState("");
  const [cat, setCat] = useState("all");
  const [filterType, setFilterType] = useState<QuestionType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"启用" | "禁用" | "all">("all");
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "all">("all");
  const [draftCat, setDraftCat] = useState("all");
  const [draftType, setDraftType] = useState<QuestionType | "all">("all");
  const [draftStatus, setDraftStatus] = useState<"启用" | "禁用" | "all">("all");
  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [rows, setRows] = useState<BankQuestion[]>(BANK_QUESTIONS);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [detail, setDetail] = useState<BankQuestion | null>(null);
  const [edit, setEdit] = useState<BankQuestion | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [rewrite, setRewrite] = useState<BankQuestion | null>(null);
  const [similar, setSimilar] = useState<BankQuestion | null>(null);
  const [disable, setDisable] = useState<BankQuestion | null>(null);
  const [usage, setUsage] = useState<BankQuestion | null>(null);
  const [addPaper, setAddPaper] = useState<BankQuestion | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchDisableOpen, setBatchDisableOpen] = useState(false);

  const filtered = useMemo(() => {
    const matchCat = BANK_CATEGORY_FILTER[cat] ?? (() => true);
    const kw = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      if (!matchCat(r)) return false;
      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterDifficulty !== "all" && r.difficulty !== filterDifficulty) return false;
      if (!kw) return true;
      return [r.stem, r.knowledge, r.type, r.source, r.difficulty, r.status].some((field) =>
        field.toLowerCase().includes(kw),
      );
    });
  }, [rows, cat, filterType, filterStatus, filterDifficulty, keyword]);

  const handleAiSearch = () => {
    setKeyword(aiQuery.trim());
    toast.success("AI 已根据描述检索题目");
  };

  const handleFormQuery = () => {
    setCat(draftCat);
    setFilterType(draftType);
    setFilterStatus(draftStatus);
    setFilterDifficulty(draftDifficulty);
    setKeyword("");
  };

  const handleFormReset = () => {
    setDraftCat("all");
    setDraftType("all");
    setDraftStatus("all");
    setDraftDifficulty("all");
    setCat("all");
    setFilterType("all");
    setFilterStatus("all");
    setFilterDifficulty("all");
    setKeyword("");
    setAiQuery("");
  };

  const selectCategory = (key: string) => {
    setCat(key);
    setDraftCat(key);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [cat, filterType, filterStatus, filterDifficulty, keyword]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleStatus = (id: string, status: "启用" | "禁用") =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));

  const removeRows = (ids: string[]) => {
    setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => n.delete(id));
      return n;
    });
  };

  const batchSetStatus = (ids: string[], status: "启用" | "禁用") => {
    setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
    setSelected(new Set());
  };

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const pageAllChecked = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const togglePageAll = () => {
    setSelected((s) => {
      const n = new Set(s);
      if (pageAllChecked) pageRows.forEach((r) => n.delete(r.id));
      else pageRows.forEach((r) => n.add(r.id));
      return n;
    });
  };

  const selectedRows = rows.filter((r) => selected.has(r.id));
  const closeForm = () => {
    setEdit(null);
    setCreateOpen(false);
  };

  const handleSaveQuestion = (item: BankQuestion, isNew: boolean) => {
    if (isNew) setRows((rs) => [item, ...rs]);
    else setRows((rs) => rs.map((r) => (r.id === item.id ? item : r)));
  };

  return (
    <div className="flex gap-4">
      <aside className="w-[220px] shrink-0">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2.5 border-b border-border bg-muted/20 px-3 py-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
              <Library className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-foreground">题库分类</div>
              <div className="text-[10.5px] text-muted-foreground">
                共 {BANK_CATEGORIES[0]?.count ?? 0} 题
              </div>
            </div>
          </div>
          <nav className="max-h-[min(32rem,60vh)] space-y-0.5 overflow-y-auto p-1.5" aria-label="题库分类">
            {BANK_CATEGORIES.map((c) => {
              const active = c.key === cat;
              const Icon = BANK_CAT_ICONS[c.key] ?? Folder;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => selectCategory(c.key)}
                  className={cn(
                    "relative flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors",
                    active
                      ? "bg-primary-soft/80 font-medium text-primary"
                      : "text-foreground/85 hover:bg-muted/50",
                  )}
                >
                  {active && (
                    <span className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-primary" aria-hidden />
                  )}
                  <Icon
                    className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground/70")}
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px]">{c.name}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-px text-[10.5px] tabular-nums",
                      active ? "bg-primary/10 text-primary" : "bg-muted/80 text-muted-foreground",
                    )}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* 查询区：模式切换 + 表单项同一行 */}
        <div className="mb-2 rounded-lg border border-border bg-card px-3 py-2 shadow-[var(--shadow-card)]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-[11.5px] text-muted-foreground">找题方式</span>
            <PillSelect
              className="shrink-0"
              options={[
                { value: "filter", label: "条件找题" },
                { value: "ai", label: "智能找题" },
              ]}
              value={searchMode}
              onChange={(v) => setSearchMode(v as "filter" | "ai")}
            />

            {searchMode === "filter" ? (
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
                <BankFilterField label="分类">
                  <Select value={draftCat} onValueChange={setDraftCat}>
                    <SelectTrigger className="h-8 w-[128px] rounded-sm text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BANK_CATEGORIES.map((c) => (
                        <SelectItem key={c.key} value={c.key} className="text-[12px]">
                          {c.key === "all" ? "全部" : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </BankFilterField>
                <BankFilterField label="题型">
                  <Select value={draftType} onValueChange={(v) => setDraftType(v as QuestionType | "all")}>
                    <SelectTrigger className="h-8 w-[112px] rounded-sm text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[12px]">全部</SelectItem>
                      {(["单选题", "多选题", "判断题", "填空题", "案例分析题", "简答题"] as QuestionType[]).map((t) => (
                        <SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </BankFilterField>
                <BankFilterField label="难度">
                  <Select value={draftDifficulty} onValueChange={(v) => setDraftDifficulty(v as Difficulty | "all")}>
                    <SelectTrigger className="h-8 w-[96px] rounded-sm text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[12px]">全部</SelectItem>
                      {(["易", "中", "难"] as Difficulty[]).map((d) => (
                        <SelectItem key={d} value={d} className="text-[12px]">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </BankFilterField>
                <BankFilterField label="状态">
                  <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as "启用" | "禁用" | "all")}>
                    <SelectTrigger className="h-8 w-[96px] rounded-sm text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[12px]">全部</SelectItem>
                      <SelectItem value="启用" className="text-[12px]">启用</SelectItem>
                      <SelectItem value="禁用" className="text-[12px]">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                </BankFilterField>
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleFormQuery}
                    className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Search className="h-3.5 w-3.5" /> 查询
                  </button>
                  <button
                    type="button"
                    onClick={handleFormReset}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-[12px] text-muted-foreground hover:bg-muted"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> 重置
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="relative h-8 min-w-0 flex-1">
                  <Sparkles style={{marginTop: '-7px'}} className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-primary/70" />
                  <Input
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
                    placeholder="找 5 道 AGC 考核相关的中等难度判断题"
                    className="h-8 rounded-sm pl-8 text-[12.5px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAiSearch}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Sparkles className="h-3.5 w-3.5" /> 智能找题
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 操作区：新增 + 批量 */}
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> 新增题目
          </button>
          <div className="flex flex-nowrap items-center gap-2">
            <span className="whitespace-nowrap text-[12px] text-muted-foreground">
              已选 <span className="font-semibold text-foreground">{selected.size}</span> 项
            </span>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => { batchSetStatus(selectedRows.map((r) => r.id), "启用"); toast.success(`已启用 ${selected.size} 道题目`); }}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-[12px] disabled:opacity-40 hover:bg-muted"
            >
              <Power className="h-3.5 w-3.5" /> 启用
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => setBatchDisableOpen(true)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-[12px] disabled:opacity-40 hover:bg-muted"
            >
              <Ban className="h-3.5 w-3.5" /> 禁用
            </button>
            {/* <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => toast.info(`已对 ${selected.size} 道题查相似题`)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-[12px] disabled:opacity-40 hover:bg-muted"
            >
              <FileSearch className="h-3.5 w-3.5" /> 查重
            </button> */}
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => setBatchDeleteOpen(true)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-[12px] text-destructive disabled:opacity-40 hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-[13px]">
              <thead className="bg-muted/40 text-[12px] text-muted-foreground">
                <tr>
                  <Th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={pageAllChecked}
                      onChange={togglePageAll}
                      className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    />
                  </Th>
                  <Th className="min-w-[240px] px-3 py-2.5">题干</Th>
                  <Th className="px-3 py-2.5">题型</Th>
                  <Th className="px-3 py-2.5">知识点</Th>
                  <Th className="px-3 py-2.5">难度</Th>
                  <Th className="px-3 py-2.5">来源资料</Th>
                  <Th className="px-3 py-2.5">使用次数</Th>
                  <Th className="px-3 py-2.5">最近使用</Th>
                  <Th className="px-3 py-2.5">正确率</Th>
                  <Th className="px-3 py-2.5">状态</Th>
                  <Th className="px-3 py-2.5 text-right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                      当前分类或搜索条件下暂无题目
                    </td>
                  </tr>
                ) : (
                  pageRows.map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <Td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(b.id)}
                          onChange={() => toggle(b.id)}
                          className="h-3.5 w-3.5 cursor-pointer accent-primary"
                        />
                      </Td>
                      <StemCell text={b.stem} maxWidthClass="max-w-[280px]" className="text-[12.5px]" />
                      <Td className="px-3 py-2.5 text-muted-foreground">{b.type}</Td>
                      <Td className="px-3 py-2.5">
                        <Badge variant="secondary" className="max-w-[120px] truncate font-normal">{b.knowledge}</Badge>
                      </Td>
                      <Td className="px-3 py-2.5">{diffOptionBadge(b.difficulty)}</Td>
                      <Td className="max-w-[160px] truncate px-3 py-2.5 text-[12px] text-muted-foreground">{b.source}</Td>
                      <Td className="px-3 py-2.5 text-muted-foreground">{b.usedCount}</Td>
                      <Td className="px-3 py-2.5 text-[12px] text-muted-foreground">{b.lastUsed}</Td>
                      <Td className="px-3 py-2.5">
                        <span
                          className={`font-medium ${b.correctRate >= 70 ? "text-success" : b.correctRate >= 55 ? "text-warning-foreground" : "text-destructive"}`}
                        >
                          {b.correctRate}%
                        </span>
                      </Td>
                      <Td className="px-3 py-2.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] ${
                            b.status === "启用" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {b.status}
                        </span>
                      </Td>
                      <Td className="px-3 py-2.5 text-right">
                        <div className="inline-flex flex-nowrap items-center justify-end gap-0.5">
                          <ActionBtn icon={Eye} label="查看详情" onClick={() => setDetail(b)} />
                          <ActionBtn icon={Pencil} label="编辑" onClick={() => setEdit(b)} />
                          <ActionBtn icon={Wand2} label="智能改写" tone="primary" onClick={() => setRewrite(b)} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                <MoreHorizontal className="h-3.5 w-3.5" /> 更多
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setSimilar(b)}>
                                <FileSearch className="mr-2 h-3.5 w-3.5" /> 查相似题
                              </DropdownMenuItem>
                              {b.status === "启用" ? (
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDisable(b)}>
                                  <Ban className="mr-2 h-3.5 w-3.5" /> 禁用
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => { toggleStatus(b.id, "启用"); toast.success("已启用题目"); }}>
                                  <Power className="mr-2 h-3.5 w-3.5" /> 启用
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setUsage(b)}>
                                <History className="mr-2 h-3.5 w-3.5" /> 查看使用记录
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAddPaper(b)}>
                                <PlusCircle className="mr-2 h-3.5 w-3.5" /> 加入试卷
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TableListPager
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      <BankDetailDrawer
        q={detail}
        onClose={() => setDetail(null)}
        onEdit={(b) => { setDetail(null); setEdit(b); }}
        onRewrite={(b) => { setDetail(null); setRewrite(b); }}
        onSimilar={(b) => { setDetail(null); setSimilar(b); }}
      />
      <BankEditDrawer
        q={createOpen ? null : edit}
        open={createOpen || !!edit}
        existingRows={rows}
        onClose={closeForm}
        onSave={handleSaveQuestion}
      />
      <RewriteDrawer q={rewrite} onClose={() => setRewrite(null)} />
      <SimilarDialog q={similar} onClose={() => setSimilar(null)} />
      <DisableDialog
        q={disable}
        onClose={() => setDisable(null)}
        onConfirm={(b) => { toggleStatus(b.id, "禁用"); setDisable(null); toast.success("已禁用题目"); }}
      />
      <UsageDialog q={usage} onClose={() => setUsage(null)} />
      <AddToPaperDialog q={addPaper} onClose={() => setAddPaper(null)} />

      <Dialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量删除题目</DialogTitle>
            <DialogDescription>共 {selectedRows.length} 道题将被永久删除,此操作不可恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setBatchDeleteOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
            <button
              type="button"
              onClick={() => { removeRows(selectedRows.map((r) => r.id)); setBatchDeleteOpen(false); toast.success("已批量删除"); }}
              className="rounded-lg bg-destructive px-3.5 py-2 text-[12.5px] font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchDisableOpen} onOpenChange={setBatchDisableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量禁用题目</DialogTitle>
            <DialogDescription>共 {selectedRows.length} 道题将被禁用,禁用后不可参与组卷。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setBatchDisableOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
            <button
              type="button"
              onClick={() => { batchSetStatus(selectedRows.map((r) => r.id), "禁用"); setBatchDisableOpen(false); toast.success("已批量禁用"); }}
              className="rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              确认禁用
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-[12.5px]">
      <span className="w-20 shrink-0 text-muted-foreground">{k}</span>
      <span className="flex-1 font-medium">{v}</span>
    </div>
  );
}

function OptionList({ options, answer }: { options?: { key: string; text: string }[]; answer?: string }) {
  if (!options) return null;
  return (
    <div className="space-y-1.5">
      {options.map((o) => {
        const correct = answer?.includes(o.key);
        return (
          <div
            key={o.key}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] ${
              correct ? "border-success/40 bg-success-soft/60" : "border-border bg-background"
            }`}
          >
            <span className={`font-semibold ${correct ? "text-success" : "text-muted-foreground"}`}>{o.key}</span>
            <span className="flex-1">{o.text}</span>
            {correct && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />}
          </div>
        );
      })}
    </div>
  );
}

function BankDetailDrawer({
  q,
  onClose,
  onEdit,
  onRewrite,
  onSimilar,
}: {
  q: BankQuestion | null;
  onClose: () => void;
  onEdit: (b: BankQuestion) => void;
  onRewrite: (b: BankQuestion) => void;
  onSimilar: (b: BankQuestion) => void;
}) {
  const d = q ? BANK_DETAILS[q.id] : undefined;
  return (
    <Sheet open={!!q} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {q && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle>题目详情</SheetTitle>
              <SheetDescription>正式题库题目完整信息</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">题干</div>
                <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-[13.5px] font-medium leading-relaxed">{q.stem}</div>
              </div>
              <div className="space-y-2">
                <DetailRow k="题型" v={q.type} />
                <DetailRow k="知识点" v={<Badge variant="secondary" className="font-normal">{q.knowledge}</Badge>} />
                <DetailRow k="难度" v={diffOptionBadge(q.difficulty)} />
                <DetailRow k="来源资料" v={q.source} />
                {/* <DetailRow k="来源章节" v={d?.section ?? "—"} /> */}
              </div>
              {d?.options && (
                <div>
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">选项</div>
                  <OptionList options={d.options} answer={d.answer} />
                </div>
              )}
              <div>
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">正确答案</div>
                <div className="text-[13px] font-semibold text-success">{d?.answer ?? "—"}</div>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">解析</div>
                <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {d?.analysis ?? "—"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="text-[11px] text-muted-foreground">使用次数</div>
                  <div className="mt-1 text-[18px] font-semibold">{q.usedCount}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="text-[11px] text-muted-foreground">历史正确率</div>
                  <div className="mt-1 text-[18px] font-semibold">{q.correctRate}%</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="text-[11px] text-muted-foreground">最近使用</div>
                  <div className="mt-1 text-[13px] font-medium">{q.lastUsed}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="text-[11px] text-muted-foreground">状态</div>
                  <div className="mt-1 text-[13px] font-medium">{q.status}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
              <button onClick={() => onSimilar(q)} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">查相似题</button>
              <button onClick={() => onRewrite(q)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-3.5 py-2 text-[12.5px] text-primary hover:bg-primary-soft">
                <Wand2 className="h-3.5 w-3.5" /> 智能改写
              </button>
              <button onClick={() => onEdit(q)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">
                <Pencil className="h-3.5 w-3.5" /> 编辑
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const QUESTION_TYPES: QuestionType[] = ["单选题", "多选题", "判断题", "填空题", "案例分析题", "简答题"];
const DIFFICULTIES: Difficulty[] = ["易", "中", "难"];

function BankEditDrawer({
  q,
  open,
  existingRows,
  onClose,
  onSave,
}: {
  q: BankQuestion | null;
  open: boolean;
  existingRows: BankQuestion[];
  onClose: () => void;
  onSave: (item: BankQuestion, isNew: boolean) => void;
}) {
  const isCreate = open && !q;
  const d = q ? BANK_DETAILS[q.id] : undefined;
  const [type, setType] = useState<QuestionType>("单选题");
  const [stem, setStem] = useState("");
  const [knowledge, setKnowledge] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("中");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<"启用" | "禁用">("启用");
  const [typeWarn, setTypeWarn] = useState(false);
  const [options, setOptions] = useState<{ key: string; text: string }[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");

  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const currentKey = open ? (q?.id ?? "__create__") : null;
  if (currentKey && currentKey !== sessionKey) {
    setSessionKey(currentKey);
    setTypeWarn(false);
    if (currentKey === "__create__") {
      setType("单选题");
      setStem("");
      setKnowledge("");
      setDifficulty("中");
      setSource("");
      setStatus("启用");
      setOptions(defaultChoiceOptions());
      setSelectedKeys([]);
      setTextAnswer("");
    } else if (q) {
      setType(q.type);
      setStem(q.stem);
      setKnowledge(q.knowledge);
      setDifficulty(q.difficulty);
      setSource(q.source);
      setStatus(q.status);
      const detail = BANK_DETAILS[q.id];
      const ans = detail?.answer ?? "";
      if (q.type === "单选题" || q.type === "多选题") {
        const rawOptions = detail?.options ?? [];
        const normalized = normalizeOptionsForChoice(rawOptions);
        setOptions(normalized);
        setSelectedKeys(migrateSelectedKeysToAbcd(rawOptions, parseAnswerKeys(ans), normalized));
        setTextAnswer("");
      } else if (q.type === "判断题") {
        setOptions(detail?.options ?? defaultJudgeOptions());
        setSelectedKeys(parseAnswerKeys(ans));
        setTextAnswer("");
      } else {
        setOptions([]);
        setSelectedKeys([]);
        setTextAnswer(ans);
      }
    }
  }

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
    if (!isCreate && q && next !== q.type) setTypeWarn(true);
  };

  const handleSave = () => {
    if (!stem.trim()) {
      toast.error("请填写题干");
      return;
    }
    const item: BankQuestion = isCreate
      ? {
          id: createBankQuestionId(existingRows),
          stem: stem.trim(),
          type,
          knowledge: knowledge.trim() || "未分类",
          difficulty,
          source: source.trim() || "人工录入",
          usedCount: 0,
          lastUsed: "—",
          correctRate: 0,
          status,
        }
      : {
          ...q!,
          stem: stem.trim(),
          type,
          knowledge: knowledge.trim() || q!.knowledge,
          difficulty,
          source: source.trim() || q!.source,
          status,
        };
    onSave(item, isCreate);
    onClose();
    toast.success(isCreate ? "已新增题目" : "已保存修改");
  };

  const isChoice = isChoiceType(type);
  const isJudge = type === "判断题";
  const isLong = type === "简答题" || type === "案例分析题";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {open && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle>{isCreate ? "新增题目" : "编辑题目"}</SheetTitle>
              <SheetDescription>
                {isCreate ? "录入新题目并加入正式题库" : "修改正式题库题目信息"}
              </SheetDescription>
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
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                    <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </BankField>
              </div>
              {typeWarn && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-[12px] text-warning-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> 切换题型可能清空当前选项和答案,请确认。
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <BankField label="知识点">
                  <Input value={knowledge} onChange={(e) => setKnowledge(e.target.value)} className="text-[13px]" />
                </BankField>
                <BankField label="来源资料">
                  <Input value={source} onChange={(e) => setSource(e.target.value)} className="text-[13px]" />
                </BankField>
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
                <BankField label="参考答案">
                  <Textarea defaultValue={d?.answer} rows={3} className="text-[13px]" />
                </BankField>
              )}

              <BankField label="解析"><Textarea defaultValue={d?.analysis} rows={3} className="text-[13px]" /></BankField>
              <BankField label="状态">
                <Select value={status} onValueChange={(v) => setStatus(v as "启用" | "禁用")}>
                  <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="启用">启用</SelectItem>
                    <SelectItem value="禁用">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </BankField>
              {!isCreate && (
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> 修改正式题库题目会影响后续组卷,不影响已下发试卷的历史答题记录。
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
              <button type="button" onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
              <button type="button" onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">
                <Save className="h-3.5 w-3.5" /> {isCreate ? "保存题目" : "保存修改"}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function BankField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function bankDiagLevel(level: string) {
  return level === "通过"
    ? "bg-success-soft text-success"
    : level === "建议优化"
      ? "bg-warning-soft text-warning-foreground"
      : "bg-destructive/10 text-destructive";
}

function RewriteDrawer({ q, onClose }: { q: BankQuestion | null; onClose: () => void }) {
  const d = q ? BANK_DETAILS[q.id] : undefined;
  const [goals, setGoals] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [confirm, setConfirm] = useState<RewriteCandidate | null>(null);

  const [openedId, setOpenedId] = useState<string | null>(null);
  if (q && q.id !== openedId) {
    setOpenedId(q.id);
    setGoals([]);
    setPrompt("");
  }

  const toggleGoal = (g: string) =>
    setGoals((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));

  return (
    <>
      <Sheet open={!!q} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
          {q && (
            <>
              <SheetHeader className="border-b border-border px-6 py-4">
                <SheetTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> 智能改写题目</SheetTitle>
                <SheetDescription>AI 对题目做质量诊断并给出改写建议,正式调整需人工确认。</SheetDescription>
              </SheetHeader>
              <div className="grid flex-1 grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-2">
                <div className="space-y-5 border-border px-6 py-5 lg:border-r">
                  <div>
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">原题信息</div>
                    <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-[13px] font-medium leading-relaxed">{q.stem}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                      <span>{q.type}</span>·<Badge variant="secondary" className="font-normal">{q.knowledge}</Badge>·{diffOptionBadge(q.difficulty)}
                    </div>
                    {d?.options && <div className="mt-3"><OptionList options={d.options} answer={d.answer} /></div>}
                    <div className="mt-3 text-[12px]"><span className="text-muted-foreground">正确答案:</span> <span className="font-semibold text-success">{d?.answer}</span></div>
                    <div className="mt-1.5 text-[12px] text-muted-foreground">解析:{d?.analysis}</div>
                    <div className="mt-1.5 text-[12px] text-muted-foreground">来源:{q.source}</div>
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">题目质量诊断</div>
                    <div className="space-y-2">
                      {REWRITE_DIAGS.map((diag) => (
                        <div key={diag.name} className="rounded-lg border border-border bg-background px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[12.5px] font-medium">{diag.name}</span>
                            <span className={`rounded-md px-2 py-0.5 text-[11px] ${bankDiagLevel(diag.level)}`}>{diag.level}</span>
                          </div>
                          <div className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{diag.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-5 px-6 py-5">
                  <div>
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">改写目标</div>
                    <div className="flex flex-wrap gap-1.5">
                      {REWRITE_GOALS.map((g) => (
                        <button
                          key={g}
                          onClick={() => toggleGoal(g)}
                          className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                            goals.includes(g)
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={2}
                      placeholder="把这道题改得更适合取证复习 / 保持知识点不变,降低一点难度"
                      className="mt-2.5 text-[12.5px]"
                    />
                    <button
                      onClick={() => toast.success("AI 已生成改写建议")}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> 生成改写建议
                    </button>
                  </div>

                  <div>
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">改写建议结果</div>
                    <div className="space-y-3">
                      {REWRITE_CANDIDATES.map((c) => (
                        <div key={c.id} className="rounded-lg border border-border bg-card p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-semibold">{c.title}</span>
                            {/* <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{c.diffChange}</span> */}
                          </div>
                          <div className="mt-2 text-[12.5px] font-medium leading-relaxed">{c.stem}</div>
                          {c.options && <div className="mt-2"><OptionList options={c.options} answer={c.answer} /></div>}
                          <div className="mt-2 text-[12px]"><span className="text-muted-foreground">推荐答案:</span> <span className="font-semibold text-success">{c.answer}</span></div>
                          <div className="mt-1.5 text-[11.5px] text-muted-foreground">解析:{c.analysis}</div>
                          <div className="mt-1.5 text-[11.5px] text-muted-foreground">改写理由:{c.reason}</div>
                          {/* <div className="mt-1 text-[11.5px] text-muted-foreground">来源依据:{c.source}</div> */}
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            <button onClick={() => setConfirm(c)} className="rounded-lg bg-primary px-2.5 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90">使用此版本</button>
                            {/* <button onClick={() => toast.info("可继续输入微调指令")} className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] hover:bg-muted">继续微调</button> */}
                            {/* <button onClick={() => toast.success("已复制为新题(草稿)")} className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] hover:bg-muted">复制为新题</button> */}
                            <button onClick={() => toast.info("已放弃该版本")} className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-muted">放弃</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-border px-6 py-2.5 text-[11.5px] text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0 text-primary" /> 智能改写仅提供建议,题目替换和试卷调整需培训负责人确认。
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认使用该版本</DialogTitle>
            <DialogDescription>
              修改后将作为正式题库题目参与后续组卷,已下发试卷不受影响。建议优先“另存为新题”,避免误改正式题库资产。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <button onClick={() => setConfirm(null)} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
            <button onClick={() => { setConfirm(null); toast.success("已覆盖原题"); onClose(); }} className="rounded-lg border border-destructive/40 px-3.5 py-2 text-[12.5px] text-destructive hover:bg-destructive/10">覆盖原题</button>
            <button onClick={() => { setConfirm(null); toast.success("已另存为新题"); onClose(); }} className="rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">另存为新题(推荐)</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SimilarDialog({ q, onClose }: { q: BankQuestion | null; onClose: () => void }) {
  return (
    <Dialog open={!!q} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl gap-4">
        {q && (
          <>
            <DialogHeader>
              <DialogTitle>相似题检测</DialogTitle>
              <DialogDescription>相似题检测用于减少重复考点,最终处理需人工确认。</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-[12.5px]">
              <span className="text-muted-foreground">当前题目:</span> {q.stem}
            </div>
            <div className="max-h-[min(24rem,50vh)] overflow-auto rounded-lg border border-border">
              <table className="w-full whitespace-nowrap text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-muted/95 text-[11.5px] text-muted-foreground backdrop-blur-sm">
                  <tr>
                    <Th className="min-w-[220px]">相似题题干</Th>
                    <Th>知识点</Th>
                    <Th>题型</Th>
                    <Th>难度</Th>
                    {/* <Th>相似度</Th> */}
                    <Th>状态</Th>
                    <Th className="text-right">操作</Th>
                  </tr>
                </thead>
                <tbody>
                  {SIMILAR_QUESTIONS.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <StemCell text={s.stem} maxWidthClass="max-w-[240px]" />
                      <Td className="text-muted-foreground">{s.knowledge}</Td>
                      <Td className="text-muted-foreground">{s.type}</Td>
                      <Td>{diffOptionBadge(s.difficulty)}</Td>
                      {/* <Td>
                        <span className={`font-semibold ${s.similarity >= 80 ? "text-destructive" : s.similarity >= 65 ? "text-warning-foreground" : "text-muted-foreground"}`}>{s.similarity}%</span>
                      </Td> */}
                      <Td>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] ${s.status === "启用" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{s.status}</span>
                      </Td>
                      <Td>
                        <div className="flex flex-nowrap justify-end gap-0.5">
                          <ActionBtn icon={Eye} label="详情" onClick={() => toast.info("查看相似题详情")} />
                          {/* <ActionBtn icon={GitMerge} label="合并" onClick={() => toast.success("已合并相似题")} /> */}
                          {/* <ActionBtn icon={CheckCircle2} label="保留" onClick={() => toast.info("已保留两题")} /> */}
                          <ActionBtn icon={Ban} label="禁用" tone="danger" onClick={() => toast.success("已禁用其中一题")} />
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter className="sm:justify-end">
              <button type="button" onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">关闭</button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DisableDialog({ q, onClose, onConfirm }: { q: BankQuestion | null; onClose: () => void; onConfirm: (b: BankQuestion) => void }) {
  const [reason, setReason] = useState<string>(DISABLE_REASONS[0]);
  return (
    <Dialog open={!!q} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认禁用题目</DialogTitle>
          <DialogDescription>
            禁用后,该题不会再进入新试卷组卷,但历史试卷和历史答题记录不受影响。
          </DialogDescription>
        </DialogHeader>
        <div className="py-1">
          <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">禁用原因</div>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DISABLE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="sm:justify-end">
          <button onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
          <button onClick={() => q && onConfirm(q)} className="rounded-lg bg-destructive px-3.5 py-2 text-[12.5px] font-medium text-destructive-foreground hover:bg-destructive/90">确认禁用</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UsageDialog({ q, onClose }: { q: BankQuestion | null; onClose: () => void }) {
  return (
    <Dialog open={!!q} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>使用记录</DialogTitle>
          <DialogDescription>该题被以下试卷使用,用于判断是否保留或改写。</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[12.5px]">
            <thead className="bg-muted/40 text-[11.5px] text-muted-foreground">
              <tr>
                <Th className="min-w-[200px]">试卷名称</Th>
                <Th>使用时间</Th>
                <Th>下发人数</Th>
                <Th>平均正确率</Th>
                <Th>最近使用</Th>
              </tr>
            </thead>
            <tbody>
              {BANK_USAGE.map((u) => (
                <tr key={u.paper} className="border-t border-border">
                  <Td className="font-medium">{u.paper}</Td>
                  <Td className="text-muted-foreground">{u.usedAt}</Td>
                  <Td className="text-muted-foreground">{u.assigned}</Td>
                  <Td><span className="font-medium">{u.avgCorrect}%</span></Td>
                  <Td className="text-muted-foreground">{u.lastUsed}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddToPaperDialog({ q, onClose }: { q: BankQuestion | null; onClose: () => void }) {
  const drafts = DRAFT_PAPERS;
  const [paper, setPaper] = useState<string>(drafts[0]?.id ?? "");
  const [score, setScore] = useState("2");
  return (
    <Dialog open={!!q} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>加入试卷</DialogTitle>
          <DialogDescription>将当前题目加入指定草稿试卷的题型分组。</DialogDescription>
        </DialogHeader>
        {q && (
          <div className="space-y-3 py-1">
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-[12px]"><span className="text-muted-foreground">题目:</span> {q.stem}</div>
            <BankField label="选择试卷">
              {drafts.length ? (
                <Select value={paper} onValueChange={setPaper}>
                  <SelectTrigger className="text-[13px]"><SelectValue placeholder="选择草稿试卷" /></SelectTrigger>
                  <SelectContent>
                    {drafts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-lg border border-dashed border-border px-3 py-2 text-[12px] text-muted-foreground">暂无草稿试卷,请先新建试卷。</div>
              )}
            </BankField>
            <div className="grid grid-cols-2 gap-3">
              <BankField label="加入题型分组">
                <div className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[12.5px]">
                  <ListChecks className="h-3.5 w-3.5 text-muted-foreground" /> {q.type}
                </div>
              </BankField>
              <BankField label="分值">
                <Input value={score} onChange={(e) => setScore(e.target.value)} type="number" className="text-[13px]" />
              </BankField>
            </div>
          </div>
        )}
        <DialogFooter className="sm:justify-end">
          <button onClick={onClose} className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted">取消</button>
          <button
            disabled={!drafts.length}
            onClick={() => { onClose(); toast.success("已加入试卷"); }}
            className="rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            确认加入
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ---------- Paper module ----------
function statusBadge(s: Paper["status"]) {
  return s === "已下发"
    ? "bg-primary-soft text-primary"
    : s === "已结束"
      ? "bg-success-soft text-success"
      : "bg-muted text-muted-foreground";
}

function PaperModule({
  onGenerate,
  onAssign,
  onRecords,
  onPreview,
  onOptimize,
  onCopy,
  onEdit,
  onNew,
}: {
  onGenerate: () => void;
  onAssign: (p: Paper) => void;
  onRecords: (p: Paper) => void;
  onPreview: (p: Paper) => void;
  onOptimize: (p: Paper) => void;
  onCopy: (p: Paper) => void;
  onEdit: (p: Paper) => void;
  onNew: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={onGenerate}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="h-3.5 w-3.5" /> 智能组卷
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-1.5 text-[12.5px] font-medium text-foreground hover:border-primary/25 hover:bg-muted/70"
        >
          <Plus className="h-3.5 w-3.5" /> 新建试卷
        </button>
        <button
          onClick={() => toast.info("批量下发已选试卷")}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-1.5 text-[12.5px] font-medium text-foreground hover:border-primary/25 hover:bg-muted/70"
        >
          <Send className="h-3.5 w-3.5" /> 批量下发
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-[13px]">
          <thead className="bg-muted/40 text-[12px] text-muted-foreground">
            <tr>
              <Th>试卷名称</Th>
              <Th>考试目标</Th>
              <Th>分类</Th>
              <Th>题量</Th>
              <Th>时长</Th>
              <Th>创建时间</Th>
              <Th>来源</Th>
              <Th><span title="去重后的人员数量">下发人数</span></Th>
              <Th><span title="该试卷累计下发记录数">下发次数</span></Th>
              <Th><span title="按每人最新一次记录统计已完成人数">完成人数</span></Th>
              <Th><span title="按每人最新一次下发记录计算">完成率</span></Th>
              <Th><span title="按每人最新一次已提交记录计算">平均正确率</span></Th>
              <Th><span title="按每人最新一次已提交记录计算">平均分</span></Th>
              <Th><span title="按每人最新一次已提交记录计算">平均用时</span></Th>
              <Th>状态</Th>
              <Th className="text-right">操作</Th>
            </tr>
          </thead>
          <tbody>
            {PAPERS.map((p) => {
              const finishRate = p.assigned ? Math.round((p.finished / p.assigned) * 100) : 0;
              return (
                <tr key={p.id} className="border-t border-border hover:bg-primary-soft/10">
                  <Td className="max-w-[180px] font-medium">{p.name}</Td>
                  <Td><Badge variant="secondary" className="font-normal">{p.goal}</Badge></Td>
                  <Td className="text-muted-foreground">{p.category}</Td>
                  <Td className="text-muted-foreground">{p.questionCount}</Td>
                  <Td className="text-muted-foreground">{p.duration} 分</Td>
                  <Td className="text-[12px] text-muted-foreground">{p.createdAt}</Td>
                  <Td className="max-w-[100px] text-[12px] text-muted-foreground">{p.source}</Td>
                  <Td className="text-muted-foreground">{p.assigned || "—"}</Td>
                  <Td className="text-muted-foreground">{p.assignTimes || "—"}</Td>
                  <Td className="text-muted-foreground">{p.assigned ? p.finished : "—"}</Td>
                  <Td>{p.assigned ? `${finishRate}%` : "—"}</Td>
                  <Td>{p.assigned ? `${p.avgCorrect}%` : "—"}</Td>
                  <Td>{p.assigned ? p.avgScore : "—"}</Td>
                  <Td className="text-muted-foreground">{p.assigned ? `${p.avgDuration} 分` : "—"}</Td>
                  <Td>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <ActionBtn variant="text" icon={Eye} label="试卷详情" onClick={() => onPreview(p)} />
                      <ActionBtn variant="text" icon={Pencil} label="编辑" onClick={() => onEdit(p)} />
                      <ActionBtn variant="text" icon={Send} label="下发" tone="primary" onClick={() => onAssign(p)} />
                      <ActionBtn variant="text" icon={History} label="下发记录" onClick={() => onRecords(p)} />
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Generate drawer ----------
function GenerateDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [nl, setNl] = useState("");
  const [generated, setGenerated] = useState(false);
  const [addType, setAddType] = useState<QuestionType | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const { groups, collapsed, toggleCollapse, move, remove, aiAppend, resetGroups, summary } =
    usePaperQuestionGroups(EDITOR_GROUPS);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> 智能组卷
          </SheetTitle>
          <SheetDescription>
            描述考试需求,AI 辅助生成结构化试卷,正式下发前需人工确认。
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium">自然语言组卷</label>
            <Textarea
              value={nl}
              onChange={(e) => setNl(e.target.value)}
              placeholder="生成一套 AGC/两细则取证复习考试,20 题,中等难度,30 分钟"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="考试目标" placeholder="取证复习" />
            <Field label="知识点" placeholder="AGC / 一次调频" />
            <Field label="题型" placeholder="单选 / 多选 / 判断" />
            <Field label="难度" placeholder="中等" />
            <Field label="题量" placeholder="20" />
            <Field label="时长(分钟)" placeholder="30" />
            <Field label="及格线(分)" placeholder="60" />
            <Field label="适用岗位" placeholder="值班员 / 值班长" />
          </div>

          <button
            onClick={() => {
              resetGroups();
              setGenerated(true);
              toast.success("已生成试卷预览");
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" /> 生成预览
          </button>

          {generated && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-[13px] font-semibold">AGC / 两细则取证复习考试</div>
                <div className="mt-1 flex flex-wrap gap-3 text-[11.5px] text-muted-foreground">
                  <span>题量 {summary[0]?.value ?? 0}</span>
                  <span>总分 {summary[1]?.value ?? 0}</span>
                  <span>时长 30 分</span>
                  <span>及格线 60</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DistBlock title="知识点覆盖" items={GEN_PREVIEW.knowledgeCoverage} />
                <DistBlock title="题型比例" items={GEN_PREVIEW.typeRatio} />
                <DistBlock title="难度分布" items={GEN_PREVIEW.difficulty} />
                <div>
                  <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">重复题风险</div>
                  <span className={`rounded-md px-2 py-0.5 text-[12px] ${riskClass(GEN_PREVIEW.dupRisk)}`}>
                    {GEN_PREVIEW.dupRisk}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2 text-[11.5px] text-primary">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                缺题提醒:简答题题量不足,建议补充 1 道或调整题型比例。
              </div>

              <PaperQuestionSummary summary={summary} />

              <PaperQuestionList
                groups={groups}
                collapsed={collapsed}
                onToggleCollapse={toggleCollapse}
                onAdd={setAddType}
                onAiAppend={aiAppend}
                onMove={move}
                onRemove={remove}
                onSwap={() => setSwapOpen(true)}
              />

              <div className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[11.5px] text-warning-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                智能组卷用于辅助培训负责人创建考试,正式下发前需人工确认。
              </div>
            </div>
          )}
        </div>

        {generated && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3.5">
            <button
              onClick={() => setGenerated(false)}
              className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted"
            >
              继续调整
            </button>
            <button
              onClick={() => {
                toast.success("试卷已保存为草稿");
                onOpenChange(false);
                setGenerated(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" /> 保存为试卷
            </button>
          </div>
        )}
      </SheetContent>
      <AddQuestionDialog
        open={addType !== null}
        onClose={() => setAddType(null)}
        onAdd={(n) => toast.success(`已向${addType ?? "试卷"}添加 ${n} 题`)}
      />
      <SwapDialog open={swapOpen} onClose={() => setSwapOpen(false)} onPick={() => {}} />
    </Sheet>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-muted-foreground">{label}</label>
      <Input placeholder={placeholder} className="h-9 text-[13px]" />
    </div>
  );
}

function DistBlock({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{title}</div>
      <div className="space-y-1.5">
        {items.map((i) => (
          <div key={i.name} className="flex items-center gap-2 text-[11.5px]">
            <span className="w-20 shrink-0 truncate">{i.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(i.count / total) * 100}%` }} />
            </div>
            <span className="w-5 shrink-0 text-right text-muted-foreground">{i.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Shuffle row ----------
function ShuffleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium">{label}</div>
        <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </div>
  );
}

// ---------- Assign dialog ----------
function AssignDialog({
  paper,
  onClose,
}: {
  paper: Paper | null;
  onClose: () => void;
}) {
  const [field, setField] = useState("");
  const [team, setTeam] = useState("");
  const [position, setPosition] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleOpt, setShuffleOpt] = useState(true);
  const [perUser, setPerUser] = useState(true);

  const teams = useMemo(() => Array.from(new Set(PERSONNEL.map((p) => p.team))), []);
  const positions = useMemo(() => Array.from(new Set(PERSONNEL.map((p) => p.position))), []);

  const filtered = PERSONNEL.filter(
    (p) =>
      (!field || p.user.includes(field)) &&
      (!team || p.team === team) &&
      (!position || p.position === position),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <Dialog open={!!paper} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>试卷下发</DialogTitle>
          <DialogDescription>{paper?.name} · 选择下发对象</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="按用户名搜索" className="h-9 text-[13px]" />
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-[13px]"
          >
            <option value="">全部班组</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-[13px]"
          >
            <option value="">全部岗位</option>
            {positions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
          {filtered.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 text-[13px] last:border-0 hover:bg-muted/40"
            >
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4 accent-[var(--primary)]" />
              <span className="font-medium">{p.user}</span>
              <span className="text-muted-foreground">{p.team}</span>
              <span className="ml-auto text-[12px] text-muted-foreground">{p.position}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">无匹配人员</div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3.5">
          <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium">
            <ShieldCheck className="h-4 w-4 text-primary" /> 下发设置 · 防作弊乱序
          </div>
          <div className="divide-y divide-border">
            <ShuffleRow
              label="题目乱序"
              desc="仅在同一题型内打乱题目顺序,不跨题型混排。"
              checked={shuffleQ}
              onChange={setShuffleQ}
            />
            <ShuffleRow
              label="选项乱序"
              desc="仅对单选题、多选题的选项打乱,系统自动同步正确答案;判断/填空/简答不参与。"
              checked={shuffleOpt}
              onChange={setShuffleOpt}
            />
            <ShuffleRow
              label="每人生成独立卷面"
              desc="为每位被下发人员生成不同的题目与选项顺序,题目集合保持一致以保证公平。"
              checked={perUser}
              onChange={setPerUser}
            />
          </div>
          <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-card px-3 py-2 text-[11.5px] text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            乱序仅改变卷面展示顺序,不改变题目集合、分值和统计口径。答题详情仍可映射回原始标准卷,便于阅卷和复盘。
          </div>
        </div>

        <div className="rounded-lg bg-primary-soft px-3.5 py-2.5 text-[12.5px] text-primary">
          已选择 {selected.size} 人,题目乱序{shuffleQ ? "已开启" : "已关闭"},选项乱序
          {shuffleOpt ? "已开启" : "已关闭"},每人独立卷面{perUser ? "已开启" : "已关闭"}。
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-muted-foreground">已选 {selected.size} 人</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted">
              取消
            </button>
            <button
              disabled={selected.size === 0}
              onClick={() => {
                toast.success(`已向 ${selected.size} 人下发试卷`);
                onClose();
                setSelected(new Set());
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Users className="h-4 w-4" /> 确认下发
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Reusable answer list ----------
function AnswerList({ items }: { items: typeof ANSWER_DETAIL }) {
  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a.no} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-2">
            <span className="text-[12px] text-muted-foreground">{a.no}.</span>
            <div className="flex-1">
              <div className="text-[13px] font-medium leading-relaxed">{a.stem}</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{a.type}</span>
                {a.isCorrect ? (
                  <span className="inline-flex items-center gap-0.5 text-success"><CheckCircle2 className="h-3 w-3" />答对</span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-destructive"><X className="h-3 w-3" />答错</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-[12.5px]">
            <div><span className="text-muted-foreground">用户答案:</span>{" "}
              <span className={a.isCorrect ? "text-success" : "text-destructive"}>{a.userAnswer}</span>
            </div>
            <div><span className="text-muted-foreground">正确答案:</span> <span className="text-success">{a.correctAnswer}</span></div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-muted-foreground">
              <span className="font-medium text-foreground">解析:</span> {a.analysis}
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] text-primary">
              <FileSearch className="h-3.5 w-3.5" /> 资料依据:{a.evidence}
            </div>
            {a.wrongTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {a.wrongTags.map((t) => (
                  <span key={t} className="rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function statusPill(s: RecordStatus | AssignRecord["status"]) {
  return s === "已提交"
    ? "bg-success-soft text-success"
    : s === "进行中"
      ? "bg-warning-soft text-warning-foreground"
      : s === "已过期"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
}

// ---------- Records drawer (left people list + right detail + history) ----------
function RecordsDrawer({ paper, onClose }: { paper: Paper | null; onClose: () => void }) {
  const [activeId, setActiveId] = useState(PERSON_AGGREGATES[0]?.id ?? "");
  // which record (issue) of the active person is being viewed; null = latest
  const [viewRecordId, setViewRecordId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // filters
  const [kw, setKw] = useState("");
  const [team, setTeam] = useState("全部");
  const [status, setStatus] = useState("全部");
  const [history, setHistory] = useState("全部");

  const people = useMemo(() => {
    return PERSON_AGGREGATES.filter((p) => {
      if (kw && !p.user.includes(kw)) return false;
      if (team !== "全部" && p.team !== team) return false;
      const latest = p.records[0];
      if (status !== "全部" && latest.status !== status) return false;
      if (history === "有历史" && p.records.length <= 1) return false;
      if (history === "无历史" && p.records.length > 1) return false;
      return true;
    });
  }, [kw, team, status, history]);

  const totals = aggregateStats(PERSON_AGGREGATES);
  const active = PERSON_AGGREGATES.find((p) => p.id === activeId) ?? people[0] ?? PERSON_AGGREGATES[0];
  const record: PersonExamRecord | undefined = active
    ? active.records.find((r) => r.id === viewRecordId) ?? active.records[0]
    : undefined;
  const isLatest = record && active && record.id === active.records[0].id;
  const shuffled = record ? record.rule !== "标准卷" : false;

  const selectPerson = (id: string) => {
    setActiveId(id);
    setViewRecordId(null);
    setShowHistory(false);
  };

  return (
    <Sheet open={!!paper} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> 下发记录
          </SheetTitle>
          <SheetDescription>
            {paper?.name} · 下发 {totals.peopleCount} 人 · 累计下发 {totals.totalTimes} 次
          </SheetDescription>
        </SheetHeader>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-6 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              placeholder="搜索员工姓名"
              className="h-8 w-40 pl-8 text-[12.5px]"
            />
          </div>
          <FilterSelect value={team} onChange={setTeam} options={TEAM_OPTIONS} />
          <FilterSelect value={status} onChange={setStatus} options={RECORD_STATUS_OPTIONS} />
          <FilterSelect value={history} onChange={setHistory} options={[...HISTORY_OPTIONS]} prefix="历史:" />
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="w-64 shrink-0 overflow-y-auto border-r border-border bg-muted/20">
            {people.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">无匹配人员</div>
            )}
            {people.map((p) => {
              const on = p.id === active?.id;
              const latest = p.records[0];
              return (
                <button
                  key={p.id}
                  onClick={() => selectPerson(p.id)}
                  className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors ${
                    on ? "bg-primary-soft" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[13px] font-medium ${on ? "text-primary" : ""}`}>{p.user}</span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] ${statusPill(latest.status)}`}>
                      {latest.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{p.team} · {p.position}</div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{latest.score != null ? `${latest.score} 分` : "—"}</span>
                    <span>{latest.correctRate != null ? `正确率 ${latest.correctRate}%` : ""}</span>
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {latest.submittedAt ?? `下发 ${latest.assignedAt}`}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {p.records.length > 1 && (
                      <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        历史 {p.records.length} 次
                      </span>
                    )}
                    <span className="inline-flex items-center rounded bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {latest.rule}
                    </span>
                  </div>
                </button>
              );
            })}
          </aside>

          <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            {active && record && (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold">{active.user}</span>
                  <span className="text-[12px] text-muted-foreground">{active.team} · {active.position}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] ${statusPill(record.status)}`}>{record.status}</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {isLatest ? "当前查看:最新一次" : `当前查看:${record.reason}`}
                  </span>
                  {active.records.length > 1 && (
                    <button
                      onClick={() => setShowHistory((v) => !v)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11.5px] hover:bg-muted"
                    >
                      <History className="h-3.5 w-3.5" /> 查看历史作答
                      {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    { l: "分数", v: record.score != null ? record.score : "—" },
                    { l: "正确率", v: record.correctRate != null ? `${record.correctRate}%` : "—" },
                    { l: "用时", v: record.duration != null ? `${record.duration} 分` : "—" },
                    { l: "提交时间", v: record.submittedAt ?? "—" },
                    { l: "卷面规则", v: record.rule },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg border border-border bg-card px-3 py-2">
                      <div className="text-[10.5px] text-muted-foreground">{s.l}</div>
                      <div className="mt-0.5 text-[12.5px] font-medium">{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* history list (secondary expand) */}
                {showHistory && (
                  <div className="mb-4 overflow-hidden rounded-lg border border-border">
                    <div className="bg-muted/40 px-3 py-2 text-[12px] font-medium">
                      历史作答记录 · 共 {active.records.length} 次
                    </div>
                    <table className="w-full text-[12px]">
                      <thead className="bg-muted/20 text-[11px] text-muted-foreground">
                        <tr>
                          <th className="px-3 py-1.5 text-left font-normal">下发时间</th>
                          <th className="px-3 py-1.5 text-left font-normal">提交时间</th>
                          <th className="px-3 py-1.5 text-left font-normal">状态</th>
                          <th className="px-3 py-1.5 text-left font-normal">分数</th>
                          <th className="px-3 py-1.5 text-left font-normal">正确率</th>
                          <th className="px-3 py-1.5 text-left font-normal">用时</th>
                          <th className="px-3 py-1.5 text-left font-normal">卷面规则</th>
                          <th className="px-3 py-1.5 text-right font-normal">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.records.map((r) => {
                          const on = r.id === record.id;
                          return (
                            <tr key={r.id} className={`border-t border-border ${on ? "bg-primary-soft/60" : ""}`}>
                              <td className="px-3 py-1.5">{r.assignedAt}</td>
                              <td className="px-3 py-1.5">{r.submittedAt ?? "—"}</td>
                              <td className="px-3 py-1.5">
                                <span className={`rounded px-1.5 py-0.5 text-[10.5px] ${statusPill(r.status)}`}>{r.status}</span>
                              </td>
                              <td className="px-3 py-1.5">{r.score ?? "—"}</td>
                              <td className="px-3 py-1.5">{r.correctRate != null ? `${r.correctRate}%` : "—"}</td>
                              <td className="px-3 py-1.5">{r.duration != null ? `${r.duration} 分` : "—"}</td>
                              <td className="px-3 py-1.5 text-muted-foreground">{r.rule}</td>
                              <td className="px-3 py-1.5 text-right">
                                <button
                                  onClick={() => setViewRecordId(r.id)}
                                  className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-muted disabled:opacity-50"
                                  disabled={on}
                                >
                                  查看本次答题
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* {shuffled && (
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11.5px] font-medium text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" /> 该记录为个人乱序卷面,已映射回标准卷统计。
                  </div>
                )} */}

                {record.status === "已提交" && record.answers.length > 0 ? (
                  <AnswerList items={record.answers} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-[12.5px] text-muted-foreground">
                    该记录{record.status},暂无答题详情。
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  prefix = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  prefix?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-border bg-card px-2 text-[12.5px] outline-none focus:border-primary/50"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {prefix}{o}
        </option>
      ))}
    </select>
  );
}


// ---------- Paper preview drawer (employee-facing exam paper) ----------
function PaperPreviewDrawer({ paper, onClose }: { paper: Paper | null; onClose: () => void }) {
  const total = PAPER_PREVIEW.reduce((s, sec) => s + sec.questions.reduce((a, q) => a + q.score, 0), 0);
  const count = PAPER_PREVIEW.reduce((s, sec) => s + sec.questions.length, 0);
  let running = 0;
  return (
    <Sheet open={!!paper} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" /> 试卷详情
          </SheetTitle>
          <SheetDescription>下发给学员的卷面预览(只读)</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <div className="text-[16px] font-semibold">{paper?.name}</div>
            <div className="mt-1.5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              <span>考试目标:{paper?.goal}</span>
              <span>题量 {count}</span>
              <span>总分 {total}</span>
              <span>时长 {paper?.duration} 分钟</span>
            </div>
            <div className="mt-2 text-[11.5px] text-muted-foreground">
              答题须知:请在规定时间内独立完成,提交后不可修改。
            </div>
          </div>

          <div className="mt-5 space-y-6">
            {PAPER_PREVIEW.map((sec, si) => {
              const secScore = sec.questions.reduce((a, q) => a + q.score, 0);
              return (
                <div key={sec.type}>
                  <div className="mb-2 text-[13.5px] font-semibold">
                    {["一", "二", "三", "四", "五", "六"][si]}、{sec.type}
                    <span className="ml-2 text-[11.5px] font-normal text-muted-foreground">
                      (共 {sec.questions.length} 小题,每小题 {sec.perScore} 分,共 {secScore} 分)
                    </span>
                  </div>
                  <div className="space-y-4">
                    {sec.questions.map((q) => {
                      running += 1;
                      const num = running;
                      return (
                        <div key={q.no} className="rounded-lg border border-border bg-card p-4">
                          <div className="flex gap-2 text-[13px] font-medium leading-relaxed">
                            <span className="text-muted-foreground">{num}.</span>
                            <span className="flex-1">
                              {q.stem}
                              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">({q.score} 分)</span>
                            </span>
                          </div>
                          {q.options && (
                            <div className="mt-3 space-y-2">
                              {q.options.map((o) => (
                                <label key={o.key} className="flex items-center gap-2.5 text-[12.5px]">
                                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-[11px] text-muted-foreground">
                                    {q.type === "多选题" ? "□" : o.key}
                                  </span>
                                  <span>{q.type === "多选题" || q.type === "判断题" ? "" : `${o.key}. `}{o.text}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {q.blanks != null && (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {Array.from({ length: q.blanks }).map((_, i) => (
                                <div key={i} className="h-8 w-40 rounded-md border border-dashed border-border bg-muted/30" />
                              ))}
                            </div>
                          )}
                          {!q.options && q.blanks == null && (
                            <div className="mt-3 h-24 rounded-md border border-dashed border-border bg-muted/30" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-border px-6 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted">关闭</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------- Copy dialog ----------
function CopyDialog({ paper, onClose }: { paper: Paper | null; onClose: () => void }) {
  const [name, setName] = useState("");
  const [keepAssign, setKeepAssign] = useState(false);
  const [asDraft, setAsDraft] = useState(true);
  const defaultName = paper ? `${paper.name}(副本)` : "";

  return (
    <Dialog open={!!paper} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4.5 w-4.5 text-primary" /> 复制试卷
          </DialogTitle>
          <DialogDescription>基于「{paper?.name}」创建一份新试卷副本。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <FieldLabel>新试卷名称</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName}
              className="h-9 text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-[12px] text-muted-foreground">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="text-[10.5px]">原题量</div>
              <div className="mt-0.5 text-[14px] font-medium text-foreground">{paper?.questionCount} 题</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="text-[10.5px]">原时长</div>
              <div className="mt-0.5 text-[14px] font-medium text-foreground">{paper?.duration} 分钟</div>
            </div>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border px-3.5">
            <ShuffleRow label="复制后保存为草稿" desc="副本将进入草稿状态,可继续编辑后再下发。" checked={asDraft} onChange={setAsDraft} />
            <ShuffleRow label="保留下发对象设置" desc="沿用原试卷的下发人员范围,默认不保留。" checked={keepAssign} onChange={setKeepAssign} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted">取消</button>
          <button
            onClick={() => {
              toast.success(`已复制为「${name || defaultName}」`);
              setName("");
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Copy className="h-4 w-4" /> 确认复制
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Smart optimize drawer ----------
function diagLevelClass(l: string) {
  return l === "偏高"
    ? "bg-warning-soft text-warning-foreground"
    : l === "偏低"
      ? "bg-destructive/10 text-destructive"
      : "bg-success-soft text-success";
}

function OptimizeDrawer({ paper, onClose, onSwap }: { paper: Paper | null; onClose: () => void; onSwap: () => void }) {
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const locked = paper?.status === "已下发" || paper?.status === "已结束";
  const total = PAPER_PREVIEW.reduce((s, sec) => s + sec.questions.reduce((a, q) => a + q.score, 0), 0);

  const toggleApply = (id: string) =>
    setApplied((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <Sheet open={!!paper} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" /> 智能优化试卷
          </SheetTitle>
          <SheetDescription>对整套试卷做结构诊断并给出可确认的优化建议。</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[13px] font-semibold">{paper?.name}</div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
              <span>考试目标:{paper?.goal}</span>
              <span>题量 {paper?.questionCount}</span>
              <span>总分 {total}</span>
              <span>时长 {paper?.duration} 分</span>
              <span>状态:{paper?.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-border bg-primary-soft/40 p-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-primary/30 text-primary">
              <span className="text-[20px] font-semibold leading-none">{OPTIMIZE.score}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium">试卷质量评分 {OPTIMIZE.score} / 100</div>
              <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{OPTIMIZE.summary}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3.5">
              <div className="mb-2 text-[12.5px] font-medium">知识点覆盖</div>
              <div className="space-y-1.5">
                {OPTIMIZE.knowledge.map((k) => (
                  <div key={k.name} className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-20 shrink-0 truncate">{k.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${k.ratio}%` }} />
                    </div>
                    <span className="w-9 shrink-0 text-right text-muted-foreground">{k.ratio}%</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${diagLevelClass(k.level)}`}>{k.level}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3.5">
              <div className="mb-2 text-[12.5px] font-medium">题型结构</div>
              <div className="space-y-1.5">
                {OPTIMIZE.types.map((t) => (
                  <div key={t.name} className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-14 shrink-0">{t.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${t.ratio}%` }} />
                    </div>
                    <span className="w-14 shrink-0 text-right text-muted-foreground">{t.count} 题 · {t.ratio}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-warning-foreground">{OPTIMIZE.typeNote}</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3.5">
              <div className="mb-2 text-[12.5px] font-medium">难度分布</div>
              <div className="flex gap-2">
                {OPTIMIZE.difficulty.map((d) => (
                  <div key={d.name} className="flex-1 rounded-lg bg-muted/40 px-2 py-2 text-center">
                    <div className="text-[15px] font-semibold text-primary">{d.count}</div>
                    <div className="text-[10.5px] text-muted-foreground">{d.name}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-warning-foreground">{OPTIMIZE.diffNote}</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3.5">
              <div className="mb-2 text-[12.5px] font-medium">相似题风险</div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-warning-soft px-2 py-0.5 text-[12px] font-medium text-warning-foreground">
                  疑似重复 {OPTIMIZE.dupGroups} 组
                </span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">{OPTIMIZE.dupNote}</div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[12.5px] font-medium">优化建议</div>
            <div className="space-y-2.5">
              {OPTIMIZE.suggestions.map((s) => {
                const on = applied.has(s.id);
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-card p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">{s.kind}</span>
                      <span className="text-[12.5px] font-medium">{s.target}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                      <div><span className="text-foreground">原因:</span>{s.reason}</div>
                      <div><span className="text-foreground">推荐:</span>{s.recommend}</div>
                      {s.source !== "—" && (
                        <div className="flex items-center gap-1.5 text-[11.5px] text-primary">
                          <FileSearch className="h-3.5 w-3.5" /> {s.source}
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 flex justify-end gap-2">
                      <button
                        onClick={onSwap}
                        className="rounded-md border border-border px-2.5 py-1 text-[11.5px] hover:bg-muted"
                      >
                        {s.candidateLabel}
                      </button>
                      <button
                        onClick={() => toggleApply(s.id)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium ${
                          on
                            ? "bg-success-soft text-success"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {on ? <><CheckCircle2 className="h-3.5 w-3.5" /> 已选用</> : "应用"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {locked && (
            <div className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[11.5px] text-warning-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              该试卷已下发,不能直接修改。可复制为新试卷后优化。
            </div>
          )}
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-[11.5px] text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            智能优化仅提供组卷建议,题目替换和试卷调整需培训负责人确认。
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted">取消</button>
          <button
            onClick={() => toast.success("已保存诊断报告")}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium hover:bg-muted"
          >
            保存诊断
          </button>
          {locked ? (
            <button
              onClick={() => { toast.success("已复制为新试卷并进入优化"); onClose(); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Copy className="h-4 w-4" /> 复制并优化
            </button>
          ) : (
            <>
              <button
                onClick={() => { toast.success("已另存为优化版试卷"); onClose(); }}
                className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium hover:bg-muted"
              >
                另存为优化版
              </button>
              <button
                disabled={applied.size === 0}
                onClick={() => { toast.success(`已应用 ${applied.size} 条建议`); onClose(); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" /> 应用已选建议
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------- AI swap dialog ----------
function SwapDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: () => void }) {
  const [nl, setNl] = useState("");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4.5 w-4.5 text-primary" /> AI 换题
          </DialogTitle>
          <DialogDescription>描述换题要求,AI 推荐候选替换题。</DialogDescription>
        </DialogHeader>
        <Textarea
          value={nl}
          onChange={(e) => setNl(e.target.value)}
          placeholder="换一道同知识点但更难一点的题"
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          {["不要重复考同一个公式", "换一道更接近取证考试风格的题"].map((s) => (
            <button
              key={s}
              onClick={() => setNl(s)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[11.5px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {SWAP_CANDIDATES.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-3">
              <div className="text-[13px] font-medium leading-relaxed">{c.stem}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-primary">
                <Sparkles className="h-3 w-3" /> {c.reason}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="secondary" className="font-normal">{c.knowledge}</Badge>
                <span className={`rounded-md px-1.5 py-0.5 ${diffClass(c.difficulty)}`}>{c.difficulty}</span>
                {/* <span>相似度 {c.similarity}%</span> */}
                <span className="inline-flex items-center gap-0.5"><FileSearch className="h-3 w-3" />{c.source}</span>
                <button
                  onClick={() => {
                    onPick();
                    onClose();
                    toast.success("已使用此题替换");
                  }}
                  className="ml-auto rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  使用此题
                </button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Add question dialog ----------
function AddQuestionDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (n: number) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pool = BANK_QUESTIONS.filter((b) => b.status === "启用");
  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>添加题目</DialogTitle>
          <DialogDescription>仅展示已审核通过并启用的题目。</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {["题型", "知识点分类", "难度", "来源资料", "正确率区间", "最近是否使用"].map((f) => (
            <select key={f} className="h-9 rounded-md border border-input bg-background px-2 text-[12px] text-muted-foreground">
              <option>{f}</option>
            </select>
          ))}
        </div>
        <div className="max-h-80 overflow-auto rounded-lg border border-border">
          <table className="w-full whitespace-nowrap text-[12.5px]">
            <thead className="sticky top-0 bg-muted/60 text-[11.5px] text-muted-foreground">
              <tr>
                <Th className="w-8"> </Th>
                <Th className="min-w-[240px]">题干</Th>
                <Th>题型</Th>
                <Th>知识点</Th>
                <Th>难度</Th>
                <Th>来源资料</Th>
                <Th>使用次数</Th>
                <Th>正确率</Th>
                <Th>最近使用</Th>
              </tr>
            </thead>
            <tbody>
              {pool.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/40">
                  <Td>
                    <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggle(b.id)} className="h-4 w-4 accent-[var(--primary)]" />
                  </Td>
                  <StemCell text={b.stem} maxWidthClass="max-w-[300px]" />
                  <Td className="text-muted-foreground">{b.type}</Td>
                  <Td><Badge variant="secondary" className="font-normal">{b.knowledge}</Badge></Td>
                  <Td><span className={`rounded-md px-1.5 py-0.5 text-[11px] ${diffClass(b.difficulty)}`}>{b.difficulty}</span></Td>
                  <Td className="text-[11.5px] text-muted-foreground">{b.source}</Td>
                  <Td className="text-muted-foreground">{b.usedCount}</Td>
                  <Td>{b.correctRate}%</Td>
                  <Td className="text-[11.5px] text-muted-foreground">{b.lastUsed}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-muted-foreground">已选择 {selected.size} 题</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted">取消</button>
            <button
              disabled={selected.size === 0}
              onClick={() => {
                onAdd(selected.size);
                setSelected(new Set());
                onClose();
              }}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              确认添加
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Paper editor ----------
const GOAL_OPTIONS = ["取证复习", "复证巩固", "岗位达标", "阶段测评", "日常自测"];

function PaperEditor({ open, onClose, paper }: { open: boolean; onClose: () => void; paper: Paper | null }) {
  const { groups, collapsed, toggleCollapse, move, remove, aiAppend, resetGroups, summary } =
    usePaperQuestionGroups(EDITOR_GROUPS);
  const [addType, setAddType] = useState<QuestionType | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [lastPaper, setLastPaper] = useState<string | null>(null);

  if (open && (paper?.id ?? null) !== lastPaper) {
    resetGroups();
    setLastPaper(paper?.id ?? null);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> 试卷编辑器
          </SheetTitle>
          <SheetDescription>{paper ? `编辑:${paper.name}` : "新建试卷"}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FieldLabel>试卷名称</FieldLabel>
              <Input defaultValue={paper?.name} placeholder="如:AGC / 两细则取证复习考试" className="h-9 text-[13px]" />
            </div>
            <div>
              <FieldLabel>考试目标</FieldLabel>
              <select defaultValue={paper?.goal} className="h-9 w-full rounded-md border border-input bg-background px-2 text-[13px]">
                {GOAL_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>试卷分类</FieldLabel>
              <Input defaultValue={paper?.category} placeholder="如:调频调压" className="h-9 text-[13px]" />
            </div>
            <div>
              <FieldLabel>适用岗位</FieldLabel>
              <Input placeholder="如:值班员 / 值班长" className="h-9 text-[13px]" />
            </div>
            <div>
              <FieldLabel>考试时长(分钟)</FieldLabel>
              <Input defaultValue={paper?.duration} placeholder="30" className="h-9 text-[13px]" />
            </div>
            <div>
              <FieldLabel>及格线(分)</FieldLabel>
              <Input placeholder="60" className="h-9 text-[13px]" />
            </div>
            <div>
              <FieldLabel>备注</FieldLabel>
              <Input placeholder="选填" className="h-9 text-[13px]" />
            </div>
          </div>

          <PaperQuestionSummary summary={summary} />

          <PaperQuestionList
            groups={groups}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            onAdd={setAddType}
            onAiAppend={aiAppend}
            onMove={move}
            onRemove={remove}
            onSwap={() => setSwapOpen(true)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted">取消</button>
          <button
            onClick={() => { toast.success("已保存为草稿"); onClose(); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium hover:bg-muted"
          >
            <Save className="h-4 w-4" /> 保存草稿
          </button>
          <button
            onClick={() => { toast.success("试卷已保存"); onClose(); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <CheckCircle2 className="h-4 w-4" /> 保存试卷
          </button>
        </div>
      </SheetContent>
      <AddQuestionDialog
        open={addType !== null}
        onClose={() => setAddType(null)}
        onAdd={(n) => toast.success(`已向${addType ?? "试卷"}添加 ${n} 题`)}
      />
      <SwapDialog open={swapOpen} onClose={() => setSwapOpen(false)} onPick={() => {}} />
    </Sheet>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[12px] font-medium text-muted-foreground">{children}</label>;
}

function IconBtn({
  icon: Icon,
  title,
  onClick,
  danger = false,
}: {
  icon: typeof Eye;
  title: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`grid h-6 w-6 place-items-center rounded transition-colors ${
        danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// ---------- Page ----------
function ExamAdminPage() {
  const [tab, setTab] = useState<TabKey>("paper");
  const [genOpen, setGenOpen] = useState(false);
  const [assignPaper, setAssignPaper] = useState<Paper | null>(null);
  const [recordsPaper, setRecordsPaper] = useState<Paper | null>(null);
  const [previewPaper, setPreviewPaper] = useState<Paper | null>(null);
  const [optimizePaper, setOptimizePaper] = useState<Paper | null>(null);
  const [copyPaper, setCopyPaper] = useState<Paper | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPaper, setEditorPaper] = useState<Paper | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);

  const openEditor = (p: Paper | null) => {
    setEditorPaper(p);
    setEditorOpen(true);
  };

  return (
    <TooltipProvider delayDuration={200}>
    <PageShell>
      <PageHeader
        title="考试管理"
        subtitle="题目审核、题库维护、智能组卷、试卷下发与答题跟踪。"
        size="md"
      />

      <StatCards />

      <ModulePanel>
        <ModuleTabs
          tabs={TABS.map((t) => ({
            key: t.key,
            label: t.label,
            desc: t.desc,
            icon: <t.icon className="h-4 w-4" />,
          }))}
          value={tab}
          onChange={setTab}
        />
        <div className="p-4">
      {tab === "review" && <ReviewModule />}
      {tab === "bank" && <BankModule />}
      {tab === "paper" && (
        <PaperModule
          onGenerate={() => setGenOpen(true)}
          onAssign={setAssignPaper}
          onRecords={setRecordsPaper}
          onPreview={setPreviewPaper}
          onOptimize={setOptimizePaper}
          onCopy={setCopyPaper}
          onEdit={openEditor}
          onNew={() => openEditor(null)}
        />
      )}
        </div>
      </ModulePanel>

      <PaperEditor open={editorOpen} onClose={() => setEditorOpen(false)} paper={editorPaper} />
      <GenerateDrawer open={genOpen} onOpenChange={setGenOpen} />
      <AssignDialog paper={assignPaper} onClose={() => setAssignPaper(null)} />
      <RecordsDrawer paper={recordsPaper} onClose={() => setRecordsPaper(null)} />
      <PaperPreviewDrawer paper={previewPaper} onClose={() => setPreviewPaper(null)} />
      <CopyDialog paper={copyPaper} onClose={() => setCopyPaper(null)} />
      <OptimizeDrawer
        paper={optimizePaper}
        onClose={() => setOptimizePaper(null)}
        onSwap={() => setSwapOpen(true)}
      />
      <SwapDialog open={swapOpen} onClose={() => setSwapOpen(false)} onPick={() => {}} />
    </PageShell>
    </TooltipProvider>
  );
}
