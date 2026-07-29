import { useNavigate } from "@tanstack/react-router";
import {
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  FileText,
  GitFork,
  GraduationCap,
  Hash,
  ListChecks,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  SearchCheck,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormTextarea } from "@/components/ui/app-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui/KbFormDialog";
import { KbHighlightText } from "@/components/knowledge/ui";
import {
  getDemoRoleKey,
  getDemoRoleServerSnapshot,
  subscribeDemoRole,
} from "@/lib/knowledge/demoRole";
import {
  getFilePracticeAnalysis,
  getFilePracticeQuestions,
  type FilePracticeQuestion,
} from "@/lib/knowledge/filePractice";
import { getFileMatchChunks } from "@/lib/knowledge/fulltextSearch";
import type { KnowledgeBase, KnowledgeFile } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

function PanelSection({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Hash;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[8px] border border-[#EEF2F4] bg-card px-4 py-4 shadow-[0_1px_3px_rgba(31,52,64,0.03)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
          <Icon className="h-4 w-4 text-primary stroke-[1.8]" />
          {title}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MindMapBoard({
  fileName,
  branches,
  zoom,
  expanded = false,
  onZoomOut,
  onZoomIn,
  onOpen,
}: {
  fileName: string;
  branches: string[];
  zoom: number;
  expanded?: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onOpen: () => void;
}) {
  const nodes = (
    branches.length > 0 ? branches : ["适用范围", "执行要求", "风险提示", "闭环管理"]
  ).slice(0, 4);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[8px] border border-kb-border bg-kb-surface",
        expanded ? "min-h-[390px]" : "min-h-[196px]",
      )}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-[7px] border border-kb-border bg-card/95 p-1 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="缩小知识脑图"
          title="缩小"
          onClick={onZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded-[5px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          <Minus className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>
        <span className="min-w-8 text-center text-[10px] font-medium text-kb-muted">{zoom}%</span>
        <button
          type="button"
          aria-label="放大知识脑图"
          title="放大"
          onClick={onZoomIn}
          className="flex h-7 w-7 items-center justify-center rounded-[5px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          <Plus className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>
        {!expanded ? (
          <button
            type="button"
            aria-label="打开知识脑图"
            title="打开脑图"
            onClick={onOpen}
            className="flex h-7 w-7 items-center justify-center rounded-[5px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <Maximize2 className="h-3.5 w-3.5 stroke-[1.8]" />
          </button>
        ) : null}
      </div>

      <div
        className="absolute inset-0 origin-center transition-transform duration-150"
        style={{ transform: `scale(${zoom / 100})` }}
      >
        <div className="absolute left-1/2 top-1/2 z-10 w-[44%] max-w-[184px] -translate-x-1/2 -translate-y-1/2 rounded-[7px] border border-primary/25 bg-card px-3 py-2 text-center text-[11.5px] font-medium leading-5 text-kb-heading shadow-sm">
          <span className="line-clamp-2">{fileName.replace(/\.[^.]+$/, "")}</span>
        </div>
        <span className="absolute left-[25%] top-1/2 h-px w-[25%] bg-primary/25" />
        <span className="absolute right-[25%] top-1/2 h-px w-[25%] bg-primary/25" />
        <div className="absolute inset-x-3 top-4 grid grid-cols-2 gap-x-9 gap-y-8">
          {nodes.map((item) => (
            <div
              key={item}
              className="rounded-[6px] border border-primary/15 bg-primary-soft/20 px-2 py-2 text-center text-[10.5px] leading-4 text-kb-body"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FileAIAssistantPanel({
  file,
  base,
  showHitTabs = false,
  searchQuery = "",
  onJumpToPage,
}: {
  file: KnowledgeFile;
  base: KnowledgeBase;
  /** When true, render tab switcher: "搜索命中" | "智能解读" */
  showHitTabs?: boolean;
  searchQuery?: string;
  onJumpToPage?: (page: number) => void;
}) {
  const navigate = useNavigate();
  const questions = useMemo(() => getFilePracticeQuestions(file), [file]);
  const keywords = file.aiKeywords ?? file.tags ?? [];
  const enabled = file.parseStatus === "success" && file.status === "published";
  const role = useSyncExternalStore(subscribeDemoRole, getDemoRoleKey, getDemoRoleServerSnapshot);
  const isAdmin = role !== "employee";
  const [displayedQuestions, setDisplayedQuestions] = useState<FilePracticeQuestion[]>(questions);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingQuestion, setDeletingQuestion] = useState<FilePracticeQuestion | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<FilePracticeQuestion | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [mindMapZoom, setMindMapZoom] = useState(100);
  const [mindMapOpen, setMindMapOpen] = useState(false);

  // Search-hit tab state
  const [activeTab, setActiveTab] = useState<"hits" | "interpret">("hits");
  const [activeHitIndex, setActiveHitIndex] = useState(0);
  const chunks = useMemo(
    () => (showHitTabs && searchQuery ? getFileMatchChunks(file, searchQuery) : []),
    [file, searchQuery, showHitTabs],
  );

  useEffect(() => {
    setDisplayedQuestions(questions);
    setSelectedIds([]);
    setDeletingQuestion(null);
    setViewingQuestion(null);
    setDetailEditing(false);
    setMindMapZoom(100);
    setMindMapOpen(false);
  }, [file.id, questions]);

  // Jump to first hit when file or chunks change
  useEffect(() => {
    setActiveHitIndex(0);
    if (showHitTabs && chunks.length > 0 && onJumpToPage) {
      onJumpToPage(chunks[0].page);
    }
  }, [file.id, chunks, showHitTabs, onJumpToPage]);

  const jumpToHit = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, chunks.length - 1));
    setActiveHitIndex(safeIndex);
    if (onJumpToPage && chunks[safeIndex]) {
      onJumpToPage(chunks[safeIndex].page);
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const submitSelectedQuestions = () => {
    if (selectedIds.length === 0) return;
    toast.success(
      isAdmin
        ? `已将 ${selectedIds.length} 道练习题提交至题库`
        : `已提交 ${selectedIds.length} 道练习题至题库`,
    );
  };

  const openQuestionDetail = (question: FilePracticeQuestion, editing = false) => {
    setViewingQuestion(question);
    setDetailEditing(editing);
  };

  const saveQuestion = (next: FilePracticeQuestion, submitToBank = false) => {
    setDisplayedQuestions((current) =>
      current.map((question) => (question.id === next.id ? next : question)),
    );
    if (submitToBank) {
      setViewingQuestion(null);
      setDetailEditing(false);
      toast.success("已保存并提交至题库");
      return;
    }
    setViewingQuestion(next);
    setDetailEditing(false);
    toast.success("练习题已更新");
  };

  const deleteQuestion = () => {
    if (!deletingQuestion) return;
    setDisplayedQuestions((current) =>
      current.filter((question) => question.id !== deletingQuestion.id),
    );
    setSelectedIds((current) => current.filter((id) => id !== deletingQuestion.id));
    toast.success("练习题已删除");
    setDeletingQuestion(null);
  };

  return (
    <aside className="flex w-[390px] shrink-0 flex-col border-l border-[#E0E9EB] bg-white 2xl:w-[420px]">
      {/* Tab bar — only shown when full-text search context is active */}
      {showHitTabs && (
        <div className="flex shrink-0 gap-1 border-b border-[#E8EFF1] px-3 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab("hits")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-t-[7px] px-3 py-2 text-[12.5px] font-medium transition-colors",
              activeTab === "hits"
                ? "bg-primary-soft/60 text-primary"
                : "text-kb-muted hover:bg-kb-surface hover:text-kb-heading",
            )}
          >
            <SearchCheck className="h-3.5 w-3.5 stroke-[1.8]" />
            搜索命中
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("interpret")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-t-[7px] px-3 py-2 text-[12.5px] font-medium transition-colors",
              activeTab === "interpret"
                ? "bg-primary-soft/60 text-primary"
                : "text-kb-muted hover:bg-kb-surface hover:text-kb-heading",
            )}
          >
            <BookOpenCheck className="h-3.5 w-3.5 stroke-[1.8]" />
            智能解读
          </button>
        </div>
      )}

      {/* ── 搜索命中 tab ──────────────────────────────────────── */}
      {showHitTabs && activeTab === "hits" && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header: hit count + prev/next navigation */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#E8EFF1] px-4 py-2.5">
            <span className="text-[12.5px] font-medium text-kb-heading">
              本文件命中{" "}
              <span className="font-semibold text-primary">{chunks.length}</span> 处
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="上一处命中"
                disabled={chunks.length === 0 || activeHitIndex === 0}
                onClick={() => jumpToHit(activeHitIndex - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#DCE8EA] text-kb-muted transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronUp className="h-4 w-4 stroke-[2]" />
              </button>
              <button
                type="button"
                aria-label="下一处命中"
                disabled={chunks.length === 0 || activeHitIndex >= chunks.length - 1}
                onClick={() => jumpToHit(activeHitIndex + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#DCE8EA] text-kb-muted transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronDown className="h-4 w-4 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Hit list */}
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
            {chunks.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-12 text-center text-[12px] text-kb-muted">
                当前文件无命中内容
              </div>
            ) : (
              <div className="space-y-2">
                {chunks.map((chunk, index) => (
                  <article
                    key={chunk.id}
                    className={cn(
                      "rounded-[8px] border px-3.5 py-3",
                      index === activeHitIndex
                        ? "border-primary/30 bg-primary-soft/40"
                        : "border-[#EEF2F4] bg-white",
                    )}
                  >
                    <p className="line-clamp-3 text-[12.5px] leading-relaxed text-kb-body">
                      <KbHighlightText text={chunk.text} keyword={chunk.keyword} />
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 智能解读 tab (or full content when no tabs) ─────────── */}
      {(!showHitTabs || activeTab === "interpret") && (
      <div className={cn("scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto p-3 pr-2.5")}>
        <section className="rounded-[8px] border border-[#EEF2F4] bg-card px-4 py-4 shadow-[0_1px_3px_rgba(31,52,64,0.03)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
                <BookOpenCheck className="h-4 w-4 text-primary stroke-[1.8]" />
                智能解读
              </div>
              <p className="mt-0.5 truncate text-[10.5px] text-kb-muted">来源：{base.name}</p>
            </div>
            <span className="shrink-0 text-[11px] text-kb-muted">
              {enabled ? "解析完成" : "等待解析"}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-kb-heading">
                <Hash className="h-3.5 w-3.5 text-primary stroke-[1.8]" />
                关键字
              </div>
              {keywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[4px] border border-primary/18 bg-primary-soft/40 px-2 py-1 text-[11px] text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-kb-muted">解析完成后自动提取关键字。</p>
              )}
            </div>

            <div className="border-t border-divider pt-3">
              <p className="mb-2 text-[12px] font-medium text-kb-heading">摘要</p>
              <p className="text-[12.5px] leading-6 text-kb-body">
                {file.summary ?? "解析完成后将自动生成文档摘要。"}
              </p>
            </div>
          </div>
        </section>

        <PanelSection title="知识脑图" icon={GitFork}>
          {enabled ? (
            <MindMapBoard
              fileName={file.name}
              branches={keywords}
              zoom={mindMapZoom}
              onZoomOut={() => setMindMapZoom((value) => Math.max(80, value - 10))}
              onZoomIn={() => setMindMapZoom((value) => Math.min(130, value + 10))}
              onOpen={() => setMindMapOpen(true)}
            />
          ) : (
            <p className="text-[12px] text-kb-muted">解析完成后生成知识结构。</p>
          )}
        </PanelSection>

        <PanelSection
          title="练习题"
          icon={GraduationCap}
          action={
            enabled ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/knowledge-practice/$fileId",
                      params: { fileId: file.id },
                    })
                  }
                  className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-primary/25 bg-primary-soft/25 px-2.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary-soft/55"
                >
                  <ListChecks className="h-3.5 w-3.5 stroke-[1.8]" />
                  开始练习
                </button>
                <button
                  type="button"
                  onClick={submitSelectedQuestions}
                  disabled={selectedIds.length === 0}
                  className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-primary/25 bg-card px-2.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary-soft/30 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send className="h-3.5 w-3.5 stroke-[1.8]" />
                  提交题库
                </button>
              </div>
            ) : undefined
          }
        >
          {enabled ? (
            <div className="scrollbar-neutral max-h-[280px] overflow-y-auto pr-0.5">
              {displayedQuestions.map((question) => {
                const selected = selectedIds.includes(question.id);
                return (
                  <div
                    key={question.id}
                    className={cn(
                      "group flex items-center gap-1.5 border-b border-divider/80 px-0 py-2 transition-colors last:border-b-0",
                      selected ? "bg-primary-soft/30" : "hover:bg-kb-surface/80",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleQuestion(question.id)}
                        aria-label={`选择练习题：${question.stem}`}
                        className="h-4 w-4 shrink-0 rounded-[3px] border-kb-border text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                      />
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => openQuestionDetail(question)}
                              className="min-w-0 flex-1 truncate text-left text-[12px] leading-[18px] text-kb-body transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                            >
                              {question.stem}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-[320px] bg-[#2f424d] text-[12px] leading-relaxed text-white"
                          >
                            {question.stem}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {isAdmin ? (
                      <div className="flex shrink-0 items-center gap-0.5 pr-0.5">
                        <button
                          type="button"
                          aria-label={`编辑练习题：${question.stem}`}
                          title="编辑练习题"
                          onClick={() => openQuestionDetail(question, true)}
                          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-primary transition-colors hover:bg-primary-soft/60 active:scale-[0.96]"
                        >
                          <Pencil className="h-3.5 w-3.5 stroke-[1.9]" />
                        </button>
                        <button
                          type="button"
                          aria-label={`删除练习题：${question.stem}`}
                          title="删除练习题"
                          onClick={() => setDeletingQuestion(question)}
                          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.96]"
                        >
                          <Trash2 className="h-3.5 w-3.5 stroke-[1.9]" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {displayedQuestions.length === 0 ? (
                <p className="px-1.5 py-6 text-center text-[12px] text-kb-muted">
                  暂无练习题，可等待资料重新解析后生成。
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[12px] text-kb-muted">解析完成后可选择练习题并提交。</p>
          )}
        </PanelSection>
      </div>
      )}

      <QuestionDetailDialog
        question={viewingQuestion}
        isAdmin={isAdmin}
        editing={detailEditing}
        onClose={() => {
          setViewingQuestion(null);
          setDetailEditing(false);
        }}
        onEditingChange={setDetailEditing}
        onSave={(question) => saveQuestion(question)}
        onSaveAndSubmit={(question) => saveQuestion(question, true)}
      />
      <KbFormDialog
        open={Boolean(deletingQuestion)}
        title="删除练习题"
        titleIcon={Trash2}
        size="small"
        variant="confirm"
        onClose={() => setDeletingQuestion(null)}
        footer={
          <>
            <AppDialogButton variant="outline" onClick={() => setDeletingQuestion(null)}>
              取消
            </AppDialogButton>
            <AppDialogButton
              variant="primary"
              className="border-destructive bg-destructive hover:border-destructive/90 hover:bg-destructive/90"
              onClick={deleteQuestion}
            >
              删除
            </AppDialogButton>
          </>
        }
      >
        <p className="text-[13px] leading-6 text-kb-body">
          删除后，该题将不再出现在这份资料的练习题中。
        </p>
      </KbFormDialog>
      <KbFormDialog
        open={mindMapOpen}
        title="知识脑图"
        titleIcon={GitFork}
        size="large"
        onClose={() => setMindMapOpen(false)}
        footer={
          <AppDialogButton variant="primary" onClick={() => setMindMapOpen(false)}>
            关闭
          </AppDialogButton>
        }
      >
        <MindMapBoard
          fileName={file.name}
          branches={keywords}
          zoom={mindMapZoom}
          expanded
          onZoomOut={() => setMindMapZoom((value) => Math.max(80, value - 10))}
          onZoomIn={() => setMindMapZoom((value) => Math.min(130, value + 10))}
          onOpen={() => undefined}
        />
      </KbFormDialog>
    </aside>
  );
}

function QuestionDetailDialog({
  question,
  isAdmin,
  editing,
  onClose,
  onEditingChange,
  onSave,
  onSaveAndSubmit,
}: {
  question: FilePracticeQuestion | null;
  isAdmin: boolean;
  editing: boolean;
  onClose: () => void;
  onEditingChange: (editing: boolean) => void;
  onSave: (question: FilePracticeQuestion) => void;
  onSaveAndSubmit: (question: FilePracticeQuestion) => void;
}) {
  const [stem, setStem] = useState("");
  const [options, setOptions] = useState<FilePracticeQuestion["options"]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState("");

  useEffect(() => {
    if (!question) return;
    setStem(question.stem);
    setOptions(question.options.map((option) => ({ ...option })));
    setAnswers(Array.isArray(question.answer) ? [...question.answer] : [question.answer]);
    setAnalysis(getFilePracticeAnalysis(question));
  }, [question]);

  if (!question) return null;

  const multiple = question.type === "multiple";
  const answerText = answers.join("，");
  const canSave = Boolean(stem.trim()) && answers.length > 0;

  const toggleAnswer = (key: string) => {
    if (!editing) return;
    if (multiple) {
      setAnswers((current) =>
        current.includes(key)
          ? current.filter((item) => item !== key)
          : [...current, key].sort(),
      );
      return;
    }
    setAnswers([key]);
  };

  const cancelEditing = () => {
    setStem(question.stem);
    setOptions(question.options.map((option) => ({ ...option })));
    setAnswers(Array.isArray(question.answer) ? [...question.answer] : [question.answer]);
    setAnalysis(getFilePracticeAnalysis(question));
    onEditingChange(false);
  };

  const buildNext = (): FilePracticeQuestion => ({
    ...question,
    stem: stem.trim(),
    options: options.map((option) => ({ ...option, label: option.label.trim() })),
    answer: multiple ? answers : answers[0] ?? "",
    analysis: analysis.trim(),
  });

  const submit = () => {
    if (!canSave) return;
    onSave(buildNext());
  };

  const submitAndUpload = () => {
    if (!canSave) return;
    onSaveAndSubmit(buildNext());
  };

  return (
    <KbFormDialog
      open
      title={editing ? "题目编辑" : "题目详情"}
      titleIcon={GraduationCap}
      size="medium"
      onClose={onClose}
      footer={
        editing ? (
          <>
            <AppDialogButton variant="outline" onClick={cancelEditing}>
              取消
            </AppDialogButton>
            <AppDialogButton variant="outline" disabled={!canSave} onClick={submit}>
              保存
            </AppDialogButton>
            <AppDialogButton variant="primary" disabled={!canSave} onClick={submitAndUpload}>
              保存并提交至题库
            </AppDialogButton>
          </>
        ) : (
          <>
            {isAdmin ? (
              <AppDialogButton variant="outline" onClick={() => onEditingChange(true)}>
                <Pencil className="h-3.5 w-3.5" />
                开启编辑
              </AppDialogButton>
            ) : null}
            <AppDialogButton variant="primary" onClick={onClose}>
              关闭
            </AppDialogButton>
          </>
        )
      }
    >
      <div className="space-y-1">
        <KbFormField label="题干" icon={FileText} required={editing}>
          {editing ? (
            <AppFormTextarea
              value={stem}
              onChange={(event) => setStem(event.target.value)}
              rows={1}
              showCount={false}
              className="!h-10 !min-h-10 !resize-none !rounded-[7px] !px-3 !py-[7px] overflow-y-auto text-[13px] leading-6"
            />
          ) : (
            <p className="text-[14px] leading-6 text-kb-heading">{question.stem}</p>
          )}
        </KbFormField>

        <KbFormField label="选项" icon={ListChecks} required={editing}>
          <div className="space-y-1.5">
            {editing
              ? options.map((option) => {
                  const checked = answers.includes(option.key);
                  return (
                    <div
                      key={option.key}
                      role="button"
                      tabIndex={0}
                      aria-pressed={checked}
                      aria-label={`选择正确答案 ${option.key}`}
                      onClick={() => toggleAnswer(option.key)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleAnswer(option.key);
                        }
                      }}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-[7px] border px-3 py-2 text-left transition-colors",
                        checked
                          ? "border-primary/45 bg-primary-soft/70"
                          : "border-[#EDF3F5] bg-white hover:border-primary/25 hover:bg-[#FBFDFD]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-[18px] w-[18px] shrink-0 place-items-center border transition-colors",
                          multiple ? "rounded-[3px]" : "rounded-full",
                          checked ? "border-primary bg-primary" : "border-[#B9CED3] bg-white",
                        )}
                        aria-hidden
                      >
                        {checked ? (
                          multiple ? (
                            <Check className="h-3 w-3 text-primary-foreground stroke-[2.4]" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                          )
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[3px] px-1 text-[10.5px] font-semibold",
                          checked ? "bg-primary/15 text-primary" : "bg-[#EAF1F3] text-[#6B7F88]",
                        )}
                      >
                        {option.key}
                      </span>
                      <input
                        aria-label={`选项 ${option.key}`}
                        value={option.label}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          setOptions((current) =>
                            current.map((entry) =>
                              entry.key === option.key
                                ? { ...entry, label: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        className="h-8 min-w-0 flex-1 cursor-text rounded-[6px] border border-[#D6E1E9] bg-white px-2.5 text-[13px] leading-5 text-[#314955] outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  );
                })
              : question.options.map((option) => {
                  const answerKeys = Array.isArray(question.answer)
                    ? question.answer
                    : [question.answer];
                  const checked = answerKeys.includes(option.key);
                  return (
                    <div
                      key={option.key}
                      className={cn(
                        "flex items-start gap-2 rounded-[7px] border px-3 py-2.5 text-[13px] leading-5",
                        checked
                          ? "border-primary/55 bg-primary-soft/55 text-kb-heading shadow-[inset_3px_0_0_0_var(--primary)]"
                          : "border-[#EEF2F4] bg-white text-kb-body",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] px-1 text-[10.5px] font-semibold",
                          checked ? "bg-primary text-primary-foreground" : "bg-[#F3F6F7] text-[#8A9BA3]",
                        )}
                      >
                        {option.key}
                      </span>
                      <span className="min-w-0 flex-1">{option.label}</span>
                      {checked ? (
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      ) : null}
                    </div>
                  );
                })}
          </div>
        </KbFormField>

        <KbFormField label="正确答案" icon={CircleCheck} required={editing}>
          <input
            readOnly
            value={answerText}
            placeholder={editing ? "请在上方选择正确选项" : ""}
            className="h-10 w-full cursor-default rounded-[7px] border border-[#D6E1E9] bg-[#F8FAFC] px-3 text-[13px] text-[#31485D] outline-none"
          />
        </KbFormField>

        <KbFormField label="解析" icon={BookOpenCheck} className="mb-0">
          {editing ? (
            <AppFormTextarea
              value={analysis}
              onChange={(event) => setAnalysis(event.target.value)}
              rows={1}
              showCount={false}
              className="!h-10 !min-h-10 !resize-none !rounded-[7px] !px-3 !py-[7px] overflow-y-auto text-[13px] leading-6"
            />
          ) : (
            <div className="rounded-[8px] border border-primary/15 bg-primary-soft/25 px-3 py-3">
              <p className="text-[12.5px] leading-6 text-kb-body">
                {getFilePracticeAnalysis(question)}
              </p>
            </div>
          )}
        </KbFormField>
      </div>
    </KbFormDialog>
  );
}
