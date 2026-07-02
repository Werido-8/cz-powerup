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

// ---------- Bank module helpers ----------
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

export function BankModule() {
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
  // 本期暂不开放：智能改写
  // const [rewrite, setRewrite] = useState<BankQuestion | null>(null);
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
                          {/* 本期暂不开放：智能改写
                          <ActionBtn icon={Wand2} label="智能改写" tone="primary" onClick={() => setRewrite(b)} />
                          */}
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
        // onRewrite={(b) => { setDetail(null); setRewrite(b); }}
        onSimilar={(b) => { setDetail(null); setSimilar(b); }}
      />
      <BankEditDrawer
        q={createOpen ? null : edit}
        open={createOpen || !!edit}
        existingRows={rows}
        onClose={closeForm}
        onSave={handleSaveQuestion}
      />
      {/* 本期暂不开放：智能改写 <RewriteDrawer q={rewrite} onClose={() => setRewrite(null)} /> */}
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
  onSimilar,
}: {
  q: BankQuestion | null;
  onClose: () => void;
  onEdit: (b: BankQuestion) => void;
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
              {/* 本期暂不开放：智能改写
              <button onClick={() => onRewrite(q)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-3.5 py-2 text-[12.5px] text-primary hover:bg-primary-soft">
                <Wand2 className="h-3.5 w-3.5" /> 智能改写
              </button>
              */}
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
/** 试卷已下发（非草稿且有人收到） */
function paperIsIssued(p: Paper): boolean {
  return p.status !== "草稿" && p.assigned > 0;
}

/** 已有提交答卷，可展示正确率 / 平均分 / 平均用时 */
function paperHasSubmittedAnswers(p: Paper): boolean {
  return paperIsIssued(p) && p.finished > 0;
}

function paperFinishRate(p: Paper): number | null {
  if (!paperIsIssued(p)) return null;
  return Math.round((p.finished / p.assigned) * 100);
}

function rateTone(rate: number): string {
  if (rate >= 80) return "font-semibold text-success";
  if (rate >= 60) return "font-medium text-amber-700 dark:text-amber-500";
  return "font-medium text-destructive/85";
}

function statusBadge(s: Paper["status"]) {
  return s === "已下发"
    ? "bg-primary-soft text-primary"
    : s === "已结束"
      ? "bg-success-soft text-success"
      : "bg-muted text-muted-foreground";
}
