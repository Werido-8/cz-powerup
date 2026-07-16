import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  FileText,
  ListChecks,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { KbEmptyState, KbStatusTag } from "@/components/knowledge/ui";
import {
  getStoreUploadApprovals,
  subscribeKnowledgeStore,
  updateStoreUploadApproval,
} from "@/lib/knowledge/store";
import type {
  ApprovalStatus,
  KnowledgeExercise,
  KnowledgeExerciseType,
  UploadApproval,
} from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

type ApprovalDraft = Pick<
  UploadApproval,
  "summary" | "aiKeywords" | "aiMetadata" | "aiQuestions" | "aiAnswers" | "aiExercises"
>;

const INPUT_CLASS =
  "w-full rounded-[8px] border border-kb-border bg-white px-3 py-2 text-[13px] text-kb-body outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-[#F5F8F9] disabled:text-kb-muted";

function approvalStatusLabel(status?: ApprovalStatus) {
  if (status === "approved") return "已通过";
  if (status === "rejected") return "已驳回";
  return "待审批";
}

function approvalStatusTone(status?: ApprovalStatus) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  return "warning" as const;
}

function exerciseTypeLabel(type: KnowledgeExerciseType) {
  if (type === "multiple") return "多选题";
  if (type === "judge") return "判断题";
  return "单选题";
}

function cloneExercises(item: UploadApproval): KnowledgeExercise[] {
  if (item.aiExercises?.length) {
    return item.aiExercises.map((exercise) => ({
      ...exercise,
      options: exercise.options.map((option) => ({ ...option })),
      correctAnswers: [...exercise.correctAnswers],
    }));
  }

  return (item.aiQuestions ?? []).map((stem, index) => ({
    id: `${item.id}-exercise-${index}`,
    type: "single",
    stem,
    options: [
      { id: "A", label: "A", content: item.aiAnswers?.[index] ?? "正确答案" },
      { id: "B", label: "B", content: "其他选项" },
    ],
    correctAnswers: ["A"],
    analysis: item.aiAnswers?.[index] ?? "",
  }));
}

function createExercise(type: KnowledgeExerciseType): KnowledgeExercise {
  const id = `exercise-${Date.now()}`;
  if (type === "judge") {
    return {
      id,
      type,
      stem: "",
      options: [
        { id: "A", label: "A", content: "正确" },
        { id: "B", label: "B", content: "错误" },
      ],
      correctAnswers: ["A"],
      analysis: "",
    };
  }

  return {
    id,
    type,
    stem: "",
    options: ["A", "B", "C", "D"].map((label) => ({ id: label, label, content: "" })),
    correctAnswers: type === "multiple" ? ["A", "B"] : ["A"],
    analysis: "",
  };
}

export function FileApprovalPage({ approvalId }: { approvalId: string }) {
  const navigate = useNavigate();
  const items = useSyncExternalStore(
    subscribeKnowledgeStore,
    getStoreUploadApprovals,
    getStoreUploadApprovals,
  );
  const item = items.find((entry) => entry.id === approvalId);
  const pendingItems = items.filter(
    (entry) => (entry.status ?? "pendingApproval") === "pendingApproval",
  );
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState("");
  const [metadata, setMetadata] = useState<NonNullable<UploadApproval["aiMetadata"]>>([]);
  const [exercises, setExercises] = useState<KnowledgeExercise[]>([]);
  const [newExerciseType, setNewExerciseType] = useState<KnowledgeExerciseType>("single");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!item) return;
    const nextExercises = cloneExercises(item);
    setSummary(item.summary ?? "");
    setKeywords((item.aiKeywords ?? []).join("、"));
    setMetadata(item.aiMetadata?.map((field) => ({ ...field })) ?? []);
    setExercises(nextExercises);
    setExpandedIds(new Set(nextExercises.slice(0, 1).map((exercise) => exercise.id)));
  }, [approvalId, item]);

  const returnToApprovalDesk = () =>
    navigate({ to: "/knowledge/admin", search: { section: "approvals" } });

  if (!item) {
    return (
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#F6F9FA] p-6">
        <KbEmptyState title="审批记录不存在" description="该审批记录可能已被删除或链接已失效。" />
        <button
          type="button"
          onClick={returnToApprovalDesk}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-4 text-[13px] font-medium text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          返回审批台
        </button>
      </main>
    );
  }

  const readOnly = (item.status ?? "pendingApproval") !== "pendingApproval";

  const getDraft = (): ApprovalDraft => ({
    summary: summary.trim(),
    aiKeywords: keywords
      .split(/[、,，]/)
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    aiMetadata: metadata.map((field) => ({
      ...field,
      label: field.label.trim(),
      value: field.value.trim(),
    })),
    aiExercises: exercises.map((exercise) => ({
      ...exercise,
      stem: exercise.stem.trim(),
      analysis: exercise.analysis.trim(),
      options: exercise.options.map((option) => ({
        ...option,
        content: option.content.trim(),
      })),
      correctAnswers: [...exercise.correctAnswers],
    })),
    aiQuestions: exercises.map((exercise) => exercise.stem.trim()),
    aiAnswers: exercises.map((exercise) => exercise.analysis.trim()),
  });

  const finishApproval = (status: "approved" | "rejected", reviewNote: string) => {
    const nextPending = pendingItems.find((entry) => entry.id !== item.id);
    updateStoreUploadApproval(item.id, {
      ...getDraft(),
      status,
      reviewerName: "张工",
      reviewedAt: new Date()
        .toLocaleString("zh-CN", {
          hour12: false,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
        .replaceAll("/", "-"),
      reviewNote,
    });
    toast.success(status === "approved" ? "审批已通过，文件进入发布流程" : "文件已驳回并记录原因");
    if (nextPending) {
      navigate({
        to: "/knowledge/approval/$approvalId",
        params: { approvalId: nextPending.id },
        replace: true,
      });
    } else {
      returnToApprovalDesk();
    }
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F6F9FA]">
      <header className="flex min-h-[68px] shrink-0 items-center justify-between gap-4 border-b border-[#DCE8EA] bg-white px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={returnToApprovalDesk}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] border border-kb-border px-3 text-[13px] font-medium text-kb-body transition-colors hover:border-primary/35 hover:bg-primary-soft hover:text-primary active:translate-y-px"
          >
            <ArrowLeft className="h-4 w-4" />
            返回审批台
          </button>
          <div className="h-7 w-px bg-[#E3EBEE]" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[17px] font-semibold text-kb-title">文件审批</h1>
              <KbStatusTag tone={approvalStatusTone(item.status)} variant="outline" dot>
                {approvalStatusLabel(item.status)}
              </KbStatusTag>
            </div>
            <p className="mt-0.5 truncate text-[12px] text-kb-muted">{item.fileName}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-[12px] text-kb-muted">
          <span>解析完成</span>
          <span>待审批 {pendingItems.length} 项</span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[252px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 overflow-y-auto border-r border-[#DCE8EA] bg-white p-3 lg:block">
          <div className="mb-2 flex items-center justify-between px-2 py-1.5">
            <span className="text-[13px] font-semibold text-kb-title">待审批文件</span>
            <span className="text-[11px] font-medium text-primary">{pendingItems.length} 项</span>
          </div>
          <div className="space-y-1.5">
            {pendingItems.map((pendingItem) => {
              const active = pendingItem.id === item.id;
              return (
                <button
                  key={pendingItem.id}
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/knowledge/approval/$approvalId",
                      params: { approvalId: pendingItem.id },
                    })
                  }
                  className={cn(
                    "w-full rounded-[8px] border px-3 py-3 text-left transition-colors active:translate-y-px",
                    active
                      ? "border-primary/30 bg-primary-soft/55"
                      : "border-transparent hover:border-[#DCE8EA] hover:bg-[#F8FBFC]",
                  )}
                >
                  <span className="line-clamp-2 text-[13px] font-medium leading-5 text-kb-title">
                    {pendingItem.fileName}
                  </span>
                  <span className="mt-1.5 block truncate text-[11.5px] text-kb-muted">
                    {pendingItem.submitterName} · {pendingItem.submittedAt}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin md:p-5">
            <div className="mx-auto max-w-[1180px] space-y-4">
              <section className="rounded-[10px] border border-[#DDE8EB] bg-white p-4">
                <SectionHeading
                  icon={FileText}
                  title="文件信息"
                  description="核对上传文件与目标知识库。"
                />
                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] xl:grid-cols-4">
                  <InfoField label="文件名" value={item.fileName} />
                  <InfoField label="目标知识库" value={item.knowledgeBaseName} />
                  <InfoField label="提交人" value={item.submitterName} />
                  <InfoField label="提交时间" value={item.submittedAt} />
                  <InfoField label="文件大小" value={item.fileSize ?? "-"} />
                  <InfoField label="解析状态" value="解析完成" success />
                  <InfoField label="上传说明" value={item.uploadNote ?? "-"} />
                  <InfoField label="审批状态" value={approvalStatusLabel(item.status)} />
                </div>
                {item.riskHint && (
                  <div className="mt-3 rounded-[8px] border border-warning/25 bg-warning-soft px-3 py-2 text-[12px] text-warning-foreground">
                    风险提示：{item.riskHint}
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
                <section className="rounded-[10px] border border-[#DDE8EB] bg-white p-4">
                  <SectionHeading
                    icon={Sparkles}
                    title="AI 元数据"
                    description="字段名称和值均可编辑。"
                  />
                  <div className="mt-4 space-y-2">
                    {metadata.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-[160px_minmax(0,1fr)_32px] gap-2"
                      >
                        <input
                          value={field.label}
                          disabled={readOnly}
                          onChange={(event) =>
                            setMetadata((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, label: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                          className={INPUT_CLASS}
                          aria-label={`元数据名称 ${index + 1}`}
                        />
                        <input
                          value={field.value}
                          disabled={readOnly}
                          onChange={(event) =>
                            setMetadata((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, value: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                          className={INPUT_CLASS}
                          aria-label={`元数据值 ${index + 1}`}
                        />
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() =>
                            setMetadata((current) =>
                              current.filter((_, entryIndex) => entryIndex !== index),
                            )
                          }
                          className="grid h-9 w-8 place-items-center rounded-[8px] text-kb-muted hover:bg-danger-soft hover:text-destructive disabled:hidden"
                          aria-label="删除元数据"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          setMetadata((current) => [
                            ...current,
                            { id: `${item.id}-meta-${Date.now()}`, label: "新字段", value: "" },
                          ])
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[12px] font-medium text-primary hover:bg-primary-soft"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        添加元数据
                      </button>
                    )}
                  </div>
                </section>

                <section className="rounded-[10px] border border-[#DDE8EB] bg-white p-4">
                  <SectionHeading
                    icon={Sparkles}
                    title="关键词与摘要"
                    description="用于检索召回与内容预览。"
                  />
                  <label className="mt-4 block text-[12px] font-medium text-kb-muted">关键词</label>
                  <input
                    value={keywords}
                    disabled={readOnly}
                    onChange={(event) => setKeywords(event.target.value)}
                    className={`${INPUT_CLASS} mt-1.5`}
                    aria-describedby="keyword-help"
                  />
                  <p id="keyword-help" className="mt-1 text-[11px] text-kb-muted">
                    使用顿号或逗号分隔
                  </p>
                  <label className="mt-3 block text-[12px] font-medium text-kb-muted">摘要</label>
                  <textarea
                    value={summary}
                    disabled={readOnly}
                    onChange={(event) => setSummary(event.target.value)}
                    rows={5}
                    className={`${INPUT_CLASS} mt-1.5 resize-y leading-6`}
                  />
                </section>
              </div>

              <section className="rounded-[10px] border border-[#DDE8EB] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeading
                    icon={ListChecks}
                    title="AI 练习题"
                    description="支持单选题、多选题和判断题，题干、选项、答案与解析均可编辑。"
                  />
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <select
                        value={newExerciseType}
                        onChange={(event) =>
                          setNewExerciseType(event.target.value as KnowledgeExerciseType)
                        }
                        className="h-8 rounded-[8px] border border-kb-border bg-white px-2 text-[12px] text-kb-body outline-none focus:border-primary"
                        aria-label="新增题目类型"
                      >
                        <option value="single">单选题</option>
                        <option value="multiple">多选题</option>
                        <option value="judge">判断题</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const next = createExercise(newExerciseType);
                          setExercises((current) => [...current, next]);
                          setExpandedIds((current) => new Set([...current, next.id]));
                        }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[12px] font-medium text-white hover:bg-primary/90 active:translate-y-px"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        添加题目
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {exercises.map((exercise, index) => (
                    <QuestionEditor
                      key={exercise.id}
                      index={index}
                      exercise={exercise}
                      expanded={expandedIds.has(exercise.id)}
                      readOnly={readOnly}
                      onToggle={() =>
                        setExpandedIds((current) => {
                          const next = new Set(current);
                          if (next.has(exercise.id)) next.delete(exercise.id);
                          else next.add(exercise.id);
                          return next;
                        })
                      }
                      onChange={(nextExercise) =>
                        setExercises((current) =>
                          current.map((entry) => (entry.id === exercise.id ? nextExercise : entry)),
                        )
                      }
                      onDelete={() =>
                        setExercises((current) =>
                          current.filter((entry) => entry.id !== exercise.id),
                        )
                      }
                    />
                  ))}
                  {exercises.length === 0 && (
                    <div className="rounded-[8px] border border-dashed border-kb-border py-9 text-center text-[12px] text-kb-muted">
                      暂无练习题，请选择题型后添加
                    </div>
                  )}
                </div>
              </section>

              {readOnly && item.reviewNote && (
                <section className="rounded-[10px] border border-[#DDE8EB] bg-white p-4">
                  <SectionHeading
                    icon={CheckCircle2}
                    title="审批记录"
                    description={`${item.reviewerName ?? "-"} · ${item.reviewedAt ?? "-"}`}
                  />
                  <p className="mt-3 text-[13px] leading-6 text-kb-body">{item.reviewNote}</p>
                </section>
              )}
            </div>
          </div>

          <footer className="sticky bottom-0 z-10 flex min-h-[64px] shrink-0 items-center justify-between gap-4 border-t border-[#DCE8EA] bg-white/95 px-5 shadow-[0_-8px_20px_rgba(31,52,64,0.05)] backdrop-blur">
            <p className="text-[12px] text-kb-muted">
              {readOnly ? "该记录已完成审批，仅支持查看。" : "提交前请确认题目答案与解析准确完整。"}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {!readOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      updateStoreUploadApproval(item.id, getDraft());
                      toast.success("修改已保存");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-kb-border px-3 text-[13px] text-kb-body hover:border-primary/35 hover:bg-primary-soft hover:text-primary active:translate-y-px"
                  >
                    <Save className="h-3.5 w-3.5" />
                    保存修改
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt("请输入驳回原因");
                      if (!reason) return;
                      finishApproval("rejected", reason);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-destructive/25 px-3 text-[13px] font-medium text-destructive hover:bg-danger-soft active:translate-y-px"
                  >
                    <X className="h-3.5 w-3.5" />
                    驳回
                  </button>
                  <button
                    type="button"
                    onClick={() => finishApproval("approved", "内容核对无误，审批通过。")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary/90 active:translate-y-px"
                  >
                    <Check className="h-4 w-4" />
                    通过审批
                  </button>
                </>
              )}
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function QuestionEditor({
  index,
  exercise,
  expanded,
  readOnly,
  onToggle,
  onChange,
  onDelete,
}: {
  index: number;
  exercise: KnowledgeExercise;
  expanded: boolean;
  readOnly: boolean;
  onToggle: () => void;
  onChange: (exercise: KnowledgeExercise) => void;
  onDelete: () => void;
}) {
  const correctAnswerText = exercise.correctAnswers.length
    ? exercise.correctAnswers.join("、")
    : "未设置";

  const changeType = (type: KnowledgeExerciseType) => {
    if (type === exercise.type) return;
    if (type !== "judge" && exercise.type !== "judge") {
      onChange({
        ...exercise,
        type,
        correctAnswers:
          type === "single" ? exercise.correctAnswers.slice(0, 1) : [...exercise.correctAnswers],
      });
      return;
    }
    const template = createExercise(type);
    onChange({
      ...exercise,
      type,
      options: template.options,
      correctAnswers: template.correctAnswers,
    });
  };

  const toggleCorrectAnswer = (optionId: string) => {
    if (exercise.type === "multiple") {
      const selected = exercise.correctAnswers.includes(optionId);
      onChange({
        ...exercise,
        correctAnswers: selected
          ? exercise.correctAnswers.filter((id) => id !== optionId)
          : [...exercise.correctAnswers, optionId],
      });
      return;
    }
    onChange({ ...exercise, correctAnswers: [optionId] });
  };

  return (
    <article className="overflow-hidden rounded-[9px] border border-[#DDE8EB] bg-[#FBFCFD]">
      <div className="flex min-h-[58px] items-center gap-3 px-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-kb-muted transition-transform",
              !expanded && "-rotate-90",
            )}
          />
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] bg-primary-soft text-[12px] font-semibold text-primary">
            {index + 1}
          </span>
          <span className="shrink-0 rounded-[6px] border border-primary/20 bg-white px-2 py-1 text-[11px] font-medium text-primary">
            {exerciseTypeLabel(exercise.type)}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-kb-title">
            {exercise.stem || "未填写题干"}
          </span>
          <span className="shrink-0 text-[11.5px] text-kb-muted">
            正确答案：<strong className="font-semibold text-success">{correctAnswerText}</strong>
          </span>
        </button>
        {!readOnly && (
          <button
            type="button"
            onClick={onDelete}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-kb-muted hover:bg-danger-soft hover:text-destructive"
            aria-label={`删除第 ${index + 1} 道题`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-[#E4ECEF] bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[150px_minmax(0,1fr)]">
            <div>
              <label className="block text-[12px] font-medium text-kb-muted">题型</label>
              <select
                value={exercise.type}
                disabled={readOnly}
                onChange={(event) => changeType(event.target.value as KnowledgeExerciseType)}
                className={`${INPUT_CLASS} mt-1.5`}
              >
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="judge">判断题</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-kb-muted">题干</label>
              <textarea
                value={exercise.stem}
                disabled={readOnly}
                onChange={(event) => onChange({ ...exercise, stem: event.target.value })}
                rows={2}
                className={`${INPUT_CLASS} mt-1.5 resize-y leading-5`}
                placeholder="请输入题干"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-[12px] font-medium text-kb-muted">选项与正确答案</label>
              {!readOnly && exercise.type !== "judge" && exercise.options.length < 8 && (
                <button
                  type="button"
                  onClick={() => {
                    const label = ["A", "B", "C", "D", "E", "F", "G", "H"].find(
                      (candidate) => !exercise.options.some((option) => option.id === candidate),
                    );
                    if (!label) return;
                    onChange({
                      ...exercise,
                      options: [...exercise.options, { id: label, label, content: "" }],
                    });
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-[7px] px-2 text-[11.5px] font-medium text-primary hover:bg-primary-soft"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加选项
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {exercise.options.map((option, optionIndex) => {
                const correct = exercise.correctAnswers.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className={cn(
                      "grid grid-cols-[34px_minmax(0,1fr)_66px_28px] items-center gap-2 rounded-[8px] border p-2",
                      correct
                        ? "border-primary/35 bg-primary-soft/40"
                        : "border-[#E1EAED] bg-[#FBFCFD]",
                    )}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-[7px] bg-white text-[12px] font-semibold text-kb-body">
                      {option.label}
                    </span>
                    <input
                      value={option.content}
                      disabled={readOnly}
                      onChange={(event) =>
                        onChange({
                          ...exercise,
                          options: exercise.options.map((entry, entryIndex) =>
                            entryIndex === optionIndex
                              ? { ...entry, content: event.target.value }
                              : entry,
                          ),
                        })
                      }
                      className="min-w-0 border-0 bg-transparent px-1 py-1.5 text-[13px] text-kb-body outline-none disabled:text-kb-muted"
                      aria-label={`选项 ${option.label}`}
                    />
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleCorrectAnswer(option.id)}
                      className={cn(
                        "inline-flex h-7 items-center justify-center gap-1 rounded-[7px] text-[11px] font-medium disabled:cursor-default",
                        correct
                          ? "bg-primary text-white"
                          : "border border-kb-border bg-white text-kb-muted hover:border-primary/30 hover:text-primary",
                      )}
                      aria-pressed={correct}
                    >
                      {exercise.type === "multiple" ? (
                        <ListChecks className="h-3 w-3" />
                      ) : (
                        <CircleDot className="h-3 w-3" />
                      )}
                      {correct ? "正确" : "设为正确"}
                    </button>
                    {!readOnly && exercise.type !== "judge" && exercise.options.length > 2 ? (
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...exercise,
                            options: exercise.options.filter((entry) => entry.id !== option.id),
                            correctAnswers: exercise.correctAnswers.filter(
                              (id) => id !== option.id,
                            ),
                          })
                        }
                        className="grid h-7 w-7 place-items-center rounded-[7px] text-kb-muted hover:bg-danger-soft hover:text-destructive"
                        aria-label={`删除选项 ${option.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 rounded-[7px] bg-[#F4F8F9] px-3 py-2 text-[12px] text-kb-muted">
              正确答案：
              <strong className="ml-1 font-semibold text-success">{correctAnswerText}</strong>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[12px] font-medium text-kb-muted">答案解析</label>
            <textarea
              value={exercise.analysis}
              disabled={readOnly}
              onChange={(event) => onChange({ ...exercise, analysis: event.target.value })}
              rows={3}
              className={`${INPUT_CLASS} mt-1.5 resize-y leading-5`}
              placeholder="请输入答案依据与解析"
            />
          </div>
        </div>
      )}
    </article>
  );
}

function InfoField({
  label,
  value,
  success = false,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11.5px] text-kb-muted">{label}</div>
      <div className={cn("mt-1 truncate font-medium text-kb-body", success && "text-success")}>
        {value}
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-primary-soft text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <h2 className="text-[14px] font-semibold text-kb-title">{title}</h2>
        <p className="mt-0.5 text-[11.5px] text-kb-muted">{description}</p>
      </div>
    </div>
  );
}
