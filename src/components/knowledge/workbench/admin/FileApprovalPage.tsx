import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  CircleCheck,
  Clock3,
  FileText,
  GitFork,
  GraduationCap,
  Hash,
  HardDrive,
  Library,
  ListChecks,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import knowledgeIcon from "@/assets/b69a8633-c81d-42e2-80f5-aae7e7edc146.png";
import { ModulePanel, ModuleTabs } from "@/components/learning/ui";
import { KbEmptyState } from "@/components/knowledge/ui/KbEmptyState";
import { FileTreeSidebar } from "@/components/knowledge/workbench/preview/FileTreeSidebar";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui/KbFormDialog";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormTextarea } from "@/components/ui/app-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getStoreUploadApprovals,
  subscribeKnowledgeStore,
  updateStoreUploadApproval,
} from "@/lib/knowledge/store";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import type { KnowledgeExercise, KnowledgeFile, UploadApproval } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

const stamp = (value?: string) => (value ? value.replace("T", " ").slice(0, 16) : "-");
const normalizeKeywords = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join("，")
    : typeof value === "string"
      ? value
      : "";
const tags = (text: unknown) =>
  normalizeKeywords(text)
    .split(/[，,]/)
    .map((x) => x.trim())
    .filter(Boolean);
const copyExercises = (items?: KnowledgeExercise[]) =>
  (items ?? []).map((item) => ({
    ...item,
    options: (item.options ?? []).map((option) => ({ ...option })),
    correctAnswers: [...(item.correctAnswers ?? [])],
  }));
type ApprovalTab = "reader" | "exercises" | "mindMap";

const questionTypeLabels: Record<KnowledgeExercise["type"], string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
};
const difficultyLabels: Record<NonNullable<KnowledgeExercise["difficulty"]>, string> = {
  easy: "易",
  medium: "中",
  hard: "难",
};

function approvalToFile(item: UploadApproval): KnowledgeFile {
  const lower = item.fileName.toLowerCase();
  const type: KnowledgeFile["type"] = lower.endsWith(".pdf")
    ? "pdf"
    : lower.endsWith(".xlsx") || lower.endsWith(".xls")
      ? "xlsx"
      : lower.endsWith(".pptx") || lower.endsWith(".ppt")
        ? "pptx"
        : lower.endsWith(".docx") || lower.endsWith(".doc")
          ? "docx"
          : "other";

  return {
    id: item.id,
    name: item.fileName,
    type,
    knowledgeBaseId: item.knowledgeBaseId ?? "",
    knowledgeBaseName: item.knowledgeBaseName,
    size: item.fileSize,
    status: item.status === "approved" ? "published" : "pendingApproval",
    parseStatus: item.parseStatus ?? "success",
    uploaderName: item.submitterName,
    updatedAt: item.submittedAt,
  };
}

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

function Header({
  item,
  readOnly,
  back,
  reject,
  approve,
}: {
  item: UploadApproval;
  readOnly: boolean;
  back: () => void;
  reject: () => void;
  approve: () => void;
}) {
  return (
    <header className="flex min-h-[56px] shrink-0 items-center justify-between gap-5 border-b border-[#E0E9EB] bg-white px-5 py-3 2xl:px-7">
      <div className="flex min-w-0 items-center gap-5">
        <button
          type="button"
          onClick={back}
          className="inline-flex shrink-0 items-center gap-2 text-[14px] font-medium text-[#44576A] hover:text-[#1496B4]"
        >
          <ArrowLeft className="size-4" />
          返回审批台
        </button>
        <span className="hidden h-8 w-px bg-[#DCE7EF] sm:block" />
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#D8EAF1] bg-[#F1FBFD]">
            <img src={knowledgeIcon} alt="知识库" className="size-8 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] text-[#65788B]">
              目标知识库 / {item.knowledgeBaseName}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <h1 className="truncate text-[18px] font-semibold text-[#1F2D3D]">{item.fileName}</h1>
              <span className="shrink-0 rounded-full bg-[#FFF3E7] px-2 py-0.5 text-[12px] font-medium text-[#E87B1B]">
                待审批
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-2 xl:flex">
        <button
          type="button"
          onClick={reject}
          disabled={readOnly}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#FFB5B2] px-3 text-[13px] font-medium text-[#F15454] hover:bg-[#FFF7F7] disabled:opacity-45"
        >
          <X className="size-3.5" />
          驳回
        </button>
        <button
          type="button"
          onClick={approve}
          disabled={readOnly}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1496B4] px-3 text-[13px] font-medium text-white hover:bg-[#0C819D] disabled:opacity-45"
        >
          <Check className="size-3.5" />
          通过审批
        </button>
      </div>
    </header>
  );
}

function SidebarHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div className="shrink-0 border-b border-[#E8EFF1] px-4 py-3.5">
      <h2 className="text-[14px] font-semibold text-kb-heading">{title}</h2>
    </div>
  );
}
function EditAction({
  children,
  completed,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  completed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary/75 disabled:opacity-45"
    >
      {completed ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
      {children}
    </button>
  );
}

function BasicInfo({ item }: { item: UploadApproval }) {
  const values = [
    { label: "上传人", value: item.submitterName || "-", icon: UserRound },
    { label: "上传时间", value: stamp(item.submittedAt), icon: Clock3 },
    { label: "文件大小", value: item.fileSize || "-", icon: HardDrive },
    { label: "目标知识库", value: item.knowledgeBaseName || "-", icon: Library },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {values.map(({ label, value, icon: Icon }) => (
        <div key={label} className="min-w-0">
          <dt className="flex items-center gap-1 text-[11px] text-kb-muted">
            <Icon className="size-3 stroke-[1.8]" />
            {label}
          </dt>
          <dd className="mt-1 truncate text-[12px] font-medium text-kb-body" title={value}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Metadata({
  values,
  editing,
  change,
}: {
  values: { id: string; label: string; value: string }[];
  editing: boolean;
  change: (id: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {values.map((value) => (
        <div key={value.id}>
          <p className="mb-1.5 text-[11px] text-kb-muted">{value.label}</p>
          {editing ? (
            <input
              value={value.value}
              onChange={(event) => change(value.id, event.target.value)}
              className="h-9 w-full rounded-[7px] border border-kb-border bg-kb-surface px-3 text-[13px] text-kb-body outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
            />
          ) : (
            <p className="flex h-9 items-center truncate rounded-[7px] border border-divider bg-kb-surface px-3 text-[12.5px] text-kb-body">
              {value.value || <span className="text-kb-muted">未填写</span>}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Keywords({
  keywordText,
  summary,
  editing,
  setKeywordText,
  setSummary,
}: {
  keywordText: string;
  summary: string;
  editing: boolean;
  setKeywordText: (value: string) => void;
  setSummary: (value: string) => void;
}) {
  const items = tags(keywordText);
  return (
    <div>
      <p className="text-[12px] font-medium text-kb-heading">关键词</p>
      {editing ? (
        <input
          value={keywordText}
          onChange={(event) => setKeywordText(event.target.value)}
          className="mt-2 h-9 w-full rounded-[7px] border border-kb-border bg-kb-surface px-3 text-[13px] text-kb-body outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
          placeholder="多个关键词使用逗号分隔"
        />
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.length ? (
            items.map((tag) => (
              <span
                key={tag}
                className="rounded-[4px] border border-primary/18 bg-primary-soft/40 px-2 py-1 text-[11px] text-primary"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[12px] text-kb-muted">暂无关键词</span>
          )}
        </div>
      )}
      <div className="mt-4 border-t border-divider pt-3">
        <p className="mb-2 text-[12px] font-medium text-kb-heading">摘要</p>
        {editing ? (
          <AppFormTextarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={2}
            showCount={false}
            className="mt-0 !min-h-[52px] !rounded-[7px] !py-2 resize-y text-[13px] leading-6"
          />
        ) : (
          <p className="text-[12.5px] leading-6 text-kb-body">{summary || "暂无摘要"}</p>
        )}
      </div>
    </div>
  );
}

function ExerciseDetailDialog({
  item,
  readOnly,
  editing,
  onClose,
  onEditingChange,
  onSave,
  onSaveAndSubmit,
}: {
  item: KnowledgeExercise | null;
  readOnly: boolean;
  editing: boolean;
  onClose: () => void;
  onEditingChange: (editing: boolean) => void;
  onSave: (item: KnowledgeExercise) => void;
  onSaveAndSubmit: (item: KnowledgeExercise) => void;
}) {
  const [stem, setStem] = useState("");
  const [options, setOptions] = useState<KnowledgeExercise["options"]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState("");

  useEffect(() => {
    if (!item) return;
    setStem(item.stem);
    setOptions(item.options.map((option) => ({ ...option })));
    setCorrectAnswers([...item.correctAnswers]);
    setAnalysis(item.analysis ?? "");
  }, [item]);

  if (!item) return null;

  const multiple = item.type === "multiple";
  const answerText = correctAnswers.join("，");
  const canSave = Boolean(stem.trim()) && correctAnswers.length > 0;

  const toggleAnswer = (label: string) => {
    if (!editing) return;
    if (multiple) {
      setCorrectAnswers((current) =>
        current.includes(label)
          ? current.filter((answer) => answer !== label)
          : [...current, label].sort(),
      );
      return;
    }
    setCorrectAnswers([label]);
  };

  const cancelEditing = () => {
    setStem(item.stem);
    setOptions(item.options.map((option) => ({ ...option })));
    setCorrectAnswers([...item.correctAnswers]);
    setAnalysis(item.analysis ?? "");
    onEditingChange(false);
  };

  const buildNext = (): KnowledgeExercise => ({
    ...item,
    stem: stem.trim(),
    options: options.map((option) => ({ ...option, content: option.content.trim() })),
    correctAnswers,
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
      open={Boolean(item)}
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
            {!readOnly ? (
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
            <p className="text-[14px] leading-6 text-kb-heading">{item.stem}</p>
          )}
        </KbFormField>

        <KbFormField label="选项" icon={ListChecks} required={editing}>
          <div className="space-y-1.5">
            {editing
              ? options.map((option) => {
                  const checked = correctAnswers.includes(option.label);
                  return (
                    <div
                      key={option.label}
                      role="button"
                      tabIndex={0}
                      aria-pressed={checked}
                      aria-label={`选择正确答案 ${option.label}`}
                      onClick={() => toggleAnswer(option.label)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleAnswer(option.label);
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
                        {option.label}
                      </span>
                      <input
                        aria-label={`选项 ${option.label}`}
                        value={option.content}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          setOptions((current) =>
                            current.map((entry) =>
                              entry.label === option.label
                                ? { ...entry, content: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        className="h-8 min-w-0 flex-1 cursor-text rounded-[6px] border border-[#D6E1E9] bg-white px-2.5 text-[13px] leading-5 text-[#314955] outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  );
                })
              : item.options.map((option) => {
                  const checked = item.correctAnswers.includes(option.label);
                  return (
                    <div
                      key={option.label}
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
                        {option.label}
                      </span>
                      <span className="min-w-0 flex-1">{option.content}</span>
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
            value={editing ? answerText : item.correctAnswers.join("，")}
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
                {item.analysis || "暂无解析"}
              </p>
            </div>
          )}
        </KbFormField>
      </div>
    </KbFormDialog>
  );
}

function Exercises({
  items,
  selected,
  readOnly,
  toggleSelected,
  toggleSelectAll,
  openDetail,
  openEdit,
  remove,
  upload,
}: {
  items: KnowledgeExercise[];
  selected: string[];
  readOnly: boolean;
  toggleSelected: (id: string) => void;
  toggleSelectAll: () => void;
  openDetail: (item: KnowledgeExercise) => void;
  openEdit: (item: KnowledgeExercise) => void;
  remove: (id: string) => void;
  upload: () => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const allSelected = items.length > 0 && selected.length === items.length;
  const someSelected = selected.length > 0 && selected.length < items.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div className="min-h-0 flex-1 overflow-hidden p-3">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[8px] border border-[#EEF2F4] bg-card shadow-[0_1px_3px_rgba(31,52,64,0.03)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-divider px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {items.length ? (
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                disabled={readOnly}
                onChange={toggleSelectAll}
                aria-label="全选练习题"
                className="h-4 w-4 shrink-0 rounded-[3px] border-kb-border text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              />
            ) : null}
            <p className="text-[12px] text-kb-muted">
              {items.length
                ? selected.length
                  ? `已选 ${selected.length} / 共 ${items.length} 道`
                  : `共 ${items.length} 道`
                : "暂无题目"}
            </p>
          </div>
          <button
            type="button"
            disabled={readOnly || selected.length === 0}
            onClick={upload}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[6px] border border-primary/25 bg-primary-soft/25 px-2.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary-soft/55 disabled:opacity-45"
          >
            <Upload className="size-3.5 stroke-[1.8]" />
            加入题库
          </button>
        </div>
        <div className="scrollbar-neutral min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {items.length ? (
            items.map((item) => {
              const checked = selected.includes(item.id);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openDetail(item);
                    }
                  }}
                  className={cn(
                    "group flex cursor-pointer items-center gap-2 border-b border-divider/80 py-3 text-left transition-colors last:border-b-0",
                    checked ? "bg-primary-soft/25" : "hover:bg-kb-surface/80",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelected(item.id)}
                    disabled={readOnly}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`选择练习题：${item.stem}`}
                    className="h-4 w-4 shrink-0 rounded-[3px] border-kb-border text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="shrink-0 rounded-[4px] border border-primary/18 bg-primary-soft/40 px-2 py-0.5 text-[10.5px] font-medium text-primary">
                      {questionTypeLabels[item.type]}
                    </span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="min-w-0 flex-1 truncate text-[13px] leading-5 text-kb-body transition-colors group-hover:text-primary">
                            {item.stem}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-[320px] bg-[#2f424d] text-[12px] leading-relaxed text-white"
                        >
                          {item.stem}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {item.difficulty ? (
                      <span className="shrink-0 text-[10.5px] text-kb-muted">
                        难度 {difficultyLabels[item.difficulty]}
                      </span>
                    ) : null}
                    {item.knowledgePoint ? (
                      <span className="hidden max-w-[120px] shrink-0 truncate text-[10.5px] text-kb-muted sm:inline">
                        {item.knowledgePoint}
                      </span>
                    ) : null}
                  </div>
                  {!readOnly ? (
                    <div className="flex shrink-0 items-center gap-1 pr-0.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(item);
                        }}
                        className="inline-flex h-7 items-center gap-1 rounded-[5px] px-2 text-[12px] font-medium text-primary transition-colors hover:bg-primary-soft/60"
                      >
                        <Pencil className="h-3.5 w-3.5 stroke-[1.9]" />
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          remove(item.id);
                        }}
                        className="inline-flex h-7 items-center gap-1 rounded-[5px] px-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[1.9]" />
                        删除
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <KbEmptyState title="暂无练习题" description="可等待解析完成后自动生成，或手动补充题目。" />
          )}
        </div>
      </section>
    </div>
  );
}

function MindMap({ item, keywordText }: { item: UploadApproval; keywordText: string }) {
  const [zoom, setZoom] = useState(100);
  const branches = (
    tags(keywordText).length ? tags(keywordText) : ["适用范围", "审批流程", "执行要点", "协同处置"]
  ).slice(0, 4);
  return (
    <div className="min-h-0 flex flex-1 flex-col bg-white p-4">
      <div className="relative min-h-[210px] flex-1 overflow-hidden rounded-lg border border-[#EEF3F6] bg-[#FAFCFD]">
          <div
            className="absolute inset-0 transition-transform"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <div className="absolute left-1/2 top-1/2 z-10 flex h-[72px] w-[126px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-[#1496B4] px-3 text-center text-[14px] font-semibold leading-5 text-white">
              {item.fileName.replace(/\.[^.]+$/, "")}
            </div>
            {branches.map((branch, index) => {
              const left = index % 2 === 0;
              return (
                <div
                  key={branch}
                  className={cn(
                    "absolute flex w-[42%] items-center gap-2",
                    left ? "left-[6%] justify-end" : "right-[6%]",
                  )}
                  style={{ top: index < 2 ? "30%" : "70%" }}
                >
                  {!left && <span className="h-px flex-1 bg-[#A8DCE8]" />}
                  <span className="rounded-md border border-[#D6E9EE] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#52677B]">
                    {branch}
                  </span>
                  {left && <span className="h-px flex-1 bg-[#A8DCE8]" />}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-[#E6EDF3] px-2">
          <button
            type="button"
            onClick={() => setZoom((n) => Math.max(80, n - 10))}
            className="flex size-7 items-center justify-center rounded hover:bg-[#F0FAFC]"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-12 text-center text-[12px] font-medium">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((n) => Math.min(120, n + 10))}
            className="flex size-7 items-center justify-center rounded hover:bg-[#F0FAFC]"
          >
            <Plus className="size-4" />
          </button>
          <span className="mx-2 h-4 w-px bg-[#E6EDF3]" />
        <button
          type="button"
          onClick={() => setZoom(100)}
          className="flex size-7 items-center justify-center rounded hover:bg-[#F0FAFC]"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Reader({
  item,
  keywordText,
  summary,
}: {
  item: UploadApproval;
  keywordText: string;
  summary: string;
}) {
  const sections = ["适用范围与职责", "审批流程与执行要求", "风险提示与协同事项"];
  return (
    <article className="min-h-0 flex-1 overflow-y-auto bg-white px-8 py-6">
        <div className="min-w-0">
          <h3 className="text-[18px] font-semibold leading-7 text-kb-heading">{item.fileName}</h3>
          <p className="mt-2 text-[12px] leading-5 text-kb-muted">
            上传人：{item.submitterName}
            <b className="px-2 font-normal opacity-40">·</b>
            {stamp(item.submittedAt)}
            {item.fileSize && (
              <>
                <b className="px-2 font-normal opacity-40">·</b>
                {item.fileSize}
              </>
            )}
          </p>
        </div>
        <section className="mt-6 border-t border-divider pt-5">
          <h4 className="text-[14px] font-semibold text-primary">1 文档概览</h4>
          <p className="mt-3 text-[12.5px] leading-7 text-kb-body">
            {summary ||
              "本文档用于明确相关业务的操作要求、审批节点与协同边界，保障流程执行规范、信息留痕完整。"}
          </p>
        </section>
        <section className="mt-6 border-t border-divider pt-5">
          <h4 className="text-[14px] font-semibold text-primary">2 重点关键词</h4>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags(keywordText).map((tag) => (
              <span
                key={tag}
                className="rounded-[4px] border border-primary/18 bg-primary-soft/40 px-2 py-1 text-[11px] text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
        {sections.map((title, index) => (
          <section key={title} className="mt-6 border-t border-divider pt-5">
            <h4 className="text-[14px] font-semibold text-primary">
              {index + 3} {title}
            </h4>
            <p className="mt-3 text-[12.5px] leading-7 text-kb-body">
              本节说明相关工作要求及执行要点。应结合实际业务场景核对材料内容，确保审批信息、适用范围和关键流程保持一致；涉及跨部门事项时，按职责分工及时沟通、跟踪并留存记录。
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[12.5px] leading-6 text-kb-body marker:text-primary">
              <li>明确责任边界与执行时点，确保信息完整准确。</li>
              <li>发现异常情形及时处置，并同步相关责任人员。</li>
            </ul>
          </section>
        ))}
    </article>
  );
}

export function FileApprovalPage({ approvalId }: { approvalId: string }) {
  const navigate = useNavigate();
  const approvals = useSyncExternalStore(
    subscribeKnowledgeStore,
    getStoreUploadApprovals,
    getStoreUploadApprovals,
  );
  const current = approvals.find((item) => item.id === approvalId) ?? approvals[0];
  const pending = useMemo(
    () => approvals.filter((item) => item.status === "pendingApproval" || !item.status),
    [approvals],
  );
  const queue = pending.length ? pending : approvals;
  const [visible, setVisible] = useState(6),
    [metadataEditing, setMetadataEditing] = useState(false),
    [keywordsEditing, setKeywordsEditing] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [keywordText, setKeywordText] = useState(""),
    [summary, setSummary] = useState(""),
    [metadata, setMetadata] = useState<{ id: string; label: string; value: string }[]>([]),
    [exercises, setExercises] = useState<KnowledgeExercise[]>([]),
    [activeTab, setActiveTab] = useState<ApprovalTab>("reader"),
    [viewingExercise, setViewingExercise] = useState<KnowledgeExercise | null>(null),
    [detailEditing, setDetailEditing] = useState(false);
  useEffect(() => {
    if (!current) return;
    setKeywordText(normalizeKeywords(current.aiKeywords));
    setSummary(current.summary ?? "");
    setMetadata(current.aiMetadata ?? []);
    setExercises(copyExercises(current.aiExercises));
    setSelected([]);
    setMetadataEditing(false);
    setKeywordsEditing(false);
    setActiveTab("reader");
    setViewingExercise(null);
    setDetailEditing(false);
  }, [current]);
  if (!current)
    return <KbEmptyState title="未找到待审批文件" description="请返回审批台重新选择文件。" />;
  const readOnly = current.status === "approved" || current.status === "rejected";
  const persist = () => {
    updateStoreUploadApproval(current.id, {
      aiKeywords: tags(keywordText),
      summary,
      aiMetadata: metadata,
      aiExercises: exercises,
    });
    toast.success("审批内容已保存");
  };
  const finish = (status: "approved" | "rejected") => {
    persist();
    updateStoreUploadApproval(current.id, {
      status,
      reviewerName: "当前审批人",
      reviewedAt: new Date().toISOString(),
    });
    toast.success(status === "approved" ? "文件已通过审批" : "文件已驳回");
    const next = queue.find((item) => item.id !== current.id);
    if (next) navigate({ to: "/knowledge/approval/$approvalId", params: { approvalId: next.id } });
    else navigate({ to: "/knowledge/admin", search: { section: "approvals" } });
  };
  const queueFiles = useMemo(
    () => queue.slice(0, visible).map(approvalToFile),
    [queue, visible],
  );
  const tabs = [
    {
      key: "reader" as const,
      label: "文件浏览",
      desc: "阅读文档正文",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      key: "exercises" as const,
      label: "练习题",
      desc: `共 ${exercises.length} 道题`,
      icon: <ListChecks className="h-4 w-4" />,
    },
    {
      key: "mindMap" as const,
      label: "脑图",
      desc: "知识结构梳理",
      icon: <GitFork className="h-4 w-4" />,
    },
  ];
  return (
    <main className={cn(kbMainPanel, "bg-[#F5F8FA] text-kb-heading")}>
      <Header
        item={current}
        readOnly={readOnly}
        back={() => navigate({ to: "/knowledge/admin", search: { section: "approvals" } })}
        reject={() => finish("rejected")}
        approve={() => finish("approved")}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <FileTreeSidebar
          title="待审批文件"
          files={queueFiles}
          currentFileId={current.id}
          onSelect={(file) =>
            navigate({ to: "/knowledge/approval/$approvalId", params: { approvalId: file.id } })
          }
          footer={
            visible < queue.length ? (
              <button
                type="button"
                onClick={() => setVisible((n) => Math.min(n + 4, queue.length))}
                className="mx-auto mt-1 flex w-full items-center justify-center gap-1.5 rounded-[8px] py-2 text-[12px] font-medium text-kb-muted transition-colors hover:bg-white hover:text-primary"
              >
                加载更多
              </button>
            ) : null
          }
        />
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F5F8FA] p-3">
          <ModulePanel className="flex min-h-0 flex-1 flex-col">
            <ModuleTabs
              compact
              tabs={tabs}
              value={activeTab}
              onChange={setActiveTab}
            />
            <div className="min-h-0 flex-1 overflow-hidden">
              {activeTab === "reader" ? (
                <Reader item={current} keywordText={keywordText} summary={summary} />
              ) : null}
              {activeTab === "exercises" ? (
                <Exercises
                  items={exercises}
                  selected={selected}
                  readOnly={readOnly}
                  toggleSelected={(id) =>
                    setSelected((items) =>
                      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
                    )
                  }
                  toggleSelectAll={() =>
                    setSelected((current) =>
                      current.length === exercises.length ? [] : exercises.map((item) => item.id),
                    )
                  }
                  openDetail={(item) => {
                    setViewingExercise(item);
                    setDetailEditing(false);
                  }}
                  openEdit={(item) => {
                    setViewingExercise(item);
                    setDetailEditing(true);
                  }}
                  remove={(id) => {
                    setExercises((items) => items.filter((item) => item.id !== id));
                    setSelected((items) => items.filter((item) => item !== id));
                  }}
                  upload={() => {
                    toast.success(`已将 ${selected.length} 道题加入题库`);
                    setSelected([]);
                  }}
                />
              ) : null}
              {activeTab === "mindMap" ? (
                <MindMap item={current} keywordText={keywordText} />
              ) : null}
            </div>
          </ModulePanel>
        </section>
        <aside className="flex w-[390px] shrink-0 flex-col border-l border-[#E0E9EB] bg-white 2xl:w-[420px]">
          <SidebarHeader title="审核信息" />
          <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            <PanelSection title="文件基本信息" icon={FileText}>
              <BasicInfo item={current} />
            </PanelSection>
            <PanelSection
              title="关键词与摘要"
              icon={Hash}
              action={
                <EditAction
                  completed={keywordsEditing}
                  disabled={readOnly}
                  onClick={() => setKeywordsEditing((value) => !value)}
                >
                  {keywordsEditing ? "完成" : "编辑"}
                </EditAction>
              }
            >
              <Keywords
                keywordText={keywordText}
                summary={summary}
                editing={keywordsEditing}
                setKeywordText={setKeywordText}
                setSummary={setSummary}
              />
            </PanelSection>
            <PanelSection
              title="元数据"
              icon={Tag}
              action={
                <EditAction
                  completed={metadataEditing}
                  disabled={readOnly}
                  onClick={() => setMetadataEditing((value) => !value)}
                >
                  {metadataEditing ? "完成" : "编辑"}
                </EditAction>
              }
            >
              <Metadata
                values={metadata}
                editing={metadataEditing}
                change={(id, value) =>
                  setMetadata((items) =>
                    items.map((item) => (item.id === id ? { ...item, value } : item)),
                  )
                }
              />
            </PanelSection>
          </div>
        </aside>
      </div>
      <ExerciseDetailDialog
        item={viewingExercise}
        readOnly={readOnly}
        editing={detailEditing}
        onClose={() => {
          setViewingExercise(null);
          setDetailEditing(false);
        }}
        onEditingChange={setDetailEditing}
        onSave={(item) => {
          setExercises((items) => items.map((entry) => (entry.id === item.id ? item : entry)));
          setViewingExercise(item);
          setDetailEditing(false);
          toast.success("练习题已更新");
        }}
        onSaveAndSubmit={(item) => {
          setExercises((items) => items.map((entry) => (entry.id === item.id ? item : entry)));
          setViewingExercise(null);
          setDetailEditing(false);
          toast.success("已保存并提交至题库");
        }}
      />
    </main>
  );
}
